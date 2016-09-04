var vnfs = [];
var services = [];
var queryString = {};
var wsId = "";
var ptId = "";
var availableItems = [];
var itemDictionary = {};
$(document).ready(function () {
	queryString = getQueryString();
	document.getElementById("nav_workspace").text = "Workspace: " + queryString["wsName"];
	document.getElementById("nav_project").text = "Project: " + queryString["ptName"];
	wsId = queryString["wsId"];
	ptId = queryString["ptId"];
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
				tdOptions.innerHTML = "Edit";
				var trService = document.createElement("tr");
				trService.appendChild(tdName);
				trService.appendChild(tdInfo);
				trService.appendChild(tdType);
				trService.appendChild(tdOptions);
				document.getElementById("display_NS_VNFS").appendChild(trService);
				(function (serviceName, serviceId) {
					trService.addEventListener('click', function () {
						goToServiceView(serviceName, serviceId);
					}, false);
				})(serviceName, serviceId)
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
				var trService = document.createElement("tr");
				trService.appendChild(tdName);
				trService.appendChild(tdInfo);
				trService.appendChild(tdType);
				trService.appendChild(tdOptions);
				document.getElementById("display_NS_VNFS").appendChild(trService);
				(function (vnfName, vnfId) {
					tdEdit.addEventListener('click', function () {
						editVnf(vnfName, vnfId);
					}, false);
					tdClone.addEventListener('click', function () {
						cloneVnf(vnfName, vnfId);
					}, false);
					tdDelete.addEventListener('click', function () {
						deleteVnf(vnfId);
					}, false);
				})(vnfName, vnfId)
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

function deleteVnf(vnfId) {
	$("#ConfirmDeletionDialog").dialog({
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

function cloneVnf(vnfName, vnfId) {
	window.location.href = "vnfView.html?wsName=" + queryString["wsName"] + "&wsId=" + queryString["wsId"] + "&ptName=" + queryString["ptName"] + "&ptId=" + queryString["ptId"] + "&vnfName=" + vnfName + "&vnfId=" + vnfId + "&operation=" + "clone";

}

function createNewVnf() {
	window.location.href = "vnfView.html?wsName=" + queryString["wsName"] + "&wsId=" + queryString["wsId"] + "&ptName=" + queryString["ptName"] + "&ptId=" + queryString["ptId"] + "&operation=" + "create";
}

function createNewService() {
	window.location.href = "nsView.html?wsName=" + queryString["wsName"] + "&wsId=" + queryString["wsId"] + "&ptName=" + queryString["ptName"] + "&ptId=" + queryString["ptId"];
}

function goToServiceView(serviceName, serviceId) {
	window.location.href = "nsView.html?wsName=" + queryString["wsName"] + "&wsId=" + queryString["wsId"] + "&ptName=" + queryString["ptName"] + "&ptId=" + queryString["ptId"] + "&serviceName=" + serviceName + "&serviceId=" + serviceId;
}

function editVnf(vnfName, vnfId) {
	window.location.href = "vnfView.html?wsName=" + queryString["wsName"] + "&wsId=" + queryString["wsId"] + "&ptName=" + queryString["ptName"] + "&ptId=" + queryString["ptId"] + "&vnfName=" + vnfName + "&vnfId=" + vnfId + "&operation=" + "edit";
}
