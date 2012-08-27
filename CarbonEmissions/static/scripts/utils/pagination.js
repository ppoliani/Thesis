$(document).ready(function() {
	$("#tabstrip").kendoTabStrip({
		animation : {
			open : {
				effects : "fadeIn"
			}
		},
		
		activate: tabChanged 

	});
	
	/*trigered when tab is changed*/
    function tabChanged(e){
		var transportMean = $(e.item).find("> .k-link").text();	
		App.tripInfoController.loadUserTrips(transportMean, 1);
	}
	
	/*fill the first tab when page loaded*/
	App.tripInfoController.loadUserTrips('Car Model', 1);	
});

/*************************************
 * Models
 *************************************/
/*Model representing the trip that are displyed to users on the trips.html page*/
App.TripInfoModel = Em.Object.extend({
	name: null,
	date: null,
	tripLegs: []	
});



/*************************************
 * Views
 *************************************/
App.TripInfoView = Em.View.extend({
	templateName : 'tripInfoView',
	tagName : 'section',
	
	/*redirect to edit page for this trip*/
	edit: function(event){
		window.location = '/edit-trip/' + event.srcElement.id;
	},
	
	deleteTrip: function(){
		//delete
	}
});

/*the pagination of a page*/
App.PaginatationView = Em.View.extend({
	tagName: 'section',
	/*binding with the the App.tripInfoController pageInfo. Binding declared in the template!*/
	pageInfo: null,
	
	prevPageClicked: function() {
		/*should the prev button be enabled or disabled*/
		if(this.pageInfo.currentPage > 1){
			App.tripInfoController.loadUserTrips(this.pageInfo.transportMean, this.pageInfo.currentPage-1);	
		}
   	},
   
   	nextPageClicked: function(){
   		var currentPage = this.pageInfo.currentPage,
			pageSize = this.pageInfo.pageSize,
			totalItems = this.pageInfo.totalItems;
			
   		if(currentPage*pageSize < totalItems){
   			App.tripInfoController.loadUserTrips(this.pageInfo.transportMean, this.pageInfo.currentPage+1);	
   		}
   	}
});

/*************************************
 * Controllers
 *************************************/
/*controller that stores the informationa about the trips*/
App.tripInfoController = Em.ArrayController.create({
	content: [],
	trips: [],
	pageInfo: null,
	
	/*load the trips made by the user using the specified tranpsport. The page denoted the selected page*/
	loadUserTrips: function(transportMean, page){
		this.set('trips', []);
		this.set('pageInfo', []);

		switch(transportMean){
			case 'Car Model':
				var url = '/get-trips-with-car-model/?page=' + page;                      
				break
			case 'Bus':
				var url = '/get-trips-with-bus/?page=' + page;
				
				break
			case 'Car':
				var url = '/get-trips-with-car/?page=' + page;
				
				break
			case 'Taxi':
				var url = '/get-trips-with-taxi/?page=' + page;
				
				break
			case 'Rail':
				var url = '/get-trips-with-rail/?page=' + page;
				
				break
			case 'Motorcycle':
				var url = '/get-trips-with-motorcycle/?page=' + page;
				
				break
			case 'Motorcycle':
				var url = '/get-trips-with-ferry/?page=' + page; 
				
				break
			case 'Aviation':
				var url = '/get-trips-with-airplane/?page=' + page; 
				
				break
		}
		var self = this;

		$.getJSON(url, function(data){
			$.each(data.trips, function(index, value){
				trip = App.TripInfoModel.create({
					id: value.id,
					name: value.name,
					date: value.date,
					tripLegs: value.tripLegs,	
				});
				self.get('trips').pushObject(trip);		
			});	
			
			/*Model containing both the trip models and page info that is needed for pagination*/
			var pageInfo = Em.Object.create({
				trips: self.get('trips'),
				currentPage: page,
				transportMean: transportMean,
				totalItems: data.totalItems,
				pageSize: 2,
			});
		
			self.set('pageInfo', pageInfo);	
		});	
	},
	
});
