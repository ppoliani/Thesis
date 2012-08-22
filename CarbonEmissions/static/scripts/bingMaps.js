var map = null;
var directionsManager = null;
var query;

var start = null;
var end = null;

//store the reference of the trip leg view that invoked the findLocation
var tripLeg = null;

/*trip leg refers to the trip leg view for which we insert the map*/
function getMap(tripLeg) {

	var elementId = "#popupContact-" + tripLeg;
	//get the DOM element
	var element = $(elementId).find('.map')[0];
	map = new Microsoft.Maps.Map(element, {
		credentials : 'AkfwYAUV1wedc2qX9NFTfUMAYmrknBNzuj67mO0yk1fTc8pZF7yezrdGzMpJtjW5'
	});
}

/*dispose the map*/
function disposeMap() {
	map.dispose();
	map = null;
}

function findLocation(location, object) {
	tripLeg = object;
	query = location;
	map.getCredentials(callSearchService);
}

function callSearchService(credentials) {
	var searchRequest = 'http://dev.virtualearth.net/REST/v1/Locations/' + query + '?output=json&jsonp=searchServiceCallback&key=' + credentials;
	var mapscript = document.createElement('script');
	mapscript.type = 'text/javascript';
	mapscript.src = searchRequest;
	document.getElementById('bing-script').appendChild(mapscript)
}

function searchServiceCallback(result) {
	tripLeg.setBingMapsResult(result);

	var output = document.getElementById("output");
	if (output) {
		while (output.hasChildNodes()) {
			output.removeChild(output.lastChild);
		}
	}
	var resultsHeader = document.createElement("h5");
	output.appendChild(resultsHeader);

	if (result && result.resourceSets && result.resourceSets.length > 0 && result.resourceSets[0].resources && result.resourceSets[0].resources.length > 0) {
		var bbox = result.resourceSets[0].resources[0].bbox;
		var viewBoundaries = Microsoft.Maps.LocationRect.fromLocations(new Microsoft.Maps.Location(bbox[0], bbox[1]), new Microsoft.Maps.Location(bbox[2], bbox[3]));
		map.setView({
			bounds : viewBoundaries
		});
		var location = new Microsoft.Maps.Location(result.resourceSets[0].resources[0].point.coordinates[0], result.resourceSets[0].resources[0].point.coordinates[1]);
		var pushpin = new Microsoft.Maps.Pushpin(location);
		map.entities.push(pushpin);
	} else {
		if ( typeof (response) == 'undefined' || response == null) {
			alert("Invalid credentials or no response");
		} else {
			if ( typeof (response) != 'undefined' && response && result && result.errorDetails) {
				resultsHeader.innerHTML = "Message :" + response.errorDetails[0];
			}
			alert("No results for the query");

		}
	}

}

/*Bing ajax 6.3 api*/
function loadMap(){
	map = new VEMap('tempMap');
	map.LoadMap();
	
}

function getMapForDrivingDistance(start, end) {
	var startingPoint = new VELatLong( start.latitude, start.longitude);
	var endPoint = new VELatLong(end.latitude, end.longitude);

	var options = new VERouteOptions();
	options.DistanceUnit = VERouteDistanceUnit.Kilometer;
	options.RouteCallback = onGotRoute;
	map.GetDirections([startingPoint, endPoint], options);
}


function onGotRoute(route) {
	App.tripManagerController.computeTripLegsCarbonEmissions(route);
}



/* BING REST API
creates an instance of bing map inorder to calculate the driving distance between two directions
function getMapForDrivingDistance(startingPoint, endPoint) {
	start = startingPoint;
	end = endPoint;

	map = new Microsoft.Maps.Map(document.getElementById('tempMap'), {
		credentials : 'AkfwYAUV1wedc2qX9NFTfUMAYmrknBNzuj67mO0yk1fTc8pZF7yezrdGzMpJtjW5'
	});

	map.getCredentials(callRouteService);
}

call the routine service inorder to get the driving distance between to positions
function callRouteService(credentials) {
	var startingPoint = start.latitude + ',' + start.longitude;
	var endPoint = end.latitude + ',' + end.longitude;
	var routeRequest = 'http://dev.virtualearth.net/REST/v1/Routes?wp.0=' + startingPoint + '&wp.1=' + endPoint + '&routePathOutput=Points&output=json&jsonp=routeCallback&key=' + credentials;
	var mapscript = document.createElement('script');
	mapscript.type = 'text/javascript';
	mapscript.src = routeRequest;
	document.getElementById('tempMap').appendChild(mapscript);
}

function routeCallback(result) {
	App.tripManagerController.computeTripLegsCarbonEmissions(result);
	disposeMap();
}

*/

