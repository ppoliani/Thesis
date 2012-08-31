$(document).ready(function() {
	//CLOSING POPUP
	//Click the x event!
	$("#popupContactClose").click(function() {
		disablePopup();

	});

	//Click out event!
	$("#backgroundPopup").click(function() {
		disablePopup();
	});

	//Press Escape event!
	$(document).keypress(function(e) {
		if (e.keyCode == 27 && popupStatus == 1) {
			disablePopup();
		}
	});

});

//SETTING UP OUR POPUP
//0 means disabled; 1 means enabled;
var popupStatus = 0;

/* loading popup with jQuery animate effect!
 * @trilLeg = the id of the trip leg view where the popup container lies
 */
function loadPopup(elementId, popupWidth, popupHeight, elementWidth, elementHeight) {
	//loads popup only if it is disabled
	if (popupStatus == 0) {
		/*set initial position to the position of the click point*/
		$("#popupContact").css({
			"position" : "absolute",
			"top" : 0,
			"left" : 0
		});

		var windowWidth = document.documentElement.clientWidth;
		var windowHeight = document.documentElement.clientHeight;
		var top = windowHeight / 2 - popupHeight / 2, left = windowWidth / 2 - popupWidth / 2;

		$(elementId).css({
			"display" : "block"
		});

		loadBackgroundPopup();

		$(elementId).animate({
			width : elementWidth,
			height : elementHeight,
			opacity : 1,
			position : "absolute",
			top : top,
			left : left
		}, 1000);

		popupStatus = 1;

	}
}

function scrollTop() {
	/*scroll to the top*/
	$('html, body').animate({
		scrollTop : 0
	}, 'slow');
}

function scrollBottom() {
	/*scroll to the top*/
	$('html, body').animate({
		scrollBottom : 0
	}, 'slow');
}

/*disabling popup*/
function disablePopup(elementId) {
	//disables popup only if it is enabled
	if (popupStatus == 1) {
		disableBackgroundPopup()

		$(elementId).animate({
			width : "0px",
			height : "0px",
			top : "0px",
			left : "0px",
			opacity : 0
		}, 1000, function() {
			$(elementId).css({
				"display" : "none"
			});
		});

		popupStatus = 0;
		scrollBottom();
	}
}

/*displays the backgroundPopup container that covers the whole screen*/
function loadBackgroundPopup() {
	$("#backgroundPopup").css({
		"opacity" : "0.9"
	});

	$("#backgroundPopup").fadeIn("slow");
}

/*disable the backgroundPopup container that covers the whole screen*/
function disableBackgroundPopup() {
	$("#backgroundPopup").fadeOut("slow");
}

/*replaces the gid preloader with a text message*/
function replaceGifWithMsg() {
	$('#ajax-preloader').css({
		'display' : 'none'
	});

	$("#redirection-alert").css({
		'display' : 'block'
	});
	var secs = 6;
	var interv = setInterval(function() {
		$('#secs').html(--secs);
		if (secs == 0) {
			window.location.replace('/');
		}
	}, 1000);

	//when it gets negative
}

function openJQueryWindow(elementId) {
	loadBackgroundPopup();
	$( elementId ).dialog({
   		close: function(event, ui) {
   			disableBackgroundPopup();	
   			deleteTempProvGraphImg();
   			$( "#static-prov-graph" ).toggleClass( "invisible", 100 );
			$( "#center-container" ).toggleClass( "invisible", 100 );
   		},
   		
   		minWidth: 970
	});

	
}


function deleteTempProvGraphImg(){
	var url = '/delete-temp-prov-img/';
	
	$.ajax({
		type: 'GET',
		url: url
	});
}
