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
