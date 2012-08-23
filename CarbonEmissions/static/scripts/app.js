/// <reference path="ember-1.0.pre.min.js" />
/// <reference path="jquery-1.6.2.js" />

/*************************************
 * Application
 *************************************/

App = Em.Application.create({
	name : 'carbon footprints',

	ready : function() {
		App.addTripView.tripLegsContainer.appendTo('#trip-legs');
	},
});

/*************************************
 * Models
 *************************************/
App.Address = Em.Object.extend({
	country: null,
	county: null,
	city: null,
	number: null,
	street: null,
	postalCode: null,
	longitude: null,
	latitude: null,
	name: null,
	visibility: null,	
});

/*Model representing the specific car model, chosen from the list of existing cars*/
App.CarModel = Em.Object.extend({
	manufacturer : null,
	model : null,
	description: null,
	engineCapacity : null,
	transmission : null,
	fuelType : null
});

/*Model representing a car*/
App.GeneralCarModel = Em.Object.extend({
	description : null,
	fuelType : null
});

/*Model representing buses*/
App.BusModel = Em.Object.extend({
	description: null
});

/*Model representing taxis*/
App.TaxiModel = Em.Object.extend({
	description: null
});

/*Model representing motorcycles*/
App.MotorcycleModel = Em.Object.extend({
	description: null
});

/*Model representing ferries*/
App.FerryModel = Em.Object.extend({
	description: null
});

/*Model representing rail transport means*/
App.RailModel = Em.Object.extend({
	description: null
});

/*Model representing airplanes*/
App.AviationModel = Em.Object.extend({
	description: null,
	cabinClass: null
});


/*The model that represent the information of a trip leg that users insert*/
App.TripLeg = Em.Object.extend({
	time : null,
	//data for trip leg and for start and end addresses
	startAddress: null,
	endAddress: null,
	step : null,
	startAddrVisibility: null,
	endAddrVisibility: null,
	transportMeanType: null,
	calculationMethod: null,
	
	//the specific model of car, if one was choses
	carModel: null,
	//...else the data of the general car that was selectes
	generalCarModel: null,
	busModel: null,
	taxiModel: null,
	motorcycleModel: null,
	ferryModel: null,
	railModel: null,
	aviationModel: null,
});

/*************************************
 * Views
 *************************************/
/*location query text field*/
App.LocationQueryTextField = Em.TextField.extend({
	attributeBindings: ['autofocus'],
	insertNewline: function(){
		this.get('parentView').findLocation();
	},
	autofocus: true,
});

/*Custom select view. We do that so as to add additional attributes through view attribute bindings.*/
App.CustomSelect = Em.Select.extend({
	attributeBindings: ['name'],
	
});

/*Custom text field view. We do that so as to add additional attributes through view attribute bindings.*/
App.CustomTextField = Em.TextField.extend({
	attributeBindings: ['name'],
	
});

/*overiding existing form element views. Address text field*/
App.AddressTextField = Em.TextField.extend({
	focusIn: function(event){
		//call the show map of the parent view (i.e. trip leg view). Pass the class (last class name) of the text field (i.e startAddress or endAddress)
		var className = event.srcElement.className.split(' ')[2];
		this.get('parentView').showMap(className);
	},
});


/*The add trip view. Parent for all the subviews of the add trip form*/
App.AddTripView = Em.View.extend({
	templateName : 'add-trip-view',
	tagName : 'section',
	
	//containerView which holds the trip legs
	tripLegsContainer:  null,
	
	didInsertElement: function(){
		$("#dateTimePicker").kendoDatePicker({
        	format: 'yyyy-MM-dd'
        });
    }

});

/*a container view holding child views which represent  differrent trip legs e.g tripLegviews*/
App.TripLegsContainer = Em.ContainerView.extend({
	tagName: 'section',
	//removes the last child view in the childViews array
	removeChildView: function(){
		this.get('childViews').popObject();	
	},
	
	addChildView: function(view){
		var childView = this.createChildView(view);
		this.get('childViews').pushObject(view);
	}
});

/*a container view holding child views which are basically, views representing differrent transport means e.g carView*/
App.TripLegTransportMeanContainer = Em.ContainerView.extend({
	removeChildView: function(view){
		view.removeFromParent();	
	},
	
	addChildView: function(view){
		var childView = this.createChildView(view);
		this.get('childViews').pushObject(view);
	},
});


/*The tril leg view. It contains basically some for field concerning trip legs e.g. addresses, time*/
App.TripLegView = Em.View.extend({
	templateName : 'trip-leg-view',
	tagName : 'section',
	
	//the step of the trip
	step: 0,
	startAddress: null,
	endAddress: null,
	addressName: null,
	startAddrVisibility: null,
	endAddrVisibility: null,
	transportMeanType: null,
	//containerView which holds the different transport mean views
	tripLegTransportMeanContainer: null,
	//the id of the div where the App.TripLegTransportMeanContainer that will hold the transport mean view, will be added
	transportMeanContainerId: 0,
	
	//the id of the pop up div where the map will be be added
	popupContactId: 0,
	
	//flag showing which address is being added, the start or end address
	startOrEndAddress: null,
	
	//the location passed by the user to locate on the map
	locationQuery: null,
	
	//the result returned by Bing maps
	bingMapsResult: null,
	
	/*execute when the view inserted into the DOM*/
	didInsertElement: function(){
		try{
			this.tripLegTransportMeanContainer.appendTo('#' + this.transportMeanContainerId);
		} catch(error){
			//do nothing
		}	
	},
	
	/*add observer when the value of the transportMeanType property changes*/
	transportMeanTypeChanged: function  () {
		var carView = null;
		var tripLegTransportMeanContainer = this.tripLegTransportMeanContainer;
		
		//remove the  all the other transport mean views of this trip leg (e.g. car)
		try{
			var view = tripLegTransportMeanContainer.get('childViews').toArray()[0];
			view.removeFromParent();
		} catch(error){
			//do nothing
		}
		
		switch(this.transportMeanType){
			case 'Car':				
				//add the carView as child to the tripLegTransportMeanContainer
				var carView = App.CarView.create(); 
				tripLegTransportMeanContainer.addChildView(carView);
				
				//load car manufacturers
				carView.loadCarManufacturerData();
				
				break
			case 'Bus':
				var busView = App.BusView.create();
				tripLegTransportMeanContainer.addChildView(busView);
				
				//load bus description
				busView.fetchBusDescriptions();
				
				break
			case 'Taxi':
				var taxiView = App.TaxiView.create();
				tripLegTransportMeanContainer.addChildView(taxiView);
				
				taxiView.fetchTaxiDescriptions();
				
				break
			case 'Motorcycle':
				var motorcycleView = App.MotorcycleView.create();
				tripLegTransportMeanContainer.addChildView(motorcycleView);
				
				motorcycleView.fetchMotorcycleDescriptions();
				
				break
			case 'Ferry':
				var ferryView = App.FerryView.create();
				tripLegTransportMeanContainer.addChildView(ferryView);
				
				ferryView.fetchFerryDescriptions();
				
				break
			case 'Rail':
				var railView = App.RailView.create();
				tripLegTransportMeanContainer.addChildView(railView);
				
				railView.fetchRailDescriptions();
				
				break
			case 'Airplane':
				var aviationView = App.AviationView.create();
				tripLegTransportMeanContainer.addChildView(aviationView);
				
				aviationView.fetchAirplaneDescriptions();
				
				break
		}
	}.observes('transportMeanType'),
	
	/*displays the map*/
	showMap: function(elementId){
		//in popUpEffects.js
		//the element id based on the trip leg for which we are adding the addresses. Each trip leg has its own popup div
		var element = "#popupContact-" + this.step 
		loadPopup(element, 600, 600, '400px', '550px');
		//in bingMaps.js
		getMap(this.step);
		this.set('startOrEndAddress', elementId);
	},
	
	/*hides the map*/
	hideMap: function(){
		//the element id based on the trip leg for which we adding the addresses
		var elementId = "#popupContact-" + this.step
		disablePopup(elementId);
		disposeMap();
	},
	
	
	/*finds the location passed by the user*/
	findLocation: function(){
		findLocation(this.locationQuery, this);
	},
	
	/*fills the address information*/
	addAddress: function(event){
		//get the address and point from the bindMapsResult
		var address = this.bingMapsResult.resourceSets[0].resources[0].address;
		var coordinates = this.bingMapsResult.resourceSets[0].resources[0].point.coordinates;
		
		//get information from the address and point objects
		var country = address.countryRegion;
		var city = address.locality;
		var postalCode = address.postalCode;
		var street = address.addressLine;
		var latitude = coordinates[0];
		var longitude = coordinates[1];
		
		//add the appropriate address
		switch(this.startOrEndAddress){
			case 'startAddress':
				this.set('startAddress', App.Address.create({
					country: country,
					city: city,
					postalCode: postalCode,
					street: street,
					latitude: latitude,
					longitude: longitude,	
				}));
				
				//erase the address form the text field
				this.set('locationQuery', null);
				
				break;
			case 'endAddress':
				this.set('endAddress', App.Address.create({
					country: country,
					city: city,
					postalCode: postalCode,
					street: street,
					latitude: latitude,
					longitude: longitude,	
				}));
				
				//erase the address form the text field
				this.set('locationQuery', null);
				
				break;
		}
		//in popUpEffects.js
		var elementId = "#popupContact-" + this.step
		disablePopup(elementId);
	},
	
	/*will be invoked by the json be callback funntion. In essence it will pass the result (addresses) from Bing maps*/
	setBingMapsResult: function(result){
		this.set('bingMapsResult', result);
	}
});

/*instance of the App.AddTripView */
App.addTripView = App.AddTripView.create({
	selectedValue : null,

	//views for each trip leg (App.TripLegView)
	tripLegViews : Em.makeArray(),
	
	tripLegsContainer: App.TripLegsContainer.create(),
	
	//will have the previous value of selectedValue. Unbound property
	previousSelectedValue: 1,

	/*display the appropriate number of App.TripLegView Depending on the number of trip legs chosen*/
	selectedValueChanged : function() {
		var tripLegView = null;
		var start = 0;
		var end = 0;
		var previousSelectedValue = this.tripLegsContainer.get('childViews').length;
	
		
		//if the new value is greater that the previous selected
		if(this.selectedValue > previousSelectedValue){
			end = this.selectedValue - previousSelectedValue;
			var len = this.tripLegsContainer.get('childViews').length;
			for (var i = 0; i < end; i++) {
				tripLegView = App.TripLegView.create({
					step: len + 1,
					transportMeanContainerId: "transport-mean-container-" + (len + 1),
					popupContactId: "popupContact-" + (len + 1),
					tripLegTransportMeanContainer: App.TripLegTransportMeanContainer.create(),
				});
				
				this.tripLegsContainer.addChildView(tripLegView);
				len++;
			}

		}
		
		//if the new value is less that the previous selected
		else if(this.selectedValue < previousSelectedValue){
			end = previousSelectedValue - this.selectedValue;
			
			for (var i = 0; i < end; i++) {
				this.tripLegsContainer.removeChildView();
			}
		}
	}.observes('selectedValue'),
	
});

/*The view showing form elements which are populated by car data retrieved via AJAX from the database*/
App.CarView = Em.View.extend({
	templateName: 'car-view',
	tagName: 'section',
	
	//initialize to null and not e.g. manufacturer: '', because the observer will think that the value has changed and will 
	//execute the function
	manufacturer: null,
	model: null,
	description: null,
	fuelType: null,
	transmission: null,
	engineCapacity: null,
	
	manufacturers: [],
	models: [],
	descriptions: [],
	engineCapacities: [],
	transmissions: [],
	fuelTypes: [],
	util: new Util(),
	
	/*make AJAX call to get the car manufactures in JSON*/
	loadCarManufacturerData: function  () {
		var self = this;
		var url = '/get-manufacturers/';			
		
		//Get json and populate the above fields
		$.getJSON(url, function (data){
			$(data).each(function(index, value){
				self.manufacturers.pushObject(value.manufacturer);
			});
		});
	},
	
	/*make AJAX call to get a specific car model data i.e engineCapacity, fuelType, transmission in JSON
	 last paramater denotes the selection that was changed e.g. engine capacity */
	loadCarModelData: function(description, engineCapacity, fuelType, transmission, valueChanged){
		var self = this;
		var url = '/get-car-model-data?model=' + this.model 
								 + '&description=' + description
								 + '&engineCapacity=' + engineCapacity 
								 + '&fuelType=' + fuelType 
								 + '&transmission=' + transmission
								 + '&valueChanged=' + valueChanged;
		
		//Get json and populate the above fields
		$.getJSON(url, function (data){
			//empty the previous select options
			self.set('descriptions', []);
			self.set('engineCapacities', []);
			self.set('transmissions', []);
			self.set('fuelTypes', []);
			
			$(data).each(function(index, value){
				self.descriptions.pushObject(value.description);
				self.engineCapacities.pushObject(value.engineCapacity);
				self.transmissions.pushObject(value.transmission);
				self.fuelTypes.pushObject(value.fuelType);
			});
			
			//remove duplicate values
			self.set('descriptions', self.util.removeDuplicatesFromArray(self.descriptions));
			self.set('engineCapacities', self.util.removeDuplicatesFromArray(self.engineCapacities));
			self.set('transmissions', self.util.removeDuplicatesFromArray(self.transmissions));
			self.set('fuelTypes', self.util.removeDuplicatesFromArray(self.fuelTypes));
		});
	},
	
	/*add observer when manufacturer changes
	make AJAX call to get the car models of the selected manufacturer in JSON*/
	manufacturerChanged: function  () {
		var self = this;
		var url = '/get-car-models/?manufacturer=' + this.manufacturer;
		
		//Get json and populate the above fields
		$.getJSON(url, function (data){
			//empty the model selections
			self.set('models', []);
			
			$(data).each(function(index, value){
				self.models.pushObject(value.model);
			});
			
			//remove duplicate values
			self.set('models', self.util.removeDuplicatesFromArray(self.models));
		});
	}.observes('manufacturer'),
	
	/*add observer when manufacturer changes*/
	modelChanged: function  () {
		//load data for the particular model
		this.loadCarModelData(null, null, null, null, 'none');
	}.observes('model'),
	
	/*add observer when model description changes*/
	descriptionChanged: function(){
		//load data for the particular model according to its description. its model can have several description
		this.loadCarModelData(this.description, null, null, null, 'description');
	}.observes('description'),
	
	/*add observer when engine capacity changes*/
	engineCapacityChanged: function  () {	
		//load data for the particular model combined with the changed engine capacity input
		this.loadCarModelData(null, this.engineCapacity, null, null, 'engineCapacity');
	}.observes('engineCapacity'),
	
	/*add observer when fuel type changes*/
	fuelTypeChanged: function  () {
		//load data for the particular model combined with the changed  fuel type input
		this.loadCarModelData(null, null, this.fuelType, null, 'fuelType');
	}.observes('fuelType'),
	
	/*add observer when transmission changes*/
	transmissionChanged: function  () {
		//load data for the particular model combined with the changed  trasmission input
		this.loadCarModelData(null, null, null, this.transmission, 'transmission');
	}.observes('transmission'),
	
	/*remove the car view and add the add newCarview*/
	showAddNewCarForm : function(event){
		//get the App.TripLegTransportMeanContainer which is the parent view
		var parentView = this.get('parentView');
		parentView.removeChildView(event.view); 
		var generalCarView = App.GeneralCarView.create();
		generalCarView.fetchCarDescriptions();
		parentView.addChildView(generalCarView);
	},
	
});


/*The view of the general described cars, not specific models that users can select as a car they used*/
App.GeneralCarView = Em.View.extend({
	templateName: 'general-car-view',
	tagName: 'section',
	
	/*car descriptions as they are stored in the database*/
	descriptions: [],
	
	fuelType: null,
	description: null,
	
	/*remove the generalCar view and add the add Carview*/
	showCarListForm: function(event){
		var parentView = this.get('parentView');
		parentView.removeChildView(event.view);
		parentView.addChildView(App.CarView.create());	
	},
	
	/*retrieves  the descriptions from the database based on fuel type*/
	fetchCarDescriptions: function(fuelType){
		var self = this;
		var url  = '/get-general-car-descriptions/?fuelType=' + this.fuelType;
		
		//Get json and populate the above fields
		$.getJSON(url, function (data){
			//empty the descriptios
			self.set('descriptions', []);
					
			$(data).each(function(index, value){
				self.descriptions.pushObject(value.description);
			});
		});
	}.observes('fuelType'),
	
});


/*A view for the bus selection*/
App.BusView = Em.View.extend({
	templateName: 'bus-view',
	tagName: 'section',
	
	descriptions: [],
	//the selected option
	description: null,
	
	/*retrieves buses types from the database*/
	fetchBusDescriptions: function(){
		var self = this;
		var url  = '/get-bus-descriptions/';
		
		//Get json and populate the above fields
		$.getJSON(url, function (data){
			//empty the descriptios
			self.set('descriptions', []);
					
			$(data).each(function(index, value){
				self.descriptions.pushObject(value.description);
			});
		});		
	}
});

/*A view for the taxi selection*/
App.TaxiView = Em.View.extend({
	templateName: 'taxi-view',
	tagName: 'section',
	
	descriptions: [],
	//the selected option
	description: null,
	
	/*retrieves the descriptions of all taxis from the database*/
	fetchTaxiDescriptions: function(){
		var self = this;
		var url  = '/get-taxi-descriptions/';
		
		//Get json and populate the above fields
		$.getJSON(url, function (data){
			//empty the descriptios
			self.set('descriptions', []);
					
			$(data).each(function(index, value){
				self.descriptions.pushObject(value.description);
			});
		});		
	}
});

/*A view for the motorcycle selection*/
App.MotorcycleView = Em.View.extend({
	templateName: 'motorcycle-view',
	tagName: 'section',
	
	descriptions: [],
	//the selected option
	description: null,
	
	/*retrieves motorcycles types from the database*/
	fetchMotorcycleDescriptions: function(){
		var self = this;
		var url  = '/get-motorcycle-descriptions/';
		
		//Get json and populate the above fields
		$.getJSON(url, function (data){
			//empty the descriptios
			self.set('descriptions', []);
					
			$(data).each(function(index, value){
				self.descriptions.pushObject(value.description);
			});
		});		
	}
});

/*A view for the ferries selection*/
App.FerryView = Em.View.extend({
	templateName: 'ferry-view',
	tagName: 'section',
	
	descriptions: [],
	//the selected option
	description: null,
	
	/*retrieves ferry types from the database*/
	fetchFerryDescriptions: function(){
		var self = this;
		var url  = '/get-ferry-descriptions/';
		
		//Get json and populate the above fields
		$.getJSON(url, function (data){
			//empty the descriptios
			self.set('descriptions', []);
					
			$(data).each(function(index, value){
				self.descriptions.pushObject(value.description);
			});
		});		
	}
});

/*A view for the rail selection*/
App.RailView = Em.View.extend({
	templateName: 'rail-view',
	tagName: 'section',
	
	descriptions: [],
	//the selected option
	description: null,
	
	/*retrieves rail types from the database*/
	fetchRailDescriptions: function(){
		var self = this;
		var url  = '/get-rail-descriptions/';
		
		//Get json and populate the above fields
		$.getJSON(url, function (data){
			//empty the descriptios
			self.set('descriptions', []);
					
			$(data).each(function(index, value){
				self.descriptions.pushObject(value.description);
			});
		});		
	}
});

/*A view for the aviation selection*/
App.AviationView = Em.View.extend({
	templateName: 'aviation-view',
	tagName: 'section',
	
	descriptions: [],
	cabinClasses: [],
	
	//the selected option
	description: null,
	cabinClass: null,
	
	util: new Util(),
	
	/*retrieves flight types from the database*/
	fetchAirplaneDescriptions: function(){
		var self = this;
		var url  = '/get-aviation-descriptions/?description=' + this.description;
		
		//Get json and populate the above fields
		$.getJSON(url, function (data){
			//empty the descriptios
			self.set('descriptions', []);
			$(data).each(function(index, value){
				self.descriptions.pushObject(value.description);
			});
			
			self.set('descriptions', self.util.removeDuplicatesFromArray(self.descriptions));
		});		
	},
	
	/*bring the cabin classes for the chosen flight type*/
	descriptionChanged: function(){
		var self = this;
		var url  = '/get-aviation-descriptions/?description=' + this.description;
		
		//Get json and populate the above fields
		$.getJSON(url, function (data){
			//empty the content
			self.set('cabinClasses', []);
					
			$(data).each(function(index, value){
				self.cabinClasses.pushObject(value.cabinClass);
			});
		});			
	}.observes('description'),
	
});
/*************************************
 * Controllers
 *************************************/

/*controls the trips added by the user*/
App.tripManagerController = Em.Object.create({
	content : [],

	name : '',
	type : '',
	date : '',
	
	//information that will be send to the ProvManager for creating the graphs
	tripLegIds: [],
	tripId: '',
	userName: '',
	userEmail: '',
	startTime: '',
	endTime: '',
	//the carbon emission calculation metdo e.g. tier1, which depends on the data that are provided to the calculation method
	calculationMethod: '',
	//the tripLegModel that is currently processed. Usefull, because we have several async function invokations
	currentTripLegModel: null,
	util: new Util(),
	
	/*a function that will collect the input data*/
	collateUserInput: function(){				
		loadPopup('#msg-container',220, 19, '220px', '19px');
		
		var tripView = App.addTripView;
		var tripLegViews = tripView.tripLegsContainer.get('childViews');

		//iterate across all trip legs views
		for( var i = 0; i < tripLegViews.length; i++ ){
			var tripLegModel = App.TripLeg.create({
				step: tripLegViews[i].get('step'),
				startAddress: tripLegViews[i].get('startAddress'),
				endAddress: tripLegViews[i].get('endAddress'),
				startAddrVisibility: tripLegViews[i].get('startAddrVisibility'),
				endAddrVisibility: tripLegViews[i].get('endAddrVisibility'), 
			});
			
			//get the transportMean sub-view of this trip leg view
			var transportMeanView = tripLegViews[i].tripLegTransportMeanContainer.get('childViews')[0];
			
			//check the type of the transport mean used
			switch(tripLegViews[i].transportMeanType){
				case 'Car':
					//check if a general car was selected or an existing one was selected
					if( transportMeanView instanceof App.CarView ){
						var carModel = App.CarModel.create({
							manufacturer: transportMeanView.get('manufacturer'),
							model: transportMeanView.get('model'),
							description: transportMeanView.get('description'),
							engineCapacity: transportMeanView.get('engineCapacity'),
							transmission: transportMeanView.get('transmission'),
							fuelType: transportMeanView.get('fuelType'),
						});
						
						tripLegModel.set('transportMeanType', 'car');
						tripLegModel.set('carModel', carModel);
					} else{
						var generalCarModel = App.GeneralCarModel.create({
							description: transportMeanView.get('description'),
							fuelType: transportMeanView.get('fuelType'),
						});
						
						tripLegModel.set('transportMeanType', 'generalCar');
						tripLegModel.set('generalCarModel', generalCarModel);
					}
					
					break
					
				case 'Bus':
					var busModel = App.BusModel.create({
						description: transportMeanView.get('description')
					});
					
					tripLegModel.set('transportMeanType', 'bus');
					tripLegModel.set('busModel', busModel);
					
					break
				case 'Taxi':
					var taxiModel = App.TaxiModel.create({
						description: transportMeanView.get('description')
					});
					tripLegModel.set('transportMeanType', 'taxi');
					tripLegModel.set('taxiModel', taxiModel);
					
					break
				case 'Motorcycle':
					var motorcycleModel = App.MotorcycleModel.create({
						description: transportMeanView.get('description')
					});
					tripLegModel.set('transportMeanType', 'motorcycle');
					tripLegModel.set('motorcycleModel', motorcycleModel);
					
					break
					
				case 'Ferry':
					var ferryModel = App.FerryModel.create({
						description: transportMeanView.get('description')
					});
					tripLegModel.set('transportMeanType', 'ferry');
					tripLegModel.set('ferryModel', ferryModel);
					
					break
				case 'Rail':
					var railModel = App.RailModel.create({
						description: transportMeanView.get('description')
					});
					tripLegModel.set('transportMeanType', 'rail');
					tripLegModel.set('railModel', railModel);
					
					break
				case 'Airplane':
					var aviationModel = App.AviationModel.create({
						description: transportMeanView.get('description'),
						cabinClass: transportMeanView.get('cabinClass'),
					});
					tripLegModel.set('transportMeanType', 'airplane');
					tripLegModel.set('aviationModel', aviationModel);
					
					break
			}
			
			
			this.content.pushObject(tripLegModel);
		}
		
		//persist input data
		this.persistData();
		
		//redirect to home page
		var interv = setInterval(function(){
						replaceGifWithMsg();
						clearInterval(interv);	
					 }, 2000);
	},
	
	/*a function that will send (i.e. Ajax call) our models (used data) into a database*/
	persistData: function(){
		//first of all we have to save the trip and get the id of the saved trip
		var url = '/save-trip/',
			tripId = 0;
			
		var data = {
			type: this.type,
			tripName: this.name,
			//add a dummy date. To be changed when calendar widget will be implemented
			date: this.date,
		};
		var self= this;
		
		//the starting time of the tripCreation activity
		this.startTime = this.xsdDateTime( new Date() );
		
		//save the trip
		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			async: false,
			success: function(data){
				self.tripId = data.tripId;
				self.userName = data.userName;
				self.userEmail = data.email;
				
				self.saveTripLegs(self.tripId);
			}
		});
	},
	
	/*saves all the trip legs of the trip*/
	saveTripLegs: function(tripId){
		var self = this;
		
		//iterate over the content (array of trip leg models) of the controller
		for( var i = 0; i < this.content.length; i++ ){
			//store the curren tripLegModel that is processed
			this.currentTripLegModel = this.content[i];
			var tripLegModel = this.content[i],
							   url = null;
			//get the transport mean id, except for the case when user has added an new car!
			switch(tripLegModel.get('transportMeanType')){
				case 'car':
					//the car models emission factor puts the calculation metdod into tier2
					tripLegModel.set('calculationMethod', 'tier2');
					
					var carModel = tripLegModel.get('carModel');
					var url = '/get-transportMeanId/?type=car'  
											   + '&model=' + encodeURIComponent(carModel.get('model'))
											   + '&description=' + encodeURIComponent(carModel.get('description'))
											   + '&engineCapacity=' + carModel.get('engineCapacity') 
											   + '&fuelType=' + carModel.get('fuelType') 
											   + '&transmission=' + carModel.get('transmission');	
					//find the car id
					$.ajax({
						type: 'GET',
						url: url,
						async: false,
						success: function(data){
							self.saveTripLeg(tripLegModel, data.transportMeanId, tripId);
						}
					}); 
					
					break
				case 'generalCar':
					tripLegModel.set('calculationMethod', 'tier1');
						
					var generalCarModel = tripLegModel.get('generalCarModel');
					var url = '/get-transportMeanId/?type=generalCar'  
											   + '&fuelType=' + encodeURIComponent(generalCarModel.get('fuelType'))
											   + '&description=' + encodeURIComponent(generalCarModel.get('description'));
					//find the general car id
					$.ajax({
						type: 'GET',
						url: url,
						async: false,
						success: function(data){
							self.saveTripLeg(tripLegModel, data.transportMeanId, tripId);
						}
					});					   
					
					break
				case 'bus':
					tripLegModel.set('calculationMethod', 'tier1');
					var busModel = tripLegModel.get('busModel');
					var url = '/get-transportMeanId/?type=bus'  
											   + '&description=' + encodeURIComponent(busModel.get('description'));
					$.ajax({
						type: 'GET',
						url: url,
						async: false,
						success: function(data){
							self.saveTripLeg(tripLegModel, data.transportMeanId, tripId);
						}
					});			
					
					break
				case 'taxi':
					tripLegModel.set('calculationMethod', 'tier1');
					var taxiModel = tripLegModel.get('taxiModel');
					var url = '/get-transportMeanId/?type=taxi'  
											   + '&description=' + encodeURIComponent(taxiModel.get('description'));
					$.ajax({
						type: 'GET',
						url: url,
						async: false,
						success: function(data){
							self.saveTripLeg(tripLegModel, data.transportMeanId, tripId);
						}
					});			
					
					break
				case 'motorcycle':
					tripLegModel.set('calculationMethod', 'tier1');
					var motorcycleModel = tripLegModel.get('motorcycleModel');
					var url = '/get-transportMeanId/?type=motorcycle'  
											   + '&description=' + encodeURIComponent(motorcycleModel.get('description'));
					$.ajax({
						type: 'GET',
						url: url,
						async: false,
						success: function(data){
							self.saveTripLeg(tripLegModel, data.transportMeanId, tripId);
						}
					});			
					
					break
					
				case 'ferry':
					tripLegModel.set('calculationMethod', 'tier1');
					var ferryModel = tripLegModel.get('ferryModel');
					var url = '/get-transportMeanId/?type=ferry'  
											   + '&description=' + encodeURIComponent(ferryModel.get('description'));
					$.ajax({
						type: 'GET',
						url: url,
						async: false,
						success: function(data){
							self.saveTripLeg(tripLegModel, data.transportMeanId, tripId);
						}
					});			
					
					break
				case 'rail':
					tripLegModel.set('calculationMethod', 'tier1');
					var railModel = tripLegModel.get('railModel');
					var url = '/get-transportMeanId/?type=rail'  
											   + '&description=' + encodeURIComponent(railModel.get('description'));
					$.ajax({
						type: 'GET',
						url: url,
						async: false,
						success: function(data){
							self.saveTripLeg(tripLegModel, data.transportMeanId, tripId);
						}
					});			
					
					break
				case 'airplane':
					tripLegModel.set('calculationMethod', 'tier1');
					var aviationModel = tripLegModel.get('aviationModel');
					var url = '/get-transportMeanId/?type=airplane'  
											   + '&description=' + encodeURIComponent(aviationModel.get('description'))
											   + '&cabinClass=' + encodeURIComponent(aviationModel.get('cabinClass'));
					$.ajax({
						type: 'GET',
						url: url,
						async: false,
						success: function(data){
							self.saveTripLeg(tripLegModel, data.transportMeanId, tripId);
						}
					});			
					
					break
			}
		}
		
						
		//the end time of the tripCreation activity
		self.endTime = this.xsdDateTime( new Date() );
		
		//invoke method on the server-side to create provenance graphs. 
		self.createProvenanceGraph('tripCreation');	
		
		//compute ghg emisisons and create provenance graphs for trip legs
		self.computeTripLegsCarbonEmissions();
	},
	
	/*a function that save individual trip leg into the database*/
	saveTripLeg: function(tripLegModel, transportMeanId, tripId){
		var url = '/save-trip-leg/';
		var self = this;
		
		var data = {
			//the type of tranposrt mean used for this trip leg
			transportMeanType: tripLegModel.get('transportMeanType'),
			
			//the id of the trip that these trip legs belong to 
			tripId: tripId,
				
			//add a dummy time. To be changed when time widget will be implemented
			time: '04:00',
				
			step: tripLegModel.get('step'),
				
			//startAddress data
			startAddrCountry: tripLegModel.get('startAddress').get('country'),
			startAddrCounty: tripLegModel.get('startAddress').get('county'),
			startAddrCity: tripLegModel.get('startAddress').get('city'),
			startAddrPostalCode: tripLegModel.get('startAddress').get('postalCode'),
			startAddrStreet: tripLegModel.get('startAddress').get('street'),
			startAddrVisibility: tripLegModel.get('startAddrVisibility'),
			startAddrName: tripLegModel.get('startAddress').get('name'),
			startAddrLongitude: tripLegModel.get('startAddress').get('longitude'),
			startAddrLatitude: tripLegModel.get('startAddress').get('latitude'),
			
			//endAddress data
			endAddrCountry: tripLegModel.get('endAddress').get('country'),
			endAddrCounty: tripLegModel.get('endAddress').get('county'),
			endAddrCity: tripLegModel.get('endAddress').get('city'),
			endAddrPostalCode: tripLegModel.get('endAddress').get('postalCode'),
			endAddrStreet: tripLegModel.get('endAddress').get('street'),
			endAddrVisibility: tripLegModel.get('endAddrVisibility'),
			endAddrName: tripLegModel.get('endAddress').get('name'),
			endAddrLongitude: tripLegModel.get('endAddress').get('longitude'),
			endAddrLatitude: tripLegModel.get('endAddress').get('latitude'),
				
			//the id of the transport mean that is already stored in the database
			transportMeanId: transportMeanId,
			calculationMethod: this.calculationMethod,

		};
			
		//save the trip leg
		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			async: false,
			success: function(data){
				//keep the trip legs id
				self.tripLegIds.push(data.tripLegId);
			}
		});	
	},
	
	
	/*calls a service on server side to calculate the carbon footprints of this trip leg and create the provenance graph foe that calculation*/
	computeTripLegsCarbonEmissions: function(){
		for(var i = 0; i < this.content.length; i++){
			var tripLegModel = this.content[i];
			startLatLong =  [tripLegModel.get('startAddress').get('latitude'), tripLegModel.get('startAddress').get('longitude')];
			endLatLong =  [tripLegModel.get('endAddress').get('latitude'), tripLegModel.get('endAddress').get('longitude')]
			var data = {
				//get the last added trip leg
				tripLegId: this.tripLegIds[i],
				startLatLong: JSON.stringify(startLatLong),
				endLatLong: JSON.stringify(endLatLong),
				transportMeanType: tripLegModel.get('transportMeanType'),
				//the calculation method tier
				calculationMethod: tripLegModel.get('calculationMethod'),
			};
		
			var self = this;
				$.ajax({
				type: 'POST',
				url: '/compute-trip-leg-emissions/',
				data: data,
				async: false,
				success: function(data){
					//some stuff here
				}
			});
			
		}
	},
	
	
	/*invoked the provenance-related actions on the back-end*/
	createProvenanceGraph: function(actionPerformed){
		var data = {
			actionPerformed: actionPerformed,
			userName: this.userName,
			userEmail: this.userEmail,
			tripId: this.tripId,
			tripLegIds: JSON.stringify(this.tripLegIds),
			startTime: JSON.stringify(this.startTime),
			endTime: JSON.stringify(this.endTime)
		};
		
		$.post('/prov/', 
				data,
				function(data){
					//to do stuff
				}
			  );
	},
	
	/*Util function for converting javascript date into xsd:datetime*/
	xsdDateTime: function (date){
  		function pad(n) {
     		var s = n.toString();
     		return s.length < 2 ? '0'+s : s;
  		};

  		var yyyy = date.getFullYear(),
		    mm1  = pad(date.getMonth()+1)
  		    dd   = pad(date.getDate()),
  			hh   = pad(date.getHours()),
  			mm2  = pad(date.getMinutes()),
  			ss   = pad(date.getSeconds()),
  			ms =  pad(date.getMilliseconds());

     
     	return yyyy +'-' +mm1 +'-' +dd +'T' +hh +':' +mm2 +':' +ss + '.' + ms;
	}
	
});


/*************************************
 * Select field options
 *************************************/
/*Options for trip type select field*/
App.tripTypeOptions = ['Commuter', 'Business'];

/*Options for number of trip legs*/
App.numOfTripLegOptions = [1, 2, 3, 4];

/*Address visibility options*/
App.addressVisibilityOptions = ['Visible', 'Not-Visible'];

/*Transport mean options*/
App.transportMeanOptions = ['Car', 'Bus', 'Taxi', 'Rail', 'Airplane', 'Ferry', 'Motorcycle'];

/*Fuel type option*/
App.fuelTypes = ['petrol', 'diesel', 'alternative'];
