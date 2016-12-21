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
	loadAllServices();
});
// load infos of all network services from the server
function loadAllServices() {
	//availableItems.push("Create new NS");
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
				for(var j=0; j < services[i].descriptor.network_functions.length; j++){
					//vnfList[serviceName] = 
					//viewModel.addVnfToTable(services[i].descriptor.network_functions[j]);
					console.log(services[i].descriptor.network_functions[j].vnf_name);
					vnfs.push(services[i].descriptor.network_functions[j].vnf_name);
				}
				if (!serviceInfo){
					serviceInfo = "";
				}
				var nsData = {
					name : serviceName,
					description : serviceInfo,
					id: serviceId,
					type: "NS",
					network_functions: vnfs
				};
				viewModel.addDescriptor(nsData);
			}
		}
	});
}

function goToEmulatorView() {
	window.location.href = "emuView.html?wsId=" + queryString["wsId"]+"&ptId=" + queryString["ptId"];
}
