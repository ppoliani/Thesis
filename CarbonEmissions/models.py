from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic

#################### Address model ############################# 
class Address(models.Model):
    """Addresses"""
    
    #the coutnry of the address
    country = models.CharField(max_length=50)
    
    #the county of the address
    county = models.CharField(max_length=50, null=True)
    
    #the city of the address
    city = models.CharField(max_length=30)
    
    #the street of the address
    street = models.CharField(max_length=50)
    
    #the number of the street
    number = models.CharField(max_length=10, null=True)
    
    #the postal code of the address
    postalCode = models.CharField(max_length=15)
    
    #the longitude value of the address
    longitude = models.DecimalField(max_digits=10, decimal_places=6)
    
    #the latitude value of the address
    latitude = models.DecimalField(max_digits=10, decimal_places=6)
    
    #The name of the address. It can help users to identify addresses
    name = models.CharField(max_length=50, null=True)
    
    #Specifies if the address is public or private. Private addresses can be 
    #viewed only by the users who added them to the system.
    visibility = models.BooleanField(default=False)
    
    def __unicode__(self):
        """unicode string representation of the model"""
        return self.street;
    
    class Meta:
        """Inline class for specifying various model-specific options"""
        ordering = ['country']

#################### User profile model ############################# 
class UserProfile(models.Model):
    """Model extending the default django User model"""
    
    #connection with the default django User model
    user = models.OneToOneField(User)
    
    #the persons title
    title = models.CharField(max_length=5, choices=(('Mr','Mr.',), ('Mrs','Mrs',), ('Dr','Dr.'), ('miss', 'Miss')))
    
    #the type of the user e.g. student or academic staff
    type = models.CharField(max_length=10, choices=(('student','Student',),('academic','Academic',)))
    
    #This concerns the users who are members of the staff. 
    #It represents the member's occupation (e.g. professor)
    occupation = models.CharField(max_length=20)
    
    #the locations that users have added earlier
    locations = models.ManyToManyField(Address, null=True)
    
    def __unicode__(self):
        """unicode string representation of the model"""
        return u'%s %s' % (self.user.first_name, self.user.last_name) 
    

#functions used to extend django User model
def create_user_profile(sender, instance, created, **kwargs):
    pass
    #if the following test is uncommented there is an error when running unit tests but not when inserting data in the ordinary database!
    #if created:
    #   UserProfile.objects.create(user=instance)

post_save.connect(create_user_profile, sender=User)


#################### Emission Factors #############################
class EmissionFactorSource(models.Model):
    """Sources for Emission factors relation"""
    name = models.CharField(max_length=50)
    
    #the year of emission factor publication
    year = models.PositiveSmallIntegerField()
    
    #the month of emission factor publication
    month = models.CharField(max_length='3', choices=(('Jan', 'Jan'), ('Feb', 'Feb'), ('Mar', 'Mar'), ('Apr', 'Apr'), ('May', 'May'), \
                                                      ('Jun', 'Jun'), ('Jul', 'Jul'), ('Aug', 'Aug'), ('Sep', 'Sep'), ('Oct', 'Oct'), \
                                                      ('Nov', 'Nov'), ('Dec', ('Dec'))))
    
    #link to the source location
    link = models.URLField()
    
    def __unicode__(self):
        """unicode string representation of the model"""
        return u'%s %s' % (self.name, self.year) 
    
     
    class Meta:
        """Inline class for specifying various model-specific options"""
        ordering = ['name']
        

#################### Abstract Emission Factors #############################
class EmissionFactor(models.Model):
    """Emission factor relation. Abastact model"""
    
    #the source of this emission factor
    source = models.ForeignKey(EmissionFactorSource)
    
    #the direct Grenn House Gas emitted to the atmosphere (Kg C02e/km)
    directGHGEmissions = models.DecimalField(max_digits=6, decimal_places=4)
    
    def __unicode__(self):
        """unicode string representation of the model"""
        return u'%s %s %s' % (self.source.name, self.source.year, self.directGHGEmissions) 
    
    class Meta:
        """Inline class for specifying various model-specific options"""
        abstract = True
         

#################### Car Emission Factors  #############################
class CarEmissionFactor(EmissionFactor):
    """Emission factor relation, for cars"""
    
    #the fuel type used by the car
    fuelType = models.CharField(max_length=10)
    
    #the minimum (Lower limit) engine capacity of the car 
    minEngineCapacity = models.PositiveSmallIntegerField()
    
    #the maximum (Upper limit) engine capacity of the car
    maxEngineCapacity = models.PositiveSmallIntegerField()
    
#################### Bus Emission Factors #############################
class BusEmissionFactor(EmissionFactor):
    """Emission factor relation, for buses"""
    
    #the type of the bus e.g. local london bus, coach, average local bus
    busType = models.CharField(max_length=50)

#################### Taxi Emission Factors  #############################
class TaxiEmissionFactor(EmissionFactor):
    """Emission factor relation, for taxis"""
    
    #the type of the bus e.g. black cab, regular taxi
    taxiType = models.CharField(max_length=50)
    
    
#################### Rail Emission Factors  #############################
class RailEmissionFactor(EmissionFactor):
    """Emission factor relation, for trains"""
    
    #the type of the train e.g. national rail, international etc.
    railType = models.CharField(max_length=50)
    
#################### Ferry Emission factors  #############################
class FerryEmissionFactor(EmissionFactor):
    """Emission factor relation, for ferries"""
    
    #the type of ferry bus e.g. foot passangers
    ferryType = models.CharField(max_length=50)
    
#################### Motorcycles Emission factors  #############################
class MotorcycleEmissionFactor(EmissionFactor):
    """Emission factor relation, for motorcycles"""
    
    #the type of the motorcycle e.g. small petrol motorbike up to 125cc
    motorcycleType = models.TextField()
    
#################### Aviation Emission factors#############################
class aviationEmissionFactor(EmissionFactor):
    """Emission factor relation, for airplanes"""
    
    #the type of the flight e.g. small petrol motorbike up to 125cc
    flightType = models.CharField(max_length=50)
    
    #the cabin type e.g. economy, business, first class
    cabinClass = models.CharField(max_length=50) 
    
    

#################### Transport Means #############################
class TransportMean(models.Model):
    """Transport mean realtion"""
    
    #the type of the transport mean, useless since this is an abstract class and we have instances of specific classes e.g. car
    #type = models.CharField(max_length=10, choices=(('car', 'Car',), ('bus', 'Bus',), ('taxi', 'Taxi',), \
    #                                            ('train', 'Train',), ('airplane','Airplane')))
     
    #Some additional information about the transport mean
    description = models.TextField(null=True)
    
    #Greenhouse gas(kg/km).The sum of CO2, CO4 and N2O emitted by the specific transport (tier 2 method) mean per km
    directGHGEmissions = models.DecimalField(max_digits=6, decimal_places=4, null=True)
    
    def __unicode__(self):
        """unicode string representation of the model"""
        return u'%s %s' % (self.manufacturer, self.model,)
    
    class Meta:
        """Inline class for specifying various model-specific options"""
        abstract = True
        

#################### Transport Mean realtion factors#############################
class TransportMeanEmissionFactor(models.Model):
    """The emission factors of transport means"""
    
    #because django doesn't allow to add foreign key to an abstract class, we use a generic relations
    # read https://docs.djangoproject.com/en/dev/ref/contrib/contenttypes/#id1
    transportMean_content_type = models.ForeignKey(ContentType, related_name='transportMean')  
    transportMean__id = models.PositiveIntegerField()
    transportMean = generic.GenericForeignKey('transportMean_content_type', 'transportMean__id')
    
    #generic emission factor foreign key
    emissionFactor_content_type = models.ForeignKey(ContentType, related_name='emissionFactor')
    emissionFactor_id = models.PositiveSmallIntegerField()
    emissionFactor = generic.GenericForeignKey('emissionFactor_content_type', 'emissionFactor_id')

     
#################### Trip model #############################
class Trip(models.Model):
    """The trip model"""
    
    #the person who added the trip
    userProfile = models.ForeignKey(UserProfile)
    
    #the type of the trip e.g. buisness or commuter
    type = models.CharField(max_length=10, choices=(('commuter', 'Commuter'), ('business', 'Business'),))
    
    #The name of the trip.This can help users to identify past trips.
    name = models.CharField(max_length=50)
    
    #the date of the trip
    date = models.DateField()
    
    def __unicode__(self):
        """unicode string representation of the model"""
        return self.name
    
    class Meta:
        """Inline class for specifying various model-specific options"""
        ordering = ['name']


#################### Car model #################################
class Car(TransportMean):
    """Represents a car relation"""
    
    #the manufacturer of the transport mean
    manufacturer = models.CharField(max_length=30, null=True)
    
    #The specific model of the transport mean"
    model = models.CharField(max_length=50, null=True)
    
    #The car trasmission
    transmission = models.CharField(max_length=20, null=True)
    
    #The car's engine capacity. PostegreSql small int range -32768 to +32767
    engineCapacity = models.PositiveSmallIntegerField()
    
    #The type of fuel that the car uses
    fuelType = models.CharField(max_length=30)
    
    def __unicode__(self):
        """unicode string representation of the model"""
        return u'%s %s' % (self.manufacturer, self.model,)
    
    #Problem when using distinct() returns duplicate values
    #class Meta:
    #    """Inline class for specifying various model-specific options"""
    #    ordering = ['manufacturer']   
    
    
#################### Group model #################################
class Group(models.Model):
    """Any group that contains a number of people, such as a research group, an academic unit or the whole university."""
    
    #A group can be part of a wider group of people. 
    #For example, the WAIS research group is part of the "Electronics and Computer Science" academic unit"
    groups = models.ManyToManyField("self", symmetrical=False)
    
    #The group's name
    name = models.CharField(max_length=50)
    
    #Some additional information for a group
    description = models.TextField()
    
    #a group comprises a number of users
    users = models.ManyToManyField(UserProfile)
    
    def __unicode__(self):
        """unicode string representation of the model"""
        return self.name
    
    class Meta:
        """Inline class for specifying various model-specific options"""
        ordering = ['name']    
        

#################### Trip leg model #############################
class TripLeg(models.Model):
    """The intermediary trip legs"""
    
    #the trip which this trip leg is part of
    trip = models.ForeignKey(Trip)
    
    #the start address of the trip leg. To avoid field clash we use the related_name attribute
    #refer to http://stackoverflow.com/questions/1142378/django-why-some-fields-clashes-with-other
    startAddress = models.ForeignKey(Address, related_name='tripleg_startAddresses')
    
    #the end address of the trip leg
    endAddress = models.ForeignKey(Address, related_name='tripleg_endAddresses')
    
    #because django doesn't allow to add foreign key to an abstract class, we use a generic relations
    # read https://docs.djangoproject.com/en/dev/ref/contrib/contenttypes/#id1
    content_type = models.ForeignKey(ContentType)  
    object_id = models.PositiveIntegerField()
    transportMean = generic.GenericForeignKey('content_type', 'object_id')
    
    #The step of the trip. In other words the stage of the trip that this leg represents
    step = models.PositiveSmallIntegerField()
    
    #the time of the trip was made
    time = models.TimeField()
    
    
    def __unicode__(self):
        """unicode string representation of the model"""
        return u'%s %s' % (self.startAddress, self.endAddress,)
    
    class Meta:
        """Inline class for specifying various model-specific options"""
        ordering = ['step']
    
    
#################### Transport means by users model #############################
class TransportMeansUsedByUsers(models.Model):
    """model representing a table containing all the transport means that were used by all the users"""
    
    #because django doesn't allow to add foreign key to an abstract class, we use a generic relations
    # read https://docs.djangoproject.com/en/dev/ref/contrib/contenttypes/#id1
    content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()
    transportMean = generic.GenericForeignKey('content_type', 'object_id')
    
    #the user tha used this transport mean
    userProfile = models.ForeignKey(UserProfile)
    
    def __unicode__(self):
        """unicode string representation of the model"""
        return u'%s %s' % (self.transportMean.manufacturer, self.transportMean.model,)

#################### Transport means owned by users model #############################
class TransportMeansOwnedByUsers(models.Model):
    """models representing a tabale containing all the transport means that are owned by users."""
    
    #the user that owns this transport mean
    userProfile = models.ForeignKey(UserProfile)
    
    #because django doesn't allow to add foreign key to an abstract class, we use a generic relations
    # read https://docs.djangoproject.com/en/dev/ref/contrib/contenttypes/#id1
    #tranposrt mean owned by a user
    content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()
    transportMean = generic.GenericForeignKey('content_type', 'object_id')

    def __unicode__(self):
        """unicode string representation of the model"""
        return u'%s %s' % (self.transportMean.manufacturer, self.transportMean.model,)
    

#################### Transport means owned by users model #############################
class TransportMeansOwnedByGroups(models.Model):
    """models representing a tabale containing all the transport means that are owned by groups."""
    
    #the user that owns this transport mean
    group = models.ForeignKey(Group)
    
    #because django doesn't allow to add foreign key to an abstract class, we use a generic relations
    # read https://docs.djangoproject.com/en/dev/ref/contrib/contenttypes/#id1
    #tranposrt mean owned by a group
    content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()
    transportMean = generic.GenericForeignKey('content_type', 'object_id')

    def __unicode__(self):
        """unicode string representation of the model"""
        return u'%s %s' % (self.transportMean.manufacturer, self.transportMean.model,)
    
    
    