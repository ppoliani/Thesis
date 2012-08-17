
from prov.model import ProvBundle, Namespace, Literal, PROV, XSD, Identifier 
import datetime
 

class ProvManager:
    """
    Class responsible fror provenance-centered tasks 
    """


    def __init__(self):
        '''
        Constructor
        '''
        
    def createTripCreationGraph(self):
        #the namespace of the project
        cf = Namespace('cf', 'rs.ecs.soton.ac.uk/pp6g11/ontology/carbonFooprints/')
        
        # create a provenance _container
        g = ProvBundle()
    
        g.add_namespace("foaf","http://xmlns.com/foaf/0.1/")
        
        #create entities
        g.entity(cf['tripLeg1'])
        g.entity(cf['tripLeg2'])
        g.entity(cf['trip'])
        
        #create activity
        g.activity(cf['tripCreation'], datetime.datetime(2008, 7, 6, 5, 4, 3), datetime.datetime(2008, 7, 6, 5, 4, 3))
        
        #create agent
        g.agent('cf:ppoliani', {'prov:type': 'prov:Person', 'foaf:giveName': 'Pavlos', 'foaf:mbox': '<mailto:ppoliani@gmail.com>'})
        
        #add relations
        g.wasGeneratedBy('cf:tripLeg1', 'cf:tripCreation')
        g.wasGeneratedBy('cf:tripLeg2', 'cf:tripCreation')
        g.wasGeneratedBy('cf:trip', 'cf:tripCreation')
        
        g.wasAssociatedWith('cf:tripCreation', 'cf:ppoliani')
        
        #derivation
        g.wasDerivedFrom('cf:trip', 'cf:tripLeg1')
        g.wasDerivedFrom('cf:trip', 'cf:tripLeg2')
        
        return g
        
        
        
        
        