

var map = null;
var query;

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

