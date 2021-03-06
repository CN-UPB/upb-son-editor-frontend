/**
 * This is the main class of the network service editor.
 * It loads the current network service, available VNFs and NSs from the current project
 * and user defined catalogues from the back-end server.
 * It implements the drag & drop, connect functionalities by using the jsPlumb.js library.
 * It uses the knockout.js library to bind each node in editor(DOM element) with view model data
 * such that functionalities like rename, deletion can be done.
 * It is used in nsView.html.
 */
/**
 * stores a list of available VNFs from the current project and user defined catalogues.
 */
var vnfs = [];
/**
 * stores a list of available NSs from the current project and user defined catalogues.
 */
var nss = [];
/**
 * stores a map of VNF descriptors in form of <vnf.vendor:vnf.name:vnf.version, vnf descriptor>
 */
var vnf_map = {};
/**
 * stores a map of NS descriptors in form of <ns.vendor:ns.name:ns.version, ns descriptor>
 */
var ns_map = {};

var queryString = {};
/**
 * stores id of the current workspace
 */
var wsId = "";
/**
 * stores id of the current project
 */
var ptId = "";
/**
 * stores id of the current network service
 */
var nsId = "";
/**
 * stores the current network service descriptor
 */
var cur_ns = {};
/**
 * an instance of jsPlumb
 */
var instance = {};
/**
 * stores the last dragged descriptor
 */
var lastDraggedDescriptor = {};
/**
 * a counter for dropped node
 */
var countDropped = 0;
/**
 * color for jsPlumb endpoints
 */
var color = "#d39963";
var interval = null;
/**
 * indicates if the mouse movement is a drag action
 */
var isDragAction = false;
/**
 * a counter for testing if a node is draged or clicked
 */
var dragCount = 0;
/**
 * stores used names for nodes in the current network service.
 */
var usedIDs = [];
/**
 * stores the name of node classes, which are not allowed to use as the name of a node
 */
var classNames = [ "CP", "cp", "e-lan" ];
/**
 * stores list of the available catalogues of the current workspace
 */
var catalogues = [];
/**
 * stores list of not found VNFs used in the current network service
 */
var notFoundVNFs = [];
/**
 * stores list of not found NSs used in the current network service
 */
var notFoundNSs = [];
/**
 * jsPlumb connection point style of each node
 */
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
/**
 * jsPlumb style configuration
 */
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

/**
 * data binding class for a node in editor
 */
var Node = function(node_data) {
	var self = this;
	self.old_id = ko.observable(node_data.id);
	self.id = ko.observable(node_data.id);
	if (node_data.uid){
		self.uid = ko.observable(node_data.uid);
	}
};

/**
 * data binding class for available catalogues
 */
var Catalogue = function(catalogue) {
	this.name = ko.observable(catalogue.name);
	this.url = ko.observable(catalogue.url);
	this.vnfs = ko.observableArray([]);
	this.nss = ko.observableArray([]);
};

/**
 * data bind class for the network service
 * add dragged VNF/NS descriptors to the vnf_map/ns_map
 * rename a node
 */
var ViewModel = function() {
	this.catalogue_map = {};
	this.catalogues = ko.observableArray([]);
	this.vnfs = ko.observableArray([]);
	this.addVnf = function(vnf) {
		var uid = vnf.descriptor.vendor + ":" + vnf.descriptor.name + ":"
				+ vnf.descriptor.version;
		if (!vnf_map[uid] || !vnf.fromCat) {
			if (vnf.fromCat) {
				if (!this.catalogue_map[vnf.fromCat.name]) {
					var cat = new Catalogue(vnf.fromCat);
					this.catalogue_map[vnf.fromCat.name] = cat;
					this.catalogues.push(cat);
				}
				this.catalogue_map[vnf.fromCat.name].vnfs.push(vnf);
			} else {
				this.vnfs.push(vnf);
			}
			vnf_map[uid] = vnf;
			classNames.push(vnf.descriptor.name);
		}
	}.bind(this);
	this.nss = ko.observableArray([]);
	this.addNs = function(ns) {
		var uid = ns.descriptor.vendor + ":" + ns.descriptor.name + ":"
				+ ns.descriptor.version;
		if (!ns_map[uid] || !ns.fromCat) {
			if (ns.fromCat) {
				if (!this.catalogue_map[ns.fromCat.name]) {
					var cat = new Catalogue(ns.fromCat);
					this.catalogue_map[ns.fromCat.name] = cat;
					this.catalogues.push(cat);
				}
				this.catalogue_map[ns.fromCat.name].nss.push(ns);
			} else {
				this.nss.push(ns);
			}
			ns_map[uid] = ns;
			classNames.push(ns.descriptor.name);
		}
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

/**
 * It calculates anchors of connection points of a node.
 * @param anchorCount
 * @returns {Array}
 */
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

/**
 * It calculates label position of connection points of a node
 * @param anchor
 * @returns {Array}
 */
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

/**
 * It writes vnf and serice dependencies of the current network service to its descriptor.
 */
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
		cur_ns.descriptor["vnf_depedency"] = vnf_deps;
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
		cur_ns.descriptor["services_depedency"] = ns_deps;
	}
}

/**
 * It updates the current network service on the back-end server.
 * @param action
 */
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

/**
 *  It adds new virtual link to the current network service descriptor.
 */
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

/** It deletes a single link from  the current network service descriptor.
 *
 * @param connection
 */
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

/** It deletes a node from the current network service descriptor.
 *
 * @param id
 * @param className
 */
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

/**
 * It renames a VNF or NS in the current network service descriptor.
 * @param oldId
 * @param newId
 * @param className
 */
function renameVnfOrNs(oldId, newId, className) {
	var node = {};
	if (className.split("-")[0] == "vnf") {
		for ( var i = 0; i < cur_ns.descriptor.network_functions.length; i++) {
			var vnf = cur_ns.descriptor.network_functions[i];
			if (vnf.vnf_id == oldId) {
				cur_ns.descriptor.network_functions[i].vnf_id = newId;
				node =  jQuery.extend({}, vnf_map[vnf.vnf_vendor + ":" + vnf.vnf_name + ":"
						+ vnf.vnf_version]);
				node.id = newId;
				break;
			}
		}
	} else {
		for ( var i = 0; i < cur_ns.descriptor.network_services.length; i++) {
			var ns = cur_ns.descriptor.network_services[i];
			if (ns.ns_id == oldId) {
				cur_ns.descriptor.network_services[i].ns_id = newId;
				node = jQuery.extend({},ns_map[ns.ns_vendor + ":" + ns.ns_name + ":"
						+ ns.ns_version]);
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

/**
 * It renames a connection point or ELAN node in the current network service descriptor.
 * @param oldId
 * @param newId
 * @param className
 */
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

/**
 * It updates the descriptor after renaming on the back-end server.
 * @param oldId
 * @param newId
 * @param className
 */
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
	updateServiceOnServer();
}

/** It draws a VNF/NS node and its connection points in editor.
 *
 * @param type
 * @param id
 * @param descriptor
 */
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
/** It draws a connection point in editor.
 *
 * @param elemID
 */
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

/** It draws a ELAN node and its links in editor.
 *
 * @param dataId
 */
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

/** It draws a node in editor
 *
 * @param type
 * @param data
 * @param rawData
 * @param x
 * @param y
 */
function drawNode(type, data, rawData, x, y) {
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
	var nodeInfo;
	if (type == "cp") {
		drawCp(data.id);
		nodeInfo = "CP";
	} else if (type == "e-lan") {
		drawElan(data.id);
		nodeInfo = "E-LAN";
	} else {
		if (type == "vnf") {
			nodeInfo = "VNF: " + rawData.vnf_vendor + ":" + rawData.vnf_name
					+ ":" + rawData.vnf_version;
		} else {
			nodeInfo = "NS: " + rawData.ns_vendor + ":" + rawData.ns_name + ":"
					+ rawData.ns_version;
		}
		drawVnfOrNs(type, data.id, data.descriptor);
	}
	elem.attr("title", nodeInfo);
	elem.tooltip({
		position : {
			my : "center top-40px",
			at : "center top"
		},
		show : {
			effect : "slideDown",
			duration : 100
		}
	});
	elem.mousedown(function() {
		elem.tooltip("disable");
	});
	elem.mouseup(function() {
		elem.tooltip("enable");
	});
	instance.draggable(data.id, {
		drag : activateDragging,
		stop : savePositionForNode,
	});
	setMousedownForDraggable(elem);
}

/**
 * It draws a link in editor.
 * @param virtual_link
 * @returns
 */
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

/**
 * It upload the current network service descriptor to a platform
 * @param id
 */
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

/**
 * It shows the upload to platform dialog.
 */
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

/**
 * It loads the available catalogues from the back-end server.
 * @returns
 */
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

/**
 * It loads VNFs and NSs from the catalogues for the left side bar.
 * @returns {Array}
 */
function loadVNFsNSsFromCatalogues() {
	var ajaxCalls = [];
	for (var i = 0; i < catalogues.length; i++) {
		var catalogue = catalogues[i];
		ajaxCalls.push(
			$.ajax({
				url: serverURL + "workspaces/" + wsId + "/catalogues/"
				+ catalogue.id + "/functions/",
				dataType: "json",
				xhrFields: {
					withCredentials: true
				},
				success: function (data) {
					c_vnfs = data;
					for (var i = 0; i < c_vnfs.length; i++) {
						c_vnfs[i].fromCat = catalogue;
						viewModel.addVnf(c_vnfs[i]);
					}
					$(".vnf-accordion").accordion({
						collapsible: true
					});
				}
			})
		);
		ajaxCalls.push(
			$.ajax({
				url: serverURL + "workspaces/" + wsId + "/catalogues/"
				+ +catalogue.id + "/services/",
				dataType: "json",
				xhrFields: {
					withCredentials: true
				},
				success: function (data) {
					c_nss = data;
					for (var i = 0; i < c_nss.length; i++) {
						if (c_nss[i].id != nsId) {
							c_nss[i].fromCat = catalogue;
							viewModel.addNs(c_nss[i]);
						}
					}
					$(".ns-accordion").accordion();
					$(".ns").draggable({
						helper: "clone",
						revert: "invalid"
					});
				}
			})
		);
	}
	return ajaxCalls;
}

/** It loads VNFs of the current project for the left side bar.
 *
 * @returns
 */
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
/** It loads NSs of the current project for the left side bar.
 *
 */
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

/** It loads the platforms for Upload dialog
 *
 */
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
/**
 * It writes connection points infomation for VNF/NS
 */
function loadCpInfos(type, data) {
	if (type == 'vnf') {
		var vnf_data = jQuery.extend({}, vnf_map[data.vnf_vendor + ":" + data.vnf_name + ":"
				+ data.vnf_version]);
		if (!$.isEmptyObject(vnf_data)) {
			vnf_data['id'] = data.vnf_id;
		} else {
			notFoundVNFs.push(data.vnf_vendor + ":" + data.vnf_name + ":"
					+ data.vnf_version);
			return null;
		}
		return vnf_data;
	}
	if (type == 'ns') {
		var ns_data = jQuery.extend({}, ns_map[data.ns_vendor + ":" + data.ns_name + ":"
				+ data.ns_version]);
		if (!$.isEmptyObject(ns_data)) {
			ns_data['id'] = data.ns_id;
		} else {
			notFoundNSs.push(data.ns_vendor + ":" + data.ns_name + ":"
					+ data.ns_version);
			return null;
		}
		return ns_data;
	}
}

/**
 * It computes a grid layout for nodes
 * @param index
 * @returns {Array}
 */
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

/**
 * It cleans the editor by deleting all items.
 */
function clean() {
	for ( var i = 0; i < viewModel.editor_nodes().length; i++) {
		var node = viewModel.editor_nodes()[i];
		instance.detachAllConnections(node.id());
		instance.removeAllEndpoints(node.id());
		instance.remove(node.id());
	}
	viewModel.editor_nodes([]);
}

/**
 * It outputs error msgs for not founded VNF/NS.
 */
function outputNotFoundInfo() {
	var error = "";
	var notFound = false;
	if (notFoundVNFs.length > 0) {
		notFound = true;
		if (notFoundVNFs.length == 1) {
			error += "The following refenrenced function is not found:\n";
		} else {
			error += "The following refenrenced functions are not found:\n";
		}
		for ( var i = 0; i < notFoundVNFs.length; i++) {
			error += "\t" + notFoundVNFs[i];
			error += "\n";
		}
	}
	if (notFoundNSs.length > 0) {
		notFound = true;
		if (notFoundNSs.length == 1) {
			error += "The following refenrenced service is not found:\n";
		} else {
			error += "The following refenrenced services are not found:\n";
		}
		for ( var i = 0; i < notFoundNSs.length; i++) {
			error += "\t" + notFoundNSs[i];
			error += "\n";
		}

	}
	if (notFound) {
		error += "Please add the referenced function/service into your project!";
		$("#errorDialog").dialog({
			modal : true,
			width : 450,
			buttons : {
				Confirm : function() {
					$("#errorDialog").dialog("close");
				}
			}
		}).text(error);
	}
	notFoundVNFs = [];
	notFoundNSs = [];
}
/** It displays the current network service in the editor.
 *
 */
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
			if (vnf_data) {
				drawNode("vnf", vnf_data, vnf, $x, $y);
				countDropped++;
			}
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
			if (ns_data) {
				drawNode("ns", ns_data, ns, $x, $y);
				countDropped++;
			}
		}
	}
	outputNotFoundInfo();
	if (cur_ns.descriptor.connection_points != null) {
		for ( var i = 0; i < (cur_ns.descriptor.connection_points).length; i++) {
			var cp = cur_ns.descriptor.connection_points[i];
			if (!cur_ns.meta.positions[cp.id]) {
				cur_ns.meta.positions[cp.id] = getGridPosition(index);
				index++;
			}
			$x = cur_ns.meta.positions[cp.id][0];
			$y = cur_ns.meta.positions[cp.id][1];
			drawNode("cp", cp, cp, $x, $y);
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
				drawNode("e-lan", elan, elan, $x, $y);
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

/** It sets the editor height dynamically fitting to the browser window.
 *
 */
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
/** It replaces old_class from the source element with new class 'xxx-after-drop'
 *
 * @param ui
 * @param data
 * @param old_class
 * @param editor
 * @param current_zoom
 */
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

/**
 * It sets configuration before drawing a droped VNF/NS.
 * @param type
 * @param list
 * @param elemId
 */
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
		drawNode(type, ns_data, newEntry, $x, $y);
	} else {
		cur_ns.descriptor.network_functions = list;
		var vnf_data = loadCpInfos('vnf', newEntry);
		$x = cur_ns.meta.positions[vnf_data.id][0];
		$y = cur_ns.meta.positions[vnf_data.id][1];
		drawNode(type, vnf_data, newEntry, $x, $y);
	}
}

/**
 * It sets configuration before drawing a dropped connection point.
 * @param elemID
 */
function dropNewCp(elemID) {
	var cp = {
		"id" : elemID,
		"type" : "interface"
	};
	$x = cur_ns.meta.positions[cp.id][0];
	$y = cur_ns.meta.positions[cp.id][1];
	drawNode('cp', cp, cp, $x, $y);
	if (!cur_ns.descriptor.connection_points) {
		cur_ns.descriptor.connection_points = [];
	}
	cur_ns.descriptor.connection_points.push(cp);
}

/**
 * It sets configuration before drawing a droppend ELAN node.
 * @param elemID
 */
function dropNewElan(elemID) {
	var elan = {
		"id" : elemID,
		"connectivity_type" : "E-LAN",
		"connection_points_reference" : []
	};
	$x = cur_ns.meta.positions[elan.id][0];
	$y = cur_ns.meta.positions[elan.id][1];
	drawNode("e-lan", elan, elan, $x, $y);
	if (!cur_ns.descriptor.virtual_links) {
		cur_ns.descriptor.virtual_links = [];
	}
	cur_ns.descriptor.virtual_links.push(elan);
}

/**
 * It animates the E-LINE connections.
 * @param conn
 * @returns
 */
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
/**
 * It saves the current position of each node to descriptor.
 * @param event
 * @param noUpdate
 */
function savePositionForNode(event, noUpdate) {
	var position = event.pos;
	var node = event.selection[0][0];
	var nodeId = node.id;
	var repaint = false;
	if (position[0] < 0) {
		position[0] = 20;
		$(node).css("left", position[0]);
		repaint = true;
	}
	if (position[1] < 0) {
		position[1] = 20;
		$(node).css("top", position[1]);
		repaint = true;
	}
	if (!cur_ns.meta.positions[nodeId]) {
		cur_ns.meta.positions[nodeId] = {
			"x" : 20,
			"y" : 20
		};
	}
	cur_ns.meta.positions[nodeId] = position;
	for ( var i = 0; i < selectedNodes.length; i++) {
		var dataId = selectedNodes[i].replace(":", "\\:");
		var selectedNode = $("#" + dataId);
		var x = selectedNode.position().left;
		var y = selectedNode.position().top;
		if (x < 0) {
			x = 20 + i * 10;
			selectedNode.css("left", x);
			repaint = true;
		}
		if (y < 0) {
			y = 20 + i * 10;
			selectedNode.css("top", y);
			repaint = true;
		}
		cur_ns.meta.positions[selectedNodes[i]] = [ x, y ];
	}
	if (repaint) {
		instance.repaintEverything();
	}
	dragCount = 0;
	if (!noUpdate && isDragAction) {
		updateServiceOnServer();
	}
}

/** It is the helper to check if nodes where dragged or jus clicked.
 *
 */
function activateDragging() {
	isDragAction = false;
	dragCount++;
	if (dragCount > 5) {
		isDragAction = true;
	}
}

/**
 *  It configures the jsPlumb instance.
 */
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
/** It loads the current network service from the back-end server.
 *
 */
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
	// loaded completely
	$.when(loadAllVNFs(), loadAllNSs(), loadCatalogues()).done(function() {
		$.when(loadVNFsNSsFromCatalogues()).done(function() {
			loadCurrentNS();
		});
	});
	ko.applyBindings(viewModel);
	jsPlumb.ready(function() {
		configureJsPlumb();
	});
});
