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
var interval = null ;
var endPointOptions = {
    endpoint: "Dot",
    paintStyle: {
        fillStyle: color
    },
    isSource: true,
    detachable: true,
    reattach: true,
    scope: "blue",
    connectorStyle: {
        strokeStyle: color,
        lineWidth: 3
    },
    connector: ["Flowchart"],
    connectorHoverPaintStyle: {
        strokeStyle: "#d36a63"
    },
    isTarget: true,
    anchor: ["Perimeter", {
        shape: "Square"
    }],
    beforeDrop: function(info) {
        return true;
    },
    maxConnections: -1,
    dragOptions: {},
    dropOptions: {
        tolerance: "touch",
        hoverClass: "dropHover",
        activeClass: "dragActive"
    }
};
var jsPlumbOptions = {
    DragOptions: {
        cursor: 'pointer',
        zIndex: "2000"
    },
    PaintStyle: {
        strokeStyle: '#666'
    },
    EndpointHoverStyle: {
        fillStyle: "#d36a63",
    },
    HoverPaintStyle: {
        strokeStyle: "#d36a63"
    },
    connectorHoverPaintStyle: {
        strokeStyle: "#d36a63",
        outlineColor: "yellow",
        outlineWidth: "5px"
    },
    EndpointStyle: {
        width: "5px",
        height: "5px",
        strokeStyle: '#666'
    },
    Endpoint: "Dot",
    Container: "editor"
};
var Node = function(node_data) {
    var self = this;
    self.old_id = ko.observable(node_data.id);
    self.id = ko.observable(node_data.id);
    self.deleteNode = function() {
        var node = "#" + self.id();
        var deleteThisNode = confirm("Do you want to delete this node?");
        if (deleteThisNode === true) {
            instance.detachAllConnections($(node));
            instance.removeAllEndpoints($(node));
            deleteNodeOnServer(self.id(), $(node).attr("class"));
            viewModel.editor_nodes.remove(self);
        }
    }
    ;
};
var ViewModel = function() {
    this.vnfs = ko.observableArray([]);
    this.addVnf = function(vnf) {
        this.vnfs.push(vnf);
        vnf_map[vnf.descriptor.vendor + ":" + vnf.descriptor.name + ":" + vnf.descriptor.version] = vnf;
    }
    .bind(this);
    this.nss = ko.observableArray([]);
    this.addNs = function(ns) {
        this.nss.push(ns);
        ns_map[ns.vendor + ":" + ns.name + ":" + ns.version] = ns;
    }
    .bind(this);
    this.editor_nodes = ko.observableArray([]);
    var self = this;
    this.addToEditor = function(node_data) {
        self.editor_nodes.push(new Node(node_data));
    }
    ;
    this.platforms = ko.observableArray([]);
    self.setPlatforms = function(platforms) {
        ko.utils.arrayPushAll(self.platforms, platforms);
    }
    ;
    self.rename = function() {
        var node = $("#" + this.id());
        var oldID = this.old_id();
        var newID = this.id();
        if (oldID != newID) {
            renameNodeOnServer(oldID, newID, node.attr("class"));
            this.old_id(newID);
        }
    }
    ;
};
var viewModel = new ViewModel();
(function() {
    ko.bindingHandlers.drag = {
        init: function(element, valueAccessor, allBindingsAccessor, ViewModel) {
            var dragElement = $(element);
            var dragOptions = {
                helper: 'clone',
                revert: false,
                revertDuration: 0,
                start: function() {
                    lastDraggedDescriptor = ko.utils.unwrapObservable(valueAccessor().value);
                },
                cursor: 'default',
            };
            dragElement.draggable(dragOptions);
        }
    };
})();
function calcAnchors(anchorCount) {
    var r = 0.5
      , step = Math.PI * 2 / anchorCount
      , current = 0
      , a = [];
    for (var i = 0; i < anchorCount; i++) {
        var x = r + (r * Math.sin(current))
          , y = r + (r * Math.cos(current));
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
        a.push([x, y, 0, 0]);
        current += step;
    }
    return a;
}
function calcLabelPos(anchor) {
    var labelX = anchor[0]
      , labelY = anchor[1];
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
    return [labelX, labelY];
}
function drawVnfOrNs(id, descriptor) {
    var connectionPoints = descriptor['connection_points'];
    if (connectionPoints) {
        anchors = calcAnchors(connectionPoints.length);
        var i;
        for (i = 0; i < connectionPoints.length; i++) {
            var connectionPoint = connectionPoints[i];
            e = instance.addEndpoint(id, {
                uuid: id + ":" + connectionPoint.id,
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
            }, endPointOptions);
            e.bind("mouseover", function(ep) {
                ep.showOverlay("lbl");
            });
            e.bind("mouseout", function(ep) {
                ep.hideOverlay("lbl");
            });
        }
    }
}
function updateService() {
    cur_ns.meta.counter = countDropped;
    $.ajax({
        url: serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/" + nsId,
        method: 'PUT',
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify(cur_ns),
        success: function(data) {
            console.log("service " + nsId + " updated..!!");
        },
        error: function(err) {
            console.log(err);
        }
    });
}
// delete all links related to a node
function updateRelatedLinks(oldId, newID) {
    var cur_links = cur_ns.descriptor.virtual_links;
    if (cur_links) {
        for (var i = 0; i < cur_links.length; i++) {
            for (var j = 0; j < cur_links[i].connection_points_reference.length; j++) {
                if (cur_links[i].connection_points_reference[j].startsWith(oldId + ":")) {
                    var link = cur_links[i];
                    var newRef = link.connection_points_reference[j].replace(oldId, newID);
                    // TODO change uuids of endpoints
                    // var connections = instance.getConnections("*",
                    // {target:oldId, source: oldId});
                    // for (var k=0; k<connections.length; k++){
                    // var uuids = connections[k].getUuids();
                    // if (uuids[0].startsWith(oldId + ":")){
                    // instance.detach(uuids);
                    // uuids[0] = newRef;
                    // instance.connect({uuids: uuids});
                    // } else if (uuids[1].startsWith(oldId + ":")){
                    // instance.detach(uuids);
                    // uuids[1] = newRef;
                    // instance.connect({uuids: uuids});
                    // }
                    // }
                    cur_links[i].connection_points_reference[j] = newRef;
                }
            }
        }
    }
}
// delete all links related to a node
function deleteRelatedLinks(objectId) {
    var cur_links = cur_ns.descriptor.virtual_links;
    if (cur_links) {
        var removed = cur_links.filter(function(el) {
            return el.id.search(objectId) == -1;
        });
        cur_ns.descriptor.virtual_links = removed;
    }
}
// delete a single link
function deleteLink(uuids) {
    var cur_links = cur_ns.descriptor.virtual_links;
    var removed = cur_links.filter(function(el) {
        return !(el.connection_points_reference[0] == uuids[0] && el.connection_points_reference[1] == uuids[1]);
    });
    cur_ns.descriptor.virtual_links = removed;
    updateService(cur_ns);
}
function deleteNodeOnServer(id, className) {
    if (className.split("-")[0] == "vnf") {
        var cur_vnfs = cur_ns.descriptor.network_functions;
        var removed = cur_vnfs.filter(function(el) {
            return el.vnf_id != id;
        });
        cur_ns.descriptor.network_functions = removed;
        deleteRelatedLinks(id);
    }
    if (className.split("-")[0] == "ns") {
        var cur_nss = cur_ns.descriptor.network_services;
        var removed = cur_nss.filter(function(el) {
            return el.ns_id != id;
        });
        cur_ns.descriptor.network_services = removed;
        deleteRelatedLinks(id);
    }
    if (className.split("-")[0] == "cp") {
        var cur_cp = cur_ns.descriptor.connection_points;
        var removed = cur_cp.filter(function(el) {
            return el.id != id;
        });
        cur_ns.descriptor.connection_points = removed;
        deleteRelatedLinks(id);
    }
    if (className.split("-")[0] == "e") {
        var cur_elan = cur_ns.descriptor.elans;
        var removed = cur_elan.filter(function(el) {
            return el.id != id;
        });
        cur_ns.descriptor.elans = removed;
        deleteRelatedLinks(id);
    }
    if (cur_ns.meta.positions[id]) {
        delete cur_ns.meta.positions[id];
    }
    updateService();
}
function renameNodeOnServer(oldId, newID, className) {
    if (className.split("-")[0] == "vnf") {
        var cur_vnfs = cur_ns.descriptor.network_functions;
        for (var i = 0; i < cur_vnfs.length; i++) {
            if (cur_vnfs[i].vnf_id === oldId) {
                cur_vnfs[i].vnf_id = newID;
                break;
            }
        }
        updateRelatedLinks(oldId, newID);
    }
    if (className.split("-")[0] == "ns") {
        var cur_nss = cur_ns.descriptor.network_services;
        for (var i = 0; i < cur_nss.length; i++) {
            if (cur_nss[i].ns_id == oldId) {
                cur_nss[i].ns_id = newID;
                break;
            }
        }
        updateRelatedLinks(oldId, newID);
    }
    if (className.split("-")[0] == "cp") {
        var cur_cp = cur_ns.descriptor.connection_points;
        for (var i = 0; i < cur_cp.length; i++) {
            if (cur_cp[i].id == oldId) {
                cur_cp[i].id = newID;
                break;
            }
        }
        updateRelatedLinks(oldId, newID);
    }
    if (className.split("-")[0] == "e") {
        var cur_elan = cur_ns.descriptor.elans;
        for (var i = 0; i < cur_elan.length; i++) {
            if (cur_elan[i].id == oldId) {
                cur_elan[i].id = newID;
                break;
            }
        }
        updateRelatedLinks(oldId, newID);
    }
    if (cur_ns.meta.positions[oldId]) {
        cur_ns.meta.positions[newID] = cur_ns.meta.positions[oldId];
        delete cur_ns.meta.positions[oldId];
    }
    updateService();
}
// add a node of a network service to editor using ko
function addNode(type, data, x, y) {
    viewModel.addToEditor(data);
    var elem = $("#" + data.id);
    elem.removeClass(type);
    elem.addClass(type + "-after-drop");
    elem.css({
        position: 'absolute',
        left: x,
        top: y
    });
    if (type == "cp") {
        drawConnectionPoint(data.id);
    } else if (type == "e-lan") {
        drawElan(data.id);
    } else {
        drawVnfOrNs(data.id, data.descriptor);
    }
    instance.draggable(data.id, {
        stop: savePositionForNode
    });
    var node = "#" + data.id;
    $(node).bind("mouseover", function() {
        $(node).children("a").css("display", "inline");
    });
    $(node).bind("mouseout", function() {
        $(node).children("a").css("display", "none");
    });
}
function doDeploy(id) {
    showWaitAnimation("Deploying...");
    $.ajax({
        url: serverURL + "workspaces/" + queryString["wsId"] + "/platforms/" + id + "/services/",
        method: 'POST',
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        data: JSON.stringify({
            "id": cur_ns.id
        }),
        success: function(data) {
            closeWaitAnimation();
            $("#success").dialog({
                buttons: {
                    "OK": function() {
                        $(this).dialog("close");
                    }
                }
            });
            $("#success").text("Service " + cur_ns.name + " deployed successfully!");
        },
        error: function(err) {
            closeWaitAnimation();
            console.log(err);
        }
    });
}
function showDeployDialog() {
    $("#deployDialog").dialog({
        resizable: false,
        height: "auto",
        modal: true,
        buttons: {
            "Deploy": function(e) {
                var id = $("#selectPlatform").val();
                var button = $(e.target);
                button[0].disabled = true;
                doDeploy(id);
                $(this).dialog("close");
            },
            "Cancel": function() {
                $(this).dialog("close");
            }
        }
    });
}
// load VNFs for the sidebar
function loadAllVNFs() {
    return $.ajax({
        url: serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/functions/",
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            vnfs = data;
            for (var i = 0; i < vnfs.length; i++) {
                viewModel.addVnf(vnfs[i]);
            }
        }
    });
}
// load network services for the sidebar
function loadAllNSs() {
    return $.ajax({
        url: serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/services/",
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            nss = data;
            for (var i = 0; i < nss.length; i++) {
                if (nss[i].id != nsId) {
                    viewModel.addNs(nss[i]);
                }
            }
            $(".ns").draggable({
                helper: "clone",
                revert: "invalid"
            });
        }
    });
}
// ajax calls for navigation bar to fetch workspace name, project name, and
// network service name
function setNaviBar() {
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
}
// load platforms for deploy dialog
function loadPlatforms() {
    $.ajax({
        url: serverURL + "workspaces/" + wsId + "/platforms/",
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function(platforms) {
            viewModel.setPlatforms(platforms);
        }
    });
}
// write data for viewModel
function rewriteData(type, data) {
    if (type == 'vnf') {
        var vnf_data = {};
        vnf_data = vnf_map[data.vnf_vendor + ":" + data.vnf_name + ":" + data.vnf_version];
        vnf_data['id'] = data.vnf_id;
        return vnf_data;
    }
    if (type == 'ns') {
        var ns_data = ns_map[data.ns_vendor + ":" + data.ns_name + ":" + data.ns_version];
        ns_data['id'] = data.ns_id;
        return ns_data;
    }
    if (type == 'cp') {
        var cp = data;
        // var txts = data.id.split("_");
        // if (txts == data.id) {
        // cp['name'] = data.name;
        // } else {
        // cp['name'] = txts[1] + txts[2];
        // }
        cp['id'] = cp['id'].replace(":", "_");
        return cp;
    }
    if (type == 'e-lan') {
        var elan = data;
        // var txts = data.id.split("_");
        // elan['name'] = txts[1] + txts[2];
        elan['id'] = elan['id'].replace(":", "_");
        return elan;
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
    return [$x, $y];
}
// display loaded network service in the editor
function displayNS() {
    var index = 0;
    if (cur_ns.descriptor.network_functions != null ) {
        for (var i = 0; i < (cur_ns.descriptor.network_functions).length; i++) {
            var vnf = cur_ns.descriptor.network_functions[i];
            if (!cur_ns.meta.positions[vnf.vnf_id]) {
                cur_ns.meta.positions[vnf.vnf_id] = getGridPosition(index);
                index++;
            }
            $x = cur_ns.meta.positions[vnf.vnf_id][0];
            $y = cur_ns.meta.positions[vnf.vnf_id][1];
            var vnf_data = rewriteData('vnf', vnf);
            addNode("vnf", vnf_data, $x, $y);
            countDropped++;
        }
    }
    if (cur_ns.descriptor.network_services != null ) {
        for (var i = 0; i < (cur_ns.descriptor.network_services).length; i++) {
            var ns = cur_ns.descriptor.network_services[i];
            if (!cur_ns.meta.positions[ns.ns_id]) {
                cur_ns.meta.positions[ns.ns_id] = getGridPosition(index);
                index++;
            }
            $x = cur_ns.meta.positions[ns.ns_id][0];
            $y = cur_ns.meta.positions[ns.ns_id][1];
            var ns_data = rewriteData('ns', ns);
            addNode("ns", ns_data, $x, $y);
            countDropped++;
        }
    }
    if (cur_ns.descriptor.connection_points != null ) {
        for (var i = 0; i < (cur_ns.descriptor.connection_points).length; i++) {
            var cp = cur_ns.descriptor.connection_points[i];
            if (!cur_ns.meta.positions[cp.id]) {
                cur_ns.meta.positions[cp.id] = getGridPosition(index);
                index++;
            }
            $x = cur_ns.meta.positions[cp.id][0];
            $y = cur_ns.meta.positions[cp.id][1];
            cp = rewriteData('cp', cp);
            addNode("cp", cp, $x, $y);
            countDropped++;
        }
    }
    if (cur_ns.descriptor.elans != null ) {
        for (var i = 0; i < (cur_ns.descriptor.elans).length; i++) {
            var elan = cur_ns.descriptor.elans[i];
            if (!cur_ns.meta.positions[elan.id]) {
                cur_ns.meta.positions[elan.id] = getGridPosition(index);
                index++;
            }
            $x = cur_ns.meta.positions[elan.id][0];
            $y = cur_ns.meta.positions[elan.id][1];
            elan = rewriteData('e-lan', elan);
            addNode("e-lan", elan, $x, $y);
            countDropped++;
        }
    }
    if (cur_ns.descriptor.virtual_links != null ) {
        for (var i = 0; i < (cur_ns.descriptor.virtual_links).length; i++) {
            var virtual_link = cur_ns.descriptor.virtual_links[i];
            drawVirtualLink(virtual_link);
        }
    }
}
function drawVirtualLink(virtual_link) {
    instance.connect({
        uuids: virtual_link["connection_points_reference"]
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
    countDropped++;
    data.attr('id', newId);
    data.removeClass(old_class);
    data.addClass(old_class + '-after-drop');
    data.removeClass('ui-draggable');
    var $newPosX = ui.offset.left - $(editor).offset().left;
    var $newPosY = ui.offset.top - $(editor).offset().top;
    data.css({
        position: 'absolute',
        left: $newPosX,
        top: $newPosY,
        width: ''
    });
    var evt = {};
    evt.pos = [$newPosX, $newPosY];
    evt.selection = [[{
        "id": newId
    }]];
    savePositionForNode(evt);
}
function updateDescriptor(type, list, elemId) {
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
        var ns_data = rewriteData('ns', newEntry);
        $x = cur_ns.meta.positions[ns_data.id][0];
        $y = cur_ns.meta.positions[ns_data.id][1];
        addNode(type, ns_data, $x, $y);
    } else {
        cur_ns.descriptor.network_functions = list;
        var vnf_data = rewriteData('vnf', newEntry);
        $x = cur_ns.meta.positions[vnf_data.id][0];
        $y = cur_ns.meta.positions[vnf_data.id][1];
        addNode(type, vnf_data, $x, $y);
    }
    updateService();
    drawVnfOrNs(elemId, lastDraggedDescriptor["descriptor"]);
}
function drawConnectionPoint(elemID) {
    instance.addEndpoint(elemID, {
        uuid: elemID,
        anchor: ["Left"],
        connectorOverlays: [["Arrow", {
            width: 10,
            length: 20,
            location: 0.45,
            id: "arrow"
        }]]
    }, endPointOptions);
}
function createNewConnectionPoint(elemID, updateOnServer) {
    text = elemID;
    var txts = text.split("_");
    text = txts[1] + txts[2];
    var cp = {};
    cp.id = elemID;
    var cp_data = rewriteData('cp', cp);
    $x = cur_ns.meta.positions[cp_data.id][0];
    $y = cur_ns.meta.positions[cp_data.id][1];
    addNode('cp', cp_data, $x, $y);
    if (!cur_ns.descriptor.connection_points) {
        cur_ns.descriptor.connection_points = [];
    }
    drawConnectionPoint(elemID);
    if (updateOnServer) {
        cur_ns.descriptor.connection_points.push({
            "id": elemID,
            "type": "interface"
        });
        updateService();
    }
}
function drawElan(elemID) {
    instance.addEndpoint(elemID, {
        uuid: elemID,
        anchor: ["Left"],
        connectorOverlays: [["Arrow", {
            width: 10,
            length: 20,
            location: 0.45,
            id: "arrow"
        }]]
    }, endPointOptions);
}
function createNewElan(elemID, updateOnServer) {
    text = elemID;
    var txts = text.split("_");
    text = txts[1] + txts[2];
    var elan = {};
    elan.id = elemID;
    var elan_data = rewriteData('e-lan', elan);
    $x = cur_ns.meta.positions[elan_data.id][0];
    $y = cur_ns.meta.positions[elan_data.id][1];
    addNode("e-lan", elan_data, $x, $y);
    if (!cur_ns.descriptor.elans) {
        cur_ns.descriptor.elans = [];
    }
    drawElan(elemID);
    if (updateOnServer) {
        cur_ns.descriptor.elans.push({
            "id": elemID,
            "type": "interface"
        });
        updateService();
    }
}
function updateVirtualLinks(conn, remove) {
    if (!remove) {
        connections.push(conn);
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
        updateService();
        console.log("number of connections:" + connections.length);
    } else {
        var idx = -1;
        for (var i = 0; i < connections.length; i++) {
            if (connections[i] == conn) {
                idx = i;
                break;
            }
        }
        if (idx != -1)
            connections.splice(idx, 1);
        console.log("number of connections:" + connections.length);
    }
    if (connections.length > 0) {
        var s = "<span><strong>Connections</strong></span><br/><br/><table><tr><th>Scope</th><th>Source</th><th>Target</th></tr>";
        for (var j = 0; j < connections.length; j++) {
            s = s + "<tr><td>" + connections[j].scope + "</td>" + "<td>" + connections[j].sourceId + "</td><td>" + connections[j].targetId + "</td></tr>";
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
function savePositionForNode(event) {
    var position = event.pos;
    var node = event.selection[0][0];
    var nodeId = node.id;
    if (!cur_ns.meta.positions[nodeId]) {
        cur_ns.meta.positions[nodeId] = {
            "x": 0,
            "y": 0
        }
    }
    ;cur_ns.meta.positions[nodeId] = position;
    updateService();
}
function configureJsPlumb() {
    instance = jsPlumb.getInstance(jsPlumbOptions);
    $("#editor").droppable({
        accept: " .vnf , .ns , .cp , .e-lan ",
        drop: function(event, ui) {
            var data = ui.draggable.clone();
            if (data.hasClass('vnf')) {
                console.log("inside vnf condition");
                reconfigureNode(ui, data, "vnf", this);
                updateDescriptor("vnf", cur_ns.descriptor.network_functions, data.attr('id'));
            }
            if (data.hasClass('ns')) {
                console.log("inside ns condition");
                reconfigureNode(ui, data, "ns", this);
                updateDescriptor("ns", cur_ns.descriptor.network_services, data.attr('id'));
            }
            if (data.hasClass('cp')) {
                console.log("inside cp condition");
                reconfigureNode(ui, data, 'cp', this);
                createNewConnectionPoint(data.attr('id'), true);
            }
            if (data.hasClass('e-lan')) {
                console.log("inside e-lan condition");
                reconfigureNode(ui, data, "e-lan", this);
                createNewElan(data.attr('id'), true);
            }
            instance.draggable(data.attr('id'), {
                stop: savePositionForNode,
                containment: "parent"
            });
            $(data).bind("mouseover", function() {
                $(data).children("a").css("display", "inline");
            });
            $(data).bind("mouseout", function() {
                $(data).children("a").css("display", "none");
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
    instance.bind("dblclick", function(connection, originalEvent) {
        var popupOkCancel = confirm("Do you want to delete this connection?");
        if (popupOkCancel === true) {
            deleteLink(connection.getUuids());
            instance.detach(connection);
        }
    });
    jsPlumb.fire("jsPlumbDemoLoaded", instance);
}
// load the current NS from the server
function loadCurrentNS() {
    $.ajax({
        url: serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/services/" + nsId,
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            document.getElementById("nav_ns").text = "NS: " + data.descriptor.name;
            if (!data.meta.positions)
                data.meta.positions = {};
            if (!data.meta.counter) {
                data.meta.counter = 0;
                if (data.descriptor.network_functions)
                    data.meta.counter += data.descriptor.network_functions.length;
                if (data.descriptor.network_services)
                    data.meta.counter += data.descriptor.network_services.length;
                if (data.descriptor.connection_points)
                    data.meta.counter += data.descriptor.connection_points.length;
            }
            countDropped = data.meta.counter;
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
    $(".cp").draggable({
        helper: "clone",
        revert: "invalid",
    });
    $(".e-lan").draggable({
        helper: "clone",
        revert: "invalid",
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
