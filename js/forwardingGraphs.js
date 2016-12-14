function addNodeToAdjacencyMatrix(type, id)
{
	if(!cur_ns.meta.adjacency_matrix[id])
	{
		item={};
		item["type"]=type;
		item["points_to"]=[];
		cur_ns.meta.adjacency_matrix[id]=item;
	}
}

function addEdgeToAdjacencyMatrix(source, target)
{
	if(cur_ns.meta.adjacency_matrix[source])
	{
		if(!cur_ns.meta.adjacency_matrix[source].points_to.find(function(cur){return cur==target;}))
		{
			cur_ns.meta.adjacency_matrix[source].points_to.push(target);
		}
	}
	else
	{
		console.log("node "+source+" doesn't exist.");
	}
}

function getNumberOfVirtualLinks()
{
	var num=0;
	for(var node in cur_ns.meta.adjacency_matrix)
	{
		num+=cur_ns.meta.adjacency_matrix[node].points_to.length;
	}
	return num;
}

function getNumberOfConstituentVnfs()
{
	var num=0;
	for(var node in cur_ns.meta.adjacency_matrix)
	{
		if(cur_ns.meta.adjacency_matrix[node].type=="vnf")
		num++;
	}
	return num;
}

function updateForwardGraph(source, target)
{
	if(cur_ns.descriptor.forwarding_graphs)
	{///TODO
		for(var i=0;i<cur_ns.descriptor.forwarding_graphs.length;i++)
		{
			var forwarding_graph=cur_ns.descriptor.forwarding_graphs[i];
			for(var j=0;j<forwarding_graph.network_forwarding_paths.length;j++)
			{
				var path=forwarding_graph.network_forwarding_paths[j];
				var connection_points=path.connection_points;
			}
		}
	}
	else
	{
		var forwarding_graphs=[];
		var forwarding_graph={};
		forwarding_graph["fg_id"]="ns:fg01";
		forwarding_graph["number_of_endpoints"]=2;
		forwarding_graph["number_of_virtual_links"]=1;
		var constituent_vnfs=[];
		var sourceName;
		if(!source.startsWith("ns"))
		{
			sourceName=source.split(":")[0];
			constituent_vnfs.push(sourceName);
		}
		if(!target.startsWith("ns"))
		{
			var targetName=source.split(":")[0];
			if(targetName!=sourceName)
			{
				constituent_vnfs.push(targetName);
			}
		}
		forwarding_graph["constituent_vnfs"]=constituent_vnfs;
		var paths=[];
		var path={};
		path["fp_id"]=forwarding_graph["fg_id"]+":fp01";
		var connection_points=[];
		var connection_point1={};
		var connection_point2={};
		connection_point1["connection_point_ref"]=source;
		connection_point1["position"]=1;
		connection_point2["connection_point_ref"]=target;
		connection_point2["position"]=2;
		connection_points.push(connection_point1);
		connection_points.push(connection_point2);
		path["connection_points"]=connection_points;
		paths.push(path);
		forwarding_graph["network_forwarding_paths"]=paths;
		forwarding_graphs.push(forwarding_graph);
		cur_ns.descriptor.forwarding_graphs=forwarding_graphs;
	}
}