var zoomMatrix = [];
var current_zoom = 1;
var $setLeft;
var $setTop;

      function changeZoomTo(){
            var x = document.getElementById("percent").value;
            console.log("you selected: " + x);
            current_zoom = x / 100;
            console.log("current zoom: " + current_zoom);
            $("#editor").panzoom("zoom", current_zoom, { 
              animate: true, 
              silent: true
            });
            console.log("inside changeZoomTo function, the original offset of Editor is: " + $setTop, $setLeft);
            
            console.log("inside changeZoomTo function, updated offset of Editor is: " + $('#editor').offset().top,$('#editor').offset().left);
            $('#editor').panzoom("pan", -130, -60, {relative: true, animation: true});
            $("#editor").offset({ top: $setTop, left: $setLeft });  

      }

	    $(function() {

          $setLeft = $('#editor').offset().left;
          $setTop = $('#editor').offset().top;
          console.log($setTop, $setLeft);
          var original_matrix = [];
          var $section = $('#editor-parent');
          //$section.find('#editor').panzoom("setMatrix", [ 1, 0, 0, 1, 0, 0 ]);
          //original_matrix = ($section.find('#editor').panzoom("getMatrix"));
          //console.log("original zoom: " + original_matrix);
          //var $in_section = $('#editor');
          //var current_zoom = $('#editor').css('transform');
          //console.log("original zoom: " + current_zoom);
          var $menu_actions = $('#menu-actions');
          var $panzoom = $section.find('#editor').panzoom({
            //disablePan: true,
            $zoomIn: $menu_actions.find(".zoom-in"),
            $zoomOut: $menu_actions.find(".zoom-out"),
            //$zoomRange: $menu_actions.find(".zoom-range"),
            $reset: $menu_actions.find(".reset"),
            //startTrnasform: 'scale(0.9)',
            which: 3,
            maxScale: 1.5,
            increment: 0.1,
            //panOnlyWhenZoomed: false,
            minScale: 0.5,
            easing: "ease-in-out"
            //contain: "invert"
          });

  		  $(".editor-area").css("cursor","default");
 
        $panzoom.parent().on('mousewheel.focal', function( e ) {
            e.preventDefault();
            var delta = e.delta || e.originalEvent.wheelDelta;
            var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
            //console.log(e.delta);
            $panzoom.panzoom('zoom', zoomOut, {
              animate: false,
              focal: e
            });
            console.log(e.offsetX, e.offsetY);
            //$("#editor").offset({ top: 150, left: 300 });
            $("#editor").offset({ top: $setTop, left: $setLeft });
            zoomMatrix = ($panzoom.panzoom("getMatrix"));
            current_zoom = zoomMatrix[0];
            console.log("current zoom: " + current_zoom);
            document.getElementById('percent').value = current_zoom * 100;

            if (current_zoom < 1){
              console.log("Your zoom is running lower than 1. Check your left border..!!");
            }
        });
        $panzoom.on('panzoomreset', function(e){
            current_zoom = 1;
            console.log("current zoom: " + current_zoom);
            document.getElementById('percent').value = current_zoom * 100;
            $('#editor').css('left', '0%');
            $('#editor').css('top', '0%');
            //console.log("editor offset is: " + $('#editor').offset().left);
        });
        $panzoom.on('panzoomend', function(e){
            console.log("Zoom has ended. Current zoom is: " + current_zoom);
            console.log("After zoom has ended, updated offset of Editor is: " + $('#editor').offset().top,$('#editor').offset().left);
            //$("#editor").offset({ top: $setTop, left: $setLeft });
        });
        /*
        $panzoom.on('panzoomchange', function(e){
            console.log("Something has changed...");
            console.log("After the change, updated offset of Editor is: " + $('#editor').offset().top,$('#editor').offset().left);
            $("#editor").offset({ top: $setTop, left: $setLeft });
        }); */
        $menu_actions.find(".zoom-in").on("click", function(e) {
          //$("#editor").offset({ top: $setTop, left: $setLeft });
          if(current_zoom < 1.5){
            //e.preventDefault();
            //$panzoom.panzoom("zoom");
            current_zoom = parseFloat(current_zoom) + 0.1;
            console.log("current zoom: " + current_zoom);
            document.getElementById('percent').value = current_zoom * 100;
            //$('#percent').val(current_zoom * 100).change();
          }
          $('#editor').panzoom("pan", -130, -60, {relative: true, animation: true});
          $("#editor").offset({ top: $setTop, left: $setLeft });
          
        });
        $menu_actions.find(".zoom-out").on("click", function(e) {
            //$("#editor").offset({ top: $setTop, left: $setLeft });
            if (current_zoom > 0.6) {
              //e.preventDefault();
              //$panzoom.panzoom("zoom");
              //current_zoom -= 0.1;
              current_zoom = current_zoom - 0.1;
              console.log("current zoom: " + current_zoom);
              document.getElementById('percent').value = current_zoom * 100;
              //$('#percent').val(current_zoom * 100).change();
              if (current_zoom < 1){
                console.log("Your zoom is running lower than 1. Check your left border..!!");
              }
              //$("#editor").offset({ top: $setTop, left: $setLeft });
            }
            $('#editor').panzoom("pan", -130, -60, {relative: true, animation: true});
            $("#editor").offset({ top: $setTop, left: $setLeft });
            //$('#editor').css('left', '0%');
            //$('#editor').css('top', '0%');
        });
      });