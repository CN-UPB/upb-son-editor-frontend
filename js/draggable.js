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
var connections = [];
var color = "#d39963";
var interval = null;
var isDragAction = false;
var dragCount = 0;
var usedIDs = [];
var classNames = [ "CP", "cp", "e-lan" ];
var catalogues = [];

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
var Node = function(node_data) {
    var self = this;
    self.old_id = ko.observable(node_data.id);
    self.id = ko.observable(node_data.id);
    self.deleteNode = function() {
	if (isDragAction) {
	    // do not trigger delete from dragging
	    return;
	}
	var dataId = self.id().replace(":", "\\:");
	var node = "#" + dataId;
	$("#deleteDialog").dialog({
	    modal : true,
	    buttons : {
		Yes : function() {
		    $(this).dialog("close");
		    instance.detachAllConnections($(node));
		    instance.removeAllEndpoints($(node));
		    var deleteId = self.id();
		    deleteNodeFromDpt(deleteId, $(node).attr("class"));
		    viewModel.editor_nodes.remove(self);
		    usedIDs.splice($.inArray(deleteId, usedIDs), 1);
		    updateServiceOnServer();
		},
		Cancel : function() {
		    $(this).dialog("close");
		}
	    }
	}).text("Do you want to delete this node?");
    };
};
var ViewModel = function() {
    this.vnfs = ko.observableArray([]);
    this.addVnf = function(vnf) {
	this.vnfs.push(vnf);
	vnf_map[vnf.descriptor.vendor + ":" + vnf.descriptor.name + ":"
		+ vnf.descriptor.version] = vnf;
	classNames.push(vnf.descriptor.name);
    }.bind(this);
    this.nss = ko.observableArray([]);
    this.addNs = function(ns) {
	this.nss.push(ns);
	ns_map[ns.descriptor.vendor + ":" + ns.descriptor.name + ":"
		+ ns.descriptor.version] = ns;
	classNames.push(ns.descriptor.name);
    }.bind(this);
    this.editor_nodes = ko.observableArray([]);
    var self = this;
    this.addToEditor = function(node_data) {
	self.editor_nodes.push(new Node(node_data));
    };
    this.platforms = ko.observableArray([]);
    self.setPlatforms = function(platforms) {
	ko.utils.arrayPushAll(self.platforms, platforms);
    };
    self.rename = function() {
	var oldId = this.old_id();
	var newId = this.id();
	if (oldId != newId) {
	    var renameOk = true;
	    var error = "";
	    var dataId;
	    var node = null;
	    var className = "";
	    if (newId.length == 0) {
		this.id(oldId);
		renameOk = false;
		error = "The name of a connection point should contain at least one symbol!";
	    } else {
		if ($.inArray(newId, usedIDs) >= 0) {
		    this.id(oldId);
		    renameOk = false;
		    error = "This name already exists!";
		} else {
		    if ($.inArray(newId, classNames) >= 0) {
			this.id(oldId);
			renameOk = false;
			error = "The name should not be a class name!";
		    } else {
			dataId = this.id().replace(":", "\\:");
			node = $("#" + dataId);
			className = node.attr("class");
			if (className.split("-")[0] == "cp") {
			    if (!/^ns\:([a-z0-9_]+)$/.test(newId)) {
				this.id(oldId);
				renameOk = false;
				error = "The name of a connection point should fulfil pattern 'ns:([a-z0-9_]+' !";
			    }
			}
		    }
		}
	    }
	    if (renameOk) {
		usedIDs[$.inArray(oldId, usedIDs)] = newId;
		renameNodeOnServer(oldId, newId, className);
		this.old_id(newId);
		instance.repaintEverything();
	    } else {
		dataId = this.id().replace(":", "\\:");
		node = $("#" + dataId);
		$("#errorDialog").dialog({
		    modal : true,
		    buttons : {
			Confirm : function() {
			    var inputBox = node.children("input")[0];
			    inputBox.value = oldId;
			    $("#errorDialog").dialog("close");
			},
		    }
		}).text(error);
	    }
	    if (node) {
		node.children("input")[0].style.width = ((node
			.children("input")[0].value.length + 2) * 8)
			+ 'px';
	    }
	}
    };
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
		cursor : 'default',
	    };
	    dragElement.draggable(dragOptions);
	}
    };
})();
function calcAnchors(anchorCount) {
    var r = 0.5, step = Math.PI * 2 / anchorCount, current = Math.PI, a = [];
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
function writeDependencies() {
    if (cur_ns.descriptor.network_functions != null) {
	vnf_deps = [];
	for ( var i = 0; i < cur_ns.descriptor.network_functions.length; i++) {
	    var vnf = cur_ns.descriptor.network_functions[i];
	    var vnf_dep = vnf.vnf_vendor + ":" + vnf.vnf_name + ":"
		    + vnf.vnf_version;
	    if ($.inArray(vnf_dep, vnf_deps) < 0) {
		vnf_deps.push(vnf_dep);
	    }
	}
	cur_ns.descriptor["vnf_dependencies"] = vnf_deps;
    }
    if (cur_ns.descriptor.network_services != null) {
	ns_deps = [];
	for ( var i = 0; i < cur_ns.descriptor.network_services.length; i++) {
	    var ns = cur_ns.descriptor.network_services[i];
	    var ns_dep = ns.ns_vendor + ":" + ns.ns_name + ":" + ns.ns_version;
	    if ($.inArray(ns_dep, ns_deps) < 0) {
		ns_deps.push(ns_dep);
	    }
	}
	cur_ns.descriptor["service_dependencies"] = ns_deps;
    }
}

function updateServiceOnServer(action) {
    if (!action) {
	addAction();
    }
    cur_ns.meta.counter = countDropped;
    writeDependencies();
    $.ajax({
	url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/"
		+ queryString["ptId"] + "/services/" + nsId,
	method : 'PUT',
	contentType : "application/json; charset=utf-8",
	dataType : 'json',
	xhrFields : {
	    withCredentials : true
	},
	data : JSON.stringify(cur_ns),
	success : function(data) {
	    console.log("service " + nsId + " updated..!!");
	},
	error : function(err) {
	    console.log(err);
	}
    });
}

// add new virtual link to descriptor
function addLinkToDpt(conn) {
    var cp_source = conn.endpoints[0];
    var cp_target = conn.endpoints[1];
    var elan, other;
    var eline = true;
    if (cp_source.getParameters().isElan) {
	elan = cp_source;
	other = cp_target;
	eline = false;
    } else if (cp_target.getParameters().isElan) {
	elan = cp_target;
	other = cp_source;
	eline = false;
    }
    if (!eline) {
	for ( var i = 0; i < cur_ns.descriptor.virtual_links.length; i++) {
	    if (cur_ns.descriptor.virtual_links[i].id == elan.elementId) {
		cur_ns.descriptor.virtual_links[i].connection_points_reference
			.push(other.getUuid());
		break;
	    }
	}
    } else {
	var virtual_link = {
	    id : cp_source.elementId + "-2-" + cp_target.elementId,
	    connectivity_type : "E-Line",
	    connection_points_reference : conn.getUuids()
	};
	if (!cur_ns.descriptor["virtual_links"]) {
	    cur_ns.descriptor["virtual_links"] = [];
	}
	cur_ns.descriptor["virtual_links"].push(virtual_link);
	if (cp_source.getUuid() != cp_target.getUuid()) {
	    updateForwardingGraphs(cp_source.getUuid(), cp_target.getUuid(),
		    false);
	}
    }
}

// delete a single link from descriptor
function deleteLinkFromDpt(connection) {
    var cur_links = cur_ns.descriptor.virtual_links;
    var cp_source = connection.endpoints[0];
    var cp_target = connection.endpoints[1];
    var elan, other;
    var eline = true;
    if (cp_source.getParameters().isElan) {
	elan = cp_source;
	other = cp_target;
	eline = false;
    } else if (cp_target.getParameters().isElan) {
	elan = cp_target;
	other = cp_source;
	eline = false;
    }
    if (!eline) {
	for ( var i = 0; i < cur_ns.descriptor.virtual_links.length; i++) {
	    if (cur_ns.descriptor.virtual_links[i].id == elan.elementId) {
		var refID = cur_ns.descriptor.virtual_links[i].connection_points_reference
			.indexOf(other.getUuid());
		if (refID > -1) {
		    cur_ns.descriptor.virtual_links[i].connection_points_reference
			    .splice(refID, 1);
		}
		break;
	    }
	}
    } else {
	if (cur_links) {
	    var removed = cur_links
		    .filter(function(el) {
			return !(el.connection_points_reference[0] == cp_source
				.getUuid() && el.connection_points_reference[1] == cp_target
				.getUuid());
		    });
	    cur_ns.descriptor.virtual_links = removed;
	    if (cp_source.getUuid() != cp_target.getUuid()) {
		updateForwardingGraphs(cp_source.getUuid(),
			cp_target.getUuid(), true);
	    }
	}
    }
}

// delete node from descriptor
function deleteNodeFromDpt(id, className) {
    if (className.startsWith("vnf")) {
	var cur_vnfs = cur_ns.descriptor.network_functions;
	var removed = cur_vnfs.filter(function(el) {
	    return el.vnf_id != id;
	});
	cur_ns.descriptor.network_functions = removed;
	if (cur_ns.descriptor.network_functions.length == 0) {
	    delete cur_ns.descriptor.network_functions;
	}
    } else if (className.startsWith("ns")) {
	var cur_nss = cur_ns.descriptor.network_services;
	var removed = cur_nss.filter(function(el) {
	    return el.ns_id != id;
	});
	cur_ns.descriptor.network_services = removed;
	if (cur_ns.descriptor.network_services.length == 0) {
	    delete cur_ns.descriptor.network_services;
	}
    } else if (className.startsWith("cp")) {
	var cur_cp = cur_ns.descriptor.connection_points;
	var removed = cur_cp.filter(function(el) {
	    return el.id != id;
	});
	cur_ns.descriptor.connection_points = removed;
	if (cur_ns.descriptor.connection_points.length == 0) {
	    delete cur_ns.descriptor.connection_points;
	}
    } else if (className.startsWith("e-lan")) {
	for ( var i = 0; i < cur_ns.descriptor.virtual_links.length; i++) {
	    if (cur_ns.descriptor.virtual_links[i].id == id) {
		cur_ns.descriptor.virtual_links.splice(i, 1);
		break;
	    }
	}
    }
    if (cur_ns.meta.positions[id]) {
	delete cur_ns.meta.positions[id];
    }
}

function renameVnfOrNs(oldId, newId, className) {
    var node = {};
    if (className.split("-")[0] == "vnf") {
	for ( var i = 0; i < cur_ns.descriptor.network_functions.length; i++) {
	    var vnf = cur_ns.descriptor.network_functions[i];
	    if (vnf.vnf_id == oldId) {
		cur_ns.descriptor.network_functions[i].vnf_id = newId;
		node = vnf_map[vnf.vnf_vendor + ":" + vnf.vnf_name + ":"
			+ vnf.vnf_version];
		node.id = newId;
		break;
	    }
	}
    } else {
	for ( var i = 0; i < cur_ns.descriptor.network_services.length; i++) {
	    var ns = cur_ns.descriptor.network_services[i];
	    if (ns.ns_id == oldId) {
		cur_ns.descriptor.network_services[i].ns_id = newId;
		node = ns_map[ns.ns_vendor + ":" + ns.ns_name + ":"
			+ ns.ns_version];
		node.id = newId;
		break;
	    }
	}
    }
    var connectionPoints = node.descriptor.connection_points;
    var virtualLinks = [];
    // save connections of this node to virtualLinks
    for ( var i = 0; i < connectionPoints.length; i++) {
	var connectionPoint = connectionPoints[i];
	var labels = connectionPoint.id.split(":");
	var oldCpLabel = oldId + ":" + labels[1];
	var ep = instance.getEndpoint(oldCpLabel);
	var conns = ep.connections;
	for ( var j = 0; j < conns.length; j++) {
	    var obj = conns[j].endpoints;
	    if (obj.length > 0) {
		var src = obj[0].getUuid();
		if (obj[0].elementId == newId) {
		    src = src.replace(oldId, newId);
		}
		var tgt = obj[1].getUuid();
		if (obj[1].elementId == newId) {
		    tgt = tgt.replace(oldId, newId);
		}
		var uuids = [];
		uuids.push(src);
		uuids.push(tgt);
		var virtualLink = {
		    connection_points_reference : uuids,
		};
		virtualLinks.push(virtualLink);
	    }
	}
    }
    // remove all connections and endpoints
    var nodeId = node.id.replace(":", "\\:");
    instance.detachAllConnections($("#" + nodeId));
    instance.removeAllEndpoints($("#" + nodeId));
    // draw connection points and connections again.
    drawVnfOrNs(className.split("-")[0], newId, node.descriptor);
    for ( var j = 0; j < virtualLinks.length; j++) {
	var conn = drawLink(virtualLinks[j]);
	addLinkToDpt(conn);
    }
}

function renameCpOrElan(oldId, newId, className) {
    var node = {};
    var virtualLinks = [];
    if (className.split("-")[0] == "cp") {
	for ( var i = 0; i < cur_ns.descriptor.connection_points.length; i++) {
	    node = cur_ns.descriptor.connection_points[i];
	    if (node.id == oldId) {
		cur_ns.descriptor.connection_points[i].id = newId;
		node.id = newId;
		break;
	    }
	}
    } else {
	for ( var i = 0; i < cur_ns.descriptor.virtual_links.length; i++) {
	    node = cur_ns.descriptor.virtual_links[i];
	    if (node.id == oldId) {
		cur_ns.descriptor.virtual_links[i].id = newId;
		node.id = newId;
		break;
	    }
	}
    }
    var conns = instance.getEndpoint(oldId).connections;
    for ( var j = 0; j < conns.length; j++) {
	var obj = conns[j].endpoints;
	if (obj.length > 0) {
	    var src = obj[0].getUuid();
	    if (obj[0].elementId == newId) {
		src = src.replace(oldId, newId);
	    }
	    var tgt = obj[1].getUuid();
	    if (obj[1].elementId == newId) {
		tgt = tgt.replace(oldId, newId);
	    }
	    var uuids = [];
	    uuids.push(src);
	    uuids.push(tgt);
	    var virtualLink = {
		connection_points_reference : uuids,
	    };
	    virtualLinks.push(virtualLink);
	}
    }
    // remove all connections and endpoints
    var nodeId = node.id.replace(":", "\\:");
    instance.detachAllConnections($("#" + nodeId));
    instance.removeAllEndpoints($("#" + nodeId));
    // draw connection points and connections again.
    if (className.split("-")[0] == "cp") {
	drawCp(newId);
    } else {
	drawElan(newId);
    }
    for ( var j = 0; j < virtualLinks.length; j++) {
	var conn = drawLink(virtualLinks[j]);
	addLinkToDpt(conn);
    }
}

function renameNodeOnServer(oldId, newId, className) {
    // notify jsplumb id is changed
    instance.setIdChanged(oldId, newId);
    if (cur_ns.meta.positions[oldId]) {
	cur_ns.meta.positions[newId] = cur_ns.meta.positions[oldId];
	delete cur_ns.meta.positions[oldId];
    }
    if (className.split("-")[0] == "vnf" || className.split("-")[0] == "ns") {
	renameVnfOrNs(oldId, newId, className);
    } else {
	renameCpOrElan(oldId, newId, className);
    }
    displayDeleteButton(newId);
    updateServiceOnServer();
}

function displayDeleteButton(id) {
    var dataId = id.replace(":", "\\:");
    var node = "#" + dataId;
    $(node).bind("mouseover", function() {
	$(node).children("a").css("display", "inline");
    });
    $(node).bind("mouseout", function() {
	$(node).children("a").css("display", "none");
    });
}

// draw a vnf/ns and its connection points
function drawVnfOrNs(type, id, descriptor) {
    if (type == "vnf") {
	addToVnfList(id);
    }
    var connectionPoints = descriptor['connection_points'];
    if (connectionPoints) {
	var anchors = calcAnchors(connectionPoints.length);
	var i;
	var cpLabels = [];
	for (i = 0; i < connectionPoints.length; i++) {
	    var connectionPoint = connectionPoints[i];
	    var labels = connectionPoint.id.split(":");
	    var cpLabel = id + ":" + labels[1];
	    cpLabels.push(cpLabel);
	    var e = instance.addEndpoint(id, {
		uuid : cpLabel,
		anchor : anchors[i],
		connectorOverlays : [ [ "Arrow", {
		    width : 10,
		    length : 20,
		    location : 0.45,
		    id : "arrow"
		} ] ],
		overlays : [ [ "Label", {
		    cssClass : "endpointLabel",
		    label : cpLabel,
		    id : "lbl",
		    location : calcLabelPos(anchors[i])
		} ] ]
	    }, endPointOptions);
	    e.bind("mouseover", function(ep) {
		ep.showOverlay("lbl");
	    });
	    e.bind("mouseout", function(ep) {
		ep.hideOverlay("lbl");
	    });
	}
	addNodeToMatrix(cpLabels);
    }
}
// draw a connection point
function drawCp(elemID) {
    instance.addEndpoint(elemID, {
	uuid : elemID,
	anchor : [ "Perimeter", {
	    shape : "Circle"
	} ],
	connectorOverlays : [ [ "Arrow", {
	    width : 10,
	    length : 20,
	    location : 0.45,
	    id : "arrow"
	} ] ]
    }, endPointOptions);
}

// draw a elan node and its links
function drawElan(dataId) {
    instance.addEndpoint(dataId, {
	uuid : dataId,
	parameters : {
	    isElan : true
	},
	anchor : [ "Perimeter", {
	    shape : "Circle"
	} ],
	connectorOverlays : [ [ "Arrow", {
	    width : 10,
	    length : 20,
	    location : 0.45,
	    id : "arrow"
	} ] ]
    }, endPointOptions);
}

// draw a node in editor
function drawNode(type, data, x, y) {
    usedIDs.push(data.id);
    viewModel.addToEditor(data);
    var dataId = data.id.replace(":", "\\:");
    var elem = $("#" + dataId);
    elem.removeClass(type);
    elem.addClass(type + "-after-drop");
    elem.css({
	position : 'absolute',
	left : x,
	top : y
    });
    var nameBox = elem.children("input")[0];
    nameBox.style.width = ((nameBox.value.length + 2) * 8) + 'px';
    if (type == "cp") {
	drawCp(data.id);
    } else if (type == "e-lan") {
	drawElan(data.id);
    } else {
	drawVnfOrNs(type, data.id, data.descriptor);
    }
    instance.draggable(data.id, {
	drag : activateDragging,
	stop : savePositionForNode,
    });
    displayDeleteButton(data.id);
    setMousedownForDraggable(elem);
}

function drawLink(virtual_link) {
    var conn = instance.connect({
	uuids : virtual_link["connection_points_reference"]
    });
    if (virtual_link["connection_points_reference"][0] != virtual_link["connection_points_reference"][1]) {
	updateForwardingGraphs(virtual_link["connection_points_reference"][0],
		virtual_link["connection_points_reference"][1], false);
    }
    return conn;
}

function doUpload(id) {
    showWaitAnimation("Uploading");
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
		    "Service " + cur_ns.descriptor.name
			    + " Uploaded successfully!");
	},
	error : function(err) {
	    closeWaitAnimation();
	    console.log(err);
	}
    });
}
function showUploadDialog() {
    $("#uploadDialog").dialog({
	resizable : false,
	height : "auto",
	modal : true,
	buttons : {
	    "Upload" : function(e) {
		var id = $("#selectPlatform").val();
		var button = $(e.target);
		button[0].disabled = true;
		doUpload(id);
		$(this).dialog("close");
	    },
	    "Cancel" : function() {
		$(this).dialog("close");
	    }
	}
    });
}

function loadCatalogues() {
    return $.ajax({
	url : serverURL + "workspaces/" + wsId + "/catalogues/",
	dataType : "json",
	xhrFields : {
	    withCredentials : true
	},
	success : function(data) {
	    catalogues = data;
	}
    });
}

function loadVNFsNSsFromCatalogues() {
    $.when(loadCatalogues()).done(
	    function(r1, r2) {
		for ( var i = 0; i < catalogues.length; i++) {
		    var catalogue = catalogues[i];
		    $.ajax({
			url : serverURL + "workspaces/" + wsId + "/catalogues/"
				+ catalogue.id + "/functions/",
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
		    $.ajax({
			url : serverURL + "workspaces/" + wsId + "/projects/"
				+ +catalogue.id + "/services/",
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

// load platforms for Upload dialog
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
// write connection points infomation for VNF/NS
function loadCpInfos(type, data) {
    if (type == 'vnf') {
	var vnf_data = {};
	vnf_data = vnf_map[data.vnf_vendor + ":" + data.vnf_name + ":"
		+ data.vnf_version];
	vnf_data['id'] = data.vnf_id;
	return vnf_data;
    }
    if (type == 'ns') {
	var ns_data = {};
	ns_data = ns_map[data.ns_vendor + ":" + data.ns_name + ":"
		+ data.ns_version];
	ns_data['id'] = data.ns_id;
	return ns_data;
    }
}
function getGridPosition(index) {
    var $editor = $("#editor");
    var editorWidth = $editor.width();
    var dist = 100;
    var max = editorWidth - editorWidth % dist;
    var min = 25;
    var $x = min + (dist * index) % max;
    var $y = min + dist * Math.floor((index * dist) / max);
    return [ $x, $y ];
}
function clean() {
    for ( var i = 0; i < viewModel.editor_nodes().length; i++) {
	var node = viewModel.editor_nodes()[i];
	instance.detachAllConnections(node.id());
	instance.removeAllEndpoints(node.id());
	instance.remove(node.id());
    }
    viewModel.editor_nodes([]);
}
// display loaded network service in the editor
function displayNS() {
    var index = 0;
    if (cur_ns.descriptor.network_functions != null) {
	for ( var i = 0; i < (cur_ns.descriptor.network_functions).length; i++) {
	    var vnf = cur_ns.descriptor.network_functions[i];
	    if (!cur_ns.meta.positions[vnf.vnf_id]) {
		cur_ns.meta.positions[vnf.vnf_id] = getGridPosition(index);
		index++;
	    }
	    $x = cur_ns.meta.positions[vnf.vnf_id][0];
	    $y = cur_ns.meta.positions[vnf.vnf_id][1];
	    var vnf_data = loadCpInfos('vnf', vnf);
	    drawNode("vnf", vnf_data, $x, $y);
	    countDropped++;
	}
    }
    if (cur_ns.descriptor.network_services != null) {
	for ( var i = 0; i < (cur_ns.descriptor.network_services).length; i++) {
	    var ns = cur_ns.descriptor.network_services[i];
	    if (!cur_ns.meta.positions[ns.ns_id]) {
		cur_ns.meta.positions[ns.ns_id] = getGridPosition(index);
		index++;
	    }
	    $x = cur_ns.meta.positions[ns.ns_id][0];
	    $y = cur_ns.meta.positions[ns.ns_id][1];
	    var ns_data = loadCpInfos('ns', ns);
	    drawNode("ns", ns_data, $x, $y);
	    countDropped++;
	}
    }
    if (cur_ns.descriptor.connection_points != null) {
	for ( var i = 0; i < (cur_ns.descriptor.connection_points).length; i++) {
	    var cp = cur_ns.descriptor.connection_points[i];
	    if (!cur_ns.meta.positions[cp.id]) {
		cur_ns.meta.positions[cp.id] = getGridPosition(index);
		index++;
	    }
	    $x = cur_ns.meta.positions[cp.id][0];
	    $y = cur_ns.meta.positions[cp.id][1];
	    drawNode("cp", cp, $x, $y);
	    countDropped++;
	}
    }
    if (cur_ns.descriptor.virtual_links != null) {
	for ( var i = 0; i < cur_ns.descriptor.virtual_links.length; i++) {
	    var virtual_link = cur_ns.descriptor.virtual_links[i];
	    if (virtual_link.connectivity_type == "E-LAN") {
		var elan = virtual_link;
		if (!cur_ns.meta.positions[elan.id]) {
		    cur_ns.meta.positions[elan.id] = getGridPosition(index);
		    index++;
		}
		$x = cur_ns.meta.positions[elan.id][0];
		$y = cur_ns.meta.positions[elan.id][1];
		drawNode("e-lan", elan, $x, $y);
		var connections = elan.connection_points_reference;
		for ( var j = 0; j < connections.length; j++) {
		    instance.connect({
			'uuids' : [ elan.id, connections[j] ]
		    });
		}
		countDropped++;
	    } else {
		drawLink(virtual_link);
	    }
	}
    }
}

// function to set the editor height dynamically fitting to the browser window
function setSize() {
    windowHeight = $(window).innerHeight()
	    - $('.left-navigation-bar').offset().top;
    windowWidth = $(window).innerWidth();
    minWidth = 255;
    $('.left-navigation-bar').css('height', windowHeight);
    $('.left-navigation-bar').css('min-width', minWidth);
    $('#editor-parent').css('height', windowHeight);
    $('#editor-parent').css('marginLeft', $('.left-navigation-bar').width());
    $('#editor').css('height', windowHeight * 2);
    $('#editor').css('width', windowWidth * 2);
    $('.vnf').css('width', $('.left-navigation-bar').width() - 10);
    $('.ns').css('width', $('.left-navigation-bar').width() - 10);
}
// replace old_class from the source element with new class 'xxx-after-drop'
function reconfigureNode(ui, data, old_class, editor, current_zoom) {
    var newId = old_class + "_" + data.attr('id') + "_" + countDropped;
    if (old_class == "cp") {
	newId = "ns:" + data.attr('id') + "_" + countDropped;
    }
    countDropped++;
    data.attr('id', newId);
    data.removeClass(old_class);
    data.addClass(old_class + '-after-drop');
    data.removeClass('ui-draggable');
    var $newPosX = (ui.offset.left - $(editor).offset().left) / current_zoom;
    var $newPosY = (ui.offset.top - $(editor).offset().top) / current_zoom;
    data.css({
	position : 'absolute',
	left : $newPosX,
	top : $newPosY,
	width : ''
    });
    var evt = {};
    evt.pos = [ $newPosX, $newPosY ];
    evt.selection = [ [ {
	"id" : newId
    } ] ];
    savePositionForNode(evt, true);
}

function dropNewVnfOrNs(type, list, elemId) {
    if (!list) {
	list = [];
    }
    var newEntry = {};
    newEntry[type + "_vendor"] = lastDraggedDescriptor.descriptor.vendor;
    newEntry[type + "_name"] = lastDraggedDescriptor.descriptor.name;
    newEntry[type + "_id"] = elemId;
    newEntry[type + "_version"] = lastDraggedDescriptor.descriptor.version;
    list.push(newEntry);
    if (type == "ns") {
	cur_ns.descriptor.network_services = list;
	var ns_data = loadCpInfos('ns', newEntry);
	$x = cur_ns.meta.positions[ns_data.id][0];
	$y = cur_ns.meta.positions[ns_data.id][1];
	drawNode(type, ns_data, $x, $y);
    } else {
	cur_ns.descriptor.network_functions = list;
	var vnf_data = loadCpInfos('vnf', newEntry);
	$x = cur_ns.meta.positions[vnf_data.id][0];
	$y = cur_ns.meta.positions[vnf_data.id][1];
	drawNode(type, vnf_data, $x, $y);
    }
}

function dropNewCp(elemID) {
    var cp = {
	"id" : elemID,
	"type" : "interface"
    };
    $x = cur_ns.meta.positions[cp.id][0];
    $y = cur_ns.meta.positions[cp.id][1];
    drawNode('cp', cp, $x, $y);
    if (!cur_ns.descriptor.connection_points) {
	cur_ns.descriptor.connection_points = [];
    }
    cur_ns.descriptor.connection_points.push(cp);
}

function dropNewElan(elemID) {
    var elan = {
	"id" : elemID,
	"connectivity_type" : "E-LAN",
	"connection_points_reference" : []
    };
    $x = cur_ns.meta.positions[elan.id][0];
    $y = cur_ns.meta.positions[elan.id][1];
    drawNode("e-lan", elan, $x, $y);
    if (!cur_ns.descriptor.virtual_links) {
	cur_ns.descriptor.virtual_links = [];
    }
    cur_ns.descriptor.virtual_links.push(elan);
}

function animateConnections(conn) {
    var arrow = conn.getOverlay("arrow");
    var src = conn.source.className;
    var tgt = conn.target.className;
    if (!src.startsWith("e-lan") && !tgt.startsWith("e-lan")) {
	var interval = window.setInterval(function() {
	    arrow.loc += 0.05;
	    if (arrow.loc > 1) {
		arrow.loc = 0;
	    }
	    try {
		conn.repaint();
		// writing in try block since when connection is removed we need
		// to
		// terminate the function for that particular connection
	    } catch (e) {
		window.clearInterval(interval);
	    }
	}, 100);
    } else {
	arrow.hide();
    }
}

function savePositionForNode(event, noUpdate) {
    var position = event.pos;
    var node = event.selection[0][0];
    var nodeId = node.id;
    if (position[0] < 0) {
	position[0] = 0;
	$(node).css("left", 20);
	instance.repaintEverything();
    }
    if (position[1] < 0) {
	position[1] = 0;
	$(node).css("top", 20);
	instance.repaintEverything();
    }
    if (!cur_ns.meta.positions[nodeId]) {
	cur_ns.meta.positions[nodeId] = {
	    "x" : 0,
	    "y" : 0
	};
    }
    cur_ns.meta.positions[nodeId] = position;
    for ( var i = 0; i < selectedNodes.length; i++) {
	var dataId = selectedNodes[i].replace(":", "\\:");
	var node = $("#" + dataId);
	var x = node.css("left");
	var y = node.css("top");
	cur_ns.meta.positions[selectedNodes[i]] = [ x, y ];
    }
    dragCount = 0;
    if (!noUpdate && isDragAction) {
	updateServiceOnServer();
    }
}

// helper to check if nodes where dragged or jus clicked
function activateDragging() {
    isDragAction = false;
    dragCount++;
    if (dragCount > 5) {
	isDragAction = true;
    }
}

function configureJsPlumb() {
    instance = jsPlumb.getInstance(jsPlumbOptions);
    $("#editor").droppable(
	    {
		accept : " .vnf , .ns , .cp , .e-lan ",
		drop : function(event, ui) {
		    var data = ui.draggable.clone();
		    if (data.hasClass('vnf')) {
			reconfigureNode(ui, data, "vnf", this, current_zoom);
			dropNewVnfOrNs("vnf",
				cur_ns.descriptor.network_functions, data
					.attr('id'));
			updateServiceOnServer();
		    }
		    if (data.hasClass('ns')) {
			reconfigureNode(ui, data, "ns", this, current_zoom);
			dropNewVnfOrNs("ns",
				cur_ns.descriptor.network_services, data
					.attr('id'));
			updateServiceOnServer();
		    }
		    if (data.hasClass('cp')) {
			reconfigureNode(ui, data, 'cp', this, current_zoom);
			dropNewCp(data.attr('id'), true);
			updateServiceOnServer();
		    }
		    if (data.hasClass('e-lan')) {
			reconfigureNode(ui, data, "e-lan", this, current_zoom);
			dropNewElan(data.attr('id'), true);
			updateServiceOnServer();
		    }
		    instance.draggable(data.attr('id'), {
			start : function(eStart) {
			    $("#editor").panzoom("disable");
			},
			drag : activateDragging,
			stop : savePositionForNode,
			containment : "parent"
		    });
		    displayDeleteButton(data.attr('id'));
		}
	    });
    // suspend drawing and initialise.
    // bind to connection/connectionDetached events, and update the list of
    // connections on screen.
    instance
	    .bind(
		    "connection",
		    function(info, originalEvent) {
			new animateConnections(info.connection);
			if (originalEvent) {
			    var cp_source = info.connection.endpoints[0];
			    var cp_target = info.connection.endpoints[1];
			    var errorMsg = "";
			    var hasError = false;
			    if (cp_source.getParameters().isElan
				    && cp_target.getParameters().isElan) {
				errorMsg = "Connecting two E-LAN nodes is not allowed! Please confirm to delete it.";
				hasError = true;
			    }
			    if (cp_source.getUuid() == cp_target.getUuid()) {
				errorMsg = "Circle connection is not allowed!";
				hasError = true;
				instance.detach(info.connection);
			    } else if (cp_source.elementId == cp_target.elementId) {
				errorMsg = "Connection inside a node is not allowed!";
				hasError = true;
				instance.detach(info.connection);
			    }
			    if (hasError) {
				$("#deleteDialog").dialog({
				    modal : true,
				    buttons : {
					Confirm : function() {
					    $(this).dialog("close");
					},
				    }
				}).text(errorMsg);
			    } else {
				addLinkToDpt(info.connection);
				updateServiceOnServer();
			    }
			}
		    });

    instance.bind("connectionDetached", function(info, originalEvent) {
	deleteLinkFromDpt(info.connection);
    });
    instance.bind("dblclick", function(connection, originalEvent) {
	$("#deleteDialog").dialog({
	    modal : true,
	    buttons : {
		Delete : function() {
		    instance.detach(connection);
		    updateServiceOnServer();
		    $(this).dialog("close");
		},
		Cancel : function() {
		    $(this).dialog("close");
		}
	    }
	}).text("Do you want to delete this connection?");
    });
    jsPlumb.fire("jsPlumbDemoLoaded", instance);
}
// load the current NS from the server
function loadCurrentNS() {
    $
	    .ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId
			+ "/services/" + nsId,
		dataType : "json",
		xhrFields : {
		    withCredentials : true
		},
		success : function(data) {
		    document.getElementById("nav_ns").text = "NS: "
			    + data.descriptor.name;
		    if (!data.meta.positions) {
			data.meta.positions = {};
		    }
		    if (!data.meta.counter) {
			data.meta.counter = 0;
			if (data.descriptor.network_functions) {
			    data.meta.counter += data.descriptor.network_functions.length;
			}
			if (data.descriptor.network_services) {
			    data.meta.counter += data.descriptor.network_services.length;
			}
			if (data.descriptor.connection_points) {
			    data.meta.counter += data.descriptor.connection_points.length;
			}
		    }
		    if (!data.meta.adjacency_matrix) {
			data.meta.adjacency_matrix = {};
		    }
		    countDropped = data.meta.counter;
		    cur_ns = data;
		    displayNS();
		    computeForwardingPaths();
		    updateServiceOnServer();
		},
	    });
}
$(document).ready(function() {
    queryString = getQueryString();
    wsId = queryString["wsId"];
    ptId = queryString["ptId"];
    nsId = queryString["nsId"];
    setWorkspaceInNav(wsId);
    setProjectInNav(wsId, ptId);
    loadPlatforms();
    setSize();
    $(window).resize(function() {
	setSize();
    });
    $(".cp").draggable({
	helper : "clone",
	revert : "invalid",
    });
    $(".e-lan").draggable({
	helper : "clone",
	revert : "invalid",
    });
    // delay loading the current network service until the sidebar has
    // loaded
    // completely
    // , loadVNFsNSsFromCatalogues()
    $.when(loadAllVNFs(), loadAllNSs()).done(function(r1, r2) {
	loadCurrentNS();
    });
    ko.applyBindings(viewModel);
    jsPlumb.ready(function() {
	configureJsPlumb();
    });
});
