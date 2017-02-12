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

var Descriptor = function(data) {
	this.name = ko.observable(data.name);
    //this.description = ko.observable(data.description);
    //this.type = ko.observable(data.type);
    this.id = ko.observable(data.id);
    //this.network_functions = ko.observable(data.network_functions);
    //this.forwarding_graphs = ko.observable(data.forwarding_graphs);
    this.status = ko.observable(data.status);
    this.template_name = ko.observable(data.template_name);
	var self = this;

	
};

var Stack = function(data){
	this.name = ko.observable(data.name);
	this.status = ko.observable(data.status);
	var self = this;
	this.showGraph = function() {
        showServiceGraph(self.name());
    };
};

var Connection = function(data){
	this.from = ko.observable(data.from);
	this.to = ko.observable(data.to);
};

function ViewModel() {
	//this.descriptors = null;
	this.descriptors = ko.observableArray([]);
	this.stacks = ko.observableArray([]);
	this.connections = ko.observableArray([]);
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
	function loadEmuServers(){
	return $.ajax({
		url : "http://fg-cn-sandman1.cs.upb.de:8775/v2.1/fc394f2ab2df4114bde39905f800dc57/servers",
		//url : "http://fg-cn-sandman1.cs.upb.de:8005/v1/fc394f2ab2df4114bde39905f800dc57/stacks",
		method : 'GET',
		contentType : "application/json; charset=utf-8",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			//console.log(data);
			
			
			services = data;
			for (var i = 0; i < services.servers.length; i++) {
				var serviceName = services.servers[i].name;	
				//console.log(serviceName);
				//var serviceId = services.servers[i].id;
				var serviceId = services.servers[i].full_name;
				var serviceStatus = services.servers[i].status;
				var serviceTemplateName = services.servers[i].template_name;

				var nsData = {
					name : serviceName,
					//description : serviceInfo,
					id: serviceId,
					//type: "NS",
					//network_functions: vnfs,
					//forwarding_graphs: virtual_links_count
					status: serviceStatus,
					template_name: serviceTemplateName
				};
				console.log(nsData);
				viewModel.addDescriptor(nsData);
				//sleep(1000);
			}

			//console.log(viewModel.descriptors.length);
		}
	});
}

function loadEmuConnections(){
	return $.ajax({
		url: "http://fg-cn-sandman1.cs.upb.de:4000/v1/chain/list",
		method : 'GET',
		contentType : "application/json; charset=utf-8",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function(data){
			
			//console.log(viewModel.connections);
			connectionlist = data;
			for (var i = 0; i < connectionlist.chains.length; i++) {
				var from = connectionlist.chains[i].src_vnf;
				var to = connectionlist.chains[i].dst_vnf;

				var connectionData = {
					from : from,
					to : to
				};
				//console.log(connectionData);
				links[i] = connectionData;
				//console.log(links);
			viewModel.addConnection(connectionData);

			}
			
		}
	});
}

function loadEmuStacks(){
	return $.ajax({
		url: "http://fg-cn-sandman1.cs.upb.de:8005/v1/fc394f2ab2df4114bde39905f800dc57/stacks",
		method : 'GET',
		contentType : "application/json; charset=utf-8",
		dataType : "json",
		xhrFields : {
			withCredentials : true
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

	function showServiceGraph(stackName){
		console.log("inside showServiceGraph function....");
		$.when(loadEmuServers(), loadEmuConnections()).done(function(r1, r2) {
			configureJsPlumb();
		});
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


