var zoomMatrix = [];
var current_zoom = 1;
      function changeZoomTo(){
            var x = document.getElementById("percent").value;
            console.log("you selected: " + x);
            current_zoom = x / 100;
            console.log("current zoom: " + current_zoom);
            $("#editor").panzoom("zoom", current_zoom, { animate: true, silent: true});
      }
	    $(function() {
          //original_matrix = $('#editor').panzoom("getmatrix");
          //console.log("Original zoom: " + original_matrix[0]);
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
            which: 1,
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
            zoomMatrix = ($panzoom.panzoom("getMatrix"));
            current_zoom = zoomMatrix[0];
            console.log("current zoom: " + current_zoom);
            document.getElementById('percent').value = current_zoom * 100;
        });
        $panzoom.on('panzoomreset', function(e){
            current_zoom = 1;
            console.log("current zoom: " + current_zoom);
            document.getElementById('percent').value = current_zoom * 100;
        });
        $menu_actions.find(".zoom-in").on("click", function(e) {
          if(current_zoom < 1.5){
            //e.preventDefault();
            //$panzoom.panzoom("zoom");
            current_zoom += 0.1;
            console.log("current zoom: " + current_zoom);
            document.getElementById('percent').value = current_zoom * 100;
            //$('#percent').val(current_zoom * 100).change();
          }
        });
        $menu_actions.find(".zoom-out").on("click", function(e) {
            if (current_zoom > 0.5) {
              //e.preventDefault();
              //$panzoom.panzoom("zoom");
              current_zoom -= 0.1;
              console.log("current zoom: " + current_zoom);
              document.getElementById('percent').value = current_zoom * 100;
              //$('#percent').val(current_zoom * 100).change();
            }
        });
      });