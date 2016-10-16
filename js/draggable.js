//var vnfs=[{"name":"name1"},{"name":"name2"},{"name":"name3"}]
//var serverURL = "http://fg-cn-sandman2.cs.upb.de:5000/";
var vnfs = [];
var nss = [];
var vnf_map = {};
var ns_map = {};
var queryString = {};
var wsId = "";
var ptId = "";
var nsId = "";
var cur_ns = {};
var instance = {};
var lastDraggedDescriptor = {};
var countDropped = 0;
var connectionPoints = 0;
(function() {
    ko.bindingHandlers.drag = {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
            var dragElement = $(element);
            var dragOptions = {
                helper: 'clone',
                revert: false,
                revertDuration: 0,
                start: function() {
                    lastDraggedDescriptor = ko.utils.unwrapObservable(valueAccessor().value);
                },
                cursor: 'default'
            };
            dragElement.draggable(dragOptions);
        }
    };
})();
var vnfViewModel = function() {
    this.vnfs = ko.observableArray([]);
    this.addVnf = function(vnf) {
        this.vnfs.push(vnf);
        vnf_map[vnf.vendor + ":" + vnf.name + ":" + vnf.version] = vnf;
    }
    .bind(this);
    this.nss = ko.observableArray([]);
    this.addNs = function(ns) {
        this.nss.push(ns);
        ns_map[ns.vendor + ":" + ns.name + ":" + ns.version] = ns;
    }
    .bind(this);
	
    this.editor_nodes = ko.observableArray([]);
    this.addToEditor = function(descriptor) {
        this.editor_nodes.push(descriptor);
    }
    .bind(this);

    this.platforms = ko.observableArray([]);
    this.setPlatforms = function(platforms){
    	ko.utils.arrayPushAll(this.platforms, platforms);
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
function calcAnchors(anchorCount) {
    var r = 0.5
      , step = Math.PI * 2 / anchorCount
      , current = 0
      , a = [];
    for (var i = 0; i < anchorCount; i++) {
        var x = r + (r * Math.sin(current))
          , y = r + (r * Math.cos(current));
        //push values to perimeter of square
        if (Math.abs(x - 0.5) > Math.abs(y - 0.5)) {
            if (x > 0.5) {
                x = 1;
            } else {
                x = 0;
            }
        } else {
            if (y > 0.5) {
                y = 1;
            } else {
                y = 0;
            }
        }
        a.push([x, y, 0, 0]);
        current += step;
    }
    return a;
}
var color2 = "#00f";
var common = {
    endpoint: "Rectangle",
    paintStyle: {
        fillStyle: color2
    },
    isSource: true,
    detachable: true,
    reattach: true,
    scope: "blue",
    connectorStyle: {
        strokeStyle: color2,
        lineWidth: 3
    },
    connector: ["Flowchart"],
    connectorHoverPaintStyle: {
        strokeStyle: "orange"
    },
    isTarget: true,
    anchor: ["Perimeter", {
        shape: "Square"
    }],
    beforeDrop: function(info) {
        console.log(info);
        return true;
        //    return confirm("Connect " + params.sourceId + " to " + params.targetId + "?");
    },
    maxConnections: -1,
    dragOptions: {},
    dropOptions: {
        tolerance: "touch",
        hoverClass: "dropHover",
        activeClass: "dragActive"
    }
};

function calcLabelPos(anchor){
	var labelX=anchor[0], labelY=anchor[1];
	if (labelX==0){
		labelX=-0.5;
	} else if (labelX==1){
		labelX = 1.5;
	}
	if (labelY==0){
		labelY=-0.5;
	} else if (labelY==1){
		labelY = 1.5;
	}
    return [labelX, labelY];
}

function createEndpoints(instance, id, descriptor) {
    var connectionPoints = descriptor['connection_points'];
    if (connectionPoints) {
        anchors = calcAnchors(connectionPoints.length);
        var i;
        for (i = 0; i < connectionPoints.length; i++) {
            var connectionPoint = connectionPoints[i];
            
            e = instance.addEndpoint(id, {
                anchor: anchors[i],
                connectorOverlays: [["Arrow", {
                    width: 10,
                    length: 20,
                    location: 0.45,
                    id: "arrow"
                }]],
                overlays: [["Label", {
                    cssClass: "endpointLabel",
                    label: connectionPoint.id,
                    id: "lbl",
                    location: calcLabelPos(anchors[i])
                }]]
            }, common);
            e.bind("mouseenter", function(ep) {
                ep.showOverlay("lbl");
            });
            e.bind("mouseexit", function(ep) {
                ep.hideOverlay("lbl");
            });
        }
    }
}
function updateService(cur_ns) {
    $.ajax({
        url: serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/" + nsId,
        method: 'PUT',
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        //data : JSON.stringify({"network_functions": [{"vnf_vendor": vnfVendor,"vnf_name": vnfName,"vnf_id": vnfId,"vnf_version": vnfVersion}]}),
        data: JSON.stringify(cur_ns.descriptor),
        success: function(data) {
            console.log("service " + nsId + " updated..!!");
        },
        error: function(err) {
            console.log(err);
        }
    });
}

function addNode(data, x ,y){
	vnfModel.addToEditor(data);
	var elem = $('#'+data.type+ "_" + data.id);
	elem.addClass(data.type+"-after-drop");
	elem.css({
		position: 'absolute',
		left: x,
		top: y
	});             
	createEndpoints(instance, elem[0].id, data.descriptor);
	instance.draggable(elem[0].id, {
		containment: "parent"
	});
}

function doDeploy(id){
	showWaitAnimation("Deploying...");
	$.ajax({
        url: serverURL + "workspaces/" + queryString["wsId"] + "/platforms/" + id +"/services/",
        method: 'POST',
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify({"id": cur_ns.id}),
        success: function(data) {
        	closeWaitAnimation();
        	$("#success").dialog({
        		buttons:{
        			"OK": function(){
        				$(this).dialog("close");
        			}
        		}
        	});
        	$("#success").text("Service "+ cur_ns.name +" deployed successfully!");
        },
        error: function(err) {
            console.log(err);
        }
    });
}

function showDeployDialog(){
	$("#deployDialog").dialog({
		resizable: false,
		height: "auto",
		modal: true,
		buttons: {
			"Deploy": function(e){
				var id = $("#selectPlatform").val();
				var button= $(e.target);
				button[0].disabled =true;
				doDeploy(id);
				$(this).dialog("close");
			},
			"Cancel": function(){
				$(this).dialog("close");
			}
		}
	});
}

$(document).ready(function() {
    queryString = getQueryString();
    wsId = queryString["wsId"];
    ptId = queryString["ptId"];
    nsId = queryString["nsId"];
    // ajax calls for navigation bar to fetch workspace name, project name, and network service name
    $.ajax({
        url: serverURL + "workspaces/" + wsId,
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            document.getElementById("nav_workspace").text = "Workspace: " + data.name;
        }
    });
    $.ajax({
        url: serverURL + "workspaces/" + wsId + "/projects/" + ptId,
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            document.getElementById("nav_project").text = "Project: " + data.name;
        }
    });
	$.ajax({
        url: serverURL + "workspaces/" + wsId+"/platforms/",
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function(platforms) {
			vnfModel.setPlatforms(platforms);
        }
    });

    function loadVNFs() {
        return $.ajax({
            url: serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/functions/",
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            success: function(data) {
                vnfs = data;
                for (var i = 0; i < vnfs.length; i++) {
                    vnfModel.addVnf(vnfs[i]);
                }
                /*    $(".vnf").draggable({
					helper: "clone",
					revert: "invalid"/* -----------------------
			// this function will disable the dragged vnf after drag stops.
			stop: function( event, ui ) {
				console.log("Stop event is triggered for draggable...");
				$(this).draggable({ disabled: true })
				}); */
            }
        });
    }
    function loadServices() {
        return $.ajax({
            url: serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/services/",
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            success: function(data) {
                nss = data;
                for (var i = 0; i < nss.length; i++) {
                    vnfModel.addNs(nss[i]);
                }
                $(".ns").draggable({
                    helper: "clone",
                    revert: "invalid"/* ----------------------
			// this function will disable the dragged vnf after drag stops.
			stop: function( event, ui ) {
				console.log("Stop event is triggered for draggable...");
				$(this).draggable({ disabled: true });
			} ----------------------- */
                });
            }
        });
    }
    //delay loading the current ns until the sidebar has loaded completely
    $.when(loadVNFs(), loadServices()).done(function(r1, r2) {
        $.ajax({
            url: serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/services/" + nsId,
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            success: function(data) {
                document.getElementById("nav_ns").text = "NS: " + data.name;
                console.log("service " + nsId + " loaded..!!");
                cur_ns = data;
				var $editor = $("#editor");
                var editorWidth = $editor.width();
                var max = editorWidth - 75;
                var min = 25;
                var ymin = 25;
                var $x = min
                var $y = ymin
                if (cur_ns.descriptor.network_functions != null ) {
                    for (var i = 0; i < (cur_ns.descriptor.network_functions).length; i++) {
                        vnf = cur_ns.descriptor.network_functions[i];
						vnf_data = vnf_map[vnf.vnf_vendor + ":" + vnf.vnf_name + ":" + vnf.vnf_version];
						vnf_data['id'] = vnf.vnf_id;
						vnf_data['type'] ='vnf';
						addNode(vnf_data, $x ,$y);
						$x = $x + 100;
                        if ($x > max) {
                            $x = min;
                            $y = $y + 100;
                        }
                        countDropped++;
                    }
                    $y = $y + 100;
                    $x = min;
                }
                if (cur_ns.descriptor.network_services != null ) {
                    for (var i = 0; i < (cur_ns.descriptor.network_services).length; i++) {
                        ns = cur_ns.descriptor.network_services[i];
						ns_data = ns_map[ns.ns_vendor + ":" + ns.ns_name + ":" + ns.ns_version];
						ns_data['id']= ns.ns_id;
						ns_data['type']= 'ns';
                        addNode(ns_data, $x, $y);
						$x = $x + 100;
                        if ($x > max) {
                            $x = min;
                            $y = $y + 100;
                        }
                        countDropped++;
                    }
                }
                if (cur_ns.descriptor.connection_points != null){
                	type ="connection-point";
                }
            }
        });
    });
    ko.applyBindings(vnfModel);
    jsPlumb.ready(function() {
        instance = jsPlumb.getInstance({
            DragOptions: {
                cursor: 'pointer',
                zIndex: 2000
            },
            PaintStyle: {
                strokeStyle: '#666'
            },
            EndpointHoverStyle: {
                fillStyle: "orange",
            },
            HoverPaintStyle: {
                strokeStyle: "orange"
            },
            connectorHoverPaintStyle: {
                strokeStyle: "orange",
                outlineColor: "yellow",
                outlineWidth: 5
            },
            EndpointStyle: {
                width: 20,
                height: 16,
                strokeStyle: '#666'
            },
            Endpoint: "Rectangle",
            Container: "editor"
        });
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
			$('#editor').css('marginLeft', $('.left-navigation-bar').width());
        }
        setHeight();
        $(window).resize(function() {
            setHeight();
        });
        //console.log("------- Loaded setEditorHeight function ---------");
        //--------------------------------------------------------
        $("#editor").droppable({
            accept: " .vnf , .ns , .connection-point , .e-lan , .e-line ",
            drop: function(event, ui) {
                var reconfigureNode = function(data, old_class) {
                    var newId = data.attr('id') + "-dropped-" + countDropped;
                    countDropped = countDropped + 1;
                    //console.log(newId);
                    data.attr('id', newId);
                    data.removeClass(old_class);
                    data.addClass(old_class + '-after-drop');
                    data.removeClass('ui-draggable');
                    var $newPosX = ui.offset.left - $(this).offset().left;
                    var $newPosY = ui.offset.top - $(this).offset().top;
                    data.css({
                        position: 'absolute',
                        left: $newPosX,
                        top: $newPosY
                    });
                    document.getElementById("editor").appendChild(data[0]);
                }
                .bind(this);
                var data = ui.draggable.clone();
                if (data.hasClass('vnf') == true) {
                    console.log("inside vnf condition");
                    var server_vnfId = data.attr('id').slice(4, data.attr('id').length);
                    // remove the 'vnf' class from the source vnf , add new class 'vnf-after-drop' to the clone
                    reconfigureNode(data, "vnf");
                    vnf_data = lastDraggedDescriptor;
                    console.log(vnf_data);
                    if (!cur_ns.descriptor.network_functions) {
                        cur_ns.descriptor.network_functions = [];
                    }
                    cur_ns.descriptor.network_functions.push({
                        "vnf_vendor": vnf_data.vendor,
                        "vnf_name": vnf_data.name,
                        "vnf_id": vnf_data.name + "_" + countDropped,
                        "vnf_version": vnf_data.version
                    });
                    console.log(cur_ns);
                    updateService(cur_ns);
                    createEndpoints(instance, data.attr('id'), vnf_data['descriptor'])
                } else if (data.hasClass('ns') == true) {
                    console.log("inside ns condition");
                    var serverId = data.attr('id').slice(3, data.attr('id').length);
                    reconfigureNode(data, "ns");
                    ns_data = lastDraggedDescriptor;
                    if (!cur_ns.descriptor.network_services) {
                        cur_ns.descriptor.network_services = [];
                    }
                    cur_ns.descriptor.network_services.push({
                        "ns_vendor": ns_data.vendor,
                        "ns_name": ns_data.name,
                        "ns_id": ns_data.name + "_" + countDropped,
                        "ns_version": ns_data.version
                    });
                    updateService(cur_ns);
                    createEndpoints(instance, data.attr('id'), ns_data["descriptor"]);
                } else if (data.hasClass('connection-point') == true) {
                    console.log("inside connection-point condition");
                    reconfigureNode(data, 'connection-point');
                    text = "CP" + connectionPoints++;
                    $(data).html("<p>" + text + "</p>");
                    if (!cur_ns.descriptor.connection_points) {
                        cur_ns.descriptor.connection_points = [];
                    }
                    cur_ns.descriptor.connection_points.push({
                        "id": text,
                        "type": "interface"
                    });
                    updateService(cur_ns);
                    instance.addEndpoint(data.attr('id'), {
                        anchor: ["Right"],
                        connectorOverlays: [["Arrow", {
                            width: 10,
                            length: 20,
                            location: 0.45,
                            id: "arrow"
                        }]]
                    }, common);
                } else if (data.hasClass('e-lan') == true) {
                    console.log("inside e-lan condition");
                    reconfigureNode(data, "e-lan");
                    instance.addEndpoint(data.attr('id'), {
                        anchor: ["Left"],
                        connectorOverlays: [["Arrow", {
                            width: 10,
                            length: 20,
                            location: 0.45,
                            id: "arrow"
                        }]]
                    }, common);
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
                instance.draggable(data.attr('id'), {
                    containment: "parent"
                });
                $(data).click(function() {
                    var deleteThisNode = confirm("Do you want to delete this node...");
                    if (deleteThisNode === true) {
                        instance.detachAllConnections($(this));
                        instance.removeAllEndpoints($(this));
                        $(this).remove();
                    }
                });
                console.log("End of drop function");
            }// end of drop function
        });
        // end of droppable			
        // ----------------- new code --- functions to update the connection list ---------------------------------
        var listDiv = document.getElementById("connection-list")
          , showConnectionInfo = function(s) {
            listDiv.innerHTML = s;
            listDiv.style.display = "block";
        }
          , hideConnectionInfo = function() {
            listDiv.style.display = "none";
        }
          , connections = []
          , updateConnections = function(conn, remove) {
            if (!remove)
                connections.push(conn);
            else {
                var idx = -1;
                for (var i = 0; i < connections.length; i++) {
                    if (connections[i] == conn) {
                        idx = i;
                        break;
                    }
                }
                if (idx != -1)
                    connections.splice(idx, 1);
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
        }
        ;
        //---------------------- method for animation over connection-------------------
        var interval = null ;
        animateConn = function(conn) {
            var arrow = conn.getOverlay("arrow");
            interval = window.setInterval(function() {
                arrow.loc += 0.05;
                if (arrow.loc > 1) {
                    arrow.loc = 0;
                }
                try {
                    conn.repaint();
                    // writing in try block since when connection is removed we need to terminate the function for that particular connection
                } catch (e) {
                    stop();
                }
            }, 100);
        }
        ,
        stop = function() {
            window.clearInterval(interval);
        }
        ;
        //-----------------------method for animation over connection ends ------------------
        // ------------------------new code - batch function------------------
        // suspend drawing and initialise.
        //instance.batch(function () { 
        // bind to connection/connectionDetached events, and update the list of connections on screen.
        instance.bind("connection", function(info, originalEvent) {
            //$(info.sourceId).addClass('connected');
            //$(info.targetId).addClass('connected');
            new animateConn(info.connection);
            updateConnections(info.connection);
        });
        instance.bind("connectionDetached", function(info, originalEvent) {
            new animateConn(info.connection);
            updateConnections(info.connection, true);
        });
        instance.bind("connectionMoved", function(info, originalEvent) {
            //  only remove here, because a 'connection' event is also fired.
            // in a future release of jsplumb this extra connection event will not
            // be fired.
            new animateConn(info.connection);
            updateConnections(info.connection, true);
        });
        instance.bind("click", function(info, originalEvent) {
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
    });
    // end of jsPlumb.ready
});
// end of outer document.ready
