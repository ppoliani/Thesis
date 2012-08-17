
from prov.model import ProvBundle, Namespace, Literal, PROV, XSD, Identifier 
import datetime 

from prov.server.models import save_bundle
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
        cf = Namespace('cf', 'rs.ecs.soton.ac.uk/pp6g11/ontology/carbonFooprints/')
        
        # create a provenance _container
        g = ProvBundle()
    
        g.add_namespace("foaf", "http://xmlns.com/foaf/0.1/")
        
        #create activity
        g.activity(cf['tripCreation'], startTime, endTime)
        
        #create entities.
        g.entity(cf['trip' + tripId])
        
        #create trip leg entities
        for tripLegId in tripLegIds:
            tripLegId = str(tripLegId)
            g.entity(cf['tripLeg' + tripLegId])
            g.wasGeneratedBy('cf:tripLeg' + tripLegId, 'cf:tripCreation')
            g.wasDerivedFrom('cf:trip' + tripId, 'cf:tripLeg' + tripLegId)
        
        #add relations
        g.wasGeneratedBy('cf:trip' + tripId, 'cf:tripCreation')
       
        #create agent
        g.agent('cf:' + userName, {'prov:type': 'prov:Person', 'foaf:mbox': '<mailto:' + userEmail + '>'})
              
        g.wasAssociatedWith('cf:tripCreation', 'cf:' + userName)
        
        
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

        
        return g
        
        
        
        
        
