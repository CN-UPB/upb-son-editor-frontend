var queryString = {};
var workspaceModel;

var Catalogue = function () {
	this.name = ko.observable("");
	this.url = ko.observable("");
	this.id = ko.observable(-1);
	this.init = function (data) {
		this.name(data.name);
		this.url(data.url);
		this.id(data.id);
		return this;
	}
}
//save the configuration from workspace and it will be called by clicking "save" button
function saveConfiguration() {
	$("form").parsley().validate();
	if ($("form").parsley().isValid()) {
		$.ajax({
			url : serverURL + "workspaces/" + queryString["wsId"]+"projects/"+queryString["ptId"],
			method : 'PUT',
			contentType : "application/json; charset=utf-8",
			dataType : 'json',
			xhrFields : {
				withCredentials : true
			},
			data : configurationJson,
			success : function (data) {
				$("#successSaveConfiDialog").dialog({
					modal : true,
					draggable : false,
					buttons : {
						ok : function () {
							$(this).dialog("close");
							window.location.reload();
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


//load the current configuration of the workspace 
function loadConfiguration(ptId) {
	$.ajax({
		url : serverURL + "workspaces/" + wsId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			
		}
	});
}

$(document).ready(function () {
	queryString = getQueryString();
	wsId = queryString["wsId"];
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
	ptId=queryString["ptId"];
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
	loadConfiguration(ptId);
});
