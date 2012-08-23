$(document).ready(function() {
	App.chartView = App.ChartView.create();
	App.chartView.appendTo('#chartContainer');
	/*refer to http://stackoverflow.com/questions/10236467/ember-js-subviews-and-didinsertelement-event
	for explanation. It will be called when all elements are inserted into the DOM*/
	Em.run.next(App.chartView, function(){
		this.initializeDefaultCharts();
		$("#fromDate").kendoDatePicker({
        	format: 'yyyy-MM-dd'
        });
        $("#untilDate").kendoDatePicker({
        	format: 'yyyy-MM-dd'
        });
	} );
});

/*************************************
 * Models
 *************************************/
App.LineChartModel = Em.Object.extend({
	title : null,
	subtitle : null,
	xAxis : null,
	yAxis : null,
	tooltip : null,
	legend : null,
	series : null	
});

/*************************************
 * Views
 *************************************/
/*Chart container view*/
App.ChartView = Em.ContainerView.extend({
	tagName: 'section',
	
	//removes the last child view in the childViews array
	removeChildView: function(){
		this.get('childViews').popObject();	
	},
	
	addChildView: function(view){
		var childView = this.createChildView(view);
		this.get('childViews').pushObject(view);
	},
	
	didInsertElement: function(){
		this.addSubViews();
	},

	/*add all the child views*/
	addSubViews: function() {
		var ghgPerTripView = App.GhgPerTripView.create();
		this.addChildView(ghgPerTripView);
	},
	
	/*shows the default graphs after the page is loaded*/
	initializeDefaultCharts: function(){
		var childViews = this.get('childViews');
		$.each(childViews, function(index, value){
			value.initializeChart();
		});
	},

	/*initialize a chart based on the parameter values*/
	showLineChart : function(lineChartModel) {
		chart = new Highcharts.Chart({
			chart : {
				renderTo : lineChartModel.renderTo,
				type : lineChartModel.type,
				marginRight : 130,
				marginBottom : 25
			},
			title : lineChartModel.title,
			subtitle : lineChartModel.subtitle,
			xAxis : lineChartModel.xAxis,
			yAxis : lineChartModel.yAxis,
			tooltip : lineChartModel.tooltip,
			plotOptions: lineChartModel.plotOptions,
			legend : lineChartModel.legend,
			series : lineChartModel.series
		});
	}
});


/*view diplaying the chart concerning ghg emissions per trip leg*/
App.GhgPerTripView = Em.View.extend({
	templateName: 'ghg-per-trip',
	tagName: 'section',
	from: '2012-08-01',
	until: '2012-08-30',
	
	initializeChart: function(){
		this.showGhgPerTripLeg({
			from : this.from,
			until : this.until,
		});		
	},
	
	fromChanged: function(){
		this.showGhgPerTripLeg({
			from : this.from,
			until : this.until,
		});		
	}.observes('from'),
	
	untilChanged: function(){
		this.showGhgPerTripLeg({
			from : this.from,
			until : this.until,
		});		
	}.observes('until'),
	
	/*displays the ghg emitted per trip leg.
	 @ timePeriod: an object defining the time period*/
	showGhgPerTripLeg : function(timePeriod) {
		 App.lineChartController.fetchDataForCharts('trip', timePeriod, this.get('parentView'));
		//this.get('parentView').showLineChart(lineChartModel);
	},
});


/*************************************
 * Controllers
 *************************************/
App.lineChartController = Em.Object.create({
	content: [],
	util: new Util(),
	
	/* brings the appropriate data form the database
	 * @dataType: the database table that will be read
	 * @timePeriod: the period of thime
	 * @callBack: the function that will be called at the end, in order to display the chart*/
	fetchDataForCharts: function(dataType, timePeriod, callBack){
		var url = null;
		
		switch(dataType){
			case 'trip':
				url = '/get-trip-info/?from=' + timePeriod.from 
											  + '&until=' + timePeriod.until;
		}
		var self = this;
		
		//fetch the data
		$.getJSON(url, function(data){
			switch(dataType){
				case 'trip':
					callBack.showLineChart(self.populateLineChart(data, timePeriod));
			}
		});	
	},
	
	/*populates the chart with the retrieved data*/
	populateLineChart: function(data, timePeriod){
		var self = this;
				
		//populate appropratly the chart
		//fing the xAxis categories. Thios depends on the time period passed as a parameter
		var fromDate = new Date(Date.parse((timePeriod.from).replace(/-/g, " ")));
		var untilDate = new Date(Date.parse((timePeriod.until).replace(/-/g, " ")));
		var xAxisCategories = this.util.dateRange(fromDate, untilDate);
		
		var seriesData = [];
		this.util.initalizeArray(seriesData, this.util.daydiff(fromDate, untilDate));
		
		var tripNames = [];
		this.util.initalizeArray(tripNames, this.util.daydiff(fromDate, untilDate));
		
		$(data).each(function(index,value){
			//days passed between the timeperiod.from and the value.date (the date of the trip)
			var dayDiff = self.util.daydiff(fromDate, new Date(Date.parse((value.date).replace(/-/g, " "))));
			//add the emissions to the apropriate position, so that i matches the day on the xAxis
			seriesData[dayDiff] = {
				name: value.name,	
				y: parseFloat(value.emissions)
			};

		});
		
		
		/*data needed for the line chart to be drawn*/
		var lineChartModel = App.LineChartModel.create({
			renderTo: 'container',
			type: 'line',
			title: {
				text : 'GHG Emissions Per Trip',
				x : -20 //center
			},
			subtitle: {
				text : 'Source: WorldClimate.com',
				x : -20
			},		
			xAxis: {
				categories : xAxisCategories
			},
			yAxis: {
				title : {
					text : 'Kg CO2e'
				},
				plotLines : [{
					value : 0,
					width : 1,
					color : '#808080'
				}]
			},
			tooltip: {
				formatter : function() {
					return '<b>' + this.point.name + '</b><br/>' + this.x + ': ' + '<b>' + this.y + ' Kg CO2e</b>';
				}
			},
			
			legend: {
				layout : 'vertical',
				align : 'right',
				verticalAlign : 'top',
				x : -10,
				y : 100,
				borderWidth : 0
			},
			
			plotOptions: {
  				series: {
                	cursor: 'pointer',
                	point: {
                    	events: {
                        	click: function() {
                            	alert ('Category: '+ this.category +', value: '+ this.y);
                        	}
                    	}
                }
            	}
        },
			series: [{
				name : 'Trips',
				data : seriesData
			}]	
		});
		
		return lineChartModel;	
	}
	
});