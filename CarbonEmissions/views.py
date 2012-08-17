
from django.shortcuts import render_to_response
from django.http import HttpResponse
from CarbonEmissions import models
from CarbonEmissions.forms import TripForm
import codecs
import json
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from CarbonEmissions.ProvManager import ProvManager

from django.utils import simplejson

def bingMaps(request):
    return render_to_response('shared/partial/bingMaps.html')

def parseCarCsv(request):
    """populate the car table with csv files taken from http://carfueldata.direct.gov.uk/downloads/default.aspx"""
    
    #use file object's context manager
    #latin-1 encoding to get french characters
    with codecs.open('Thesis/CarbonEmissions/temp/euro4.csv', 'r', 'latin-1') as file_object:
        file_object.readline()
        for line in file_object:
            values = line.split(',')
            #add co2 and co4 together. convert to kg/km
            ghgEmissions = float(values[13])/1000 + float(values[16])/1000000
            #combine transmision and AorM together and store it as transmission in the table
            transmission =  '%s %s' % (values[3], values[4],)  # or values[3] + ' ' + values[4]
            models.Car(manufacturer=values[0], model=values[1], description=values[2], directGHGEmissions=ghgEmissions, \
                       transmission=transmission, engineCapacity=int(values[5]), fuelType=values[6]).save()
                       
    

def createTrip(request):
    """view for persisting the data submitted by users when creating new trips"""
    
    if request.method == 'POST':
        form = TripForm(request.POST)
        if form.is_valid():
            print 'Form is valid'
    else:
        form = TripForm()
        
    return render_to_response('createTrip.html', {'form': form})

# A view that returns the  distinct car manufacturers values from the db in JSON format
def getCarManufacturers(request):
    manufacturers = models.Car.objects.values('manufacturer').distinct()
    # refer to http://stackoverflow.com/questions/6601174/converting-a-django-valuesqueryset-to-a-json-object/6601250#6601250 
    # and http://djangosnippets.org/snippets/2454/ for explanation
    manufacturers = list(manufacturers)
    
    return HttpResponse(json.dumps(manufacturers), mimetype='application/json')

#returns the models that correspond to a specific manufacturer passed as get parameter, in JSON format
def getCarModels(request):
    if request.GET['manufacturer'] != 'null':
        cars = models.Car.objects.values('model').filter(manufacturer=request.GET['manufacturer'])
        cars = list(cars)
    
        return HttpResponse(json.dumps(cars), mimetype='application/json')  
    
#returns the engine capacity that correspond to a specific model passed as get parameter, in JSON format
def getCarModelData(request):
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
    if request.GET['type'] == 'Car':
        model = request.GET['model']
        description = request.GET['description']
        engineCapacity = request.GET['engineCapacity']
        fuelType = request.GET['fuelType']
        transmission = request.GET['transmission']
        
        car = models.Car.objects.get(model=model, description=description, engineCapacity=engineCapacity, fuelType=fuelType, transmission=transmission)
        json = simplejson.dumps( {'transportMeanId': car.id})
        
        return HttpResponse(json,  mimetype='application/json')

#saves the trip and returns the id of the saved trip
@csrf_exempt
def saveTrip(request):
    userProfile = User.get_profile(request.user)

    postedType = request.POST.getlist('type')[0]
    postedName = request.POST.getlist('tripName')[0]
    postedDate = request.POST.getlist('date')[0]
    
    trip = models.Trip.objects.create(userProfile=userProfile, type=postedType, name=postedName, date=postedDate)
    
    #return the id of the trip along with information about the user.
    json = simplejson.dumps( {'tripId': trip.id, 'userName': request.user.username, 'email': request.user.email} )
    
    return HttpResponse(json,  mimetype='application/json')

#saves the trip leg 
@csrf_exempt
def saveTripLeg(request):
    tripId = request.POST.getlist('tripId')[0]
    tripLegStep = request.POST.getlist('step')[0]
    tripLegTime = request.POST.getlist('time')[0]
    
    trip = models.Trip.objects.get(id=tripId)
    
    #save the start address
    postedCountry = request.POST.getlist('startAddrCountry')[0]
    postedCounty = request.POST.getlist('startAddrCounty')[0]
    postedCity = request.POST.getlist('startAddrCity')[0]
    postedPostalCode = request.POST.getlist('startAddrPostalCode')[0]
    postedStreet = request.POST.getlist('startAddrStreet')[0]
    postedVisibilitry = request.POST.getlist('startAddrVisibility')[0]
    #postedAddrName = request.POST.getlist('startAddrName')[0]
    postedLongitude = request.POST.getlist('startAddrLongitude')[0]
    postedLatitude = request.POST.getlist('startAddrLatitude')[0]
    
    startAddress = models.Address.objects.create(country=postedCountry, county=postedCounty, city=postedCity, postalCode=postedPostalCode, \
                                                 street=postedStreet, visibility=postedVisibilitry, longitude=postedLongitude, \
                                                 latitude=postedLatitude)
    
    #save the end address
    postedCountry = request.POST.getlist('endAddrCountry')[0]
    postedCounty = request.POST.getlist('endAddrCounty')[0]
    postedCity = request.POST.getlist('endAddrCity')[0]
    postedPostalCode = request.POST.getlist('endAddrPostalCode')[0]
    postedStreet = request.POST.getlist('endAddrStreet')[0]
    postedVisibilitry = request.POST.getlist('endAddrVisibility')[0]
    #postedAddrName = request.POST.getlist('endAddrName')[0]
    postedLongitude = request.POST.getlist('endAddrLongitude')[0]
    postedLatitude = request.POST.getlist('endAddrLatitude')[0]
    
    endAddress = models.Address.objects.create(country=postedCountry, county=postedCounty, city=postedCity, postalCode=postedPostalCode, \
                                                 street=postedStreet, visibility=postedVisibilitry, longitude=postedLongitude, \
                                                 latitude=postedLatitude)
    
    #if user has not added the value just retrieve the existing car, otherwise save the new car created by the user
    if request.POST.getlist('carName')[0] == '':
        transportMean = models.Car.objects.get(id=request.POST.getlist('transportMeanId')[0]) 
        
    else:
        postedEngineCapacity = request.POST.getlist('engineCapacity')[0]
        postedCarName = request.POST.getlist('carName')[0]
        postedFuelType = request.POST.getlist('fuelType')[0]
        #the directGHGEmissions field has dummy value. It will be changed during the second milestone
        transportMean = models.Car.objects.create(engineCapacity=int(postedEngineCapacity), description=postedCarName, fuelType=postedFuelType, \
                                           directGHGEmissions = 1.23)
        
    #save the trip leg
    tripLeg = models.TripLeg.objects.create(trip=trip, startAddress=startAddress, endAddress=endAddress, transportMean=transportMean, \
                                            step=tripLegStep, time=tripLegTime)
    
    
    #finally store this transport mean in the transportMeanUsedByusers model, for future use
    userProfile = User.get_profile(request.user)
    models.TransportMeansUsedByUsers(userProfile=userProfile, transportMean=transportMean).save()
    
    json = simplejson.dumps( {'tripLegId': tripLeg.id} )
    
    return HttpResponse(json, mimetype='application/json')


#a view that will call all the methods for creating and persisting provenance graphs for each action
@csrf_exempt
def prov(request):
    provManager = ProvManager()
    post = request.POST
    if post['actionPerformed'] == 'tripCreation':
        bundle = provManager.createTripCreationGraph(post['userName'], post['userEmail'], post['tripId'],\
                                                      simplejson.loads(post['tripLegIds']), post['startTime'], post['endTime'])
    
    
    #save the graph
    #save_bundle(bundle)
    
    
    
    
    