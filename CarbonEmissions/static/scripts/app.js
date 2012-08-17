/// <reference path="ember-1.0.pre.min.js" />
/// <reference path="jquery-1.6.2.js" />

/*************************************
 * Application
 *************************************/

App = Em.Application.create({
	name : 'carbon footprints',

	ready : function() {
		App.addTripView.tripLegsContainer.appendTo('#trip-legs');
		//alert('Ember App started');
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

/*Model representing the data passed by the user for the creation of a new car*/
App.NewCarModel = Em.Object.extend({
	name : null,
	engineCapacity : null,
	fuelType : null
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
	
	//the specific model of car, if one was choses
	carModel: null,
	//...else the data for the nes car passed
	newCarModel: null,
});

/*************************************
 * Views
 *************************************/
/*location query text field*/
App.LocationQueryTextField = Em.TextField.extend({
	insertNewline: function(){
		this.get('parentView').findLocation();
	}
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
	}
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

	/*add observer when the value of the transportMeanType property changes*/
	transportMeanTypeChanged: function  () {
		var carView = null;

		switch(this.transportMeanType){
			case 'Car':
			    //add the carView as child to the tripLegTransportMeanContainer
			    var tripLegTransportMeanContainer = this.tripLegTransportMeanContainer;
				var carView = App.CarView.create(); 
				tripLegTransportMeanContainer.addChildView(carView);
			
				tripLegTransportMeanContainer.appendTo('#' + this.transportMeanContainerId)
				
				//load car manufacturers
				carView.loadCarManufacturerData();
				
				break;
			case 'Bus':
				var tripLegTransportMeanContainer = this.tripLegTransportMeanContainer;
				//remove the  all the other transport mean views of this trip leg (e.g. car)
				//MAYBE in the future i will need to remove all the childs!!!!
				var view = tripLegTransportMeanContainer.get('childViews').toArray()[0];
				view.removeFromParent();//this.carView.remove();
				
				//add a busView
		}
	}.observes('transportMeanType'),
	
	/*displays the map*/
	showMap: function(elementId){
		//in popUpEffects.js
		loadPopup(this.step);
		//in bingMaps.js
		getMap(this.step);
		this.set('startOrEndAddress', elementId);
	},
	
	/*hides the map*/
	hideMap: function(){
		disablePopup(this.step);
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
		disablePopup(this.step);
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
					transportMeanContainerId: "car-list-" + (len + 1),
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
	
	
	/**auxiliary function that removes duplicates from arrays*/
	removeDuplicatesFromArray: function(arr){
		var i,
      		len=arr.length,
      		out=[],
      		obj={};

  		for (i=0;i<len;i++) {
    		obj[arr[i]]=0;
  		}
  
  		for (i in obj) {
    		out.push(i);
  		}
  		
  		return out;
	},
	
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
			self.set('descriptions', self.removeDuplicatesFromArray(self.descriptions));
			self.set('engineCapacities', self.removeDuplicatesFromArray(self.engineCapacities));
			self.set('transmissions', self.removeDuplicatesFromArray(self.transmissions));
			self.set('fuelTypes', self.removeDuplicatesFromArray(self.fuelTypes));
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
			self.set('models', self.removeDuplicatesFromArray(self.models));
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
		parentView.addChildView(App.NewCarView.create());
	},
	
});


App.NewCarView = Em.View.extend({
	templateName: 'new-car-view',
	tagName: 'section',
	
	fuelType: null,
	name: null,
	engineCapacity: null,
	
	/*remove the newCar view and add the add Carview*/
	showCarListForm: function(event){
		var parentView = this.get('parentView');
		parentView.removeChildView(event.view);
		parentView.addChildView(App.CarView.create());	
	}
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
	
	/*a function that will collect the input data*/
	collateUserInput: function(){
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
			
			//get the transportMean suv-view of this trip leg view
			var transportMeanView = tripLegViews[i].tripLegTransportMeanContainer.get('childViews')[0];
			
			//check the type of the transport mean used
			switch(tripLegViews[i].transportMeanType){
				case 'Car':
					//check if a new car was added or an existing one was selected
					if( transportMeanView instanceof App.CarView ){
						var carModel = App.CarModel.create({
							manufacturer: transportMeanView.get('manufacturer'),
							model: transportMeanView.get('model'),
							description: transportMeanView.get('description'),
							engineCapacity: transportMeanView.get('engineCapacity'),
							transmission: transportMeanView.get('transmission'),
							fuelType: transportMeanView.get('fuelType'),
						});
						
						tripLegModel.set('transportMeanType', 'Car');
						tripLegModel.set('carModel', carModel);
					} else{
						var newCarModel = App.NewCarModel.create({
							name: transportMeanView.get('name'),
							engineCapacity: transportMeanView.get('engineCapacity'),
							fuelType: transportMeanView.get('fuelType'),
						});
						
						tripLegModel.set('transportMeanType', 'Car');
						tripLegModel.set('newCarModel', newCarModel);
					}
					break;
			}
			
			
			this.content.pushObject(tripLegModel);
		}
		
		//persist data
		this.persistData();
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
			date: '2012-10-01',//this.date
		};
		var self= this;
		//save the trip
		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			success: function(data){
				self.saveTripLegs(data);
			}
		});
	},
	
	/*saves all the trip legs of the trip*/
	saveTripLegs: function(tripId){
			
		//iterate over the content (array of trip leg models) of the controller
		for( var i = 0; i < this.content.length; i++ ){
			var tripLegModel = this.content[i],
							   url = null;
			
			//get the transport mean id, except for the case when user has added an new car!
			switch(tripLegModel.get('transportMeanType')){
				case 'Car':
					//check if a new car was added or one from the list was selected
					if( tripLegModel.get('carModel') ){
						var carModel = tripLegModel.get('carModel');
						var url = '/get-transportMeanId/?type=Car'  
												   + '&model=' + carModel.get('model') 
												   + '&description=' + carModel.get('description')
												   + '&engineCapacity=' + carModel.get('engineCapacity') 
												   + '&fuelType=' + carModel.get('fuelType') 
												   + '&transmission=' + carModel.get('transmission');	
						var self = this;
						//find the car id
						$.ajax({
							type: 'GET',
							url: url,
							success: function(data){
								self.saveTripLeg(tripLegModel, data, '', 0, '', tripId);
								//self.transportMeanId = data;	
							}
				
						});
					} else{
						//get the new car data
					    var newCarName = tripLegModel.get('newCarModel').get('name');
					    var newCarEngineCapacity = tripLegModel.get('newCarModel').get('engineCapacity');
					    var newCarFuelType = tripLegModel.get('newCarModel').get('fuelType');
					    
					    self.saveTripLeg(tripLegModel, '', newCarName, newCarEngineCapacity, newCarFuelType, tripId);
					}
												   
			}
		}
	},
	
	/*a function that save individual trip leg into the database*/
	saveTripLeg: function(tripLegModel, transportMeanId, newCarName, newCarEngineCapacity, newCarFuelType, tripId){
		var url = '/save-trip-leg/';
		var data = {
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
				
			//the id of the transport mean that is already stored in the datbase
			transportMeanId: transportMeanId,
			//will have value only if users adds a new car. ONLY THEN, otherwise the values will be null
			carName: newCarName,
			engineCapacity: newCarEngineCapacity,
			fuelType: newCarFuelType,
		};
			
		//save the trip leg
		$.ajax({
			type: 'POST',
			url: url,
			data: data,
			success: function(data){
				alert('trip leg added');
			}
		});	
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
App.transportMeanOptions = ['Car', 'Bus'];
