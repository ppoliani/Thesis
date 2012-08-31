$(document).ready(  

    function() {

        var $container = $(".bannerContainer");

        $container.wtRotator({
            width: 805,

            height:200,

            button_width:24,

            button_height:24,

            button_margin:4,

            auto_start:true,

            delay:8000,

            transition:"random",

            transition_speed:1000,

            block_size:75,

            vert_size:55,

            horz_size:50,

            cpanel_align:"BR",

            display_thumbs: false,

            display_dbuttons:true,

            display_playbutton:true,

            display_tooltip:true,

            display_numbers:true,

            display_timer:true,

            mouseover_pause:false,

            cpanel_mouseover:true,

            text_mouseover:false,

            text_effect: "fade",

            tooltip_type: "image",

            shuffle:true,

            block_delay:25,

            vstripe_delay:73,

            hstripe_delay:183

        });

        

        var $cpAlign = $("#cpalignments");

        var $cpanelCB = $("#cpanel-cb");

        var $thumbCB = $("#thumbs-cb");

        var $dBtnsCB = $("#dbuttons-cb");

        var $playBtnCB = $("#playbutton-cb");

        var $tooltipCB = $("#tooltip-cb");
        
        var $thumbImgCB = $("#img-cb");

        

        $("#transitions").val("random").change(

            function() {

                $container.updateTransition($(this).val());

            }

        );

        

        $("#texteffects").val("fade").change(

            function() {

                $container.updateTextEffect($(this).val());

            }

        );

        

        $cpAlign.val("BR").change(

            function() {

                $container.updateCpAlign($(this).val());

            }

        );

        

        $thumbCB.attr("checked", "checked").change(

            function() {

                var val = $(this).attr("checked");

                $tooltipCB.attr("disabled", !val); 

                $container.displayThumbs(val);

                checkCPanel();  

            }

        );

        

        $dBtnsCB.attr("checked", "checked").change(

            function() {

                $container.displayDButtons($(this).attr("checked"));

                checkCPanel();

            }               

        );



        $playBtnCB.attr("checked", "checked").change(

            function() {

                $container.displayPlayButton($(this).attr("checked"));

                checkCPanel();

            }               

        );

        

        $tooltipCB.attr("checked", "checked").change(

            function() {

                $container.displayTooltip($(this).attr("checked")); 

            }               

        );                  

        

        $("#timer-cb").attr("checked", "checked").change(

            function() {

                $container.displayTimerBar($(this).attr("checked"));    

            }               

        );                      

        

        $("#pause-cb").attr("checked", "").change(

            function() {

                $container.updateMouseoverPause($(this).attr("checked"));

            }               

        );      

        

        $("#text-cb").attr("checked", "").change(

            function() {

                $container.updateMouseoverDesc($(this).attr("checked"));

            }               

        );

        

        $cpanelCB.attr("checked", "").change(

            function() {

                $container.updateMouseoverCP($(this).attr("checked"));

            }               

        );

        

        var checkCPanel = function() {

            var val = ($thumbCB.attr("checked") || $dBtnsCB.attr("checked") || $playBtnCB.attr("checked"));

            $cpanelCB.attr("disabled", !val);

            $cpAlign.attr("disabled", !val);

        }               

    }

);