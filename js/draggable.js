//var vnfs=[{"name":"name1"},{"name":"name2"},{"name":"name3"}]
//var serverURL = "http://fg-cn-sandman2.cs.upb.de:5000/";§§
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
var elans = 0;
var connections = [];
var color = "#d39963";
var interval = null;
var endPointOptions = {
	endpoint : "Dot",
	paintStyle : {
		fillStyle : color
	},
	isSource : true,
	detachable : true,
	reattach : true,
	scope : "blue",
	connectorStyle : {
		strokeStyle : color,
		lineWidth : 3
	},
	connector : [ "Flowchart" ],
	connectorHoverPaintStyle : {
		strokeStyle : "#d36a63"
	},
	isTarget : true,
	anchor : [ "Perimeter", {
		shape : "Square"
	} ],
	beforeDrop : function(info) {
		console.log(info);
		return true;
	},
	maxConnections : -1,
	dragOptions : {},
	dropOptions : {
		tolerance : "touch",
		hoverClass : "dropHover",
		activeClass : "dragActive"
	}
};
var jsPlumbOptions = {
	DragOptions : {
		cursor : 'pointer',
		zIndex : "2000"
	},
	PaintStyle : {
		strokeStyle : '#666'
	},
	EndpointHoverStyle : {
		fillStyle : "#d36a63",
	},
	HoverPaintStyle : {
		strokeStyle : "#d36a63"
	},
	connectorHoverPaintStyle : {
		strokeStyle : "#d36a63",
		outlineColor : "yellow",
		outlineWidth : "5px"
	},
	EndpointStyle : {
		width : "5px",
		height : "5px",
		strokeStyle : '#666'
	},
	Endpoint : "Dot",
	Container : "editor"
};

var ViewModel = function() {
	this.vnfs = ko.observableArray([]);
	this.addVnf = function(vnf) {
		this.vnfs.push(vnf);
		vnf_map[vnf.vendor + ":" + vnf.name + ":" + vnf.version] = vnf;
	}.bind(this);
	this.nss = ko.observableArray([]);
	this.addNs = function(ns) {
		this.nss.push(ns);
		ns_map[ns.vendor + ":" + ns.name + ":" + ns.version] = ns;
	}.bind(this);

	this.editor_nodes = ko.observableArray([]);
	this.addToEditor = function(descriptor) {
		this.editor_nodes.push(descriptor);
	}.bind(this);

	this.platforms = ko.observableArray([]);
	this.setPlatforms = function(platforms) {
		ko.utils.arrayPushAll(this.platforms, platforms);
	}.bind(this);
};

var viewModel = new ViewModel();

(function() {
	ko.bindingHandlers.drag = {
		init : function(element, valueAccessor, allBindingsAccessor, ViewModel) {
			var dragElement = $(element);
			var dragOptions = {
				helper : 'clone',
				revert : false,
				revertDuration : 0,
				start : function() {
					lastDraggedDescriptor = ko.utils
							.unwrapObservable(valueAccessor().value);
				},
				cursor : 'default'
			};
			dragElement.draggable(dragOptions);
		}
	};
})();

function calcAnchors(anchorCount) {
	var r = 0.5, step = Math.PI * 2 / anchorCount, current = 0, a = [];
	for ( var i = 0; i < anchorCount; i++) {
		var x = r + (r * Math.sin(current)), y = r + (r * Math.cos(current));
		// push values to perimeter of square
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
		a.push([ x, y, 0, 0 ]);
		current += step;
	}
	return a;
}

function calcLabelPos(anchor) {
	var labelX = anchor[0], labelY = anchor[1];
	if (labelX == 0) {
		labelX = -0.5;
	} else if (labelX == 1) {
		labelX = 1.5;
	}
	if (labelY == 0) {
		labelY = -0.5;
	} else if (labelY == 1) {
		labelY = 1.5;
	}
	return [ labelX, labelY ];
}

function drawVNFandNS(id, descriptor) {
	var connectionPoints = descriptor['connection_points'];
	if (connectionPoints) {
		anchors = calcAnchors(connectionPoints.length);
		var i;
		for (i = 0; i < connectionPoints.length; i++) {
			var connectionPoint = connectionPoints[i];
			e = instance.addEndpoint(id, {
				uuid : id + ":" + connectionPoint.id,
				anchor : anchors[i],
				connectorOverlays : [ [ "Arrow", {
					width : 10,
					length : 20,
					location : 0.45,
					id : "arrow"
				} ] ],
				overlays : [ [ "Label", {
					cssClass : "endpointLabel",
					label : connectionPoint.id,
					id : "lbl",
					location : calcLabelPos(anchors[i])
				} ] ]
			}, endPointOptions);
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
		url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/"
				+ queryString["ptId"] + "/services/" + nsId,
		method : 'PUT',
		contentType : "application/json; charset=utf-8",
		dataType : 'json',
		xhrFields : {
			withCredentials : true
		},
		data : JSON.stringify(cur_ns.descriptor),
		success : function(data) {
			console.log("service " + nsId + " updated..!!");
		},
		error : function(err) {
			console.log(err);
		}
	});
}
//delete all links related to a node
function deleteRelatedLinks(objectId) {
	var cur_links = cur_ns.descriptor.virtual_links;
	var removed = cur_links.filter(function(el) {
		return el.id.search(objectId) == -1;
	});
	cur_ns.descriptor.virtual_links = removed;
}
//delete a single link
function deleteLink(uuids)
{
	var cur_links=cur_ns.descriptor.virtual_links;
		var removed=cur_links.filter(function(el){
			return !(el.connection_points_reference[0]==uuids[0]&&el.connection_points_reference[1]==uuids[1]);
		});
		cur_ns.descriptor.virtual_links=removed;
}

function deleteNodeOnServer(id) {
	if (id.split("_")[0] == "vnf") {
		var cur_vnfs = cur_ns.descriptor.network_functions;
		var removed = cur_vnfs.filter(function(el) {
			return el.vnf_id != id;
		});
		cur_ns.descriptor.network_functions = removed;
		deleteRelatedLinks(id);
	}
	if (id.split("_")[0] == "ns") {
		var cur_nss = cur_ns.descriptor.network_services;
		var removed = cur_nss.filter(function(el) {
			return el.ns_id != id;
		});
		cur_ns.descriptor.network_services = removed;
		deleteRelatedLinks(id);
	}
	if (id.split("_")[0] == "connection-point") {
		var cur_cp = cur_ns.descriptor.connection_points;
		var removed = cur_cp.filter(function(el) {
			return el.id != id;
		});
		cur_ns.descriptor.connection_points = removed;
		deleteRelatedLinks(id);
	}
	if (id.split("_")[0] == "e-lan") {
		var cur_elan = cur_ns.descriptor.elans;
		var removed = cur_elan.filter(function(el) {
			return el.id != id;
		});
		cur_ns.descriptor.elans = removed;
		deleteRelatedLinks(id);
	}
	updateService(cur_ns);
}
// add a node of a network service to editor
function addNode(data, x, y) {
	viewModel.addToEditor(data);
	var elem = $('#' + data.id);
	elem.addClass(data.type + "-after-drop");
	elem.css({
		position : 'absolute',
		left : x,
		top : y
	});
	if (data.type == "connection-point") {
		drawConnectionPoint(elem[0].id);
	} else if (data.type == "e-lan") {
		drawElan(elem[0].id);
	} else {
		drawVNFandNS(elem[0].id, data.descriptor);
	}
	instance.draggable(elem[0].id);
	$("#" + elem[0].id).click(function() {
		var deleteThisNode = confirm("Do you want to delete this node?");
		if (deleteThisNode === true) {
			deleteNodeOnServer(this.id);
			instance.detachAllConnections($(this));
			instance.removeAllEndpoints($(this));
			$(this).remove();	
		}
	});
}

function doDeploy(id) {
	showWaitAnimation("Deploying...");
	$.ajax({
		url : serverURL + "workspaces/" + queryString["wsId"] + "/platforms/"
				+ id + "/services/",
		method : 'POST',
		contentType : "application/json; charset=utf-8",
		dataType : 'json',
		xhrFields : {
			withCredentials : true
		},
		data : JSON.stringify({
			"id" : cur_ns.id
		}),
		success : function(data) {
			closeWaitAnimation();
			$("#success").dialog({
				buttons : {
					"OK" : function() {
						$(this).dialog("close");
					}
				}
			});
			$("#success").text(
					"Service " + cur_ns.name + " deployed successfully!");
		},
		error : function(err) {
			closeWaitAnimation();
			console.log(err);
		}
	});
}

function showDeployDialog() {
	$("#deployDialog").dialog({
		resizable : false,
		height : "auto",
		modal : true,
		buttons : {
			"Deploy" : function(e) {
				var id = $("#selectPlatform").val();
				var button = $(e.target);
				button[0].disabled = true;
				doDeploy(id);
				$(this).dialog("close");
			},
			"Cancel" : function() {
				$(this).dialog("close");
			}
		}
	});
}

// load VNFs for the sidebar
function loadAllVNFs() {
	return $.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId
				+ "/functions/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function(data) {
			vnfs = data;
			for ( var i = 0; i < vnfs.length; i++) {
				viewModel.addVnf(vnfs[i]);
			}
		}
	});
}

// load network services for the sidebar
function loadAllNSs() {
	return $.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId
				+ "/services/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function(data) {
			nss = data;
			for ( var i = 0; i < nss.length; i++) {
				if (nss[i].id != nsId) {
					viewModel.addNs(nss[i]);
				}
			}
			$(".ns").draggable({
				helper : "clone",
				revert : "invalid"
			});
		}
	});
}

// ajax calls for navigation bar to fetch workspace name, project name, and
// network service name
function setNaviBar() {
	$.ajax({
		url : serverURL + "workspaces/" + wsId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function(data) {
			document.getElementById("nav_workspace").text = "Workspace: "
					+ data.name;
		}
	});
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function(data) {
			document.getElementById("nav_project").text = "Project: "
					+ data.name;
		}
	});
}

// load platforms for deploy dialog
function loadPlatforms() {
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/platforms/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function(platforms) {
			viewModel.setPlatforms(platforms);
		}
	});
}

// display loaded network service in the editor
function displayNS() {
	var $editor = $("#editor");
	var editorWidth = $editor.width();
	var max = editorWidth - 75;
	var min = 25;
	var ymin = 25;
	var $x = min;
	var $y = ymin;
	if (cur_ns.descriptor.network_functions != null) {
		for ( var i = 0; i < (cur_ns.descriptor.network_functions).length; i++) {
			vnf = cur_ns.descriptor.network_functions[i];
			vnf_data = vnf_map[vnf.vnf_vendor + ":" + vnf.vnf_name + ":"
					+ vnf.vnf_version];
			vnf_data['id'] = vnf.vnf_id;
			vnf_data['type'] = 'vnf';
			addNode(vnf_data, $x, $y);
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
	if (cur_ns.descriptor.network_services != null) {
		for ( var i = 0; i < (cur_ns.descriptor.network_services).length; i++) {
			ns = cur_ns.descriptor.network_services[i];
			ns_data = ns_map[ns.ns_vendor + ":" + ns.ns_name + ":"
					+ ns.ns_version];
			ns_data['id'] = ns.ns_id;
			ns_data['type'] = 'ns';
			addNode(ns_data, $x, $y);
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

	if (cur_ns.descriptor.connection_points != null) {
		for ( var i = 0; i < (cur_ns.descriptor.connection_points).length; i++) {
			var cp = cur_ns.descriptor.connection_points[i];
			var txts = cp.id.split("_");
			cp['name'] = txts[1] + txts[2];
			cp['type'] = 'connection-point';
			addNode(cp, $x, $y);
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

	if (cur_ns.descriptor.elans != null) {
		for ( var i = 0; i < (cur_ns.descriptor.elans).length; i++) {
			var elan = cur_ns.descriptor.elans[i];
			var txts = elan.id.split("_");
			elan['name'] = txts[1] + txts[2];
			elan['type'] = 'e-lan';
			addNode(elan, $x, $y);
			$x = $x + 100;
			if ($x > max) {
				$x = min;
				$y = $y + 100;
			}
			countDropped++;
		}
	}
	if (cur_ns.descriptor.virtual_links != null) {
		for ( var i = 0; i < (cur_ns.descriptor.virtual_links).length; i++) {
			var virtual_link = cur_ns.descriptor.virtual_links[i];
			drawVirtualLink(virtual_link);
		}
	}
}
function drawVirtualLink(virtual_link) {
	instance.connect({
		uuids : virtual_link["connection_points_reference"]
	});
}

// function to set the editor height dynamically fitting to the browser window
function setSize() {
	windowHeight = $(window).innerHeight();
	windowWidth = $(window).innerWidth();
	minWidth = windowWidth * 0.1;
	$('.left-navigation-bar').css('min-height', windowHeight);
	$('.left-navigation-bar').css('min-width', minWidth);
	$('#editor').css('min-height', windowHeight);
	$('#editor').css('marginLeft', minWidth);
	$('.vnf').css('width', $('.left-navigation-bar').width() - 10);
	$('.ns').css('width', $('.left-navigation-bar').width() - 10);
}

// replace old_class from the source element with new class 'xxx-after-drop'
function reconfigureNode(ui, data, old_class, editor) {
	var newId = old_class + "_" + data.attr('id') + "_" + countDropped;
	countDropped = countDropped + 1;
	data.attr('id', newId);
	data.removeClass(old_class);
	data.addClass(old_class + '-after-drop');
	data.removeClass('ui-draggable');
	var $newPosX = ui.offset.left - $(editor).offset().left;
	var $newPosY = ui.offset.top - $(editor).offset().top;
	data.css({
		position : 'absolute',
		left : $newPosX,
		top : $newPosY,
		width : ''
	});
	document.getElementById("editor").appendChild(data[0]);
}

function updateDescriptor(type, list, elemId) {
	if (!list) {
		list = [];
	}
	var newEntry = {};
	newEntry[type + "_vendor"] = lastDraggedDescriptor.vendor;
	newEntry[type + "_name"] = lastDraggedDescriptor.name;
	newEntry[type + "_id"] = elemId;
	newEntry[type + "_version"] = lastDraggedDescriptor.version;
	list.push(newEntry);
	if (type == "ns") {
		cur_ns.descriptor.network_services = list;
	} else {
		cur_ns.descriptor.network_functions = list;
	}
	updateService(cur_ns);
	drawVNFandNS(elemId, lastDraggedDescriptor["descriptor"]);
}
function drawConnectionPoint(elemID) {
	instance.addEndpoint(elemID, {
		uuid : elemID,
		anchor : [ "Left" ],
		connectorOverlays : [ [ "Arrow", {
			width : 10,
			length : 20,
			location : 0.45,
			id : "arrow"
		} ] ]
	}, endPointOptions);
}
function createNewConnectionPoint(elemID, updateOnServer) {
	text = elemID;
	var txts = text.split("_");
	text = txts[1] + txts[2];
	$("#" + elemID).html("<p>" + text + "</p>");
	if (!cur_ns.descriptor.connection_points) {
		cur_ns.descriptor.connection_points = [];
	}
	drawConnectionPoint(elemID);
	if (updateOnServer) {
		cur_ns.descriptor.connection_points.push({
			"id" : elemID,
			"type" : "interface"
		});
		updateService(cur_ns);
	}
}
function drawElan(elemID) {
	instance.addEndpoint(elemID, {
		uuid : elemID,
		anchor : [ "Left" ],
		connectorOverlays : [ [ "Arrow", {
			width : 10,
			length : 20,
			location : 0.45,
			id : "arrow"
		} ] ]
	}, endPointOptions);
}
function createNewElan(elemID, updateOnServer) {
	text = elemID;
	var txts = text.split("_");
	text = txts[1] + txts[2];
	$("#" + elemID).html("<p>" + text + "</p>");
	if (!cur_ns.descriptor.elans) {
		cur_ns.descriptor.elans = [];
	}
	drawElan(elemID);
	if (updateOnServer) {
		cur_ns.descriptor.elans.push({
			"id" : elemID,
			"type" : "interface"
		});
		updateService(cur_ns);
	}
}

function updateVirtualLinks(conn, remove) {
	if (!remove) {
		connections.push(conn);
	} else {
		var idx = -1;
		for ( var i = 0; i < connections.length; i++) {
			if (connections[i] == conn) {
				idx = i;
				break;
			}
		}
		if (idx != -1)
			connections.splice(idx, 1);
	}
	var cp_source = conn.endpoints[0];
	var cp_target = conn.endpoints[1];
	var virtual_link = {};
	virtual_link["id"] = cp_source.elementId + "-2-" + cp_target.elementId;
	virtual_link["connectivity_type"] = "E-Line";
	virtual_link["connection_points_reference"] = conn.getUuids();
	if (!cur_ns.descriptor["virtual_links"]) {
		cur_ns.descriptor["virtual_links"] = [];
	}
	cur_ns.descriptor["virtual_links"].push(virtual_link);
	updateService(cur_ns);
	console.log("number of connections:" + connections.length);
	if (connections.length > 0) {
		var s = "<span><strong>Connections</strong></span><br/><br/><table><tr><th>Scope</th><th>Source</th><th>Target</th></tr>";
		for ( var j = 0; j < connections.length; j++) {
			s = s + "<tr><td>" + connections[j].scope + "</td>" + "<td>"
					+ connections[j].sourceId + "</td><td>"
					+ connections[j].targetId + "</td></tr>";
		}
		showConnectionInfo(s);
	} else
		hideConnectionInfo();
}

function showConnectionInfo(s) {
	var listDiv = document.getElementById("connection-list");
	listDiv.innerHTML = s;
	listDiv.style.display = "block";
}

function hideConnectionInfo() {
	var listDiv = document.getElementById("connection-list");
	listDiv.style.display = "none";
}

function animateConnections(conn) {
	var arrow = conn.getOverlay("arrow");
	interval = window.setInterval(function() {
		arrow.loc += 0.05;
		if (arrow.loc > 1) {
			arrow.loc = 0;
		}
		try {
			conn.repaint();
			// writing in try block since when connection is removed we need to
			// terminate the function for that particular connection
		} catch (e) {
			window.clearInterval(interval);
		}
	}, 100);
}

function configureJsPlumb() {
	instance = jsPlumb.getInstance(jsPlumbOptions);
	$("#editor")
			.droppable(
					{
						accept : " .vnf , .ns , .connection-point , .e-lan ",
						drop : function(event, ui) {
							var data = ui.draggable.clone();
							if (data.hasClass('vnf')) {
								console.log("inside vnf condition");
								reconfigureNode(ui, data, "vnf", this);
								updateDescriptor("vnf",
										cur_ns.descriptor.network_functions,
										data.attr('id'));
							}
							if (data.hasClass('ns')) {
								console.log("inside ns condition");
								reconfigureNode(ui, data, "ns", this);
								updateDescriptor("ns",
										cur_ns.descriptor.network_services,
										data.attr('id'));
							}
							if (data.hasClass('connection-point')) {
								console
										.log("inside connection-point condition");
								reconfigureNode(ui, data, 'connection-point',
										this);
								createNewConnectionPoint(data.attr('id'), true);
							}
							if (data.hasClass('e-lan')) {
								console.log("inside e-lan condition");
								reconfigureNode(ui, data, "e-lan", this);
								createNewElan(data.attr('id'), true);
							}
							instance.draggable(data.attr('id'), {
								containment : "parent"
							});
							$(data)
									.click(
											function() {
												var deleteThisNode = confirm("Do you want to delete this node?");
												if (deleteThisNode === true) {
													deleteNodeOnServer(this.id);
													instance
															.detachAllConnections($(this));
													instance
															.removeAllEndpoints($(this));
													$(this).remove();
													
												}
											});
						}
					});
	// suspend drawing and initialise.
	// bind to connection/connectionDetached events, and update the list of
	// connections on screen.
	instance.bind("connection", function(info, originalEvent) {
		new animateConnections(info.connection);
		if (originalEvent) {
			updateVirtualLinks(info.connection, false);
		}
	});
	instance.bind("connectionDetached", function(info, originalEvent) {
		new animateConnections(info.connection);
		updateVirtualLinks(info.connection, true);
	});
	instance.bind("connectionMoved", function(info, originalEvent) {
		// only remove here, because a 'connection' event is also fired.
		// in a future release of jsplumb this extra connection event will not
		// be fired.
		new animateConnections(info.connection);
		updateVirtualLinks(info.connection, true);
	});
	instance.bind("click", function(connection, originalEvent) {
		var popupOkCancel = confirm("Do you want to delete this connection?");
		if (popupOkCancel === true) {	
			deleteLink(connection.getUuids());
			updateService(cur_ns);
			instance.detach(connection);
		}
	});
	jsPlumb.fire("jsPlumbDemoLoaded", instance);
}

// load the current NS from the server
function loadCurrentNS() {
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId
				+ "/services/" + nsId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function(data) {
			document.getElementById("nav_ns").text = "NS: " + data.name;
			cur_ns = data;
			displayNS();
		},
	});
}
$(document).ready(function() {
	queryString = getQueryString();
	wsId = queryString["wsId"];
	ptId = queryString["ptId"];
	nsId = queryString["nsId"];
	setNaviBar();
	loadPlatforms();
	setSize();
	$(window).resize(function() {
		setSize();
	});

	$(".connection-point").draggable({
		helper : "clone",
		revert : "invalid"
	});
	$(".e-lan").draggable({
		helper : "clone",
		revert : "invalid"
	});
	// delay loading the current network service until the sidebar has loaded
	// completely
	$.when(loadAllVNFs(), loadAllNSs()).done(function(r1, r2) {
		loadCurrentNS();
	});
	ko.applyBindings(viewModel);
	jsPlumb.ready(function() {
		configureJsPlumb();
	});
});
