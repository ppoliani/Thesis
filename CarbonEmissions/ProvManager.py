
from prov.model import ProvBundle, Namespace, Literal, PROV, XSD, Identifier 
from prov.server.models import save_bundle, PDBundle, PDRecord
from CarbonEmissions.models import Trip, TripLeg

import datetime 
from prov.model import graph

import tempfile, os
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
 

class ProvManager:
    """
    Class responsible fror provenance-centered tasks 
    """


    def __init__(self):
        '''
        Constructor
        '''
        
    def createTripCreationGraph(self, userName, userEmail, tripId, tripLegIds, startTime, endTime):
        """Creates and stores the provenacne graph depecting the action of creating the trip"""
        #startTime = datetime.datetime.strptime(startTime, "%a, %d %b %Y %H:%M:%S %Z")
        #endTime = datetime.datetime.strptime(endTime, "%a, %d %b %Y %H:%M:%S %Z")
        #the namespace of the project
        cf = Namespace('cf', 'http://users.ecs.soton.ac.uk/pp6g11/ontology/carbonFooprints/')
        
        # create a provenance _container
        g = ProvBundle()
    
        g.add_namespace("foaf", "http://xmlns.com/foaf/0.1/")
        
        #create activity
        g.activity(cf['tripCreation'], startTime, endTime)
        
        #create entities.
        g.entity(cf['trip-' + tripId])
        
        #create trip leg entities
        for tripLegId in tripLegIds:
            tripLegId = str(tripLegId)
            g.entity(cf['tripLeg-' + tripLegId])
            g.wasGeneratedBy('cf:tripLeg-' + tripLegId, 'cf:tripCreation')
            g.wasDerivedFrom('cf:trip-' + tripId, 'cf:tripLeg-' + tripLegId)
        
        #add relations
        g.wasGeneratedBy('cf:trip-' + tripId, 'cf:tripCreation')
        
        #create agent
        g.agent('cf:' + userName, {'prov:type': 'prov:Person', 'foaf:mbox': '<mailto:' + userEmail + '>'})
              
        g.wasAssociatedWith('cf:tripCreation', 'cf:' + userName)
        g.wasAttributedTo('cf:trip-' + tripId, 'cf:' + userName)
        
        #visualize the graph
        path = tempfile.mkdtemp()
        filepath = os.path.join(path, 'dot-test.png')
    
        # Convert it to DOT
        dot = graph.prov_to_dot(g)
        dot.set_dpi(120)
        # Write it to a temporary PNG file
        dot.write_png(filepath)
    
        # Display it using matplotlib
        img = mpimg.imread(filepath)
        imgplot = plt.imshow(img)
        plt.show()
        os.remove(filepath)
        
        #save the graph
        pdBundle = save_bundle(g)

        return pdBundle
    
    #Creates and stores the provenacne graph depecting the action of calculating carbon emissions of a trip leg
    def createTripLegEmissionGraph(self, tripLegEmissionId, methodId, transportMeanId, transportMeanType, emissionFactorId, \
                                   emissionFactorSourceId, drivingDistance, tripLegId, startAddressId, endAddressId, startTime, endTime):
        """Creates and stores the provenacne graph depecting the action of calculating carbon emissions of a trip leg"""
                
        cf = Namespace('cf', 'http://users.ecs.soton.ac.uk/pp6g11/ontology/carbonFooprints/')
        
        #define the entity, activity and agent identifiers
        tripLegEmission = cf['tripLegEmission-' + str(tripLegEmissionId)]
        transportMean = cf['transportMean-' + str(transportMeanId)]
        emissionFactor = cf['emissionFactor-' + str(emissionFactorId)]
        emissionFactorSource = cf['emissionFactorSource-' + str(emissionFactorSourceId)]
        tripLeg = cf['tripLeg-' + str(tripLegId)]
        tripLegDrivingDistance = cf['tripLegDrivingDistance-' + str(tripLegId)]
        tripLegStartAddress = cf['tripLegStartAddress-' + str(startAddressId)]
        tripLegEndAddress = cf['tripLegEndAddress-' + str(endAddressId)]
        calculationMethod = cf['calculationMetdod-' + str(methodId)]
        
        #the id of the trip leg as it is stored in the PDRecord models
        rec_id = cf.get_uri() +'tripLeg-' + str(tripLegId)
        
        # load the bundle that contains this trip leg. The one that has the trip creation graph
        pdBundle = TripLeg.objects.get(id=tripLegId).trip.provBundle
        # pdBundle = PDBundle.objects.get(id=284) #PDRecord.objects.get(bundle_id=60).bundle
        
        #get the in memmory model of that bundle
        g = pdBundle.get_prov_bundle()

        #get the trip leg entity that is already stored
        tripLegEntity = g.get_record(tripLeg)
         
        #define the activities
        g.activity(cf['tripLegCarbonEmissionsCalculation'], startTime, endTime)
        g.activity(cf['drivingDistanceCalculation'])
        
        #define the entities
        g.entity(tripLegEmission)
        g.entity(transportMean)
        g.entity(emissionFactor)
        g.entity(emissionFactorSource)
        g.entity(tripLegDrivingDistance, {'prov:value': drivingDistance})
        g.entity(tripLegStartAddress)
        g.entity(tripLegEndAddress)
        g.entity(calculationMethod)
        
        #create agent
        g.agent('cf:CarbonEmissionCalculator', {'prov:type': 'prov:SoftwareAgent'})
        g.agent('cf:BingApi', {'prov:type': 'prov:SoftwareAgent'})
        
        #relations
        g.wasAttributedTo(tripLegEmission, 'cf:CarbonEmissionCalculator')
        
        g.wasGeneratedBy(tripLegEmission, 'cf:tripLegCarbonEmissionsCalculation')
        
        g.wasAssociatedWith('cf:tripLegCarbonEmissionsCalculation', 'cf:CarbonEmissionCalculator')
        g.wasAssociatedWith('cf:drivingDistanceCalculation', 'cf:BingApi')
        
        g.used('cf:tripLegCarbonEmissionsCalculation', emissionFactor)
        g.used('cf:tripLegCarbonEmissionsCalculation', transportMean)
        g.used('cf:tripLegCarbonEmissionsCalculation', calculationMethod)
        g.used('cf:tripLegCarbonEmissionsCalculation', tripLegDrivingDistance)
        
        g.wasDerivedFrom(transportMean, tripLegEntity)
        g.wasDerivedFrom(tripLegStartAddress, tripLegEntity)
        g.wasDerivedFrom(tripLegEndAddress, tripLegEntity)
        g.wasDerivedFrom(tripLegDrivingDistance, tripLegStartAddress)
        g.wasDerivedFrom(tripLegDrivingDistance, tripLegEndAddress)
        
        g.wasGeneratedBy(tripLegDrivingDistance, 'cf:drivingDistanceCalculation')
        g.used('cf:drivingDistanceCalculation', tripLegStartAddress)
        g.used('cf:drivingDistanceCalculation', tripLegEndAddress)
        
        #g.hadPrimarySource(emissionFactor, emissionFactorSource)
        
        #visualize the graph
        path = tempfile.mkdtemp()
        filepath = os.path.join(path, 'dot-test.png')
    
        # Convert it to DOT
        dot = graph.prov_to_dot(g)
        dot.set_dpi(120)
        # Write it to a temporary PNG file
        dot.write_png(filepath)
    
        # Display it using matplotlib
        img = mpimg.imread(filepath)
        imgplot = plt.imshow(img)
        plt.show()
        os.remove(filepath)
        
        #small demo of how to encode the bundle into a dictionary and ultimately into json 
        json = g._encode_JSON_container()
        entities = json['entity'].keys()
    
        #save the graph (bundle)
        return save_bundle(g)
        
        
        
