"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from django.contrib.auth.models import User
from CarbonEmissions import models
from datetime import datetime

class DbTest(TestCase):
    #is called before each test case (e.g test_insertingUserProfiles)
    def setUp(self):
        
        self.user = User.objects.create(username='ppoliani')
        self.userProfile = models.UserProfile.objects.create(user=self.user, title='Mr', type='student', occupation='student')
        
        self.address = models.Address.objects.create(country='UK', county='Hampshire', city='Southampton', postalCode='SO17 3ST', \
                                                     longitude = 123.6765, latitude= 123.675, name='some name', visibility=False)
        self.trip = models.Trip.objects.create(userProfile=self.userProfile, type='commuter', name='trip name', date=datetime.now(),\
                                                time=datetime.time(datetime.now()))
        self.car = models.Car.objects.create(manufacturer='Audi', model='A5', CO2Emissions=10.102, engineCapacity=2000, \
                                             fuelType='petrol')
        self.tripLeg = models.TripLeg.objects.create(trip=self.trip, startAddress=self.address, endAddress=self.address, \
                                                     transportMean=self.car, step=1)
        self.transportMeanUsedByUser = models.TransportMeansUsedByUsers.objects.create(transportMean=self.car, userProfile=self.userProfile)

    #is called after each test case (e.g test_insertingUserProfiles)
    def tearDown(self):
        self.address.delete()
        self.user.delete()
        self.userProfile.delete()
        self.trip.delete()
        self.car.delete()
        self.tripLeg.delete()
        self.transportMeanUsedByUser.delete()
        
    #Testing the insertion of user profiles into our datbase 
    def test_insertingUserProfiles(self):
        """
            Testing the insertion of user profiles into our datbase 
        """       
        #passes
        self.assertEqual(self.user.get_profile().title,'Mr')
        #fails
        self.assertEqual(self.user.get_profile().type,'academic')
    
    #Testing the insertion of addresses into our datbase         
    def test_insertAddresses(self):
        """
            Testing the insertion of addresses into our datbase 
        """   
        #passes
        self.assertEqual(self.address.country,'UK')      
        #fails
        self.assertEqual(self.address.city,'London')
    
    #Testing the insertion of trips into our datbase         
    def test_insertTrips(self):
        """
            Testing the insertion of addresses into our datbase 
        """       
        #passes
        self.assertEqual(self.trip.name,'trip name')  
        #fails
        self.assertEqual(self.trip.type, 'business')
    
    #Testing the insertion of cars into our datbase         
    def test_insertCars(self):
        """
            Testing the insertion of addresses into our datbase 
        """    
        #passes
        self.assertEqual(self.car.model,'A5')  
        #fails
        self.assertEqual(self.car.CO2Emissions, 10.123)
    
    #Testing the insertion of cars into our datbase         
    def test_insertTripLegs(self):
        """
            Testing the insertion of addresses into our datbase 
        """    
        #passes
        self.assertEqual(self.tripLeg.trip.type,'commuter')  
        self.assertEqual(self.tripLeg.trip.userProfile.type,'student')
        self.assertEqual(self.tripLeg.startAddress.country,'UK')
        #fails
        self.assertEqual(self.tripLeg.transportMean.engineCapacity, 3000)
    
    #Testing the insertion of transportmeans used by users into our datbase         
    def test_insertTransportMeanUsedByUsers(self):
        """
            Testing the insertion of addresses into our datbase 
        """    
        #passes
        self.assertEqual(self.transportMeanUsedByUser.transportMean.model,'A5')  
        #fails
        self.assertEqual(self.transportMeanUsedByUser.userProfile.title, 'Miss')
        

