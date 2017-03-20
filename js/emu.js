var vnfs = [];
var services = [];
var queryString = {};
var wsId = "";
var ptId = "";
var nsId = "";
var availableItems = [];
var itemDictionary = {};
var vnfList = {};
var links = [];
var clickedStack = "";
var allServerNodes = [];
var nodeName = "";
var dc_count = 0;
//var firstServerNode = {};
//var lastServerNode = {};

var Descriptor = function(data) {
	this.name = ko.observable(data.name);
    //this.description = ko.observable(data.description);
    //this.type = ko.observable(data.type);
    this.id = ko.observable(data.id);
    //this.network_functions = ko.observable(data.network_functions);
    //this.forwarding_graphs = ko.observable(data.forwarding_graphs);
    this.status = ko.observable(data.status);
    this.template_name = ko.observable(data.template_name);
    this.interfaces = ko.observable(data.interfaces);
    this.ips = ko.observable(data.ips);
    this.info = ko.observable(data.info);
    this.title = ko.observable(data.title);
	var self = this;

	
};

var Stack = function(data){
	this.name = ko.observable(data.name);
	this.status = ko.observable(data.status);
	var self = this;
	this.showGraph = function() {
		clickedStack = self.name();
        showServiceGraph();
    };

    this.clear = function(){
    	clearGraph(self.name());
    }
};

var Connection = function(data){
	this.from = ko.observable(data.from);
	this.to = ko.observable(data.to);
	this.src_intf = ko.observable(data.src_intf);
	this.dst_intf = ko.observable(data.dst_intf);
};

var LbConnection = function(data){
	this.from = ko.observable(data.from);
	this.to = ko.observable(data.to);
	this.src_intf = ko.observable(data.src_intf);
	this.dst_intf = ko.observable(data.dst_intf);
};
/*
var Interface = function(data){
	this.interfaces = ko.observable(data.interfaces);
}*/


function ViewModel() {
	//this.descriptors = null;
	this.descriptors = ko.observableArray([]);
	this.stacks = ko.observableArray([]);
	this.connections = ko.observableArray([]);
	this.lbconnections = ko.observableArray([]);
	//this.interfaces = ko.observableArray([]);
	//console.log(this.descriptors);
	var self = this;

	this.addDescriptor= function(data){
		
		/*if (null != viewModel.descriptors.length ){
				console.log("Before clearing the list: " + viewModel.descriptors);
				viewModel.descriptors = [];
				console.log("After clearing the list: " + viewModel.descriptors);
		}*/
		self.descriptors.push(new Descriptor(data));
		//this.descriptors.splice(0, this.descriptors.length - data.length);
		//console.log(self.descriptors.);
    },

    this.addStack = function(data){
    	self.stacks.push(new Stack(data));
    },

    this.addConnection = function(data){
    	self.connections.push(new Connection(data));
    }

    this.addLbConnection = function(data){
    	self.lbconnections.push(new Connection(data));
    }
 /*   
    this.addInterface = function(data){
    	self.interfaces.push(new Interface(data));
    }*/

   /*
    this.network_functions = ko.observableArray([]);

	this.addVnfToTable=function(vnf){
		this.network_functions.push(vnf);
	}.bind(this);*/
}

var viewModel = new ViewModel();



	//setWorkspaceInNav(wsId);
	//setProjectInNav(wsId,ptId);

	//loadAllServices();

// load infos of all network services from the server
//function loadAllServices() {
/*var loadRepeat = setInterval(function(){*/
	//var nsData = {};
	//availableItems.push("Create new NS");
	
	/*$("#service-table").find("tr:gt(0)").remove();*/

	/*if (viewModel.descriptors.length != 0){
		//viewModel.descriptors = [];
	}
	if (viewModel.connections.length != 0 || links.length != 0){
		viewModel.connections = [];
		links = [];
	}
	if (viewModel.stacks.length != 0){
		viewModel.stacks = [];
	}*/
	function loadEmuServers(clickedStack, data_center){
		//var services = [];
		var dc_port = 8775 + +data_center;
	return $.ajax({
		url : "http://fg-cn-sandman1.cs.upb.de:"+ dc_port +"/v2.1/fc394f2ab2df4114bde39905f800dc57/servers/andPorts",
		//url : "http://fg-cn-sandman1.cs.upb.de:8005/v1/fc394f2ab2df4114bde39905f800dc57/stacks",
		method : 'GET',
		//contentType : "application/json; charset=utf-8",
		dataType : "json",
		xhrFields : {
			withCredentials : false
		},
		success : function (data) {
			console.log(clickedStack);
			//console.log(data);

		/*	// add start node
			var firstNode = {
				name: "start",
				id: "start",
				status: "ACTIVE",
				template_name: "START"
			};
			viewModel.addDescriptor(firstNode); */
			if ( JSON.stringify(services) === JSON.stringify(data)){
				console.log("objects are exactly same..!!!");
			}
			else{
				console.log("objects are not same..!!!");	
			}


			//allServerNodes = [];
			services = data;
			for (var i = 0; i < services.servers.length; i++) {
				if(services.servers[i].name.search(clickedStack) == -1){
					console.log("The vnf: " + services.servers[i].name + " is not part of the stack: " + clickedStack);
				}
				else{
					//console.log(i);
					var serviceName = services.servers[i].name;	
					//console.log(serviceName);
					//var serviceId = services.servers[i].id;
					var serviceId = services.servers[i].full_name;
					var serviceStatus = services.servers[i].status;
					var serviceTemplateName = services.servers[i].template_name;
					var servicePorts = services.servers[i].ports;
					console.log(servicePorts.length);
					var servicesInterfaces = [];
					var serviceIps = [];
					//var servicesInterfaces = "Interfaces ";
					//var serviceIps = "IP Addresses ";
					var serverInfo = {};
					for (var j = 0; j < services.servers[i].ports.length; j++){
						console.log("Port number "+ j + " is: " + services.servers[i].ports[j].name);
						servicesInterfaces[j] = services.servers[i].ports[j].intf_name;
						//servicePorts[j] = services.servers[i].ports[j].fixed_ips.ip_address;
						serviceIps[j] = services.servers[i].ports[j].fixed_ips[0].ip_address;
						//servicesInterfaces = servicesInterfaces + ":" + services.servers[i].ports[j].intf_name;
						//serviceIps = serviceIps + ":" + services.servers[i].ports[j].fixed_ips[0].ip_address;
						serverInfo = {
							interface: servicesInterfaces[j],
							//ip: servicePorts[j]
							ip: serviceIps[j]
						};
						//viewModel.addInterface(serverInfo);
						//serverInfo = servicesInterfaces + "\n \n" + serviceIps;
					}
					//console.log(serviceIps);
					var nodeTitle = buildTitle(serviceIps,servicesInterfaces);
					//build_nodeTitle = function(serviceIps){
					console.log(nodeTitle);
					//}
					var nsData = {
						name : serviceName,
						//description : serviceInfo,
						id: serviceId,
						//type: "NS",
						//network_functions: vnfs,
						//forwarding_graphs: virtual_links_count
						status: serviceStatus,
						template_name: serviceTemplateName,
						interfaces: servicesInterfaces,
						ips: serviceIps,
						info: serverInfo,
						title: nodeTitle
					};
					/*if (i == 0){
						console.log("First server node: " + nsData);
						firstServerNode = nsData;
					}
					if (i == services.servers.length-1){
						console.log("Last server node: " + nsData);
						lastServerNode = nsData;
					}*/
					allServerNodes.push(nsData);
					console.log(allServerNodes +":"+ allServerNodes.length);
					viewModel.addDescriptor(nsData);
					//sleep(1000);
				}
			}
		/*	// Add last node
			var lastNode = {
				name: "stop",
				id: "stop",
				status: "ACTIVE",
				template_name: "STOP"
			};
			viewModel.addDescriptor(lastNode); */
			//console.log(viewModel.descriptors.length);
			//console.log(allServerNodes);
		}
	});
}

function loadEmuConnections(clickedStack){
	return $.ajax({
		url: "http://fg-cn-sandman1.cs.upb.de:4000/v1/chain/list",
		method : 'GET',
		//contentType : "application/json; charset=utf-8",
		dataType : "json",
		xhrFields : {
			withCredentials : false
		},
		success : function(data){
			
			//console.log(viewModel.connections);
		/*	var firstConnection = {
				from: 'start',
				to: firstServerNode.id
			};
			links.push(firstConnection);
			viewModel.addConnection(firstConnection); */
			links = [];
			var connectionlist = data;
			for (var i = 0; i < connectionlist.chains.length; i++) {
				if(connectionlist.chains[i].src_vnf.search(clickedStack) == -1 || connectionlist.chains[i].dst_vnf.search(clickedStack) == -1){
					console.log("The connection from: " + connectionlist.chains[i].src_vnf + " to: " + connectionlist.chains[i].dst_vnf + " is not part of the stack: " + clickedStack);
				}
				else{
						var from = connectionlist.chains[i].src_vnf;
						var to = connectionlist.chains[i].dst_vnf;

						var source_interface = connectionlist.chains[i].src_intf;
						var destination_interface = connectionlist.chains[i].dst_intf;

						var connectionData = {
							from : from,
							to : to,
							src_intf: source_interface,
							dst_intf: destination_interface
						};
						//console.log(connectionData);
						//links[i] = connectionData;
						links.push(connectionData);
						//console.log(links);
					viewModel.addConnection(connectionData);
				}
			}
			/*
			var lastConnection = {
				from: lastServerNode.id,
				to: 'stop'
			};
			links.push(lastConnection);
			viewModel.addConnection(lastConnection); */
			
			//console.log(links);
			
		}
	});
}

function loadEmuLbConnections(clickedStack){
	return $.ajax({
		url: "http://fg-cn-sandman1.cs.upb.de:4000/v1/lb/list",
		method : 'GET',
		//contentType : "application/json; charset=utf-8",
		dataType : "json",
		xhrFields : {
			withCredentials : false
		},
		success : function(data){
				var connectionListLb = data;
				if (connectionListLb.loadbalancers.length == 0 ){
					console.log("No loadbalancing in place..!!!");
				}
				else{
					for(var i = 0; i < connectionListLb.loadbalancers.length; i++){
						
							var from = connectionListLb.loadbalancers[i].src_vnf;
							var source_interface = connectionListLb.loadbalancers[i].src_intf;
							for(j = 0; j < connectionListLb.loadbalancers[i].paths.length; j++){
								if(connectionListLb.loadbalancers[i].src_vnf.search(clickedStack) == -1 || connectionListLb.loadbalancers[i].paths[j].dst_vnf.search(clickedStack) == -1){
									console.log("The connection from: " + connectionListLb.loadbalancers[i].src_vnf + " to: " + connectionListLb.loadbalancers[i].paths[j].dst_vnf + " is not part of the stack: " + clickedStack);
								}
								else{
									var to = connectionListLb.loadbalancers[i].paths[j].dst_vnf;
									var destination_interface = connectionListLb.loadbalancers[i].paths[j].dst_intf;

									var connectionData = {
										from : from,
										to : to,
										src_intf: source_interface,
										dst_intf: destination_interface
									};
									links.push(connectionData);
									viewModel.addLbConnection(connectionData);
								}
						}
					}
				}

		}
	});
}


function loadEmuStacks(){
	return $.ajax({
		url: "http://fg-cn-sandman1.cs.upb.de:8005/v1/fc394f2ab2df4114bde39905f800dc57/stacks",
		method : 'GET',
		//contentType : "application/json; charset=utf-8",
		dataType : "json",
		xhrFields : {
			withCredentials : false
		},
		success : function (data){
			
			//console.log(viewModel.stacks);
			stacklist = data;
			for(var i = 0; i < stacklist.stacks.length; i++){
				var stackName = stacklist.stacks[i].stack_name;
				var stackStatus = stacklist.stacks[i].stack_status;
				var stackData = {
					name : stackName,
					status : stackStatus
				};
				//console.log(stackData);
				viewModel.addStack(stackData);
			}
		}
	});
}

	$(document).ready(function () {
//function drawEmuService(){
	queryString = getQueryString();
	wsId = queryString["wsId"];
	ptId = queryString["ptId"];

	// delay loading the current configurejsplumb until the sidebar has loaded
	// completely
	//$.when(loadEmuServers(), loadEmuConnections(), loadEmuStacks()).done(function(r1, r2) {
		loadEmuStacks();
		calculateCountDC();
		//console.log(dc_count);
		ko.applyBindings(viewModel);
		//configureJsPlumb();
	//});

		
		//sleep(3000);
		
		
	
/*
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/services/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			console.log("services:");
			console.log(data);
			// display available services and their onclick event.
			services = data;
			for (var i = 0; i < services.length; i++) {
				var serviceName = services[i].descriptor.name;
				//availableItems.push("NS: " + serviceName);
				var serviceId = services[i].id;
				//itemDictionary[serviceName] = serviceId;
				var serviceInfo = services[i].descriptor.description;
				vnfs = [];
				if(typeof services[i].descriptor.network_functions === 'undefined'){
					console.log("The following service named "+ services[i].descriptor.name +" does not have any network functions..!!!");
				}
				else{   
					for(var j=0; j < services[i].descriptor.network_functions.length; j++){
					//vnfList[serviceName] = 
					//viewModel.addVnfToTable(services[i].descriptor.network_functions[j]);
						console.log(services[i].descriptor.network_functions[j].vnf_name);
						vnfs.push(services[i].descriptor.network_functions[j].vnf_name);
					}
				}

				var virtual_links_count = 0;
				if (typeof services[i].descriptor.forwarding_graphs === 'undefined'){
					console.log("The following service named "+services[i].descriptor.name+" does not have any forwarding graph..!!")
					virtual_links_count = 0;
				}
				else{
					for(var k=0; k < services[i].descriptor.forwarding_graphs.length; k++){
						console.log(services[i].descriptor.forwarding_graphs[k].number_of_virtual_links);
						virtual_links_count = services[i].descriptor.forwarding_graphs[k].number_of_virtual_links;
					}
				}
				if (!serviceInfo){
					serviceInfo = "";
				}
				var nsData = {
					name : serviceName,
					description : serviceInfo,
					id: serviceId,
					type: "NS",
					network_functions: vnfs,
					forwarding_graphs: virtual_links_count
				};
				viewModel.addDescriptor(nsData);
			}
		}
	});*/
/*}, 5000);*/




/*           emuDrawGraph Function */


/*           end of emuDrawGraph Function */




}); // end of document.ready

	function showServiceGraph(){
		
		console.log("inside showServiceGraph function....");
		//clickedStack = emuStackName;
		clearGraph(clickedStack);
		//dc_count = calculateCountDC();
		allServerNodes = [];
		console.log(dc_count);
		for (var i = 0; i < dc_count; i++){
			loadEmuServers(clickedStack, i);
		}
		$.when(loadEmuConnections(clickedStack), loadEmuLbConnections(clickedStack)).done(function(r1, r2) {
			configureJsPlumb();
		});

		setTimeout(showServiceGraph, 5000);
	}

	function clearGraph(clickedStack){
		$(".diagram").empty();
	}

function listStacks() {
    document.getElementById("myDropdown").classList.toggle("show");
    //loadEmuStacks();
}

window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {

    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function goToEmulatorView() {
	window.location.href = "emuView.html?wsId=" + queryString["wsId"]+"&ptId=" + queryString["ptId"];
}

function buildTitle(serviceIps, servicesInterfaces){
	
	var nodetitle = "<div><p>ip addresses:Interfaces</p><ul>";
	for (var k = 0; k < serviceIps.length; k++){
		nodetitle = nodetitle + "<li>" + serviceIps[k] + ":" + servicesInterfaces[k] + "</li>";
	}
	nodetitle = nodetitle + "</ul></div>";
	return nodetitle;
}

function calculateCountDC(){
			//var count = 0;
			$.ajax({
				url: "http://fg-cn-sandman1.cs.upb.de:4000/v1/topo",
				method : 'GET',
				//contentType : "application/json; charset=utf-8",
				dataType : "json",
				xhrFields : {
					withCredentials : false
				},
				success : function (data){
			
				//console.log(viewModel.stacks);
					dclist = data;
					//console.log(dclist);
					for(var i = 0; i < dclist.nodes.length; i++){
						//var dcnodetype = dclist.nodes[i].type;
						
						if(dclist.nodes[i].type === "Datacenter"){
							//for(var j = 0; j < dclist.nodes.links.length; j++){
								//console.log(dclist.nodes[i].type);
								dc_count++;
							//}
							
						}

						
					}
					//console.log(dc_count);
					//return count;
				}
				
			});
			//console.log(dc_count);
			//return count;
		}

