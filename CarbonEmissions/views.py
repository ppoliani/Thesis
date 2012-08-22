
from django.shortcuts import render_to_response
from django.http import HttpResponse
from CarbonEmissions import models
from CarbonEmissions.forms import TripForm
import codecs
import json
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from CarbonEmissions.ProvManager import ProvManager
from django.contrib.contenttypes.models import ContentType
from decimal import Decimal
import datetime
from googlemaps import GoogleMaps

from django.utils import simplejson

#constants
GOOGLE_MAPS_API_KEY = 'AIzaSyDY0dYuWgX47mvEyJoiRjky76pLBTZTlfQ'

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
                       
    

def createTrip(request):
    """view for persisting the data submitted by users when creating new trips"""
    
    if request.method == 'POST':
        form = TripForm(request.POST)
        if form.is_valid():
            print 'Form is valid'
    else:
        form = TripForm()
        
    return render_to_response('createTrip.html', {'form': form})

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
        models.TransportMeansUsedByUsers.objects.get(userProfile=userProfile, object_id=transportMean.id)
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
                                                                           
        endTime = datetime.datetime.now()
        #createProvenanceGraph
        provManager = ProvManager()
        bundle = provManager.createTripLegEmissionGraph(tripLegEmission.id, calculationMethod.id, transportMean.id, transportMeanType,\
                                                            emissionFactor.id, emissionFactor.source.id, drivingDistance, tripLeg.id, tripLeg.startAddress.id,\
                                                            tripLeg.endAddress.id, startTime, endTime)
        tripLeg.provBundle = bundle
        tripLeg.save()

    elif post['calculationMethod'] == 'tier2':
        pass
    
    json = simplejson.dumps( {'status': 'OK'} )
    
    return HttpResponse(json, mimetype='application/json')


def _computeTripLegsEmissions(tripLeg, transportMean, transportMeanType, calculationMethod):
    pass