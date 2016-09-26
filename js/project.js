var vnfs = [];
var services = [];
var queryString = {};
var wsId = "";
var ptId = "";
var nsId = "";
var availableItems = [];
var itemDictionary = {};

$(document).ready(function () {
	queryString = getQueryString();
	wsId = queryString["wsId"];
	ptId = queryString["ptId"];
	nsId = queryString["nsId"];

	$.ajax({
		url : serverURL + "workspaces/" + wsId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			document.getElementById("nav_workspace").text = "Workspace: " +data.name;
		}
	});
		$.ajax({
		url : serverURL + "workspaces/" + wsId+"/projects/" + ptId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			document.getElementById("nav_project").text = "Project: " +data.name;
		}
	});
	loadServices();
	loadVnfs();
	//search bar(uses jquery ui Autocomplete)
	$("#search_item").autocomplete({
		source : availableItems,
		select : function (event, ui) {
			var item = ui.item.label;
			var selectedId;
			if (item.startsWith("NS")) {
				item = item.substring(4, item.length);
				selectedId = itemDictionary[item];
				goToServiceView(item, selectedId);
			} else {
				item = item.substring(5, item.length);
				selectedId = itemDictionary[item];
				editVnf(item, selectedId);
			}
		}
	});
});

function loadServices() {
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/services/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			console.log("services:");
			console.log(data);
			//display available services and their onclick event.
			services = data;
			for (i = 0; i < services.length; i++) {
				var serviceName = services[i].name;
				availableItems.push("NS: " + serviceName);
				var serviceId = services[i].id;
				itemDictionary[serviceName] = serviceId;
				var serviceInfo = services[i].descriptor.description;
				var tdName = document.createElement("td");
				tdName.innerHTML = serviceName;
				var tdInfo = document.createElement("td");
				tdInfo.innerHTML = serviceInfo;
				var tdType = document.createElement("td");
				tdType.innerHTML = "NS";
				var tdOptions = document.createElement("td");
				var optionTable = document.createElement("table");
				var trOptionTable = document.createElement("tr");
				var tdEdit = document.createElement("td");
				tdEdit.className = "btn btn-primary btn-sm";
				tdEdit.style.marginLeft = "10px";
				tdEdit.style.marginRight = "15px";
				tdEdit.innerHTML = "Edit";
				var tdClone = document.createElement("td");
				tdClone.className = "btn btn-primary btn-sm";
				tdClone.style.marginRight = "15px";
				tdClone.innerHTML = "Clone";
				var tdDelete = document.createElement("td");
				tdDelete.className = "btn btn-danger btn-sm";
				tdDelete.innerHTML = "Delete";
				trOptionTable.appendChild(tdEdit);
				trOptionTable.appendChild(tdClone);
				trOptionTable.appendChild(tdDelete);
				optionTable.appendChild(trOptionTable);
				tdOptions.appendChild(optionTable);
				var trService = document.createElement("tr");
				trService.appendChild(tdName);
				trService.appendChild(tdInfo);
				trService.appendChild(tdType);
				trService.appendChild(tdOptions);
				document.getElementById("display_NS_VNFS").appendChild(trService);
				(function (serviceId) {
					tdEdit.addEventListener('click', function () {

						editService(serviceId);

					}, false);
					tdClone.addEventListener('click', function () {
						cloneService(serviceId);
					}, false);
					tdDelete.addEventListener('click', function () {
						deleteService(nsId);
					}, false);
					})(serviceId)
			}
		}
	});
}

function loadVnfs() {
	vnf = [];
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/functions/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			console.log("vnfs:");
			console.log(data);
			//display available vnfs and their onclick event.
			vnfs = data;
			for (i = 0; i < vnfs.length; i++) {
				var vnfName = vnfs[i].name;
				availableItems.push("VNF: " + vnfName);
				var vnfId = vnfs[i].id;
				itemDictionary[vnfName] = vnfId;
				var vnfInfo = vnfs[i].descriptor.description;
				var tdName = document.createElement("td");
				tdName.innerHTML = vnfName;
				var tdInfo = document.createElement("td");
				tdInfo.innerHTML = vnfInfo;
				var tdType = document.createElement("td");
				tdType.innerHTML = "VNF";
				var tdOptions = document.createElement("td");
				var optionTable = document.createElement("table");
				var trOptionTable = document.createElement("tr");
				var tdEdit = document.createElement("td");
				tdEdit.className = "btn btn-primary btn-sm";
				tdEdit.style.marginLeft = "10px";
				tdEdit.style.marginRight = "15px";
				tdEdit.innerHTML = "Edit";
				var tdClone = document.createElement("td");
				tdClone.className = "btn btn-primary btn-sm";
				tdClone.style.marginRight = "15px";
				tdClone.innerHTML = "Clone";
				var tdDelete = document.createElement("td");
				tdDelete.className = "btn btn-danger btn-sm";
				tdDelete.innerHTML = "Delete";
				trOptionTable.appendChild(tdEdit);
				trOptionTable.appendChild(tdClone);
				trOptionTable.appendChild(tdDelete);
				optionTable.appendChild(trOptionTable);
				tdOptions.appendChild(optionTable);
				var trVnf = document.createElement("tr");
				trVnf.appendChild(tdName);
				trVnf.appendChild(tdInfo);
				trVnf.appendChild(tdType);
				trVnf.appendChild(tdOptions);
				document.getElementById("display_NS_VNFS").appendChild(trVnf);
				(function (vnfId) {
					tdEdit.addEventListener('click', function () {
						editVnf(vnfId);
					}, false);
					tdClone.addEventListener('click', function () {
						cloneVnf(vnfId);
					}, false);
					tdDelete.addEventListener('click', function () {
						deleteVnf(vnfId);
					}, false);
				})(vnfId)
			}
		}
	});
}

function loadList(selectedIndex) {
	document.getElementById("display_NS_VNFS").innerHTML = "";
	availableItems = [];
	itemDictionary = {};
	switch (selectedIndex) {
	case 0:
		loadServices();
		loadVnfs();
		break;
	case 1:
		loadServices();
		break;
	default:
		loadVnfs();
		break;
	}
}
function deleteService(serviceId) {
	$("#ConfirmDeletionDialog_Service").dialog({
		modal : true,
		draggable : false,
		buttons : {
			Yes : function () {
				$(this).dialog("close");
				$.ajax({
					url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/" + serviceId,
					dataType : "json",
					type : 'DELETE',
					xhrFields : {
						withCredentials : true
					},
					success : function (data) {
						$("#DeleteServiceDialog").dialog({
							modal : true,
							draggable : false,
							buttons : {
								Ok : function () {
									$(this).dialog("close");
									window.location.reload();
								}
							}
						});
					}
				});
			},
			No : function () {
				$(this).dialog("close");
			}

		},

	});
}

function deleteVnf(vnfId) {
	$("#ConfirmDeletionDialog_VNF").dialog({
		modal : true,
		draggable : false,
		buttons : {
			Yes : function () {
				$(this).dialog("close");
				$.ajax({
					url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/functions/" + vnfId,
					dataType : "json",
					type : 'DELETE',
					xhrFields : {
						withCredentials : true
					},
					success : function (data) {
						$("#DeleteVnfDialog").dialog({
							modal : true,
							draggable : false,
							buttons : {
								Ok : function () {
									$(this).dialog("close");
									window.location.reload();
								}
							}
						});
					}
				});
			},
			No : function () {
				$(this).dialog("close");
			}

		},

	});
}

function cloneService(serviceId) {
	window.location.href = "nsView.html?wsId=" + queryString["wsId"] +  "&ptId=" + queryString["ptId"] + "&serviceId=" + serviceId+"&operation="+"clone";

}

function cloneVnf(vnfId) {
	window.location.href = "vnfView.html?wsId=" + queryString["wsId"] +  "&ptId=" + queryString["ptId"] + "&vnfId=" + vnfId + "&operation=" + "clone";

}

function createNewVnf() {
	window.location.href = "vnfView.html?wsId=" + queryString["wsId"] +  "&ptId=" + queryString["ptId"] + "&operation=" + "create";
}



/*function createNewService(name, id) {
	window.location.href = "nsView.html?wsName=" + queryString["wsName"] + "&wsId=" + queryString["wsId"] + "&ptName=" + queryString["ptName"] + "&ptId=" + queryString["ptId"] + "&nsName=" + queryString["nsName"] + "&nsId=" + queryString["nsId"];
}*/

function createNewService(nsName, nsId) {
	window.location.href = "nsView.html?wsName=" + queryString["wsName"] + "&wsId=" + queryString["wsId"] + "&ptName=" + queryString["ptName"] + "&ptId=" + queryString["ptId"] +  "&nsName=" + nsName + "&nsId=" + nsId;
}

function editService(serviceId) {
	window.location.href = "nsView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] +  "&serviceId=" + serviceId+"&operation="+"edit";

}

function editVnf(vnfId) {
	window.location.href = "vnfView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&vnfId=" + vnfId + "&operation=" + "edit";
}

//create new networkservice dialog (uses jquery ui Dialog)
function showCreateNSDialog() {
	$("#createNetworkserviceDialog").dialog({
		modal : true,
		draggable : false,
		buttons : {
			Cancel : function (){
				$(this).dialog("close");
			},
			"Create" : function () {
				createNewNetworkservice();
				$(this).dialog("close");
			}
		}
	});
}

//send the name of the new networkservice to server
function createNewNetworkservice() {
	name    = $('#nsNameInput').val();
	vendor  = $('#nsVendorInput').val();
	version = $('#nsVersionInput').val();
	
	$.ajax({
		url : serverURL + "/workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/",
		method : 'POST',
		contentType : "application/json; charset=utf-8",
		dataType : 'json',
		xhrFields : {
			withCredentials : true
		},
		data : JSON.stringify({
			"version": version,
			"vendor": vendor,
			"name": name
		}),
		success : function (data) {
			goToServiceView(data.name, data.id);
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

function goToServiceView(nsName, nsId) {
	//Removing the name parameter from URL
	  window.location.href = "nsView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&nsId=" + nsId;

}

$.get(serverURL + "/workspaces/" + wsId + "/projects/" + ptId + "/services/" + nsId )
