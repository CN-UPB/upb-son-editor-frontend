var queryString = {};
var projectModel;
var availableCatalogues=[];

var ProjectModel = function () {
	this.name = ko.observable();
	this.maintainer = ko.observable();
	this.vendor=ko.observable();
	this.version=ko.observable();
	this.description=ko.observable();
	//this.publish_to=ko.observableArray();
	this.init=function(data){
		this.name(data.name);
		this.maintainer(data.maintainer);
		this.vendor(data.vendor);
		this.version(data.version);
		this.description(data.description);
		//this.publish_to(data.publish_to);
	}
}

//save the configuration from workspace and it will be called by clicking "save" button
function saveConfiguration() {
	selected=$(".chosen-select").val();
	//$("form").parsley().validate();
	//if ($("form").parsley().isValid()) 
	var configurationJson=ko.toJSON(projectModel);
	{
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
	}
	/*else {
		$("#FailedValidationDialog").dialog({
			modal : true,
			draggable : false,
			buttons : {
				ok : function () {
					$(this).dialog("close");
				}
			}
		});
	}*/
}


//load the current configuration of the workspace 
function loadConfiguration(ptId) {
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			projectModel.init(data);
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
			catalogues=data.catalogues;
			var selectBox=document.getElementById("select_box");
			for(i=0;i<catalogues.length;i++)
			{
				var catalogueName=catalogues[i].name;
				availableCatalogues.push(catalogueName);
				var op=document.createElement("option");
				op.value=i;
				op.innerHTML=catalogueName;
				selectBox.appendChild(op);
			}
			$(".chosen-select").chosen();
		}
	});
	ptId=queryString["ptId"];
	projectModel=new ProjectModel();
	loadConfiguration(ptId);
	ko.applyBindings(projectModel);
});
