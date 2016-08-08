var serverURL = "http://131.234.73.193:5000/";
var queryString = {};

$(document).ready(function () {
	queryString = getQueryString();
	document.getElementById("nav_workspace").text = "Workspace: " + queryString["wsName"];
	document.getElementById("nav_project").text = "Project: " + queryString["ptName"];
	if (queryString["vnfName"] != undefined)
		document.getElementById("nav_vnf").text = "VNF: " + queryString["vnfName"];
	$("#accordion").accordion({
		active : false,
		collapsible : true
	});
});
