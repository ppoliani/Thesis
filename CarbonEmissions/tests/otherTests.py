from django.test import TestCase
from django.contrib.auth.models import User
from CarbonEmissions import models
from datetime import datetime
from django.test import Client

class otherTest(TestCase):
    #is called before each test case (e.g test_insertingUserProfiles)
    def setUp(self):
        
        self.user = User.objects.create(username='ppoliani')
        self.userProfile = models.UserProfile.objects.create(user=self.user, title='Mr', type='student', occupation='student')
        
        self.address = models.Address.objects.create(country='UK', county='Hampshire', city='Southampton', street='723 portswood road' ,postalCode='SO17 3ST', \
                                                     longitude = 123.6765, latitude= 123.675, name='some name', visibility=False)
        self.trip = models.Trip.objects.create(userProfile=self.userProfile, type='commuter', name='trip name', date=datetime.now())
        self.car = models.Car.objects.create(manufacturer='Audi', model='A5', engineCapacity=2000, \
                                             fuelType='petrol')
        self.tripLeg = models.TripLeg.objects.create(trip=self.trip, startAddress=self.address, endAddress=self.address, \
                                                     transportMean=self.car, step=1, time=datetime.time(datetime.now()))
        self.transportMeanUsedByUser = models.TransportMeansUsedByUsers.objects.create(transportMean=self.car, userProfile=self.userProfile)
        
        self.emissionFactorSource = models.EmissionFactorSource.objects.create(name='Defra', year=2012, link='http://link.com')
        self.emissionFactor = models.CarEmissionFactor.objects.create(source=self.emissionFactorSource, directGHGEmissions=0.1232, \
                                                                      fuelType='petrol', carType='small car')
        
        self.transportMeanEmissionFactor = models.TransportMeanEmissionFactor.objects.create(transportMean=self.car, emissionFactor=self.emissionFactor)
        self.calculationMethod = models.C02CalculationMethod.objects.create(name='tier1 method', description='some description', tier='1')

    #is called after each test case (e.g test_insertingUserProfiles)
    def tearDown(self):
        self.address.delete()
        self.userProfile.delete()
        self.trip.delete()
        self.car.delete()
        self.tripLeg.delete()
        self.transportMeanUsedByUser.delete()
        
    #testing the carbon emission calculation for trip legs
    def test_tripLegCarbonEmissionCalculation(self):
        c = Client()

        # Extra parameters to make this a Ajax style request.
        kwargs = {
                    'tripLegId':self.tripLeg.id,
                    'drivingDistance': 100,
                    'transportMeanType': 'car',
                    'calculationMethod': 'tier1'
                 }
        response = c.post('/compute-trip-leg-emissions/', kwargs)
        
        #pass
        emissions = float(models.TripLegCarbonEmission.objects.get(tripLeg=self.tripLeg).emissions)
        self.assertEqual( emissions, 12.32)
        
        #fail
        self.assertEqual( emissions, 120.32)