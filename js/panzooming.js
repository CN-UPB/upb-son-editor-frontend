	    $(function() {

          var $section = $('#editor-parent');
          //var $in_section = $('#editor');
          var $menu_actions = $('#menu-actions');
          var $panzoom = $section.find('#editor').panzoom({
            disablePan: true,
            $zoomIn: $menu_actions.find(".zoom-in"),
            $zoomOut: $menu_actions.find(".zoom-out"),
            $reset: $menu_actions.find(".reset")
            //panOnlyWhenZoomed: true,
            //minScale: 0.5
            //contain: true
          });
          /*var $panzoom_vnf = $in_section.find('#vnf_vnf-sample_0').panzoom({
            contain: true
          });*/
		  $(".editor-area").css("cursor","default");
          $panzoom.on('mousewheel.focal', function( e ) {
            e.preventDefault();
            var delta = e.delta || e.originalEvent.wheelDelta;
            var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
            $panzoom.panzoom('zoom', zoomOut, {
              animate: false,
              focal: e
            });
          });
        });