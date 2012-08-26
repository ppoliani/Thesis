$(document).ready(function() {
	App.chartView = App.ChartView.create();
	App.chartView.appendTo('#chartContainer');
	/*refer to http://stackoverflow.com/questions/10236467/ember-js-subviews-and-didinsertelement-event
	for explanation. It will be called when all elements are inserted into the DOM*/
	Em.run.next(App.chartView, function(){
		this.initializeDefaultCharts();
		
		$(".fromDate").kendoDatePicker({
        	format: 'yyyy-MM-dd'
        });
        
        $(".untilDate").kendoDatePicker({
        	format: 'yyyy-MM-dd'
        });
	} );
});

/*************************************
 * Models
 *************************************/
App.ChartModel = Em.Object.extend({
	title : null,
	subtitle : null,
	xAxis : null,
	yAxis : null,
	tooltip : null,
	plotOptions: null,
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
		var ghgPerTripLegView = App.GhgPerTripLegView.create();
		var ghgPerTransportMean = App.GhgPerTransportMeanView.create();
		
		this.addChildView(ghgPerTripLegView);
		this.addChildView(ghgPerTripView);
		this.addChildView(ghgPerTransportMean);
	},
	
	/*shows the default graphs after the page is loaded*/
	initializeDefaultCharts: function(){
		var childViews = this.get('childViews');
		$.each(childViews, function(index, value){
			value.initializeChart();
		});
	},

	/*initialize a chart based on the parameter values*/
	showChart : function(chartModel) {
		chart = new Highcharts.Chart({
			chart : {
				renderTo : chartModel.renderTo,
				type : chartModel.type,
				marginRight : 130,
				marginBottom : 25
			},
			title : chartModel.title,
			subtitle : chartModel.subtitle,
			xAxis : chartModel.xAxis,
			yAxis : chartModel.yAxis,
			tooltip : chartModel.tooltip,
			plotOptions: chartModel.plotOptions,
			legend : chartModel.legend,
			series : chartModel.series
		});
	}
});


/*view diplaying the chart illustrating ghg emissions per trip*/
App.GhgPerTripView = Em.View.extend({
	templateName: 'ghg-per-trip',
	tagName: 'section',
	from: '2012-08-01',
	until: '2012-08-30',
	
	initializeChart: function(){
		this.showGhgPerTrip({
			from : this.from,
			until : this.until,
		});		
	},
	
	fromChanged: function(){
		this.showGhgPerTrip({
			from : this.from,
			until : this.until,
		});		
	}.observes('from'),
	
	untilChanged: function(){
		this.showGhgPerTrip({
			from : this.from,
			until : this.until,
		});		
	}.observes('until'),
	
	/*displays the chart illustrating the ghg emitted per trip leg.
	 @ timePeriod: an object defining the time period*/
	showGhgPerTrip : function(timePeriod) {
		 App.lineChartController.fetchDataForCharts('trip', timePeriod, this.get('parentView'));
	},
});

/*View displaying chart illustrating ghg emissions pre trip leg*/
App.GhgPerTripLegView = Em.View.extend({
	templateName: 'ghg-per-trip-leg',
	tagName: 'section',
	from: '2012-08-01',
	until: '2012-08-30',
	
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
	
	initializeChart: function(){
		this.showGhgPerTripLeg({
			from : this.from,
			until : this.until,
		});		
	},
	
	/*displays the chart illustrating the ghg emitted per trip leg.
	 @ timePeriod: an object defining the time period*/
	showGhgPerTripLeg : function(timePeriod) {
		 App.lineChartController.fetchDataForCharts('tripLeg', timePeriod, this.get('parentView'));
	},
});

/*View displaying chart illustrating ghg emissions pre transport mean*/
App.GhgPerTransportMeanView = Em.View.extend({
	templateName: 'ghg-per-tranpsport-mean',
	tagName: 'section',
	from: '2012-08-01',
	until: '2012-08-30',
	
	fromChanged: function(){
		this.showGhgPerTransportMean({
			from : this.from,
			until : this.until,
		});		
	}.observes('from'),
	
	untilChanged: function(){
		this.showGhgPerTransportMean({
			from : this.from,
			until : this.until,
		});		
	}.observes('until'),
	
	initializeChart: function(){
		this.showGhgPerTransportMean({
			from : this.from,
			until : this.until,
		});		
	},
	
	showGhgPerTransportMean : function(timePeriod) {
		 App.lineChartController.fetchDataForCharts('transportMean', timePeriod, this.get('parentView'));
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
				break
			case 'tripLeg':
				url = '/get-trip-leg-info/?from=' + timePeriod.from 
											  + '&until=' + timePeriod.until;
				break
			case 'transportMean':
				url = '/get-tranpsport-mean-report/?from=' + timePeriod.from 
											  + '&until=' + timePeriod.until;
				break
		}
		var self = this;
		
		//fetch the data
		$.getJSON(url, function(data){
			switch(dataType){
				case 'tripLeg':
					callBack.showChart(self.populateBarChart(data, 'tripLegChart'));
					
					break
				case 'trip':
					callBack.showChart(self.populateLineChart(data, timePeriod, 'tripChart'));
					
					break
				case 'transportMean':
					callBack.showChart(self.populateHorizontalBarChart(data, 'transportMeanChart'));
					
					break
			}
		});	
	},
	
	/*populates the chart with the retrieved data*/
	populateLineChart: function(data, timePeriod, renderTo){
		var self = this;
				
		//populate appropratly the chart
		//fing the xAxis categories. This depends on the time period passed as a parameter
		var fromDate = new Date(Date.parse((timePeriod.from).replace(/-/g, " ")));
		var untilDate = new Date(Date.parse((timePeriod.until).replace(/-/g, " ")));
		var xAxisCategories = this.util.dateRange(fromDate, untilDate);
		
		var seriesData = [];
		this.util.initalizeArray(seriesData, this.util.daydiff(fromDate, untilDate));
		
		var tripNames = [];
		this.util.initalizeArray(tripNames, this.util.daydiff(fromDate, untilDate));
		
		$(data).each(function(index,value){
			try{
				//days passed between the time period.from and the value.date (the date of the trip)
				var dayDiff = self.util.daydiff(fromDate, new Date(Date.parse((value.date).replace(/-/g, " "))));
			}catch(error){
				//do nothing
			}
			//add the emissions to the apropriate position, so that i matches the day on the xAxis
			seriesData[dayDiff] = {
				name: value.name,	
				y: parseFloat(value.emissions)
			};

		});
		
		/*data needed for the line chart to be drawn*/
		var chartModel = App.ChartModel.create({
			renderTo: renderTo,
			type: 'line',
			title: {
				text : 'GHG Emissions Per Trip',
				x : -20 //center
			},
			subtitle: {
				text : 'Average Value: ' + data[data.length-1].avg + 'Kg CO2e',
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
                            	//alert ('Category: '+ this.category +', value: '+ this.y);
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
		
		return chartModel;	
	},
	
	/*populates bar chart with the retrieved data*/
	populateBarChart: function(data, renderTo){
		var tripNames = [];
		var trips = {};
		
		/*get the trip names. Last index is the average so skip it (length-1)*/
		for( var i = 0; i < data.length-1; i++ ){
			tripNames.push(data[i].name);
		}
		var xAxisCategories = this.util.removeDuplicatesFromArray(tripNames);
		var seriesData = [];
		//max trip legs that a trip has
		var freq = this.util.getMaxOccurance(tripNames);
		
		//get the trip legs of each trip
		for(var i = 0; i < data.length; i++){
			try{
				trips[data[i].name].push({
						emissions: parseFloat(data[i].emissions),
						startAddress: data[i].startAddress,
						endAddress: data[i].endAddress,
						method: data[i].method,
						provBundleId: data[i].provBundleId
					});
			} catch(error){
				trips[data[i].name] = [];
				trips[data[i].name].push({
						emissions: parseFloat(data[i].emissions),
						startAddress: data[i].startAddress,
						endAddress: data[i].endAddress,
						method: data[i].method,
						provBundleId: data[i].provBundleId
					});
			}
		}
		
		/*create n categories according to the max number of trip legs that a trip has*/
		for(var i = 0; i < freq; i++){
			values = [];
			//add the emissions of each trip leg to the appropriate place
			for (item in trips){
				//not all the trips have the same number of trip legs, so some values for emissions will be undefined
				if( trips[item][i] != undefined){
					values.push({
							y: trips[item][i].emissions,
							from: trips[item][i].startAddress,
							to: trips[item][i].endAddress,
							method: trips[item][i].method,
							provBundleId: trips[item][i].provBundleId
						});
				}
			}
			seriesData.push({
				name: 'Trip Leg ' + (i + 1),
				data: values
			});
		}
		
		/*data needed for the line chart to be drawn*/
		var chartModel = App.ChartModel.create({
			renderTo: renderTo,
			type: 'bar',
			title: {
				text : 'GHG Emissions Per Trip Leg',
				x : -20 //center
			},
			subtitle: {
				text : 'Average Value: ' + data[data.length-1].avg + 'Kg CO2e',
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
					return 'From: <b>' + this.point.from + '</b><br />To: <b>' + this.point.to + '</b><br/>Emissions:<b> ' 
							+ this.y + ' Kg CO2e</b><br/>Method: <b>tier-' + this.point.method + '</b>';
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
                        		//delete the previous graph if exist
                        		try{
                        			$('#infovis').html('');
                        		} catch(error){
                        			//do nothing
                        		}
                        		
                            	openJQueryWindow('#prov-graph-container');                      
                            	App.provGraphManager = App.ProvGraphManager.create();
                            	App.provGraphManager.loadProvBundle(this.provBundleId);
                        	}
                    	}
                }
            	}
        },
			series: seriesData	
		});
		
		return chartModel;
	},
	
	/*populates horizontal bar chart with the retrieved data*/
	populateHorizontalBarChart: function(data, renderTo){
		var xAxisCategories = [];
		var emissions = [];
		for (item in data[0]){
			xAxisCategories.push(item);
			emissions.push(parseFloat(data[0][item]));
		}
		
		var seriesData = [{
			name: 'Transport Mean',
			data: emissions,
			
		}];
		
		/*data needed for the line chart to be drawn*/
		var chartModel = App.ChartModel.create({
			renderTo: renderTo,
			type: 'column',
			title: {
				text : 'GHG Emissions Per Transport Mean',
				x : -20 //center
			},
			subtitle: {
				text : '',
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
					return 'Emissions: <b>' + this.y + ' Kg CO2e</b>';
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
			series: seriesData	
		});
		
		return chartModel;
	}
});