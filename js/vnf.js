var queryString = {};
var units;
var vnfViewModel;

/*1.Function Specific Managers Section*/
var FunctionSpecificManager = function(){
	this.description = ko.observable("");
	this.id = ko.observable("");
	this.image = ko.observable("");
	this.image_md5 = ko.observable("");
	this.resource_requirements = new ResourceRequirements();
	this.options = ko.observableArray([new Option()]);
	this.addOption = function(){
		this.options.push(new Option());
	}.bind(this);
	this.deleteOption = function(option){
		this.options.remove(option);	
	}.bind(this);
}

var ResourceRequirements= function(){
	this.docker_version = ko.observable("");
}

var Option = function(){
	this.key = ko.observable("");
	this.value = ko.observable("");
}

/*2.Virtual Deployment Units Section*/
var VirtualDeploymentUnit = function(){
	this.id = ko.observable("");
	this.vm_image = ko.observable("");
	this.vm_image_format = ko.observable("");
	this.vm_image_md5 = ko.observable("");
	this.resource_requirements= ko.observableArray([new ResourceRequirement()]);
	this.connection_points= ko.observableArray([new ConnectionPoint()]);
	this.monitoring_parameters= ko.observableArray([new MonitoringParameter()]);
	this.scale_in_out = new ScaleInOut();
	
	this.addRequirement = function() {
		this.resource_requirements.push(new ResourceRequirement());
	}
	this.deleteRequirement = function(requirement){
		this.resource_requirements.remove(requirement);
	}.bind(this);
	
	this.addPoint = function() {
		this.connection_points.push(new ConnectionPoint());
	}
	this.removePoint = function(point){
		this.connection_points.remove(point);
	}.bind(this);
	
	this.addParameter = function() {
		this.monitoring_parameters.push(new MonitoringParameter());
	}
	this.deleteParameter = function(parameter){
		this.monitoring_parameters.remove(parameter);
	}.bind(this);
}

var MonitoringParameter = function(){
	this.name = ko.observable("");
	this.unit = ko.observable("");
	this.frequency = ko.observable("");
	this.frequency_unit = ko.observable("");
	this.command = ko.observable("");
}

var MonitoringRequirement = function (){
	this.name = ko.observable("");
	this.unit = ko.observable("");
}

var HypervisorParameters = function(){
	this.type = ko.observable("");
	this.version = ko.observable("");
}

var VswitchCapabilities = function(){
	this.version = ko.observable("");
	this.type = ko.observable("");
	this.overlay_tunnel = ko.observable("");
}

var CPU = function(){
	this.vcpus = ko.observable(0);
	this.cpu_support_accelerator = ko.observable("");
}

var Memory = function(){
	this.size = ko.observable(0);
	this.size_unit = ko.observable("MB");
	this.large_pages_required = ko.observable(false);
    this.numa_allocation_policy = ko.observable("");
}

var Storage = function(){
	this.size = ko.observable(0);
	this.size_unit = ko.observable("MB");
	this.persistence = ko.observable(false);
}

var PCIE = function(){
	this.SR_IOV = ko.observable(false);
	this.device_pass_through = ko.observable(false);
}

var NICCaps = function(){
	this.SR_IOV = ko.observable(false);
	this.mirroring = ko.observable(false);
}

var Network = function(){
	this.network_interface_bandwidth = ko.observable(0);
	this.network_interface_bandwidth_unit= ko.observable("");
	this.network_interface_card_capabilities= new NICCaps();
	this.data_processing_acceleration_library= ko.observable("");
}

var ScaleInOut = function(){
	this.minimum = ko.observable(1);
	this.maximum = ko.observable(1);
}

var ResourceRequirement= function(){
	this.hypervisor_parameters = new HypervisorParameters();
	this.vswitch_capabilities = new VswitchCapabilities();
	this.cpu = new CPU();
	this.memory = new Memory();
	this.storage = new Storage();
	this.network = new Network();
	this.pcie = new PCIE();
}

/*3.Connection Points Section*/
var ConnectionPoint = function () {
	this.id  = ko.observable("");
	this.type = ko.observable("");
	this.virtual_link_reference = ko.observable("");	
}

/*4.Virtual Links Section*/
var VirtualLink = function() {
	this.id = ko.observable("");
	this.connectivity_type = ko.observable("");
	this.connection_points_reference = ko.observableArray([]);
	this.access =  ko.observable(false);
	this.external_access =  ko.observable(false);
	this.root_requirement =  ko.observable("");
	this.leaf_requirement =  ko.observable("");
	this.dhcp =  ko.observable(false);
	this.qos =  ko.observable("");
}

/*5.VNF Lifecycle Events Section*/
var Event = function () {
	this.command = ko.observable("");
	this.template_file = ko.observable("");
	this.template_file_format = ko.observable("");
}

var Events = function(){
	this.start = new Event();
	this.stop = new Event();
	this.restart = new Event();
	this.scale_in = new Event();
	this.scale_out = new Event();
}

var LifecycleEvent = function(){
	this.authentication_username = ko.observable("");
	this.driver = ko.observable("");
	this.authentication_type = ko.observable("");
	this.authentication = ko.observable("");
	this.vnf_container = ko.observable("");
	this.events = new Events();
	this.flavor_id_ref = ko.observable("");
}

/*6.Deployment Flavours Section*/
var DeploymentFlavour = function() {
	this.id = ko.observable("");
	this.flavour_key = ko.observable("");
	this.constraint = ko.observable("");
	this.vdu_reference = ko.observableArray([new Text()]);
	this.vlink_reference = ko.observableArray([new Text()]);
    this.assurance_parameters = ko.observableArray([new AssuranceParameter()]);
	
	this.addVduReference = function(){
		this.vdu_reference.push(new Text());
	};
	this.deleteVduReference = function(vduReference){
		this.vdu_reference.remove(vduReference);
	}.bind(this);
	
	this.addVlinkReference = function(){
		this.vlink_reference.push(new Text());
	};
	this.deleteVlinkReference = function(vduReference){
		this.vlink_reference.remove(vduReference);
	}.bind(this);
	
	this.addAssuranceParameter = function(){
		this.assurance_parameters.push(new AssuranceParameter());
	};
	this.deleteAssuranceParameter = function(assuranceParameter){
		this.assurance_parameters.remove(assuranceParameter);
	}.bind(this);
}

var Text = function(){
	this.text = ko.observable("");
}

var Violation = function(){
	this.interval = ko.observable("");
	this.breaches_count = ko.observable("");
}

var Penalty = function(){
	this.type = ko.observable("");
	this.expression = ko.observable("");
	this.validity = ko.observable("");
	this.unit = ko.observable("");
}

var AssuranceParameter = function() {
    this.violation = ko.observableArray([new Violation()]);
    this.value = ko.observable("");
	this.penalty = new Penalty();
	this.formula = ko.observable("");
	this.rel_id = ko.observable("");
	this.id = ko.observable("");
	this.unit = ko.observable("");	
	this.addViolation= function(){
		this.violation.push(new Violation());
	};
	this.deleteViolation = function(violation){
		this.violation.remove(violation);
	}.bind(this);
}

/*7.Monitoring Rules*/
var MonitoringRule = function(){
	this.name= ko.observable("");
    this.description= ko.observable("");
    this.duration= ko.observable("");
    this.duration_unit= ko.observable("");
    this.condition= ko.observable("");
    this.notification= new Notification();
}

var Notification = function(){
	this.name= ko.observable("");
    this.type= ko.observable("");
}

var vnfViewModel = function() {
	this.schema = ko.observable("example-schema");
	this.descriptor_version = ko.observable("vnfd-schema-01");
	this.vendor = ko.observable("de.upb.cs.fg-cn-sandman1");
	this.name = ko.observable("example_name");
	this.version= ko.observable("1337");
	this.author = ko.observable("Your Name");
	this.description= ko.observable("An example description");

	this.function_specific_managers= ko.observableArray([new FunctionSpecificManager()]);
	this.virtual_deployment_units = ko.observableArray([new VirtualDeploymentUnit()]);
	this.connection_points=ko.observableArray([new ConnectionPoint()]);
	this.virtual_links = ko.observableArray([new VirtualLink()]);
	this.lifecycle_events=ko.observableArray([new LifecycleEvent()]);
	this.deployment_flavours=ko.observableArray([new DeploymentFlavour()]);
	this.monitoring_rules=ko.observableArray([new MonitoringRule()]);
	
	this.addFunctionSpecificManager=  function(){
		this.function_specific_managers.push(new FunctionSpecificManager());
	};
	this.deleteFunctionSpecificManager=  function(functionSpecificManager){
		this.function_specific_managers.remove(functionSpecificManager);
	}.bind(this);
	
	this.addVirtualDeploymentUnit=  function(){
		this.virtual_deployment_units.push(new VirtualDeploymentUnit());
		$(units).accordion("refresh");
	};
	this.deleteVirtualDeploymentUnit=  function(virtualDeploymentUnit){
		this.virtual_deployment_units.remove(virtualDeploymentUnit);
	}.bind(this);
	
	this.addConnectionPoint=  function(){
		this.connection_points.push(new ConnectionPoint());
	};
	this.deleteConnectionPoint=  function(connectionPoint){
		this.connection_points.remove(connectionPoint);
	}.bind(this);
	
	this.addVirtualLink=  function(){
		this.virtual_links.push(new VirtualLink());
	};
	this.deleteVirtualLink=  function(virtualLink){
		this.virtual_links.remove(virtualLink);
	}.bind(this);
	
	this.addDeploymentFlavour=  function(){
		this.deployment_flavours.push(new DeploymentFlavour());
	};
	this.deleteDeploymentFlavour=  function(deploymentFlavour){
		this.deployment_flavours.remove(deploymentFlavour);
	}.bind(this);
	
	this.addLifecycleEvent=  function(){
		this.lifecycle_events.push(new LifecycleEvent());
	};
	this.deleteLifecycleEvent=  function(lifecycleEvent){
		this.lifecycle_events.remove(lifecycleEvent);
	}.bind(this);
	
	this.addMonitoringRule =  function(){
		this.monitoring_rules.push(new MonitoringRule());
	};
	this.deleteMonitoringRule = function(monitoring_rule){
		this.monitoring_rules.remove(monitoring_rule);
	}.bind(this);
};

function updateVnfViewModel(vnf) 
{
	console.log(vnf);
	this.schema = vnf.schema;
	this.descriptor_version = vnf.descriptor_version;
	this.vendor = vnf.vendor;
	this.name = vnf.name;
	this.version= vnf.version;
	this.author = vnf.author;
	this.description= vnf.description;
	this.function_specific_managers=vnf.function_specific_managers;
	this.virtual_deployment_units = ko.observableArray(vnf.virtual_deployment_units);
	this.connection_points=ko.observableArray(vnf.connection_points);
	this.virtual_links = ko.observableArray(vnf.virtual_Links);
	this.lifecycle_events=ko.observableArray(vnf.lifecycle_events);
	this.deployment_flavours=ko.observableArray(vnf.deployment_flavours);
	this.monitoring_rules=ko.observableArray(vnf.monitoring_rules);
	
	this.addFunctionSpecificManager=  function(){
		this.function_specific_managers.push(new FunctionSpecificManager());
	};
	this.deleteFunctionSpecificManager=  function(functionSpecificManager){
		this.function_specific_managers.remove(functionSpecificManager);
	}.bind(this);
	
	this.addVirtualDeploymentUnit=  function(){
		this.virtual_deployment_units.push(new VirtualDeploymentUnit());
		$(units).accordion("refresh");
	};
	this.deleteVirtualDeploymentUnit=  function(virtualDeploymentUnit){
		this.virtual_deployment_units.remove(virtualDeploymentUnit);
	}.bind(this);
	
	this.addConnectionPoint=  function(){
		this.connection_points.push(new ConnectionPoint());
	};
	this.deleteConnectionPoint=  function(connectionPoint){
		this.connection_points.remove(connectionPoint);
	}.bind(this);
	
	this.addVirtualLink=  function(){
		this.virtual_links.push(new VirtualLink());
	};
	this.deleteVirtualLink=  function(virtualLink){
		this.virtual_links.remove(virtualLink);
	}.bind(this);
	
	this.addDeploymentFlavour=  function(){
		this.deployment_flavours.push(new DeploymentFlavour());
	};
	this.deleteDeploymentFlavour=  function(deploymentFlavour){
		this.deployment_flavours.remove(deploymentFlavour);
	}.bind(this);
	
	this.addLifecycleEvent=  function(){
		this.lifecycle_events.push(new LifecycleEvent());
	};
	this.deleteLifecycleEvent=  function(lifecycleEvent){
		this.lifecycle_events.remove(lifecycleEvent);
	}.bind(this);
	
	this.addMonitoringRule =  function(){
		this.monitoring_rules.push(new MonitoringRule());
	};
	this.deleteMonitoringRule = function(monitoring_rule){
		this.monitoring_rules.remove(monitoring_rule);
	}.bind(this);
}
/*Other page events*/
$(document).ready(function () {
	queryString = getQueryString();
	document.getElementById("nav_workspace").text = "Workspace: " + queryString["wsName"];
	document.getElementById("nav_project").text = "Project: " + queryString["ptName"];
	if (queryString["vnfName"] != undefined)
		document.getElementById("nav_vnf").text = "VNF: " + queryString["vnfName"];
	units = document.getElementById("accordion_units");
	vnfViewModel=new vnfViewModel();
	if(queryString["loadVnf"]=="true")
	{
			loadVnf(queryString["vnfId"]);
	}
	ko.applyBindings(vnfViewModel);
	$("#accordion_units").accordion({
		active : false,
		collapsible : true,
		heightStyle : "content"
	});
	$("#accordion").accordion({
		active : false,
		collapsible : true,
		heightStyle : "content"
	});
	
});

function submitTables() {
	var jsonData=ko.toJSON(vnfViewModel);
	//correct some variable names
	jsonData=jsonData.replace(/SR_IOV/g,"SR-IOV");
	jsonData=jsonData.replace(/scale_in/g,"scale-in");
	jsonData=jsonData.replace(/scale_out/g,"scale-out");
	//console.log(jsonData);
	createNewVnf(jsonData);
}

function createNewVnf(jsonData) {
	$.ajax({
		url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/functions/",
		method : 'POST',
		contentType : "application/json; charset=utf-8",
		dataType : 'json',
		xhrFields : {
			withCredentials : true
		},
		data : jsonData,
		success : function (data) {
			$("#successVnfDialog").dialog({
				modal : true,
				draggable : false,
				buttons : {
					ok : function () {
						$(this).dialog("close");
						goToProjectView();
					}
				}
			});
		},
		error : function (err) {
			$('#errorDialog').text(err.responseText);
			$('#errorDialog').dialog({
				modal : true,
				buttons : {
					Ok : function () {
						$(this).dialog("close");
					}
				}
			});
		}
	});
}


function goToProjectView() {
	window.location.href = "projectView.html?wsName=" + queryString["wsName"] + "&wsId=" + queryString["wsId"] + "&ptName=" + queryString["ptName"] + "&ptId=" + queryString["ptId"];
}

function loadVnf(vnfId)
{
	$.ajax({
		url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/functions/"+vnfId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			updateVnfViewModel(data.descriptor);
		}
	});
}

