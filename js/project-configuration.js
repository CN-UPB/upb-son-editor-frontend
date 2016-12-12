var queryString = {};
var projectModel;
var availableCatalogues=[];

var ProjectModel = function () {
	this.name = ko.observable();
	this.maintainer = ko.observable();
	this.vendor=ko.observable();
	this.version=ko.observable();
	this.description=ko.observable();
	this.publish_to=ko.observableArray();
	this.init=function(data){
		this.name(data.name);
		this.maintainer(data.maintainer);
		this.vendor(data.vendor);
		this.version(data.version);
		this.description(data.description);
		this.publish_to(data.publish_to);
		var selected=[];
		for(i=0;i<data.publish_to.length;i++)
		{
			var catalogueName=data.publish_to[i];
			if($.inArray(catalogueName,availableCatalogues)!=-1)
			{
				selected.push(catalogueName);
			}
		}
		$(".chosen-select").val(selected).trigger("chosen:updated");
	}
	this.setPublishTo=function(data)
	{
		this.publish_to(data);
	}
}

//save the configuration from project and it will be called by clicking "save" button
function saveConfiguration() {
	selected=$(".chosen-select").val();
	projectModel.setPublishTo(selected);
	$("form").parsley().validate();
	if ($("form").parsley().isValid()) 
	{
		var configurationJson=ko.toJSON(projectModel);
		$.ajax({
			url : serverURL + "workspaces/" + queryString["wsId"]+"/projects/"+queryString["ptId"],
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
	else {
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
	ptId=queryString["ptId"];
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
			for(var i=0;i<catalogues.length;i++)
			{
				var catalogueName=catalogues[i].name;
				availableCatalogues.push(catalogueName);
				var op=document.createElement("option");
				op.value=catalogueName;
				op.innerHTML=catalogueName;
				selectBox.appendChild(op);
			}
			$(".chosen-select").chosen();
		}
	});
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId ,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			document.getElementById("nav_project").text = "Project: " +data.name;
			
		}
	});
	projectModel=new ProjectModel();
	loadConfiguration(ptId);
	ko.applyBindings(projectModel);
});
