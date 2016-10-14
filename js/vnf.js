var queryString = {};
var vnfViewModel;
var vnfForm;
var textDiv;
var container;
var isYamlEditor=false;

var FunctionSpecificManager = function () {
	this.description = ko.observable("");
	this.id = ko.observable("");
	this.image = ko.observable("");
	this.image_md5 = ko.observable("");
	this.resource_requirements = new ResourceRequirements();
	this.options = ko.observableArray();
	this.addOption = function () {
		this.options.push(new Option());
		$("form").parsley().validate();
	}
	.bind(this);
	this.deleteOption = function (option) {
		this.options.remove(option);
	}
	.bind(this);
	this.init = function (data) {
		this.description(data.description);
		this.id(data.id);
		this.image(data.image);
		this.image_md5(data.image_md5);
		this.resource_requirements.init(data.resource_requirements);
		this.options($.map(data.options, function (item) {
				return new Option().init(item)
			}));
		return this;
	};
}
var ResourceRequirements = function () {
	this.docker_version = ko.observable("");
	this.init = function (data) {
		this.docker_version(data.docker_version);
		return this;
	}
}
var Option = function () {
	this.key = ko.observable("");
	this.value = ko.observable("");
	this.init = function (data) {
		this.key(data.key);
		this.value(data.value);
		return this;
	}
}
var VirtualDeploymentUnit = function () {
	this.id = ko.observable("");
	this.vm_image = ko.observable("");
	this.vm_image_format = ko.observable("");
	this.vm_image_md5 = ko.observable("");
	this.resource_requirements = ko.observableArray();
	this.connection_points = ko.observableArray();
	this.monitoring_parameters = ko.observableArray();
	this.scale_in_out = new ScaleInOut();
	this.addRequirement = function () {
		this.resource_requirements.push(new ResourceRequirement());
		$("form").parsley().validate();
	}
	this.deleteRequirement = function (requirement) {
		this.resource_requirements.remove(requirement);
	}
	.bind(this);
	this.addPoint = function () {
		this.connection_points.push(new ConnectionPoint());
		$("form").parsley().validate();
	}
	this.removePoint = function (point) {
		this.connection_points.remove(point);
	}
	.bind(this);
	this.addParameter = function () {
		this.monitoring_parameters.push(new MonitoringParameter());
		$("form").parsley().validate();
	}
	this.deleteParameter = function (parameter) {
		this.monitoring_parameters.remove(parameter);
	}
	.bind(this);
	this.init = function (data) {
		this.id(data.id);
		this.vm_image(data.vm_image);
		this.vm_image_format(data.vm_image_format);
		this.vm_image_md5(data.vm_image_md5);
		this.resource_requirements($.map(data.resource_requirements, function (item) {
				return new ResourceRequirement().init(item)
			}));
		this.connection_points($.map(data.connection_points, function (item) {
				return new ConnectionPoint().init(item)
			}));
		this.monitoring_parameters($.map(data.monitoring_parameters, function (item) {
				return new MonitoringParameter().init(item)
			}));
		this.scale_in_out.init(data["scale-in-out"]);
		return this;
	}
}
var MonitoringParameter = function () {
	this.name = ko.observable("");
	this.unit = ko.observable("");
	this.frequency = ko.observable("");
	this.frequency_unit = ko.observable("");
	this.command = ko.observable("");
	this.init = function (data) {
		this.name(data.name);
		this.unit(data.unit);
		this.frequency(data.frequency);
		this.frequency_unit(data.frequency_unit);
		this.command(data.command);
		return this;
	}
}
var MonitoringRequirement = function () {
	this.name = ko.observable("");
	this.unit = ko.observable("");
	this.init = function (data) {
		this.name(data.name);
		this.unit(data.unit);
		return this;
	}
}
var HypervisorParameters = function () {
	this.type = ko.observable("");
	this.version = ko.observable("");
	this.init = function (data) {
		if (data != undefined) {
			this.type(data.type);
			this.version(data.version);
		}
		return this;
	}
}
var VswitchCapabilities = function () {
	this.version = ko.observable("");
	this.type = ko.observable("");
	this.overlay_tunnel = ko.observable("");
	this.init = function (data) {
		if (data != undefined) {
			this.version(data.version);
			this.type(data.type);
			this.overlay_tunnel(data.overlay_tunnel);
		}
		return this;
	}
}
var CPU = function () {
	this.vcpus = ko.observable(0);
	this.cpu_support_accelerator = ko.observable("");
	this.init = function (data) {
		if (data != undefined) {
			this.vcpus(data.vcpus);
			this.cpu_support_accelerator(data.cpu_support_accelerator);
		}
		return this;
	}
}
var Memory = function () {
	this.size = ko.observable(0);
	this.size_unit = ko.observable("MB");
	this.large_pages_required = ko.observable(false);
	this.numa_allocation_policy = ko.observable("");
	this.init = function (data) {
		if (data != undefined) {
			this.size(data.size);
			this.size_unit(data.size_unit);
			this.large_pages_required(data.large_pages_required),
			this.numa_allocation_policy(data.numa_allocation_policy);
		}
		return this;
	}
}
var Storage = function () {
	this.size = ko.observable(0);
	this.size_unit = ko.observable("MB");
	this.persistence = ko.observable(false);
	this.init = function (data) {
		if (data != undefined) {
			this.size(data.size);
			this.size_unit(data.size_unit);
			this.persistence(data.persistence);
		}
		return this;
	}
}
var PCIE = function () {
	this.SR_IOV = ko.observable(false);
	this.device_pass_through = ko.observable(false);
	this.init = function (data) {
		if (data != undefined) {
			this.SR_IOV(data["SR-IOV"]);
			this.device_pass_through(data.device_pass_through);
		}
		return this;
	}
}
var NICCaps = function () {
	this.SR_IOV = ko.observable(false);
	this.mirroring = ko.observable(false);
	this.init = function (data) {
		if (data != undefined) {
			this.SR_IOV(data["SR-IOV"]);
			this.mirroring(data.mirroring);
		}
		return this;
	}
}
var Network = function () {
	this.network_interface_bandwidth = ko.observable(0);
	this.network_interface_bandwidth_unit = ko.observable("");
	this.network_interface_card_capabilities = new NICCaps();
	this.data_processing_acceleration_library = ko.observable("");
	this.init = function (data) {
		if (data != undefined) {
			this.network_interface_bandwidth(data.network_interface_bandwidth);
			this.network_interface_bandwidth_unit(data.network_interface_bandwidth_unit);
			this.network_interface_card_capabilities.init(data.network_interface_card_capabilities);
			this.data_processing_acceleration_library(data.data_processing_acceleration_library);
		}
		return this;
	}
}
var ScaleInOut = function () {
	this.minimum = ko.observable(1);
	this.maximum = ko.observable(1);
	this.init = function (data) {
		if (data) {
			this.minimum(data.minimum);
			this.maximum(data.maximum);
		}
		return this;
	}
}
var ResourceRequirement = function () {
	this.hypervisor_parameters = new HypervisorParameters();
	this.vswitch_capabilities = new VswitchCapabilities();
	this.cpu = new CPU();
	this.memory = new Memory();
	this.storage = new Storage();
	this.network = new Network();
	this.pcie = new PCIE();
	this.init = function (data) {
		if (data != undefined) {
			this.hypervisor_parameters.init(data.hypervisor_parameters);
			this.vswitch_capabilities.init(data.vswitch_capabilities);
			this.cpu.init(data.cpu);
			this.memory.init(data.memory);
			this.storage.init(data.storage);
			this.network.init(data.network);
			this.pcie.init(data.pcie);
		}
		return this;
	}
}
var ConnectionPoint = function () {
	this.id = ko.observable("");
	this.type = ko.observable("");
	this.virtual_link_reference = ko.observable("");
	this.init = function (data) {
		this.id(data.id);
		this.type(data.type);
		this.virtual_link_reference(data.virtual_link_reference);
		return this;
	}
}
var VirtualLink = function () {
	this.id = ko.observable("");
	this.connectivity_type = ko.observable("");
	this.connection_points_reference = ko.observable("");
	this.access = ko.observable(false);
	this.external_access = ko.observable(false);
	this.root_requirement = ko.observable("");
	this.leaf_requirement = ko.observable("");
	this.dhcp = ko.observable(false);
	this.qos = ko.observable("");
	this.init = function (data) {
		this.id(data.id);
		this.connectivity_type(data.connectivity_type);
		this.connection_points_reference(data.connection_points_reference);
		this.access(data.access);
		this.external_access(data.external_access);
		this.root_requirement(data.root_requirement);
		this.leaf_requirement(data.leaf_requirement);
		this.dhcp(data.dhcp);
		this.qos(data.qos);
		return this;
	};
}
var Event = function () {
	this.command = ko.observable("");
	this.template_file = ko.observable("");
	this.template_file_format = ko.observable("");
	this.init = function (data) {
		if (data) {
			this.command(data.command);
			this.template_file(data.template_file);
			this.template_file_format(data.template_file_format);
		}
		return this;
	}
}
var Events = function () {
	this.start = new Event();
	this.stop = new Event();
	this.restart = new Event();
	this.scale_in = new Event();
	this.scale_out = new Event();
	this.init = function (data) {
		this.start.init(data.start);
		this.stop.init(data.stop);
		this.restart.init(data.restart);
		this.scale_in.init(data["scale-in"]);
		this.scale_out.init(data["scale-out"]);
		return this;
	}
}
var LifecycleEvent = function () {
	this.authentication_username = ko.observable("");
	this.driver = ko.observable("");
	this.authentication_type = ko.observable("");
	this.authentication = ko.observable("");
	this.vnf_container = ko.observable("");
	this.events = new Events();
	this.flavor_id_ref = ko.observable("");
	this.init = function (data) {
		this.authentication_username(data.authentication_username);
		this.driver(data.driver);
		this.authentication_type(data.authentication_type);
		this.authentication(data.authentication);
		this.vnf_container(data.vnf_container);
		this.events.init(data.events);
		this.flavor_id_ref(data.flavor_id_ref);
		return this;
	}
}
var DeploymentFlavour = function () {
	this.id = ko.observable("");
	this.flavour_key = ko.observable("");
	this.constraint = ko.observable("");
	this.vdu_reference = ko.observableArray();
	this.vlink_reference = ko.observableArray();
	this.assurance_parameters = ko.observableArray();
	this.addVduReference = function () {
		this.vdu_reference.push(new Text());
		$("form").parsley().validate();
	};
	this.deleteVduReference = function (vduReference) {
		this.vdu_reference.remove(vduReference);
	}
	.bind(this);
	this.addVlinkReference = function () {
		this.vlink_reference.push(new Text());
		$("form").parsley().validate();
	};
	this.deleteVlinkReference = function (vduReference) {
		this.vlink_reference.remove(vduReference);
	}
	.bind(this);
	this.addAssuranceParameter = function () {
		this.assurance_parameters.push(new AssuranceParameter());
		$("form").parsley().validate();
		$("form").parsley().validate();
	};
	this.deleteAssuranceParameter = function (assuranceParameter) {
		this.assurance_parameters.remove(assuranceParameter);
	}
	.bind(this);
	this.init = function (data) {
		this.id(data.id);
		this.flavour_key(data.flavour_key);
		this.constraint(data.constraint);
		this.vdu_reference($.map(data.vdu_reference, function (item) {
				return new Text().init(item)
			}));
		this.vlink_reference($.map(data.vlink_reference, function (item) {
				return new Text().init(item)
			}));
		this.assurance_parameters($.map(data.assurance_parameters, function (item) {
				return new AssuranceParameter().init(item)
			}));
		return this;
	}
}
var Text = function () {
	this.text = ko.observable("");
	this.init = function (data) {
		this.text(data);
		return this;
	}
}
var Violation = function () {
	this.interval = ko.observable("");
	this.breaches_count = ko.observable("");
	this.init = function (data) {
		this.interval(data.interval);
		this.breaches_count(data.breaches_count);
		return this;
	}
}
var Penalty = function () {
	this.type = ko.observable("");
	this.expression = ko.observable("");
	this.validity = ko.observable("");
	this.unit = ko.observable("");
	this.init = function (data) {
		this.type(data.type);
		this.expression(data.expression);
		this.validity(data.validity);
		this.unit(data.unit);
		return this;
	}
}
var AssuranceParameter = function () {
	this.violation = ko.observableArray();
	this.value = ko.observable("");
	this.penalty = new Penalty();
	this.formula = ko.observable("");
	this.rel_id = ko.observable("");
	this.id = ko.observable("");
	this.unit = ko.observable("");
	this.addViolation = function () {
		this.violation.push(new Violation());
		$("form").parsley().validate();
		$("form").parsley().validate();
	};
	this.deleteViolation = function (violation) {
		this.violation.remove(violation);
	}
	.bind(this);
	this.init = function (data) {
		this.violation($.map(data.violation, function (item) {
				return new Violation().init(item)
			}));
		this.value(data.value);
		this.penalty.init(data.penalty);
		this.formula(data.formula);
		this.rel_id(data.rel_id);
		this.id(data.id);
		this.unit(data.unit);
		return this;
	}
}
var MonitoringRule = function () {
	this.name = ko.observable("");
	this.description = ko.observable("");
	this.duration = ko.observable("");
	this.duration_unit = ko.observable("");
	this.condition = ko.observable("");
	this.notification = new Notification();
	this.init = function (data) {
		if (data != undefined) {
			this.name(data.name);
			this.description(data.description);
			this.duration(data.duration);
			this.duration_unit(data.duration_unit);
			this.condition(data.condition);
			this.notification.init(data.notification);
		}
		return this;
	}
}
var Notification = function () {
	this.name = ko.observable("");
	this.type = ko.observable("");
	this.init = function (data) {
		this.name(data.name);
		this.type(data.type);
		return this;
	}
}
var vnfViewModel = function () {
	this.schema = ko.observable();
	this.descriptor_version = ko.observable();
	this.vendor = ko.observable();
	this.name = ko.observable();
	this.version = ko.observable();
	this.author = ko.observable();
	this.description = ko.observable();
	this.function_specific_managers = ko.observableArray();
	this.virtual_deployment_units = ko.observableArray([new VirtualDeploymentUnit()]);
	this.connection_points = ko.observableArray();
	this.virtual_links = ko.observableArray();
	this.lifecycle_events = ko.observableArray([new LifecycleEvent()]);
	this.deployment_flavours = ko.observableArray();
	this.monitoring_rules = ko.observableArray();
	this.addFunctionSpecificManager = function () {
		this.function_specific_managers.push(new FunctionSpecificManager());
		$("form").parsley().validate();
	};
	this.deleteFunctionSpecificManager = function (functionSpecificManager) {
		this.function_specific_managers.remove(functionSpecificManager);
	}
	.bind(this);
	this.addVirtualDeploymentUnit = function () {
		this.virtual_deployment_units.push(new VirtualDeploymentUnit());
		$("#accordion_units").accordion("refresh");
		$("form").parsley().validate();
	};
	this.deleteVirtualDeploymentUnit = function (virtualDeploymentUnit) {
		this.virtual_deployment_units.remove(virtualDeploymentUnit);
	}
	.bind(this);
	this.addConnectionPoint = function () {
		this.connection_points.push(new ConnectionPoint());
		$("form").parsley().validate();
	};
	this.deleteConnectionPoint = function (connectionPoint) {
		this.connection_points.remove(connectionPoint);
	}
	.bind(this);
	this.addVirtualLink = function () {
		this.virtual_links.push(new VirtualLink());
		$("form").parsley().validate();
	};
	this.deleteVirtualLink = function (virtualLink) {
		this.virtual_links.remove(virtualLink);
	}
	.bind(this);
	this.addDeploymentFlavour = function () {
		this.deployment_flavours.push(new DeploymentFlavour());
		$("form").parsley().validate();
	};
	this.deleteDeploymentFlavour = function (deploymentFlavour) {
		this.deployment_flavours.remove(deploymentFlavour);
	}
	.bind(this);
	this.addLifecycleEvent = function () {
		this.lifecycle_events.push(new LifecycleEvent());
		$("form").parsley().validate();
	};
	this.deleteLifecycleEvent = function (lifecycleEvent) {
		this.lifecycle_events.remove(lifecycleEvent);
	}
	.bind(this);
	this.addMonitoringRule = function () {
		this.monitoring_rules.push(new MonitoringRule());
		$("form").parsley().validate();
	};
	this.deleteMonitoringRule = function (monitoring_rule) {
		this.monitoring_rules.remove(monitoring_rule);
	}
	.bind(this);
	this.init = function (vnf) {
		vnfViewModel.schema(vnf.schema);
		vnfViewModel.descriptor_version(vnf.descriptor_version);
		vnfViewModel.vendor(vnf.vendor);
		vnfViewModel.name(vnf.name);
		vnfViewModel.version(vnf.version);
		vnfViewModel.author(vnf.author);
		vnfViewModel.description(vnf.description);
		vnfViewModel.function_specific_managers($.map(vnf.function_specific_managers, function (item) {
				return new FunctionSpecificManager().init(item)
			}));
		vnfViewModel.virtual_deployment_units($.map(vnf.virtual_deployment_units, function (item) {
				return new VirtualDeploymentUnit().init(item)
			}));
		vnfViewModel.connection_points($.map(vnf.connection_points, function (item) {
				return new ConnectionPoint().init(item)
			}));
		vnfViewModel.virtual_links($.map(vnf.virtual_links, function (item) {
				return new VirtualLink().init(item)
			}));
		vnfViewModel.lifecycle_events($.map(vnf.lifecycle_events, function (item) {
				return new LifecycleEvent().init(item)
			}));
		vnfViewModel.deployment_flavours($.map(vnf.deployment_flavours, function (item) {
				return new DeploymentFlavour().init(item)
			}));
		vnfViewModel.monitoring_rules($.map(vnf.monitoring_rules, function (item) {
				return new MonitoringRule().init(item)
			}));
		$("form").parsley().validate();
	};
};
function saveTables() {
	if(isYamlEditor)
	{	var yamlData = tinyMCE.activeEditor.getContent({
				format : 'raw'
			});
		yamlData=yamlData.replace(/<br\s*[\/]?>/gi, "\n");
		yamlData=yamlData.replace(/&nbsp;/g, " ")
		yamlData=yamlData.replace(/<p>/g, "");
		yamlData=yamlData.replace(/<\/p>/g, "");
		updateViewModel(yamlData);
	}
	$("form").parsley().validate();
	if ($("form").parsley().isValid()) {
		var jsonData = ko.toJSON(vnfViewModel);
		jsonData = jsonData.replace(/SR_IOV/g, "SR-IOV");
		jsonData = jsonData.replace(/scale_in_out/g, "scale-in-out");
		jsonData = jsonData.replace(/scale_in/g, "scale-in");
		jsonData = jsonData.replace(/scale_out/g, "scale-out");
		if (queryString["operation"] != "edit") {
			createNewVnf(jsonData);
		} else {
			updateVnf(jsonData);
		}
	} else {
		$("#FailedValidationDialog").dialog({
			modal : true,
			draggable : false,
			buttons : {
				ok : function () {
					$(this).dialog("close");
				}
			}
		});
	}
}
function updateVnf(jsonData) {
	$.ajax({
		url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/functions/" + queryString["vnfId"],
		method : 'PUT',
		contentType : "application/json; charset=utf-8",
		dataType : 'json',
		xhrFields : {
			withCredentials : true
		},
		data : jsonData,
		success : function (data) {
			$("#successVnfDialogUpdated").dialog({
				modal : true,
				draggable : false,
				buttons : {
					ok : function () {
						$(this).dialog("close");
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
						window.location.href = "vnfView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&vnfId=" + data.id + "&operation=" + "edit";
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
function loadVnf(vnfId) {
	$.ajax({
		url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/functions/" + vnfId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			document.getElementById("nav_vnf").text = "VNF: " + data.name;
			vnfViewModel.init(data.descriptor);
			$("#accordion_units").accordion("refresh");
			$("[title]").tooltip();
		}
	});
}

function readJsonObject(str, obj) {
	var yamlData = "";
	var i = 0;
	for (var key in obj) {
		if (i == 0) {
			if (str != "")
				yamlData += "-";
			yamlData += str + key + ": ";
		} else {
			yamlData += str + str + key + ": ";
		}
		i++;
		var val = obj[key];
		var valType = typeof obj[key];
		if (valType == "string") {
			if (val.length == 0) {
				yamlData += '""' + "<br>";
			} else {
				yamlData += obj[key] + "<br>";
			}
		} else {
			if (val.length == 0) {
				yamlData += "[]" + "<br>";
			} else {
				yamlData += "<br>";
				for (var k in val) {
					yamlData += readJsonObject("&nbsp;", val[k]);
				}
			}
		}
	}
	return yamlData;
}

function convertToYaml() {
	var jsonData = ko.toJSON(vnfViewModel);
	jsonData = jsonData.replace(/SR_IOV/g, "SR-IOV");
	jsonData = jsonData.replace(/scale_in_out/g, "scale-in-out");
	jsonData = jsonData.replace(/scale_in/g, "scale-in");
	jsonData = jsonData.replace(/scale_out/g, "scale-out");
	var jsonObj = JSON.parse(jsonData);
	return jsyaml.safeDump(jsonObj,{indent: 4});
}

function updateViewModel(yamlData) {
	console.log(yamlData);
	yamlData = yamlData.replace(/<p>/g, "");
	yamlData = yamlData.replace(/&nbsp;/g, "");
	yamlData = yamlData.replace(/SR-IOV/g, "SR_IOV");
	yamlData = yamlData.replace(/scale-in-out/g, "scale_in_out");
	yamlData = yamlData.replace(/scale-in/g, "scale_in");
	yamlData = yamlData.replace(/scale-out/g, "scale_out");
	var jsonObj = jsyaml.safeLoad(yamlData);
	vnfViewModel.init(jsonObj);
	$("#accordion_units").accordion("refresh");
}

function switchViews() {
	var switchButton = document.getElementById("switchButton");
	var previous = document.getElementById("previous");
	var saveButton = document.getElementById("saveButton");
	if (!isYamlEditor) {
		switchButton.innerHTML = "Switch to normal editor";
		isYamlEditor=true;
		var yamlData = convertToYaml();
		yamlData=yamlData.replace(/\r?\n/g, '<br/>');
		yamlData=yamlData.replace(/\s/g, '&nbsp;')
		tinyMCE.activeEditor.setContent(yamlData);
		vnfForm.style.visibility = "hidden";
		textDiv.style.visibility = "visible";
		container.appendChild(saveButton);
		container.appendChild(previous);
		container.appendChild(vnfForm);

	} else {
		switchButton.innerHTML = "Switch to YAML editor";
		isYamlEditor=false;
		var yamlData = tinyMCE.activeEditor.getContent({
				format : 'raw'
			});
		yamlData=yamlData.replace(/<br\s*[\/]?>/gi, "\n");
		yamlData=yamlData.replace(/&nbsp;/g, " ")
		yamlData=yamlData.replace(/<p>/g, "");
		yamlData=yamlData.replace(/<\/p>/g, "");
		updateViewModel(yamlData);
		vnfForm.style.visibility = "visible";
		textDiv.style.visibility = "hidden";
		container.insertBefore(previous, textDiv);
		container.insertBefore(saveButton, previous);
		container.insertBefore(vnfForm, saveButton);
	}
}
$(document).ready(function () {
	queryString = getQueryString();
	var wsId = queryString["wsId"];
	var ptId = queryString["ptId"];
	$.ajax({
		url : serverURL + "workspaces/" + wsId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			document.getElementById("nav_workspace").text = "Workspace: " + data.name;
		}
	});
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			document.getElementById("nav_project").text = "Project: " + data.name;
		}
	});
	vnfViewModel = new vnfViewModel();
	if (queryString["operation"] != "create") {
		loadVnf(queryString["vnfId"]);
	}
	ko.applyBindings(vnfViewModel);
	$("#accordion_units").accordion({
		active : false,
		collapsible : false,
		heightStyle : "content"
	});
	$("#accordion").accordion({
		active : false,
		collapsible : true,
		heightStyle : "content"
	});
	$("[title]").tooltip();
	tinymce.init({
		selector : 'textarea',
		height : 500,
		menubar : false,
		toolbar : 'undo redo | bold italic ',
		setup : function (ed) {
			ed.on('init', function () {
				this.getDoc().body.style.fontSize = '15px';
			});
		}
	});
	vnfForm = document.getElementById("vnfForm");
	textDiv = document.getElementById("textDiv");
	textDiv.style.visibility = "hidden";
	container = vnfForm.parentNode;
});
