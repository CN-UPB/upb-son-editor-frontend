var queryString = {};
var vnf = {
	"descriptor_version" : "",
	"verdor" : "",
	"name" : "",
	"virtual_deployment_units" : [],
	"virtual_links" : []
};
var numOfUnits = 1;
var units;

$(document).ready(function () {
	queryString = getQueryString();
	document.getElementById("nav_workspace").text = "Workspace: " + queryString["wsName"];
	document.getElementById("nav_project").text = "Project: " + queryString["ptName"];
	if (queryString["vnfName"] != undefined)
		document.getElementById("nav_vnf").text = "VNF: " + queryString["vnfName"];
	units = document.getElementById("accordion_units");
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
function submitInfos() {
	alert("submit");
}
function createNewVnf(vnfName) {
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/functions/",
		method : 'POST',
		contentType : "application/json; charset=utf-8",
		dataType : 'json',
		xhrFields : {
			withCredentials : true
		},
		data : JSON.stringify({
			"name" : vnfName
		}),
		success : function (data) {
			$("#successVnfDialog").dialog({
				modal : true,
				draggable : false,
				buttons : {
					ok : function () {
						$(this).dialog("close");
					}
				}
			});
			goToProjectView();
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

function addVirtualUnit() {
	numOfUnits++;
	var uhead=document.createElement("h3");
	uhead.innerHTML="Unit "+numOfUnits;
	var utable= document.getElementById("unit_table1").cloneNode(true);
	utable.id="unit_table"+numOfUnits;
	var unit=document.createElement("div");
	unit.id = "accordion_unit" + numOfUnits;
	unit.class="subaccordion";
	units.appendChild(uhead);
	units.appendChild(utable);
	$(units).accordion("refresh");
}

function deleteVirtualUnit() {
	if (numOfUnits > 1) {
		units.lastChild.remove();
		units.lastChild.remove();
		numOfUnits--;
	}
}

function addPoint(tName) {
	var utable=document.getElementById(tName);
	var points=$(utable).find("#connection_points")[0];
	var point= document.getElementById("connection_point").cloneNode(true);
	points.appendChild(point);
}

function deletePoint(tName) {
	var utable=document.getElementById(tName);
	var points=$(utable).find("#connection_points")[0];
	points.lastChild.remove();
}

function addParameter(tName) {
	var utable=document.getElementById(tName);
	var pars=$(utable).find("#monitoring_parameters")[0];
	var par= document.getElementById("monitoring_parameter").cloneNode(true);
	pars.appendChild(par);
}

function deleteParameter(tName) {
	var utable=document.getElementById(tName);
	var pars=$(utable).find("#monitoring_parameters")[0];
	pars.lastChild.remove();
}
