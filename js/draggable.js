 //var vnfs=[{"name":"name1"},{"name":"name2"},{"name":"name3"}]
//var serverURL = "http://fg-cn-sandman2.cs.upb.de:5000/";
var vnfs=[];
var nss=[];
var queryString = {};
var wsId = "";
var ptId = "";
var nsId = "";
var cur_ns=[];

var vnfViewModel = function(){
					this.vnfs = ko.observableArray([]);
	
					this.addVnf=function(vnf){
						this.vnfs.push(vnf);
					}.bind(this);
					
					this.nss = ko.observableArray([]);
	
					this.addNs=function(ns){
						this.nss.push(ns);
					}.bind(this);
				}
 
var vnfModel = new vnfViewModel();
/*
var nsViewModel = function(){
					this.nss = ko.observableArray([]);
	
					this.addNs=function(ns){
						this.nss.push(ns);
					}.bind(this);
				}
 
var nsModel = new nsViewModel();
*/

$(document).ready(function() {
		
		
		jsPlumb.ready(function() {
		
		queryString = getQueryString();


		wsId = queryString["wsId"];
		ptId = queryString["ptId"];
		nsId = queryString["nsId"];

		// ajax calls for navigation bar to fetch workspace name, project name, and network service name
		$.ajax({
			url : serverURL + "workspaces/" + wsId,
			dataType : "json",
			xhrFields : {
				withCredentials : true
			},
			success : function (data) {
				document.getElementById("nav_workspace").text = "Workspace: " +data.name;
			}
		});
		$.ajax({
			url : serverURL + "workspaces/" + wsId+"/projects/" + ptId,
			dataType : "json",
			xhrFields : {
				withCredentials : true
			},
			success : function (data) {
				document.getElementById("nav_project").text = "Project: " +data.name;
			}
		});		
		
		$.ajax({
			url : serverURL + "workspaces/" + wsId+"/projects/" + ptId + "/services/" + nsId,
			dataType : "json",
			xhrFields : {
				withCredentials : true
			},
			success : function (data) {
				document.getElementById("nav_ns").text = "NS: " +data.name;
			}
		});
		
		
		
		
		
		console.log(wsId,ptId,nsId);
		
		$.ajax({
			url : serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/functions/",
			dataType : "json",
			xhrFields : {
				withCredentials : true
			},
			success : function (data) { 
				vnfs = data;
				
				for (var i=0; i< vnfs.length;i++){
					vnfModel.addVnf(vnfs[i]);
				}
				
				$(".vnf").draggable({
					helper: "clone", 
					revert: "invalid"
			/* -----------------------
			// this function will disable the dragged vnf after drag stops.
			stop: function( event, ui ) {
				console.log("Stop event is triggered for draggable...");
				$(this).draggable({ disabled: true });
			} ------------------------ */
		
				});
			}
		});
		
		
		//ko.applyBindings(vnfModel); 
		
		
		$.ajax({
			url : serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/services/",
			dataType : "json",
			xhrFields : {
				withCredentials : true
			},
			success : function (data) { 
				nss = data;
				
				for (var i=0; i< nss.length;i++){
					vnfModel.addNs(nss[i]);
				}
				
				$(".ns").draggable({
					helper: "clone", 
					revert: "invalid"
			/* ----------------------
			// this function will disable the dragged vnf after drag stops.
			stop: function( event, ui ) {
				console.log("Stop event is triggered for draggable...");
				$(this).draggable({ disabled: true });
			} ----------------------- */
		
				});
			}
		});
		
		

		
		ko.applyBindings(vnfModel); 
		//ko.applyBindings(nsModel);
		
		
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
						detachable: true,
						reattach: true,
						scope: "blue",
						connectorStyle: { strokeStyle: color2, lineWidth: 3 },
						//connector: ["Bezier", { curviness: 63 } ],
						connector: ["Flowchart"],
						connectorHoverPaintStyle:{ 
							 
							strokeStyle: "orange" 
							
						},
						isTarget:true,
						anchors:["Right", "Left"],
						beforeDrop: function (params) {
							return confirm("Connect " + params.sourceId + " to " + params.targetId + "?");
						},
						maxConnections: -1,
						dragOptions: {},
						dropOptions: exampleDropOptions
						//anchors:["Right", "Left"],
						//connector: ["StateMachine"]
					};		
		
		$(".connection-point").draggable({
			helper: "clone", 
			revert: "invalid"
			});
		$(".e-lan").draggable({
			helper: "clone", 
			revert: "invalid"
			});
		/*
		$(".e-line").draggable({
			helper: "clone", 
			revert: "invalid"
			});
		*/
		
		/* 
		$(".vnf").draggable({
			helper: "clone", 
			revert: "invalid"
			/*
			// this function will disable the dragged vnf after drag stops.
			stop: function( event, ui ) {
				console.log("Stop event is triggered for draggable...");
				$(this).draggable({ disabled: true });
			} */
		
		//}); 
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
			accept: " .vnf , .ns , .connection-point , .e-lan , .e-line ",
			drop: function(event, ui) {

				var data = ui.draggable.clone();
				//console.log(data.attr('id'));
				//var serverId = data.attr('id').substr(data.attr('id').length -2);

				
			$.ajax({
				url : serverURL + "/workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/" + queryString["nsId"],
				method : 'GET',
				contentType : "application/json; charset=utf-8",
				dataType : 'json',
				xhrFields : {
					withCredentials : true
				},
				success : function (ns_data) {
					console.log("service " + nsId + " loaded..!!");
					cur_ns = ns_data;
					console.log(cur_ns);
					console.log(cur_ns.descriptor);
				
					//console.log(cur_ns.descriptor.contains("network_functions"));
					//console.log(cur_ns.descriptor.network_functions);
					//console.log((cur_ns.descriptor.network_functions).length);
				}
			});
				
				
				
				
				
				//console.log(data.attr('id'));
				
				//console.log(data);
				
				//var vnfClassName = data.attr('class');
				//console.log(vnfClassName);
				if (data.hasClass('vnf') == true) { 
				
				// remove the 'vnf' class from the source vnf , add new class 'vnf-after-drop' to the clone
					console.log("inside vnf condition");
					
					var server_vnfId = data.attr('id').slice(4, data.attr('id').length);
					console.log(server_vnfId);
					var newId = data.attr('id') + "-dropped-" + countDropped;
					countDropped = countDropped + 1 ;
					//console.log(newId);
					data.attr('id', newId);
					
					data.removeClass('vnf');
					data.addClass('vnf-after-drop');
					data.removeClass('ui-draggable');
					
					var $newPosX_vnf = ui.offset.left - $(this).offset().left;
					var $newPosY_vnf = ui.offset.top - $(this).offset().top;
					data.css({position:'relative', left: $newPosX_vnf, top: $newPosY_vnf});
					document.getElementById("editor").appendChild(data[0]);
					console.log("completed vnf condition");
					console.log(data);
					
					instance.addEndpoint(data.attr('id'), {
						anchor:["Left"],
						//anchor:[ "Perimeter", { shape:"Square", anchorCount:150 }],
						connectorOverlays:[ 
							[ "Arrow", { width:10, length:20, location: 0.45, id:"arrow" } ]
							//[ "Label", { label:"foo", id:"label" } ]
						]
					}, common);
				
					instance.addEndpoint(data.attr('id'), {
						anchor:["Right"],
						//anchor:[ "Perimeter", { shape:"Square", anchorCount:150 }],
						connectorOverlays:[ 
							[ "Arrow", { width:10, length:20, location: 0.45, id:"arrow" } ]
							//[ "Label", { label:"foo", id:"label" } ]
						]
					}, common);
					instance.draggable(data.attr('id'), {containment:"parent"});
					
					$.ajax({
						url : serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/functions/" + server_vnfId,
						dataType : "json",
						xhrFields : {
							withCredentials : true
						},
						success : function (vnf_data) { 
							console.log(vnf_data);
							if(typeof cur_ns.descriptor.network_functions === 'undefined') {
								console.log("inside first vnf");
								updateService_firstVNF(vnf_data);
							}
							else{
								cur_ns.descriptor.network_functions.push({"vnf_vendor": vnf_data.vendor,"vnf_name": vnf_data.name,"vnf_id": vnf_data.id.toString(),"vnf_version": vnf_data.version});
								//cur_ns.descriptor.author = "surendra Shankar kulkarni";
								//updateService(vnf_data.id, vnf_data.vendor, vnf_data.name, vnf_data.version);
								//updateService(vnf_data);
								console.log(cur_ns.descriptor.network_functions);
								console.log(cur_ns);
								updateService(cur_ns);
								//updateService_firstVNF(vnf_data);
							}
							
						}
					});					
					
					//-------------update service code NOT WORKING Yet--------------
					function updateService(cur_ns) {
							$.ajax({
								url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/" + nsId,
								method : 'PUT',
								contentType : "application/json; charset=utf-8",
								dataType : 'json',
								xhrFields : {
									withCredentials : true
								},
								//data : JSON.stringify({"network_functions": [{"vnf_vendor": vnfVendor,"vnf_name": vnfName,"vnf_id": vnfId,"vnf_version": vnfVersion}]}),
								data : JSON.stringify(cur_ns.descriptor),
								success : function (data) {
									console.log("service " + nsId + " updated..!!");
								},
								error : function (err) {
									console.log(err);
								}
							});
					}
					
					function updateService_firstVNF(vnf_data){
							$.ajax({
								url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/" + nsId,
								method : 'PUT',
								contentType : "application/json; charset=utf-8",
								dataType : 'json',
								xhrFields : {
									withCredentials : true
								},
								data : JSON.stringify({"vendor":cur_ns.vendor,"name":cur_ns.name,"version":cur_ns.version,"network_functions": [{"vnf_vendor": vnf_data.vendor,"vnf_name": vnf_data.name,"vnf_id": vnf_data.id.toString(),"vnf_version": vnf_data.version}]}),
								//data : JSON.stringify(cur_ns.descriptor),
								success : function (data) {
									console.log("service " + nsId + " updated..!!");
								},
								error : function (err) {
									console.log(err);
								}
							});
					}
						
				}
				
				else if (data.hasClass('ns') == true) {
					console.log("inside ns condition");
					
					var serverId = data.attr('id').slice(3, data.attr('id').length);
					console.log(serverId);
					var newId = data.attr('id') + "-dropped-" + countDropped;
					countDropped = countDropped + 1 ;
					//console.log(newId);
					data.attr('id', newId);					
					
					data.removeClass('ns');
					data.addClass('ns-after-drop');
					data.removeClass('ui-draggable');
					
					var $newPosX_ns = ui.offset.left - $(this).offset().left;
					var $newPosY_ns = ui.offset.top - $(this).offset().top;
					data.css({position:'relative', left: $newPosX_ns, top: $newPosY_ns});
					document.getElementById("editor").appendChild(data[0]);
					
					instance.addEndpoint(data.attr('id'), {
						anchor:["Left"],
						//anchor:[ "Perimeter", { shape:"Square", anchorCount:150 }],
						connectorOverlays:[ 
							[ "Arrow", { width:10, length:20, location: 0.45, id:"arrow" } ]
							//[ "Label", { label:"foo", id:"label" } ]
						]
					}, common);
				
					instance.addEndpoint(data.attr('id'), {
						anchor:["Right"],
						//anchor:[ "Perimeter", { shape:"Square", anchorCount:150 }],
						connectorOverlays:[ 
							[ "Arrow", { width:10, length:20, location: 0.45, id:"arrow" } ]
							//[ "Label", { label:"foo", id:"label" } ]
						]
					}, common);
					instance.draggable(data.attr('id'), {containment:"parent"});					
				}
				else if (data.hasClass('connection-point') == true) {
					console.log("inside connection-point condition");
					
					//var serverId = data.attr('id').slice(4, data.attr('id').length);
					//console.log(serverId);
					var newId = data.attr('id') + "-dropped-" + countDropped;
					countDropped = countDropped + 1 ;
					//console.log(newId);
					data.attr('id', newId);					
					
					data.removeClass('connection-point');
					data.addClass('connection-point-after-drop');
					data.removeClass('ui-draggable');
					
					var $newPosX_cp = ui.offset.left - $(this).offset().left;
					var $newPosY_cp = ui.offset.top - $(this).offset().top;
					data.css({position:'relative', left: $newPosX_cp, top: $newPosY_cp});
					document.getElementById("editor").appendChild(data[0]);
					
					instance.addEndpoint(data.attr('id'), {
						anchor:["Left"],
						//anchor:[ "Perimeter", { shape:"Square", anchorCount:150 }],
						connectorOverlays:[ 
							[ "Arrow", { width:10, length:20, location: 0.45, id:"arrow" } ]
							//[ "Label", { label:"foo", id:"label" } ]
						]
					}, common);
				
					instance.addEndpoint(data.attr('id'), {
						anchor:["Right"],
						//anchor:[ "Perimeter", { shape:"Square", anchorCount:150 }],
						connectorOverlays:[ 
							[ "Arrow", { width:10, length:20, location: 0.45, id:"arrow" } ]
							//[ "Label", { label:"foo", id:"label" } ]
						]
					}, common);
					instance.draggable(data.attr('id'), {containment:"parent"});					
				}
				else if (data.hasClass('e-lan') == true) {
					console.log("inside e-lan condition");
					
					//var serverId = data.attr('id').slice(4, data.attr('id').length);
					//console.log(serverId);
					var newId = data.attr('id') + "-dropped-" + countDropped;
					countDropped = countDropped + 1 ;
					//console.log(newId);
					data.attr('id', newId);					
					
					data.removeClass('e-lan');
					data.addClass('e-lan-after-drop');
					data.removeClass('ui-draggable');
					
					var $newPosX_elan = ui.offset.left - $(this).offset().left;
					var $newPosY_elan = ui.offset.top - $(this).offset().top;
					data.css({position:'relative', left: $newPosX_elan, top: $newPosY_elan});
					document.getElementById("editor").appendChild(data[0]);
					
					instance.addEndpoint(data.attr('id'), {
						anchor:["Left"],
						//anchor:[ "Perimeter", { shape:"Square", anchorCount:150 }],
						connectorOverlays:[ 
							[ "Arrow", { width:10, length:20, location: 0.45, id:"arrow" } ]
							//[ "Label", { label:"foo", id:"label" } ]
						]
					}, common);
				
					instance.addEndpoint(data.attr('id'), {
						anchor:["Right"],
						//anchor:[ "Perimeter", { shape:"Square", anchorCount:150 }],
						connectorOverlays:[ 
							[ "Arrow", { width:10, length:20, location: 0.45, id:"arrow" } ]
							//[ "Label", { label:"foo", id:"label" } ]
						]
					}, common);
					instance.draggable(data.attr('id'), {containment:"parent"});					
				}
				/*
				else if (data.hasClass('e-line') == true) {
					console.log("inside e-line condition");
					data.removeClass('e-line');
					data.addClass('e-line-after-drop');
					data.removeClass('ui-draggable');
				} */
				//-------------------- 
	
				// Give the resizable properties to the dragged vnf
				/*
				data.resizable({
					//handles: 'all', 
					animate: true, 
					ghost: true
					});
				*/
				
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
					console.log("number of connections:" + connections.length);
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
						new animateConn(info.connection);
						updateConnections(info.connection, true);
					}); 

					instance.bind("connectionMoved", function (info, originalEvent) {
						//  only remove here, because a 'connection' event is also fired.
						// in a future release of jsplumb this extra connection event will not
						// be fired.
						new animateConn(info.connection);
						updateConnections(info.connection, true);
					});

					instance.bind("click", function (info, originalEvent) {
						//console.log(info);
						//alert("click!");
						var popupOkCancel = confirm("Do you want to delete this connection..??");
						if (popupOkCancel === true) {
							instance.detach(info);
							//updateConnections(info.connection, true);
							//console.log(info);
							//instance.removeAllEndpoints(info.sourceId);
							
							/*instance.removeAllEndpoints(info.targetId);*/
							
							//instance.remove(info.sourceId);
							
							/*instance.remove(info.targetId);*/
						}
							
						//else {
						//	alert("You just chose not to delete this connection..!!!");
						//	}
					});
			
					jsPlumb.fire("jsPlumbDemoLoaded", instance);

				}); 	// end of jsPlumb.ready

		}); 				// end of outer document.ready