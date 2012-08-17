/// <reference path="../jquery-1.7.1.min.js" />


$(document).ready(function () {
    //CLOSING POPUP
    //Click the x event!
    $("#popupContactClose").click(function () {
        disablePopup();

    });

    //Click out event!
    $("#backgroundPopup").click(function () {
        disablePopup();
    });

    //Press Escape event!
    $(document).keypress(function (e) {
        if (e.keyCode == 27 && popupStatus == 1) {
            disablePopup();
        }
    });

});

//SETTING UP OUR POPUP
//0 means disabled; 1 means enabled;
var popupStatus = 0;


/*loading popup with jQuery animate effect!*/
function loadPopup(tripLeg) {
    var popupWidth = 600,
        popupHeight = 600;
	
    //loads popup only if it is disabled
    if (popupStatus == 0) {
        /*set initial position to the position of the click point*/
        $("#popupContact").css({
            "position": "absolute",
            "top": 0,
            "left": 0
        });

        var windowWidth = document.documentElement.clientWidth;
        var windowHeight = document.documentElement.clientHeight;
        var top = windowHeight / 2 - popupHeight / 2,
            left = windowWidth / 2 - popupWidth / 2;
		
		//the element id based on the trip leg for which we adding the addresses. Each trip leg has its own popup div
		var elementId = "#popupContact-" + tripLeg
        
        $("#backgroundPopup").css({
            "opacity": "0.9"
        });

        $(elementId).css({
            "display": "block"
        });

        $("#backgroundPopup").fadeIn("slow");
        //$("#popupContact").fadeIn("slow");
        
        $(elementId).animate({
            width: "400px",
            height: "550px",
            opacity: 1,
            position: "absolute",
            top: top,
            left: left
        }, 1000);

        popupStatus = 1;

        /*scroll to the top*/
        $('html, body').animate({ scrollTop: 0 }, 'slow');

    }
}


/*disabling popup*/
function disablePopup(tripLeg) {
    //disables popup only if it is enabled
    if (popupStatus == 1) {
    	//the element id based on the trip leg for which we adding the addresses
		var elementId = "#popupContact-" + tripLeg
		
        $("#backgroundPopup").fadeOut("slow");
        $(elementId).animate({
            width: "0px",
            height: "0px",
            top: "0px",
            left: "0px",
            opacity: 0
        }, 1000, function () {
            $(elementId).css({
                "display": "none"
            });    
        });

        popupStatus = 0;
    }
}
