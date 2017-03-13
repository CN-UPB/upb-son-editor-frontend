/**
 * Written by Linghui
 * The idea is to perform the depth-first search algorithm on the adjacency matrix.
 * The nodes in adjacency matrix are connection points of each node.
 * The edges in adjacency matrix are the E-Line connections and the connections inside a node.
 * Note that a node can have multiple connection points and they are connected to each other even though
 * there is no explicit E-Line connections between them.
 * Each forwarding path starts from a connection point of the current network service.
 * Each forwarding graph must be a connected component. A network service can have multiple forwarding graphs
 * since multiple connected components are allowed.
 * It is used in nsView.html.
 */
/**
 * stores the starting connection points of the current network service
 */
var startNodes = [];
/**
 * stores the ending connection points of the current network service
 */
var endNodes = [];
/**
 * adjacency matrix to store nodes and edges
 */
var adj = {};
/**
 * intermediate storage for computed forwarding graphs with redundant infos
 */
var graphs = [];
/**
 * stores the computed forwarding graphs
 */
var forwardingGraphs = [];
/**
 * stores number of connection points of the current network service used in a computed forwarding graph
 */
var numOfCps = [];
/**
 * Used to count the number of virtual links of a forwarding path
 */
var countedLinks = [];
/**
 * a list to save the VNFs in the current network service.
 */
var vnfList = [];

/**
 * It adds a VNF to the list of VNFs.
 * @param vnf
 */
function addToVnfList(vnf) {
    if ($.inArray(vnf, vnfList) < 0) {
        vnfList.push(vnf);
    }
}

/**
 * It removes a VNF from the list of VNFs.
 * @param vnf
 */
function removeFromVnfList(vnf) {
    var index = vnfList.indexOf(vnf);
    if (index > -1) {
        vnfList.splice(index, 1);
    }
}

/**
 * It tests if all connection points in a list are from the one node.
 * This is to avoid circular path in the depth-first search.
 * @param list
 * @returns {Boolean}
 */
function containsOnlyCps(list) {
    if (list) {
        var id = list[0].split(":")[0];
        for (var i = 0; i < list.length; i++) {
            var temp = list[i].split(":")[0];
            if (temp != id) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}

/**
 * It adds a node to the adjacency matrix.
 * @param cps
 */
function addNodeToMatrix(cps) {
    if (cps) {
        for (var i = 0; i < cps.length; i++) {
            var cp = cps[i];
            if (!adj[cp]) {
                adj[cp] = [];
            }
        }
        for (var i = 0; i < cps.length; i++) {
            var others = cps.filter(function(cur) {
                return cur != cps[i];
            });
            if (adj[cps[i]]) {
                adj[cps[i]] = adj[cps[i]].concat(others);
            } else {
                adj[cps[i]] = others;
            }
        }
    }
    cur_ns.meta.adjacency_matrix = adj;
}

/**
 * It adds an edge to the adjacency matrix.
 * @param source
 * @param target
 */
function addEdgeToAdjacencyMatrix(source, target) {
    if (adj[source]) {
        var points_to = adj[source];
        if ($.inArray(target, points_to) < 0) {
            points_to.push(target);
        }
        adj[source] = points_to;
    } else {
        var points_to = [];
        points_to.push(target);
        adj[source] = points_to;
    }
    cur_ns.meta.adjacency_matrix = adj;
}

/**
 * It removes an edge from the adjacency matrix.
 * @param source
 * @param target
 */
function removeFromAdjacencyMatrix(source, target) {
    if (adj[source]) {
        var points_to = adj[source];
        if ($.inArray(target, points_to) >= 0) {
            points_to = points_to.filter(function(cur) {
                return cur != target;
            });
        }
        adj[source] = points_to;
    }
    cur_ns.meta.adjacency_matrix = adj;
}

/**
 * It runs depth-first search recursively.
 * @param node
 * @param found
 * @returns {Array}
 */
function dfs(node, found) {
    var foundSoFar = JSON.parse(found);
    foundSoFar.push(node);
    var paths = [];
    var points_to = cur_ns.meta.adjacency_matrix[node];
    if (!points_to) {
        var path = [];
        path.push(node);
        paths.push(path);
        return paths;
    } else {
        for (var i = 0; i < points_to.length; i++) {
            var next = points_to[i];
            var nextPaths = [];
            if ($.inArray(next, foundSoFar) < 0) // only visit unfound nodes;
            {
                var list = cur_ns.meta.adjacency_matrix[next];
                if (next.split(":")[0] == node.split(":")[0]) // edges in node
                {
                    if (!containsOnlyCps(list)) {
                        nextPaths = dfs(next, JSON.stringify(foundSoFar));
                    }
                } else // edges between nodes
                {
                    nextPaths = dfs(next, JSON.stringify(foundSoFar));
                }
            }
            for (var k = 0; k < nextPaths.length; k++) {
                var path = [];
                path.push(node);
                path = path.concat(nextPaths[k]);
                paths.push(path);
            }
        }
        return paths;
    }
}

/**
 * It runs depth-first search starting from every connection points of the current network service.
 */
function computeForwardingPaths() {
    var paths = [];
    for (var i = 0; i < startNodes.length; i++) {
        var start = startNodes[i];
        var points_to = cur_ns.meta.adjacency_matrix[start];
        for (var j = 0; j < points_to.length; j++) {
            var found = [];
            found.push(start);
            var next = points_to[j];
            var nextPaths = dfs(next, JSON.stringify(found));
            for (var k = 0; k < nextPaths.length; k++) {
                var path = [];
                path.push(start);
                path = path.concat(nextPaths[k]);
                paths.push(path);
            }
        }
    }
    var filteredPaths = [];
    for (var k = 0; k < paths.length; k++) // delete edges between cps in one
    // node
    {
        var path = paths[k];
        var deleted = {};
        if (path.length >= 3) {
            var begin = 0;
            var end = 1;
            for (var i = 1; i < path.length; i++) {
                var first = path[begin];
                var second = path[i];
                if (first.split(":")[0] != second.split(":")[0]) {
                    end = i - 1;
                    if (end - begin >= 2) {
                        var key = "[" + begin + ":" + end + "]";
                        deleted[key] = [];
                        deleted[key].push(begin);
                        deleted[key].push(end);
                    }
                    begin = i;
                }
            }
            var numOfDeletedItems = 0;
            for (var key in deleted) {
                var begin = deleted[key][0] - numOfDeletedItems;
                var end = deleted[key][1] - numOfDeletedItems;
                var first = path.slice(0, begin + 1);
                var second = path.slice(end, path.length);
                path = first.concat(second);
                numOfDeletedItems += end - begin - 1;
            }
        }
        //delete double found paths
        var pathStr=JSON.stringify(path);
        if ($.inArray(pathStr, filteredPaths) < 0) {
            filteredPaths.push(pathStr);
        }
    }
    paths=[];
    for(var n=0;n<filteredPaths.length;n++)
    {
    	paths.push(JSON.parse(filteredPaths[n]));
    }
    writeGraphToDescriptor(paths);
    cur_ns.descriptor["forwarding_graphs"] = forwardingGraphs;
    return paths;
}

/**
 * It writes the computed forwarding paths to the respective forwarding graph
 */
function writePathToGraph(path, i) {
    for (var k = 0; k < path.length; k++) {
        var node = path[k];
        if (!node.startsWith("ns:")) {
            node = node.split(":")[0];
        }
        if ($.inArray(node, graphs[i]) < 0) {
            graphs[i].push(node);
            if (node.startsWith("ns:")) {
                if (numOfCps[i]) {
                    numOfCps[i] = numOfCps[i] + 1;
                } else {
                    numOfCps[i] = 1;
                }
            }
        }
    }
    var fg = {};
    fg["fg_id"] = "ns:fg" + (i + 1);
    var vnfs = [];
    var fps = [];
    if (forwardingGraphs[i]) {
        fg = forwardingGraphs[i];
        vnfs = fg["constituent_vnfs"];
        fps = fg["network_forwarding_paths"];
    }
    var fp = {};
    fp["fp_id"] = fg["fg_id"] + ":fp" + (fps.length + 1);
    var connection_points = [];
    for (var k = 0; k < path.length; k++) {
        var item = {};
        item["connection_point_ref"] = path[k];
        item["position"] = k + 1;
        connection_points.push(item);
        var node = path[k];
        if (!node.startsWith("ns:")) {
            node = node.split(":")[0];
            if ($.inArray(node, vnfList) >= 0) {
                if ($.inArray(node, vnfs) < 0) {
                    vnfs.push(node);
                }
            }
        }
        if (k < path.length - 1) {
            var next = path[k + 1];
            if (!next.startsWith("ns:")) {
                next = next.split(":")[0];
            }
            if (node != next) {
                var link = node + "->" + next;
                if ($.inArray(link, countedLinks) < 0) {
                    if (!fg["number_of_virtual_links"]) {
                        fg["number_of_virtual_links"] = 1;
                    } else {
                        fg["number_of_virtual_links"] = fg["number_of_virtual_links"] + 1;
                    }
                    countedLinks.push(link);
                }
            }
        }
    }
    fp["connection_points"] = connection_points;
    fps.push(fp);
    fg["network_forwarding_paths"] = fps;
    fg["constituent_vnfs"] = vnfs;
    fg["number_of_endpoints"] = numOfCps[i];
    forwardingGraphs[i] = fg;
}

/**
 * It writes the computed forwarding graphs to descriptor
 * @param forwardingPaths
 */
function writeGraphToDescriptor(forwardingPaths) {
    graphs = [];
    forwardingGraphs = [];
    numOfCps = [];
    countedLinks = [];
    var num = 0;
    if (forwardingPaths.length > 0) {
        graphs.push([]);
        num = 1;
        var firstPath = forwardingPaths[0];
        writePathToGraph(firstPath, 0);
    }
    if (forwardingPaths.length > 1) {
        for (var j = 1; j < forwardingPaths.length; j++) {
            var path = forwardingPaths[j];
            var connected = false;
            loop1: for (var k = 0; k < path.length; k++) {
                var node = path[k];
                if (!node.startsWith("ns:")) {
                    node = node.split(":")[0];
                }
                loop2: for (var t = 0; t < num; t++) {
                    if ($.inArray(node, graphs[t]) >= 0) {
                        writePathToGraph(path, t);
                        connected = true;
                        break loop1;
                    }
                }
            }
            if (!connected) {
                graphs.push([]);
                writePathToGraph(path, num);
                num++;
            }
        }
    }
}

/**
 * It recomputes the forwarding graphs whenever a connection is added/deleted to the graph.
 * It is called in nsEditor.js, whenever a connection is added/deleted.
 */
function updateForwardingGraphs(source, target, remove) {
    if (!remove) {
        addEdgeToAdjacencyMatrix(source, target);
        if (source.startsWith("ns:")) {
            // start a new path
            if ($.inArray(source, startNodes) < 0) {
                startNodes.push(source);
            }
        } else {
            if (target.startsWith("ns:")) // edge vnf/ns -> cp
            {
                // finish a path
                if ($.inArray(target, endNodes) < 0) {
                    endNodes.push(target);
                }
            }
        }
    } else {
        removeFromAdjacencyMatrix(source, target);
    }
    computeForwardingPaths();
}
