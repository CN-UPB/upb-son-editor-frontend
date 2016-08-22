	$(document).ready(function() {
		jsPlumb.ready(function() {
		var instance = jsPlumb.getInstance({
				
					DragOptions: { cursor: 'pointer', zIndex: 2000 },
					PaintStyle: { strokeStyle: '#666' },
					EndpointHoverStyle: { fillStyle: "orange" },
					HoverPaintStyle: { strokeStyle: "orange" },
					connectorHoverPaintStyle:{ strokeStyle: "orange", outlineColor:"yellow", outlineWidth:5 },
					EndpointStyle: { width: 20, height: 16, strokeStyle: '#666' },
					Endpoint: "Rectangle",
					Anchors: ["TopCenter", "TopCenter"],
					Container: "editor"
		});
		
		
		
		$(".vnf").draggable({
			helper: "clone", 
			revert: "invalid"
			/*
			// this function will disable the dragged vnf after drag stops.
			stop: function( event, ui ) {
				console.log("Stop event is triggered for draggable...");
				$(this).draggable({ disabled: true });
			} */
		
		});
		//$(this).draggable( "option", "disabled", true);
		
		//-------------------function to set the editor height dynamically fitting to the browser window -------------------------------------
		function setHeight() {
			windowHeight = $(window).innerHeight();
			$('.left-navigation-bar').css('min-height', windowHeight);
			$('#editor').css('min-height', windowHeight);
		};
			setHeight();
	  
			$(window).resize(function() {
			setHeight();
		});
		//console.log("------- Loaded setEditorHeight function ---------");
		//--------------------------------------------------------
		var countDropped = 1;
		$( "#editor").droppable({
			accept: ".vnf",
			drop: function(event, ui) {

				var data = ui.draggable.clone();
				//console.log(data.attr('id'));
				
				var newId = data.attr('id') + "-dropped-" + countDropped;
				countDropped = countDropped + 1 ;
				//console.log(newId);
				
				data.attr('id', newId);
				
				//console.log(data.attr('id'));
				
				//console.log(data);
				
				// remove the 'vnf' class from the source vnf , add new class 'vnf-after-drop' to the clone
				data.removeClass('vnf');
				data.addClass('vnf-after-drop');
				data.removeClass('ui-draggable');
				
				//console.log($(ui.draggable).position());
				//var mouseX = $(ui.draggable).left;
				//var mouseY = $(ui.draggable).top;
				
				// position of the draggable minus position of the droppable relative to the document
				
				var $newPosX = ui.offset.left - $(this).offset().left;
				var $newPosY = ui.offset.top - $(this).offset().top;

				data.css({position:'relative', left: $newPosX, top: $newPosY});
				
				//data.draggable({ cursor: 'move', containment: '#editor'});
				
				// Add the cloned vnf to the editor div, it will be the first element of data array
				
				document.getElementById("editor").appendChild(data[0]);
				
				// Give the resizable properties to the dragged vnf
				
				data.resizable({
					//handles: 'all', 
					animate: true, 
					ghost: true
					});
				
				//console.log(event.clientX);
				//console.log(event.clientY);
			
				// ------------------ new code end--------------------------------
				
				// configure some drop options for use by all endpoints.
					
					var exampleDropOptions = {
						tolerance: "touch",
						hoverClass: "dropHover",
						activeClass: "dragActive"
					};
					
					//var exampleColor = "#00f";
					var color2 = "#00f";
					var common = {
						endpoint: "Rectangle",
						paintStyle: { fillStyle: color2 },
						isSource:true,
						reattach: true,
						scope: "blue",
						connectorStyle: { strokeStyle: color2, lineWidth: 3 },
						connector: ["Bezier", { curviness: 63 } ],
						connectorHoverPaintStyle:{ 
							 
							strokeStyle: "orange" 
							
						},
						isTarget:true,
						anchors:["Right", "Left"],
						beforeDrop: function (params) {
							return confirm("Connect " + params.sourceId + " to " + params.targetId + "?");
						},
						dropOptions: exampleDropOptions
						//anchors:["Right", "Left"],
						//connector: ["StateMachine"]
					};
				
				instance.addEndpoint(data.attr('id'), {
					anchor:["Left"],
					connectorOverlays:[ 
						[ "Arrow", { width:10, length:20, location:0.45, id:"arrow" } ]
						//[ "Label", { label:"foo", id:"label" } ]
					]
				}, common);
				
				instance.addEndpoint(data.attr('id'), {
					anchor:["Right"],
					connectorOverlays:[ 
						[ "Arrow", { width:10, length:20, location:0.45, id:"arrow" } ]
						//[ "Label", { label:"foo", id:"label" } ]
					]
				}, common);
				

				instance.draggable(data.attr('id'), {containment:"parent"});
				
				
				
				
				// deletes the node from editor
				data.click(function() {
					
						var deleteThisNode = confirm("Do you want to delete this node...");
						if (deleteThisNode === true ) { 
							instance.detachAllConnections($(this));
							instance.removeAllEndpoints($(this));
							$(this).remove();
						}
				}); 
				
				console.log("End of drop function");
				/*
				 var detachLinks = jsPlumb.getSelector(".drag-drop-demo .detach");
				 jsPlumb.on(document.getElementById("detachAll-link"), "click", function (e) {
						jsPlumb.detachAllConnections(this.getAttribute("rel"));
						//showConnectionInfo("");
						//jsPlumbUtil.consume(e);
					}); */
			   

			   //jsPlumb.draggable("item_right");	
				//});		// end of jsPlumb.batch	

			} 			// end of drop function
		}); 			// end of droppable			
			
							// ----------------- new code --- functions to update the connection list ---------------------------------
				
			var listDiv = document.getElementById("connection-list"),

				showConnectionInfo = function (s) {
					listDiv.innerHTML = s;
					listDiv.style.display = "block";
				},
				hideConnectionInfo = function () {
					listDiv.style.display = "none";
				},
				connections = [],
				updateConnections = function (conn, remove) {
					if (!remove) connections.push(conn);
					else {
						var idx = -1;
						for (var i = 0; i < connections.length; i++) {
							if (connections[i] == conn) {
								idx = i;
								break;
							}
						}
						if (idx != -1) connections.splice(idx, 1);
					}
					if (connections.length > 0) {
						var s = "<span><strong>Connections</strong></span><br/><br/><table><tr><th>Scope</th><th>Source</th><th>Target</th></tr>";
						for (var j = 0; j < connections.length; j++) {
							s = s + "<tr><td>" + connections[j].scope + "</td>" + "<td>" + connections[j].sourceId + "</td><td>" + connections[j].targetId + "</td></tr>";
						}
						//showConnectionInfo(s);
						hideConnectionInfo();
					} else
						hideConnectionInfo();
				};
				
			//---------------------- method for animation over connection-------------------
			
			var interval = null; 
			animateConn = function(conn) {
            var arrow = conn.getOverlay("arrow");
            interval = window.setInterval(function() {
					arrow.loc += 0.05;
					if (arrow.loc > 1) {arrow.loc = 0;}
					try{
						conn.repaint(); // writing in try block since when connection is removed we need to terminate the function for that particular connection
					}catch(e){stop();}
				}, 100);                 
			},
			stop = function() {
				window.clearInterval(interval);
			};
			
			//-----------------------method for animation over connection ends ------------------
			
							// ------------------------new code - batch function------------------
				// suspend drawing and initialise.
			//instance.batch(function () { 

					// bind to connection/connectionDetached events, and update the list of connections on screen.
					instance.bind("connection", function (info, originalEvent) {
						//$(info.sourceId).addClass('connected');
						//$(info.targetId).addClass('connected');
						new animateConn(info.connection);
						updateConnections(info.connection);
					});
					instance.bind("connectionDetached", function (info, originalEvent) {
						updateConnections(info.connection, true);
					});

					instance.bind("connectionMoved", function (info, originalEvent) {
						//  only remove here, because a 'connection' event is also fired.
						// in a future release of jsplumb this extra connection event will not
						// be fired.
						updateConnections(info.connection, true);
					});

					instance.bind("click", function (info, originalEvent) {
						//console.log(info);
						//alert("click!");
						var popupOkCancel = confirm("Do you want to delete this connection..??");
						if (popupOkCancel === true) {
							instance.detach(info);
							updateConnections(info.connection, true);
							//console.log(info);
							//instance.removeAllEndpoints(info.sourceId);
							instance.removeAllEndpoints(info.targetId);
							//instance.remove(info.sourceId);
							instance.remove(info.targetId);
						}
							
						//else {
						//	alert("You just chose not to delete this connection..!!!");
						//	}
					});
					
					
					
					
					/*
					
					
					var deleteNode = jsPlumb.getSelector(".vnf-after-drop");
					instance.on(deleteNode, "click", function (e) {
						console.log("------------Before Detach ALL--------------");
						console.log(connections);
						console.log("------------------------------------------");
						//instance.detachEveryConnection();
						//showConnectionInfo("");
						//jsPlumbUtil.consume(e);
						
						instance.detachAllConnections(this.getAttribute("id"));
						jsPlumbUtil.consume(e);
						$(this).remove();
						console.log("------------After Detach ALL--------------");
						console.log(connections);
						console.log("------------------------------------------");
					});  */

				// ------------------------------ function for Detach All (not successful) ---------------------	
				/*
					var deleteAll = jsPlumb.getSelector("#detachAll-link");
					
					$(deleteAll).click(function(){
						//instance.reset();
						//console.log("------------Before Detach ALL--------------");
						//console.log(connections);
						//console.log("------------------------------------------");
						
						var popupOkCancelDetachAll = confirm("Do you want to detach everything..??");
						if (popupOkCancelDetachAll === true) {
							instance.detachEveryConnection();
							instance.reset();
							//jsPlumb.empty("editor");
							//showConnectionInfo("");
							instance.repaintEverything();
							//jsPlumbUtil.consume(e);
						}
						else {
							
							alert("You just chose not to detach all..!!!");
						}
						
						
						//console.log("------------After Detach ALL--------------");
						//console.log(connections);
						//console.log("------------------------------------------");
						
					}); */
				// ------------------------------ function for Detach All (not successful) ---------------------	
				
				// ------------------ new code end--------------------------------




				//}); instance.batch function end.
			
					jsPlumb.fire("jsPlumbDemoLoaded", instance);

				}); 	// end of jsPlumb.ready

		}); 				// end of outer document.ready