var startNodes = [];
var endNodes = [];
var adj = {};
var found = [];
var visitedEdges = [];
var graphs = [];
var forwardingGraphs = [];
var numOfCps = [];
var countedLinks = [];
var vnfList = [];

function addToVnfList(vnf) {
	if ($.inArray(vnf, vnfList) < 0) {
		vnfList.push(vnf);
	}
}
function containsOnlyCps(list) {
	if (list) {
		var id = list[0].split(":")[0];
		for ( var i = 0; i < list.length; i++) {
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
function addNodeToMatrix(cps) {
	if (cps) {
		for ( var i = 0; i < cps.length; i++) {
			var cp = cps[i];
			if (!adj[cp]) {
				adj[cp] = [];
			}
		}
		for ( var i = 0; i < cps.length; i++) {
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
function dfs(node) {
	found.push(node);
	var paths = [];
	var points_to = cur_ns.meta.adjacency_matrix[node];
	if (!points_to) {
		var path = [];
		path.push(node);
		paths.push(path);
		return paths;
	} else {
		for ( var i = 0; i < points_to.length; i++) {
			var next = points_to[i];
			var nextPaths = [];
			if ($.inArray(next, found) < 0)// only visit unfound nodes;
			{
				var list = cur_ns.meta.adjacency_matrix[next];
				if (next.split(":")[0] == node.split(":")[0])// edges in node
				{
					if (!containsOnlyCps(list)) {
						nextPaths = dfs(next);
						visitedEdges.push(node + "->" + next);
					} else {
						found.push(next);
					}
				} else// edges between nodes
				{
					nextPaths = dfs(next);
					visitedEdges.push(node + "->" + next);
				}
			} else {
				var edge = node + "->" + next;
				if (!visitedEdges.find(function(cur) {
					return edge == cur;
				})) {
					if (next.split(":")[0] != node.split(":")[0]) {
						nextPaths = dfs(next);
					}
					visitedEdges.push(node + "->" + next);
				}
			}
			for ( var k = 0; k < nextPaths.length; k++) {
				var path = [];
				path.push(node);
				path = path.concat(nextPaths[k]);
				paths.push(path);
			}

		}
		return paths;
	}
}

function computeForwardingPaths() {
	var paths = [];
	for ( var i = 0; i < startNodes.length; i++) {
		visitedEdges = [];
		var start = startNodes[i];
		var points_to = cur_ns.meta.adjacency_matrix[start];
		for ( var j = 0; j < points_to.length; j++) {
			found = [];
			found.push(start);
			var next = points_to[j];
			var nextPaths = dfs(next);
			visitedEdges.push(start + "->" + next);
			for ( var k = 0; k < nextPaths.length; k++) {
				var path = [];
				path.push(start);
				path = path.concat(nextPaths[k]);
				paths.push(path);
			}
		}
	}
	for ( var k = 0; k < paths.length; k++)// delete edges between cps in one
	// node
	{
		var path = paths[k];
		var deleted = {};
		if (path.length >= 3) {
			var begin = 0;
			var end = 1;
			for ( var i = 1; i < path.length ; i++) {
				var first = path[begin];
				var second = path[i];
				if (first.split(":")[0] != second.split(":")[0]) {
					end = i - 1;
					if (end - begin >= 2) {
						var key="["+begin+":"+end+"]";
						deleted[key]=[];
						deleted[key].push(begin);
						deleted[key].push(end);
					}
					begin = i;
				}
			}
			var numOfDeletedItems=0;
			for ( var key in deleted) {
				var begin=deleted[key][0]-numOfDeletedItems;
				var end = deleted[key][1]-numOfDeletedItems;
				var first=path.slice(0,begin+1);
				var second=path.slice(end,path.length);	
				path=first.concat(second);
				numOfDeletedItems+=end-begin-1;
			}
		}
		paths[k] = path;
	}
	writeGraphToDescriptor(paths);
	cur_ns.descriptor["forwarding_graphs"] = forwardingGraphs;
	updateService();
	//console.log("forwarding graphs computed");
	//console.log(paths);
	//console.log(forwardingGraphs);
	return paths;
}

function isVNF(node) {
	return true;
}

function writePathToGraph(path, i) {
	for ( var k = 0; k < path.length; k++) {
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
	for ( var k = 0; k < path.length; k++) {
		var item = {};
		item["connection_point_ref"] = path[k];
		item["position"] = k + 1;
		connection_points.push(item);
		var node = path[k];
		if (!node.startsWith("ns:")) {
			node = node.split(":")[0];
			if ($.inArray(node, vnfList) >= 0) {
				if ($.inArray(node, vnfs) < 0)
					vnfs.push(node);
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
function writeGraphToDescriptor(forwardingPaths) {
	graphs = [];
	forwardingGraphs = [];
	numOfCps = [];
	countedLinks = [];
	if (forwardingPaths.length > 0) {
		graphs.push([]);
		var num = 1;
		var firstPath = forwardingPaths[0];
		writePathToGraph(firstPath, 0);
	}
	if (forwardingPaths.length > 1) {
		for ( var j = 1; j < forwardingPaths.length; j++) {
			var path = forwardingPaths[j];
			var connected = false;
			loop1: for ( var k = 0; k < path.length; k++) {
				var node = path[k];
				if (!node.startsWith("ns:")) {
					node = node.split(":")[0];
				}
				loop2: for ( var t = 0; t < num; t++) {
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
function updateForwardingGraphs(source, target, remove) {
	if (!remove) {
		addEdgeToAdjacencyMatrix(source, target);
		if (source.startsWith("ns:")) {// start a new path
			if ($.inArray(source, startNodes) < 0) {
				startNodes.push(source);
			}
		} else {
			if (target.startsWith("ns:"))// edge vnf/ns -> cp
			{// finish a path
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