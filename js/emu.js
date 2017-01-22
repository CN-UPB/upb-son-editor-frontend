var vnfs = [];
var services = [];
var queryString = {};
var wsId = "";
var ptId = "";
var nsId = "";
var availableItems = [];
var itemDictionary = {};
var vnfList = {};

var Descriptor = function(data) {
	this.name = ko.observable(data.name);
    this.description = ko.observable(data.description);
    this.type = ko.observable(data.type);
    this.id = ko.observable(data.id);
    this.network_functions = ko.observable(data.network_functions);
    this.forwarding_graphs = ko.observable(data.forwarding_graphs);
    //this.vnfs = ko.observable(data.network_functions);
	var self = this;
};

function ViewModel() {
	this.descriptors = ko.observableArray([]);

	var self = this;

	this.addDescriptor= function(data){
		self.descriptors.push(new Descriptor(data));
    }
   /*
    this.network_functions = ko.observableArray([]);

	this.addVnfToTable=function(vnf){
		this.network_functions.push(vnf);
	}.bind(this);*/
}

var viewModel = new ViewModel();


$(document).ready(function () {
	queryString = getQueryString();
	wsId = queryString["wsId"];
	ptId = queryString["ptId"];
	//setWorkspaceInNav(wsId);
	//setProjectInNav(wsId,ptId);
	ko.applyBindings(viewModel);
	//loadAllServices();
});
// load infos of all network services from the server
//function loadAllServices() {
var loadRepeat = setInterval(function(){
	//var nsData = {};
	//availableItems.push("Create new NS");
	
	$("#service-table").find("tr:gt(0)").remove();

	$.ajax({
		url : "https://fg-cn-sandman1.cs.upb.de:8775/v2.1/fc394f2ab2df4114bde39905f800dc57/servers/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			console.log(data);
		}
	});
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
}, 10000);

function goToEmulatorView() {
	window.location.href = "emuView.html?wsId=" + queryString["wsId"]+"&ptId=" + queryString["ptId"];
}
