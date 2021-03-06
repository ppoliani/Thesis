
from django.shortcuts import render_to_response
from django.http import HttpResponse
from CarbonEmissions import models
from CarbonEmissions.forms import TripForm
import codecs
import json
from django.contrib.auth.models import User
from django.forms import model_to_dict
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.core.serializers.json import DjangoJSONEncoder
from CarbonEmissions.ProvManager import ProvManager
from django.contrib.contenttypes.models import ContentType
from decimal import Decimal
import datetime
from googlemaps import GoogleMaps

from django.utils import simplejson
from numpy.ma.core import logical_and
from django.template.context import RequestContext

from minidetector import detect_mobile
from django.contrib.auth import authenticate, login

#constants
GOOGLE_MAPS_API_KEY = 'AIzaSyDY0dYuWgX47mvEyJoiRjky76pLBTZTlfQ'

BASE_TEMPLATE = 'shared/base.html'
MOBILE_BASE_TEMPLATE = 'shared/mobile_base.html'


@detect_mobile
def home(request):
    if not request.mobile:
        return render_to_response('home.html', {'user': request.user, 'base': BASE_TEMPLATE, 'mobileDevice': request.mobile})
    else:
        return render_to_response('home.html', {'user': request.user, 'base': MOBILE_BASE_TEMPLATE, 'mobileDevice': request.mobile})

@csrf_exempt
def mobileLogin(request):
    usrName = request.POST['user']
    password = request.POST['pass']
    
    user = authenticate(username=usrName, password=password)
    
    if user is not None:
        login(request, user)
        json = simplejson.dumps( {'type': 'success'} )
        return HttpResponse(json, mimetype='application/json')
    else:
        json = simplejson.dumps( {'type': 'error', 'value': 'Wrong username or password!'} )
        return HttpResponse(json, mimetype='application/json')
        

def bingMaps(request):
    return render_to_response('shared/partial/bingMaps.html')

def graph(request):
    return render_to_response('graph.html')

def parseCarCsv(request):
    """populate the car table with csv files taken from http://carfueldata.direct.gov.uk/downloads/default.aspx"""
    
    #the emission factor source used when the application was developed
    emisisonFactorSource = models.EmissionFactorSource.objects.get(name='DirectGov')
    
    #use file object's context manager
    #latin-1 encoding to get french characters
    with codecs.open('Thesis/CarbonEmissions/temp/euro6.csv', 'r', 'latin-1') as file_object:
        file_object.readline()
        for line in file_object:
            values = line.split(',')
            #add co2 and co4 together. convert to kg/km
            ghgEmissions = float(values[13])/1000 + float(values[16])/1000000
            #save car model emission factor
            carModelEmissionFactor = models.CarModelEmissionFactor.objects.create(source=emisisonFactorSource,\
                                                                                   directGHGEmissions=ghgEmissions)
            #combine transmision and AorM together and store it as transmission in the table
            transmission =  '%s %s' % (values[3], values[4],)  # or values[3] + ' ' + values[4]
            
            carModel = models.Car.objects.create(manufacturer=values[0], model=values[1], description=values[2],transmission=transmission,\
                                                engineCapacity=int(values[5]), fuelType=values[6])
            
            #save the conection between transport mean and emission factor
            models.TransportMeanEmissionFactor(transportMean=carModel, emissionFactor=carModelEmissionFactor).save()
                       
    
@login_required
@detect_mobile
def createTrip(request):
    """view for persisting the data submitted by users when creating new trips"""
    
    if request.method == 'POST':
        form = TripForm(request.POST)
        if form.is_valid():
            print 'Form is valid'
    else:
        form = TripForm()
    
    if not request.mobile:
        return render_to_response('createTrip.html', {'form': form, 'user': request.user, 'base': BASE_TEMPLATE, 'mobileDevice': request.mobile}, context_instance=RequestContext(request))
    else:
        return render_to_response('createTrip.html', {'form': form, 'user': request.user, 'base': MOBILE_BASE_TEMPLATE, 'mobileDevice': request.mobile}, context_instance=RequestContext(request))

#returns the description from the general cars table
def getGeneralCarDescription(request):
    """
       returns the description from the general cars table
    """
    
    fuelType = request.GET['fuelType']
    
    if fuelType == 'null':
        descriptions = list(models.GeneralCar.objects.values('description')) 
    else:
        descriptions = list(models.GeneralCar.objects.values('description').filter(fuelType=fuelType))
    
    return HttpResponse(json.dumps(descriptions), mimetype='application/json')

#returns the flight types and the cabin classes for each flight type
def getAviationDescriptions(request):
    """
      returns the flight types and the cabin classes for each flight type
    """
    
    description = request.GET['description']
    
    if description == 'null':
        descriptions = list(models.Airplane.objects.values('description', 'cabinClass'))  
    else:
        descriptions = list(models.Airplane.objects.values('description', 'cabinClass').filter(description=description))
        
    return HttpResponse(json.dumps(descriptions), mimetype="application/json")

#return the bus type stored in the database
def getBusDescriptions(request):
    """
        return the desscriptions of the buses stored in the database
    """
    
    descriptions = list(models.Bus.objects.values('description'))
    
    return HttpResponse(json.dumps(descriptions), mimetype='application/json')

#return taxi types stored in the database
def getTaxiDescriptions(request):
    """
        return the desscriptions of the taxis stored in the database
    """
    
    descriptions = list(models.Taxi.objects.values('description'))
    
    return HttpResponse(json.dumps(descriptions), mimetype='application/json')

#return  motorcycle types stored in the database
def getMotorcycleDescriptions(request):
    """
        return the desscriptions of the motorcycles stored in the database
    """
    
    descriptions = list(models.Motorcycle.objects.values('description'))
    
    return HttpResponse(json.dumps(descriptions), mimetype='application/json')

#return the ferry types stored in the database
def getFerryDescriptions(request):
    """
        return the desscriptions of the ferries stored in the database
    """
    
    descriptions = list(models.Ferry.objects.values('description'))
    
    return HttpResponse(json.dumps(descriptions), mimetype='application/json')

#return the rail tranport means types stored in the database
def getRailDescriptions(request):
    """
        return the desscriptions of the rail transport mean stored in the database
    """
    
    descriptions = list(models.Rail.objects.values('description'))
    
    return HttpResponse(json.dumps(descriptions), mimetype='application/json')


# A view that returns the  distinct car manufacturers values from the db in JSON format
def getCarManufacturers(request):
    """
         A view that returns the  distinct car manufacturers values from the db in JSON format
    """
    manufacturers = models.Car.objects.values('manufacturer').distinct()
    # refer to http://stackoverflow.com/questions/6601174/converting-a-django-valuesqueryset-to-a-json-object/6601250#6601250 
    # and http://djangosnippets.org/snippets/2454/ for explanation
    manufacturers = list(manufacturers)
    
    return HttpResponse(json.dumps(manufacturers), mimetype='application/json')


#returns the models that correspond to a specific manufacturer passed as get parameter, in JSON format
def getCarModels(request):
    """
        returns the models that correspond to a specific manufacturer passed as get parameter, in JSON format
    """
    if request.GET['manufacturer'] != 'null':
        cars = models.Car.objects.values('model').filter(manufacturer=request.GET['manufacturer'])
        cars = list(cars)
    
        return HttpResponse(json.dumps(cars), mimetype='application/json')  
    
#returns the engine capacity that correspond to a specific model passed as get parameter, in JSON format
def getCarModelData(request):
    """
        returns the engine capacity that correspond to a specific model passed as get parameter, in JSON format
    """
    
    # the value changed determines which paramater to use in the filter() of the Queryset. e.g if user choose a value for 
    # car's engine capacity, the result should return the values that correspond to that engine capacity
    if request.GET['model'] != 'null':
        if request.GET['valueChanged'] == 'description':
            carModelData = models.Car.objects.values('description', 'engineCapacity', 'transmission', 'fuelType').filter(model=request.GET['model'], \
                                                                                                          description=request.GET['description']).distinct('description',)
        if request.GET['valueChanged'] == 'engineCapacity':
            carModelData = models.Car.objects.values('description', 'engineCapacity', 'transmission', 'fuelType').filter(model=request.GET['model'], \
                                                                                                          engineCapacity=request.GET['engineCapacity']).distinct('engineCapacity')
        elif request.GET['valueChanged'] == 'transmission':
            carModelData = models.Car.objects.values('description', 'engineCapacity', 'transmission', 'fuelType').filter(model=request.GET['model'], \
                                                                                                          transmission=request.GET['transmission']).distinct('transmission')
        elif request.GET['valueChanged'] == 'fuelType':
            carModelData = models.Car.objects.values('description', 'engineCapacity', 'transmission', 'fuelType').filter(model=request.GET['model'], \
                                                                                                          fuelType=request.GET['fuelType']).distinct('fuelType')
        else:
            carModelData = models.Car.objects.values('description', 'engineCapacity', 'transmission', 'fuelType').filter(model=request.GET['model'])
        
        carModelData = list(carModelData)
    
        return HttpResponse(json.dumps(carModelData), mimetype='application/json')  
    
#view for AJAX Calls. returns the id of a transport mean
def getTransportMeanId(request):
    """
        view for AJAX Calls. returns the id of a transport mean
    """
    description = request.GET['description']
    if request.GET['type'] == 'car':
        model = request.GET['model']
        description = str(request.GET['description'])
        engineCapacity = request.GET['engineCapacity']
        fuelType = request.GET['fuelType']
        transmission = request.GET['transmission']
        
        car = models.Car.objects.get(model=model, description=description, engineCapacity=engineCapacity, fuelType=fuelType,\
                                     transmission=transmission)
        
        json = simplejson.dumps( {'transportMeanId': car.id})
    elif request.GET['type'] == 'generalCar':
        fuelType = request.GET['fuelType']
        generalCar = models.GeneralCar.objects.get(fuelType=fuelType, description=description)
        
        json = simplejson.dumps( {'transportMeanId': generalCar.id} )
    elif request.GET['type'] == 'bus':
        bus = models.Bus.objects.get(description=description)
        json = simplejson.dumps( {'transportMeanId': bus.id} )
    elif request.GET['type'] == 'taxi':
        taxi = models.Taxi.objects.get(description=description)
        json = simplejson.dumps( {'transportMeanId': taxi.id} )
    elif request.GET['type'] == 'motorcycle':
        motorcycle = models.Motorcycle.objects.get(description=description)
        json = simplejson.dumps( {'transportMeanId': motorcycle.id} )
    elif request.GET['type'] == 'ferry':
        ferry = models.Ferry.objects.get(description=description)
        json = simplejson.dumps( {'transportMeanId': ferry.id} )
    elif request.GET['type'] == 'rail':
        rail = models.Rail.objects.get(description=description)
        json = simplejson.dumps( {'transportMeanId': rail.id} )
    elif request.GET['type'] == 'airplane':
        airplane = models.Airplane.objects.get(description=description, cabinClass=request.GET['cabinClass'])
        json = simplejson.dumps( {'transportMeanId': airplane.id} )
        
    return HttpResponse(json,  mimetype='application/json')

#saves the trip and returns the id of the saved trip
@csrf_exempt
def saveTrip(request):
    """
        saves the trip and returns the id of the saved trip
    """
    
    userProfile = User.get_profile(request.user)

    postedType = request.POST.getlist('type')[0]
    postedName = request.POST.getlist('tripName')[0]
    postedDate = request.POST.getlist('date')[0]
    
    trip = models.Trip.objects.create(userProfile=userProfile, type=postedType, name=postedName, date=postedDate)
    
    #return the id of the trip along with information about the user.
    json = simplejson.dumps( {'tripId': trip.id, 'userName': request.user.username, 'email': request.user.email} )
    
    return HttpResponse(json,  mimetype='application/json')

#saves a trip leg 
@csrf_exempt
def saveTripLeg(request):
    """
        saves the trip leg 
    """
    tripId = request.POST.getlist('tripId')[0]
    tripLegStep = request.POST.getlist('step')[0]
    tripLegTime = request.POST.getlist('time')[0]
    
    trip = models.Trip.objects.get(id=tripId)
    
    #save the start address
    postedCountry = request.POST.getlist('startAddrCountry')[0]
    postedCounty = None if request.POST.getlist('startAddrCounty')[0] == 'null' else request.POST.getlist('startAddrCounty')[0]
    postedCity = request.POST.getlist('startAddrCity')[0]
    postedPostalCode = request.POST.getlist('startAddrPostalCode')[0]
    postedStreet = request.POST.getlist('startAddrStreet')[0]
    postedVisibilitry = True if request.POST.getlist('startAddrVisibility')[0] == 'Visible' else False
    #postedAddrName = request.POST.getlist('startAddrName')[0]
    postedLongitude = '%.6f' % float(request.POST.getlist('startAddrLongitude')[0])
    postedLatitude = '%.6f' % float(request.POST.getlist('startAddrLatitude')[0])
    
    #add address if not exist. If exist then reuse it
    startAddress = models.Address.objects.get_or_create(country=postedCountry, county=postedCounty, city=postedCity, postalCode=postedPostalCode, \
                                                 street=postedStreet, visibility=postedVisibilitry, longitude=postedLongitude, \
                                                 latitude=postedLatitude)[0]
        
    #save the end address
    postedCountry = request.POST.getlist('endAddrCountry')[0]
    postedCounty = None if request.POST.getlist('endAddrCounty')[0] == 'null' else request.POST.getlist('endAddrCounty')[0]
    postedCity = request.POST.getlist('endAddrCity')[0]
    postedPostalCode = request.POST.getlist('endAddrPostalCode')[0]
    postedStreet = request.POST.getlist('endAddrStreet')[0]
    postedVisibilitry = True if request.POST.getlist('endAddrVisibility')[0] == 'Visible' else False
    #postedAddrName = request.POST.getlist('endAddrName')[0]
    postedLongitude =  '%.6f' % float(request.POST.getlist('endAddrLongitude')[0])
    postedLatitude = '%.6f' % float(request.POST.getlist('endAddrLatitude')[0])
    
    #add address if not exist. If exist then reuse it. Get_or_creta returns tuple of two values, the first one is the model instance
    endAddress = models.Address.objects.get_or_create(country=postedCountry, county=postedCounty, city=postedCity, postalCode=postedPostalCode, \
                                                 street=postedStreet, visibility=postedVisibilitry, longitude=postedLongitude, \
                                                 latitude=postedLatitude)[0]
    
    #retrieve the apropraite transport mean
    if request.POST.getlist('transportMeanType')[0] == 'car':
        transportMean = models.Car.objects.get(id=request.POST.getlist('transportMeanId')[0]) 
        
    elif request.POST.getlist('transportMeanType')[0] == 'generalCar':
        transportMean = models.GeneralCar.objects.get(id=request.POST.getlist('transportMeanId')[0]) 
    elif request.POST.getlist('transportMeanType')[0] == 'bus':
        transportMean = models.Bus.objects.get(id=request.POST.getlist('transportMeanId')[0])
    elif request.POST.getlist('transportMeanType')[0] == 'taxi':
        transportMean = models.Taxi.objects.get(id=request.POST.getlist('transportMeanId')[0])
    elif request.POST.getlist('transportMeanType')[0] == 'motorcycle':
        transportMean = models.Motorcycle.objects.get(id=request.POST.getlist('transportMeanId')[0])
    elif request.POST.getlist('transportMeanType')[0] == 'ferry':
        transportMean = models.Ferry.objects.get(id=request.POST.getlist('transportMeanId')[0])
    elif request.POST.getlist('transportMeanType')[0] == 'rail':
        transportMean = models.Rail.objects.get(id=request.POST.getlist('transportMeanId')[0])
    elif request.POST.getlist('transportMeanType')[0] == 'airplane':
        transportMean = models.Airplane.objects.get(id=request.POST.getlist('transportMeanId')[0])
    #save the trip leg
    tripLeg = models.TripLeg.objects.create(trip=trip, startAddress=startAddress, endAddress=endAddress, transportMean=transportMean, \
                                            step=tripLegStep, time=tripLegTime)
    
    
    #finally store this transport mean in the transportMeanUsedByusers and user_locations model (if records not already exist), for future use
    userProfile = User.get_profile(request.user)
    
    #check if TransportMeansUsedByUsers record already exist. refet to https://code.djangoproject.com/ticket/12351 issue
    #to  see why get_or_create was not used and to http://stackoverflow.com/questions/11960422/django-how-do-i-query-based-on-genericforeignkeys-fields
    #to see the solution that we did not used here (although we could have)
    try:
        models.TransportMeansUsedByUsers.objects.get(userProfile=userProfile, content_type=ContentType.objects.get_for_model(transportMean.__class__),
                                                     object_id=transportMean.id)
    except models.TransportMeansUsedByUsers.DoesNotExist:
        models.TransportMeansUsedByUsers.objects.create(userProfile=userProfile, transportMean=transportMean)
        
    
    #check if user location already exist before adding
    try:
        models.UserProfile.objects.get(locations=startAddress)
    except models.UserProfile.DoesNotExist:
        userProfile.locations.add(startAddress) 
    
    try:
        models.UserProfile.objects.get(locations=endAddress)
    except models.UserProfile.DoesNotExist:
        userProfile.locations.add(endAddress)     
    
    json = simplejson.dumps( {'tripLegId': tripLeg.id} )
    
    return HttpResponse(json, mimetype='application/json')


#a view for AJAX call that will call all the methods for creating and persisting provenance graphs for each action
@csrf_exempt
def prov(request):
    """
        a view that will call all the methods for creating and persisting provenance graphs for each action
    """
    
    provManager = ProvManager()
    post = request.POST
    if post['actionPerformed'] == 'tripCreation':
        bundle = provManager.createTripCreationGraph(post['userName'], post['userEmail'], post['tripId'],\
                                                      simplejson.loads(post['tripLegIds']), post['startTime'], post['endTime'])
        trip = models.Trip.objects.get(id=post['tripId'])
        trip.provBundle = bundle
        trip.save()
        
    json = simplejson.dumps( {'status': 'OK'} )
    
    return HttpResponse(json, mimetype='application/json')
        
#calculates the carbon emissions of a trip leg
@csrf_exempt
def computeTripLegsEmissions(request):
    startTime = datetime.datetime.now()
    post = request.POST
    transportMeanType = post['transportMeanType']
    gmaps = GoogleMaps(GOOGLE_MAPS_API_KEY)
    startLatLong = simplejson.loads(post['startLatLong'])
    endLatLong = simplejson.loads(post['endLatLong'])
    
    directions = gmaps.directions(gmaps.latlng_to_address(startLatLong[0], startLatLong[1]), \
                                  gmaps.latlng_to_address(endLatLong[0], endLatLong[1]) )
    drivingDistance = Decimal(directions['Directions']['Distance']['meters']) / 1000
    tripLeg= models.TripLeg.objects.get(id=post['tripLegId'])
    
    #get the transport mean used during this trip leg
    transportMean = tripLeg.transportMean

    if post['calculationMethod'] == 'tier1':
        #get tier1 calculation method id
        calculationMethod = models.C02CalculationMethod.objects.get(tier='1')
        
        if transportMeanType == 'generalCar':
            #get emission factor corresponding to this general car
            emissionFactor = models.TransportMeanEmissionFactor.objects.get(transportMean_content_type=ContentType.objects.get_for_model(models.GeneralCar),\
                                                                            transportMean_id=transportMean.id).emissionFactor            
        elif transportMeanType == 'bus':
            emissionFactor = models.TransportMeanEmissionFactor.objects.get(transportMean_content_type=ContentType.objects.get_for_model(models.Bus),\
                                                                            transportMean_id=transportMean.id).emissionFactor 
        elif transportMeanType == 'taxi':
            emissionFactor = models.TransportMeanEmissionFactor.objects.get(transportMean_content_type=ContentType.objects.get_for_model(models.Taxi),\
                                                                            transportMean_id=transportMean.id).emissionFactor 
        elif transportMeanType == 'motorcycle':
            emissionFactor = models.TransportMeanEmissionFactor.objects.get(transportMean_content_type=ContentType.objects.get_for_model(models.Motorcycle),\
                                                                            transportMean_id=transportMean.id).emissionFactor 
        elif transportMeanType == 'ferry':
            emissionFactor = models.TransportMeanEmissionFactor.objects.get(transportMean_content_type=ContentType.objects.get_for_model(models.Ferry),\
                                                                            transportMean_id=transportMean.id).emissionFactor 
        elif transportMeanType == 'rail':
            emissionFactor = models.TransportMeanEmissionFactor.objects.get(transportMean_content_type=ContentType.objects.get_for_model(models.Rail),\
                                                                            transportMean_id=transportMean.id).emissionFactor 
        elif transportMeanType == 'airplane':
            emissionFactor = models.TransportMeanEmissionFactor.objects.get(transportMean_content_type=ContentType.objects.get_for_model(models.Airplane),\
                                                                            transportMean_id=transportMean.id).emissionFactor                                                              
        ghgEmissions = drivingDistance * emissionFactor.directGHGEmissions
            
        #save the computed value
        tripLegEmission = models.TripLegCarbonEmission.objects.create(tripLeg=tripLeg, method=calculationMethod,\
                                                                          emissionFactor=emissionFactor, emissions=ghgEmissions)
    elif post['calculationMethod'] == 'tier2':
        #get tier2 calculation method id
        calculationMethod = models.C02CalculationMethod.objects.get(tier='2')
        #get emission factor corresponding to the specific car model
        emissionFactor = models.TransportMeanEmissionFactor.objects.get(transportMean_content_type=ContentType.objects.get_for_model(models.Car),\
                                                                            transportMean_id=transportMean.id).emissionFactor            
        ghgEmissions = drivingDistance * emissionFactor.directGHGEmissions
            
        #save the computed value
        tripLegEmission = models.TripLegCarbonEmission.objects.create(tripLeg=tripLeg, method=calculationMethod,\
                                                                          emissionFactor=emissionFactor, emissions=ghgEmissions)
    endTime = datetime.datetime.now()
    #createProvenanceGraph
    provManager = ProvManager()
    bundle = provManager.createTripLegEmissionGraph(tripLegEmission.id, calculationMethod.id, transportMean.id, transportMeanType,\
                                                            emissionFactor.id, emissionFactor.source.id, drivingDistance, tripLeg.id, tripLeg.startAddress.id,\
                                                            tripLeg.endAddress.id, startTime, endTime)
    tripLegEmission.provBundle = bundle
    tripLegEmission.save()

    
    json = simplejson.dumps( {'status': 'OK'} )
    
    return HttpResponse(json, mimetype='application/json')

#return the carbon footprint report template
@login_required
@detect_mobile
def report(request):
    stats = {}
    stats['individual'] = getIndividualStats(User.get_profile(request.user))
    stats['group'] = getGroupStats(User.get_profile(request.user))
    
    if not request.mobile:
        return render_to_response('report.html', {'stats': stats, 'user': request.user, 'base': BASE_TEMPLATE, 'mobileDevice': request.mobile}, context_instance=RequestContext(request))
    else:
        return render_to_response('report.html', {'stats': stats, 'user': request.user, 'base': MOBILE_BASE_TEMPLATE, 'mobileDevice': request.mobile}, context_instance=RequestContext(request)) 
    

#returns some individual stats concerning ghg emissions
def getIndividualStats(userProfile):
    trips = models.Trip.objects.all().filter(userProfile=userProfile)
    stats = {}
    emissions = []
    
    for trip in trips:
        #get all trip legs of this trip
        tripLegs = trip.tripleg_set.all()
        
        #get all the emissions for this trip leg
        for tripLeg in tripLegs:
            emissions.append( models.TripLegCarbonEmission.objects.get(tripLeg=tripLeg).emissions)

    stats['total'] = sum(emissions)
    stats['min'] = min(emissions)
    stats['max'] = max(emissions)
    stats['avg'] = sum(emissions) / len(emissions)
    stats['numOfTrips'] = len(trips)

    return stats

#returns some individual stats concerning ghg emissions
def getGroupStats(userProfile):
    stats = {}
    emissions = []
    numOfTrips = 0
    userGroups = userProfile.group_set.all()
    
    #iterate over all the groups that user is member of 
    for group in userGroups:
        #find the trips of all the members of the group
        groupUsers = group.users.all()
        
        for user in groupUsers:
            trips = models.Trip.objects.all().filter(userProfile=user)
            numOfTrips += len(trips)
            for trip in trips:
                #get all trip legs of this trip
                tripLegs = trip.tripleg_set.all()
                
                #get all the emissions for this trip
                for tripLeg in tripLegs:
                    emissions.append( models.TripLegCarbonEmission.objects.get(tripLeg=tripLeg).emissions)

    stats['total'] = sum(emissions)
    stats['min'] = min(emissions)
    stats['max'] = max(emissions)
    stats['avg'] = sum(emissions) / len(emissions)
    stats['numOfTrips'] = numOfTrips
    
    return stats



#return the trip  information that is needed for the charts and that took place during the time period specified by the parameters
def getTripInfo(request):
    """
        returns the trip  information that is needed for the charts and that took place during the time period specified by the parameters
    """
    #create python dates from input strings
    fromDate =  request.GET['from'].split('-')
    untilDate = request.GET['until'].split('-')
    
    startDate = datetime.date(int(fromDate[0]), int(fromDate[1]), int(fromDate[2]))
    endDate = datetime.date(int(untilDate[0]), int(untilDate[1]), int(untilDate[2]))
    userProfile = User.get_profile(request.user)
    #trips that took place during the specified time period
    trips = models.Trip.objects.all().filter(date__range=(startDate, endDate), userProfile=userProfile)
                                             
    tripValues = list(models.Trip.objects.values('type','name','date').filter(date__range=(startDate, endDate), userProfile=userProfile))
    
    ghgEmissions = 0
    index = 0
    totalEmissions = 0
    numOfTripLegs = 0
    
    for trip in trips:
        #get all trip legs of this trip
        tripLegs = trip.tripleg_set.all()
        
        #get all the emissions for this trip leg
        for tripLeg in tripLegs:
            numOfTripLegs += 1
            #since each trip leg might have several emissions based on the emission factors used, in the futures specify the 
            #source of emissions factors.
            ghgEmissions += models.TripLegCarbonEmission.objects.get(tripLeg=tripLeg).emissions
            totalEmissions += ghgEmissions
        
        #add the computed emissions for that trip in the appropriate place in the dictionary
        tripValues[index]['emissions'] = ghgEmissions
        index += 1
        ghgEmissions = 0
    
    if( numOfTripLegs > 0 ):    
        tripValues.append({'avg': float(totalEmissions/numOfTripLegs)}) 
    else:
        tripValues.append({'avg': 0}) 
    return HttpResponse(json.dumps(tripValues,  cls=DjangoJSONEncoder), mimetype="application/json")



#returns emission information about groups
def getGroupEmissionInfo(request):
    #create python dates from input strings
    fromDate = request.GET['from'].split('-')
    untilDate = request.GET['until'] .split('-')
    
    startDate = datetime.date(int(fromDate[0]), int(fromDate[1]), int(fromDate[2]))
    endDate = datetime.date(int(untilDate[0]), int(untilDate[1]), int(untilDate[2]))
    
    userProfile = User.get_profile(request.user)
    userGroups = userProfile.group_set.all()
    numOfTripLegs = 0
    groupValues = {}
    
    #iterate over all gorups
    for group in userGroups:
        #find the trips of all the members of the group
        groupUsers = group.users.all()
        tripValues = []
        index = 0
        
        for user in groupUsers:
            #trips that took place during the specified time period
            trips = models.Trip.objects.all().filter(date__range=(startDate, endDate), userProfile=user)                                            
            tripValues += list(models.Trip.objects.values('type','name','date').filter(date__range=(startDate, endDate), userProfile=user))         
            ghgEmissions = 0
            totalEmissions = 0
            
            for trip in trips:
                #get all trip legs of this trip
                tripLegs = trip.tripleg_set.all()
                
                #get all the emissions for this trip leg
                for tripLeg in tripLegs:
                    numOfTripLegs += 1
                    #since each trip leg might have several emissions based on the emission factors used, in the futures specify the 
                    #source of emissions factors.
                    ghgEmissions += models.TripLegCarbonEmission.objects.get(tripLeg=tripLeg).emissions
                    totalEmissions += ghgEmissions
                
                #add the computed emissions for that trip in the appropriate place in the dictionary
                tripValues[index]['emissions'] = ghgEmissions
                index += 1
                ghgEmissions = 0
                
        if( numOfTripLegs > 0 ):    
            tripValues.append({'avg': float(totalEmissions/numOfTripLegs)})
        else:
            tripValues.append({'avg': 0})        
        
        groupValues[group.name] = tripValues

        
    return HttpResponse(json.dumps(groupValues,  cls=DjangoJSONEncoder), mimetype="application/json")


#return the trip leg information that is needed for the charts and that took place during the time period specified by the parameters
def getTripLegInfo(request):
    #create python dates from input strings
    fromDate = request.GET['from'].split('-')
    untilDate = request.GET['until'] .split('-')
    
    startDate = datetime.date(int(fromDate[0]), int(fromDate[1]), int(fromDate[2]))
    endDate = datetime.date(int(untilDate[0]), int(untilDate[1]), int(untilDate[2]))
    userProfile = User.get_profile(request.user)
    #trips that took place during the specified time period
    trips = models.Trip.objects.all().filter(date__range=(startDate, endDate), userProfile=userProfile)
    tripLegValues = [] 
    index = 0
    totalEmissions = 0
    numOfTripLegs = 0
     
    for trip in trips:
        #get all trip legs of this trip
        tripLegs = trip.tripleg_set.all()
        numOfTripLegs += len(tripLegs)
        
        #get all the emissions for this trip leg
        for tripLeg in tripLegs:
            tripLegValues.append({'name': trip.name, 'date': trip.date})
            tripLegEmission = models.TripLegCarbonEmission.objects.get(tripLeg=tripLeg)
            totalEmissions += tripLegEmission.emissions
            tripLegValues[index]['emissions'] = tripLegEmission.emissions
            tripLegValues[index]['startAddress'] = tripLeg.startAddress.street
            tripLegValues[index]['endAddress'] = tripLeg.endAddress.street
            tripLegValues[index]['method'] = tripLegEmission.method.tier
            tripLegValues[index]['provBundleId'] = tripLegEmission.provBundle.id
            index += 1
            
    if( numOfTripLegs > 0 ):
        tripLegValues.append({'avg': float(totalEmissions/numOfTripLegs)})  
    else:
        tripLegValues.append({'avg': 0}) 
    return HttpResponse(json.dumps(tripLegValues,  cls=DjangoJSONEncoder), mimetype="application/json")


#return transport means information for trips that is needed for the charts and that took place during the time period specified 
#by the parameters
def getTransportMeanReport(request):
    #create python dates from input strings
    fromDate = request.GET['from'].split('-')
    untilDate = request.GET['until'] .split('-')
    
    startDate = datetime.date(int(fromDate[0]), int(fromDate[1]), int(fromDate[2]))
    endDate = datetime.date(int(untilDate[0]), int(untilDate[1]), int(untilDate[2]))
    userProfile = User.get_profile(request.user)
    #trips that took place during the specified time period
    trips = models.Trip.objects.all().filter(date__range=(startDate, endDate), userProfile=userProfile)
    returnValues = []
    
    carModelEmissions = 0
    carEmissions = 0
    busEmissions = 0
    taxiEmissions = 0
    ferryEmissions = 0
    motorcycleEmissions = 0
    airplaneEmissions = 0
    railEmissions = 0
    
    for trip in trips:
        #get all trip legs of this trip
        tripLegs = trip.tripleg_set.all()
        
        #get all the emissions for this trip leg
        for tripLeg in tripLegs:
            transportMean = tripLeg.transportMean
            tripLegEmission = models.TripLegCarbonEmission.objects.get(tripLeg=tripLeg)
            
            if isinstance(transportMean, models.Car):
                carModelEmissions += tripLegEmission.emissions
            elif isinstance(transportMean, models.GeneralCar):
                carEmissions += tripLegEmission.emissions
            elif isinstance(transportMean, models.Bus):
                busEmissions += tripLegEmission.emissions
            elif isinstance(transportMean, models.Taxi):
                taxiEmissions += tripLegEmission.emissions
            elif isinstance(transportMean, models.Ferry):
                ferryEmissions += tripLegEmission.emissions
            elif isinstance(transportMean, models.Motorcycle):
                motorcycleEmissions += tripLegEmission.emissions
            elif isinstance(transportMean, models.Airplane):
                airplaneEmissions += tripLegEmission.emissions
            elif isinstance(transportMean, models.Rail):
                railEmissions += tripLegEmission.emissions
    
    returnValues.append({'carModel': carModelEmissions,
                        'car': carEmissions,
                        'bus': busEmissions,
                        'taxi': taxiEmissions,
                        'ferry': ferryEmissions,
                        'motocycle': motorcycleEmissions,
                        'airplane': airplaneEmissions,
                        'rail': railEmissions}) 
    
    return HttpResponse(json.dumps(returnValues,  cls=DjangoJSONEncoder), mimetype="application/json")

#return the provenance graph with the id passed as a GET parameter
def getProvGraph(request):
    provManager = ProvManager() 
    returnValues = provManager.getProvBundleInJson(request.GET['provBundleId'])

    return HttpResponse(json.dumps(returnValues, cls=DjangoJSONEncoder), mimetype="application/json")

#crates a temporary static png image of the graph of a provenance graph
def getStaticProvGraph(request):
    provManager = ProvManager() 
    returnValues = provManager.createTempProvGraphImage(request.GET['provBundleId'])
    
    return HttpResponse(json.dumps(returnValues, cls=DjangoJSONEncoder), mimetype="application/json")

#deletes the temporary prov graph that was created earlier
def deleteTempProvImg(request):
    provManager = ProvManager()
    provManager.deleteTempProvGraphImage()

#return information about a prov graph node (i.e agent, activity or entity)
def getProvNodeInfo(request):
    provManager = ProvManager()
    returnValues = provManager.getProvNodeInfo(request.GET['id'])
    
    return HttpResponse(json.dumps(returnValues, cls=DjangoJSONEncoder), mimetype="application/json")


#returns the user trip page. (without any trips this is done asynchronously with AJAX) 
@login_required
@detect_mobile
def getUserTrips(request):
    """
        returns all the trips that user has made along with information about each trip
    """
    userProfile = User.get_profile(request.user)
    
    if not request.mobile:
        return render_to_response('trips.html', {'name': request.user.first_name, 
                                             'surname': request.user.last_name,
                                             'user': request.user,
                                             'base': BASE_TEMPLATE,
                                             'mobileDevice': request.mobile}, context_instance=RequestContext(request))
    else:
        return render_to_response('trips.html', {'name': request.user.first_name, 
                                             'surname': request.user.last_name,
                                             'user': request.user,
                                             'base': MOBILE_BASE_TEMPLATE,
                                             'mobileDevice': request.mobile}, context_instance=RequestContext(request)) 

#returns the trips made by user, where the transport mean was a specific car model
def getTripsWithCarModel(request):
    """
        returns the trips made by user, where the transport mean was a specific car model
    """
    userProfile = User.get_profile(request.user)
    page = request.GET.get('page')
    
    trips, totalItems = _getUserTripInfo(userProfile, models.Car, page)
    returnValues = {'trips': trips, 'totalItems': totalItems}
    
    return HttpResponse(json.dumps(returnValues, cls=DjangoJSONEncoder), mimetype="application/json")

#returns the trips made by user, where the transport mean was a bus
def getTripsWithBus(request):
    """
        returns the trips made by user, where the transport mean was a bus
    """
    userProfile = User.get_profile(request.user)
    page = request.GET.get('page')
    
    trips, totalItems = _getUserTripInfo(userProfile, models.Bus, page)
    returnValues = {'trips': trips, 'totalItems': totalItems}
    
    return HttpResponse(json.dumps(returnValues, cls=DjangoJSONEncoder), mimetype="application/json")

#returns the trips made by user, where the transport mean was a car
def getTripsWithCar(request):
    """
        returns the trips made by user, where the transport mean was a car
    """
    userProfile = User.get_profile(request.user)
    page = request.GET.get('page')
    
    trips, totalItems = _getUserTripInfo(userProfile, models.GeneralCar, page)
    returnValues = {'trips': trips, 'totalItems': totalItems}
    
    return HttpResponse(json.dumps(returnValues, cls=DjangoJSONEncoder), mimetype="application/json")

#returns the trips made by user, where the transport mean was a taxi
def getTripsWithTaxi(request):
    """
        returns the trips made by user, where the transport mean was a taxi
    """
    userProfile = User.get_profile(request.user)
    page = request.GET.get('page')
    
    trips, totalItems = _getUserTripInfo(userProfile, models.Taxi, page)
    returnValues = {'trips': trips, 'totalItems': totalItems}
    
    return HttpResponse(json.dumps(returnValues, cls=DjangoJSONEncoder), mimetype="application/json")

#returns the trips made by user, where the transport mean was a rail
def getTripsWithRail(request):
    """
        returns the trips made by user, where the transport mean was a rail
    """
    userProfile = User.get_profile(request.user)
    page = request.GET.get('page')
    
    trips, totalItems = _getUserTripInfo(userProfile, models.Rail, page)
    returnValues = {'trips': trips, 'totalItems': totalItems}
        
    return HttpResponse(json.dumps(returnValues, cls=DjangoJSONEncoder), mimetype="application/json")

#returns the trips made by user, where the transport mean was a motorcycle
def getTripsWithMotorcycle(request):
    """
        returns the trips made by user, where the transport mean was a motorcycle
    """
    userProfile = User.get_profile(request.user)
    page = request.GET.get('page')
     
    trips, totalItems = _getUserTripInfo(userProfile, models.Motorcycle, page)
    returnValues = {'trips': trips, 'totalItems': totalItems}
    
    return HttpResponse(json.dumps(returnValues, cls=DjangoJSONEncoder), mimetype="application/json")

#returns the trips made by user, where the transport mean was a ferry
def getTripsWithFerry(request):
    """
        returns the trips made by user, where the transport mean was a ferry
    """
    userProfile = User.get_profile(request.user)
    page = request.GET.get('page')
    
    trips, totalItems = _getUserTripInfo(userProfile, models.Ferry, page)
    returnValues = {'trips': trips, 'totalItems': totalItems}
    
    return HttpResponse(json.dumps(returnValues, cls=DjangoJSONEncoder), mimetype="application/json")

#returns the trips made by user, where the transport mean was a ferry
def getTripsWithAirplane(request):
    """
        returns the trips made by user, where the transport mean was a ferry
    """
    userProfile = User.get_profile(request.user)
    page = request.GET.get('page')
    
    trips, totalItems = _getUserTripInfo(userProfile, models.Airplane, page)
    returnValues = {'trips': trips, 'totalItems': totalItems}
    
    return HttpResponse(json.dumps(returnValues, cls=DjangoJSONEncoder), mimetype="application/json")

def _getUserTripInfo(userProfile, model, page):
    pageSize = 2
    trips = []
    page = int(page)
    skip = (page - 1) * pageSize
    object_list = models.Trip.objects.filter(userProfile=userProfile) #[skip:pageSize]    
   
    for trip in object_list:
        #get all trip legs for this trip and the specified transport mean 
        tripLegs = trip.tripleg_set.filter(content_type=ContentType.objects.get_for_model(model))
        
        #if there are trip which trip legs have specified transport mean then add it to the list.
        #additionally add the details of all the trip legs of that trip, regardsless of the transport mean used by the
        #rest trip legs
        if len(tripLegs) > 0:
            tripLegs = trip.tripleg_set.all()
            trips.append({'id': trip.id, 'name': trip.name, 'date': trip.date, 'tripLegs': []})
            for tripLeg in tripLegs:
                tripLegEmission = models.TripLegCarbonEmission.objects.get(tripLeg=tripLeg)
                trips[len(trips)-1]['tripLegs'].append({'from': tripLeg.startAddress.street,
                                                        'to': tripLeg.endAddress.street,
                                                        'emissions': tripLegEmission.emissions })
    
    return (trips[skip:pageSize], len(trips))   
    

#return the edit trip page
@detect_mobile
def editTrip(request, tripId):
    """
        return the edit trip page
    """
    
    if not request.mobile:
        response = render_to_response('tripEdit.html', {'base': BASE_TEMPLATE})
    else:
        response = render_to_response('tripEdit.html', {'base': MOBILE_BASE_TEMPLATE})
        
    #store the trip id in a cookie
    response.set_cookie('tripToEdit', tripId)
    
    
    return response

#return information about the specified trip
def getTrip(request):
    tripId = request.GET['tripId']
    trip = models.Trip.objects.get(id=tripId)
    tripValues = models.Trip.objects.values('name', 'type', 'date').get(id=tripId)
    tripLegValues = []   
    tripLegs = trip.tripleg_set.all()
    
    for tripLeg in tripLegs:
        tripLegData = {'startAddress': model_to_dict(tripLeg.startAddress),
                       'endAddress': model_to_dict(tripLeg.endAddress)}
        tripLegValues.append(tripLegData)
    
    returnValues = {'trip': tripValues, 'tripLegs': tripLegValues} 
    
    return HttpResponse(json.dumps(returnValues, cls=DjangoJSONEncoder), mimetype="application/json")


def mobile(request):
    return render_to_response('mobile_test.html');