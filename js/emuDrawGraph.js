var minScale = 0.4;
var maxScale = 2;
var incScale = 0.1;
var plumb = null;
var $container = $(".container");
$diagram = $container.find(".diagram");
var $panzoom = null;

//var links = [];
/*var links = [
  {from: "dc1_TestStack_iperf1", to: "dc1_TestStack_firewall1"},
  {from: "dc1_TestStack_firewall1", to: "dc1_TestStack_tcpdump1" },
];
var links = [
  { from: "i0", to: "i1" },
  { from: "i1", to: "i11" },
  { from: "i1", to: "i12" },
  { from: "i0", to: "i2" },
  { from: "i2", to: "i21" },
  { from: "i0", to: "i3" },
];*/
//$(document).ready(function () {
  function configureJsPlumb() {
  //location.reload();
  //sleep(3000);
jsPlumb.ready(function() {
  plumb = jsPlumb.getInstance({
    PaintStyle: { stroke:"red", strokeWidth: 10 },
    Anchors: [["Left","Right","Bottom"], ["Top","Bottom"]],
    Container: $diagram,
  });
  
  _.each(links,function(link){
     var conn = plumb.connect({
       source:link.from,
       target:link.to,
       connector: [ "StateMachine",
        {
          cornerRadius: 3,
          stub:16,
        }
       ],

       endpoints:["Blank","Blank"],
       //label: "",
       //endpoints:["Dot","Dot"],
       overlays:[
                  ["Arrow",{location:1,width:10, length:10,events:{
                    click:function() { alert("you clicked on the arrow overlay")}
                  }}],
                  [ "Label", {
                    //location: [0.5, 1.5],
                    location: 0.20,
                    id: "label",
                    cssClass: "aLabel",
                    visible: true,
                    events:{
                      tap:function() { alert("hey"); }
                    }
                  }]

                ]
             
     });
     //conn.setLabel(link.from + "-" + link.to);
     /*init = function (link) {       
          link.getOverlay("label").setLabel(link.from + "-" + link.to)
        } */
     conn.bind("mouseover", function (connection, originalEvent) {
            //connection.setLabel(link.src_intf + ":" + link.dst_intf);
            
            var conn_label = connection.getOverlay("label");
            conn_label.setLabel(link.src_intf + ":" + link.dst_intf);
            console.log(conn_label.getLabel());
            connection.showOverlay("label");

        });
     conn.bind("mouseout", function (connection, originalEvent) {
            //connection.setLabel("");
            //var conn_label = connection.getOverlay("label");
            //conn_label.hide();
            connection.hideOverlay("label");
        });

  });
  //sleep(3000); 
  var dg = new dagre.graphlib.Graph();
  dg.setGraph({rankdir:'LR',align:'DR',nodesep:30,ranksep:50,marginx:50,marginy:50});
  //dg.setGraph({rankdir:'LR',align:'DL',nodesep:50,ranksep:130});
  dg.setDefaultEdgeLabel(function() { return {}; });
  console.log("before in items loop...");
  //sleep(3000);
  $container.find(".item").each(
    function(idx, node) {
      var $n = $(node);
      //console.log("Node is: " + $n);
      var box = {
        width  : Math.round($n.outerWidth()),
        height : Math.round($n.outerHeight())
      };
      dg.setNode($n.attr('id'), box);   
      //console.log(dg.node(node));

    }

  ); 
  console.log("after in items loop...");
  plumb.getAllConnections()
    .forEach(function(edge) {dg.setEdge(edge.source.id,edge.target.id);});
  dagre.layout(dg);
  var graphInfo = dg.graph();
  //console.log(dg.nodes());
  console.log(dg);
  var xdest = 50;
  dg.nodes().forEach(function(n) {
      //console.log("Node " + n + ": " + JSON.stringify(dg.node(n)));
      var node = dg.node(n);
      node.x = node.x + xdest;

      //console.log(dg.node(n));
      var top = Math.round(node.y-node.height/2)+'px';
      //var top = Math.round(152)+'px';
      var left = Math.round(node.x-node.height/2)+'px';
      //var left = Math.round(node.x + node.width/2)+'px';
      console.log("left: " + left + ", top: " + top);
      $('#' + n).css({left:left,top:top});
      xdest = xdest + 50;
      //add tooltip code
      //$('#' + n).attr("title", n);
      $('#' + n).tooltip({
            position : {
                my : "center top-40px",
                at : "center top"
            },
            show : {
                effect : "slideDown",
                duration : 100
            },
            content: function(){
              var title = $(this).attr("title");
              return title;
            },
            track: true
        });
        $('#' + n).mousedown(function() {
          $('#' + n).tooltip("disable");
        });
        $('#' + n).mouseup(function() {
          $('#' + n).tooltip("enable");
        });

    });
  //console.log($('.container').marginLeft());
  //$('#start').css('marginLeft', $('.container').width() -100);
  //var start_left = Math.round($("#start").css("left") + 100)+'px';
  //var start_top = $("#start").css("top");
  //$('#stop').css({left:start_left,top:start_top});
    /*var all_nodes = []; 
    all_nodes = dg.nodes();
    for(var i=0; i < all_nodes.length; i++){
      var node = all_nodes[i];
      console.log(node);
      var top = Math.round(node.y-node.height/2)+'px';
      var left = Math.round(node.x-node.width/2)+'px';
      $('#' + node).css({left:left,top:top});
    }*/
  plumb.repaintEverything();
/* // stopping pan and zoom and dragging of nodes
  _.defer(function(){
    $panzoom = $container.find('.panzoom').panzoom({
      minScale: minScale,
      maxScale: maxScale,
      which: 3,
      increment: incScale,
      cursor: "",
    }).on("panzoomstart",function(e,pz,ev){
      $panzoom.css("cursor","move");
    })
    .on("panzoomend",function(e,pz){
      $panzoom.css("cursor","");
    });
	
    $panzoom.parent()
    .on('mousewheel.focal', function( e ) {
      //if(e.ctrlKey||e.originalEvent.ctrlKey)
      //{
        e.preventDefault();
        var delta = e.delta || e.originalEvent.wheelDelta;
        var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
        $panzoom.panzoom('zoom', zoomOut, {
           animate: true,
           exponential: false,
        });
      //}else{
        //e.preventDefault();
        //var deltaY = e.deltaY || e.originalEvent.wheelDeltaY || (-e.originalEvent.deltaY);
        //var deltaX = e.deltaX || e.originalEvent.wheelDeltaX || (-e.originalEvent.deltaX);
        //$panzoom.panzoom("pan",deltaX/2,deltaY/2,{
          //animate: true,
          //relative: true,
        //});
      //}
    })
    .on("mousedown touchstart",function(ev){
      var matrix = $container.find(".panzoom").panzoom("getMatrix");
      var offsetX = matrix[4];
      var offsetY = matrix[5];
      var dragstart = {x:ev.pageX,y:ev.pageY,dx:offsetX,dy:offsetY};
      $(ev.target).css("cursor","move");
      $(this).data('dragstart', dragstart);
    })
    .on("mousemove touchmove", function(ev){
      var dragstart = $(this).data('dragstart');
      if(dragstart)
      {
        var deltaX = dragstart.x-ev.pageX;
        var deltaY = dragstart.y-ev.pageY;
        var matrix = $container.find(".panzoom").panzoom("getMatrix");
        matrix[4] = parseInt(dragstart.dx)-deltaX;
        matrix[5] = parseInt(dragstart.dy)-deltaY;
        $container.find(".panzoom").panzoom("setMatrix",matrix);
      }
    })
    .on("mouseup touchend touchcancel", function(ev){
      $(this).data('dragstart',null);
      $(ev.target).css("cursor","");
    });
  }); //end of defer function
  
  var currentScale = 1;
  $container.find(".item").draggable({
    start: function(e){
      var pz = $container.find(".panzoom");
      currentScale = pz.panzoom("getMatrix")[0];
	  console.log(currentScale);
      $(this).css("cursor","move");
      pz.panzoom("disable");
    },
    drag:function(e,ui){
      ui.position.left = ui.position.left/currentScale;
      ui.position.top = ui.position.top/currentScale;
      if($(this).hasClass("jsplumb-connected"))
      {
        plumb.repaint($(this).attr('id'),ui.position);
      }
    },
    stop: function(e,ui){
      var nodeId = $(this).attr('id');
      if($(this).hasClass("jsplumb-connected"))
      {
        plumb.repaint(nodeId,ui.position);
      }
      $(this).css("cursor","");
      $container.find(".panzoom").panzoom("enable");
    }
  }); */
 }); //end of jsplumb ready function
//});
}