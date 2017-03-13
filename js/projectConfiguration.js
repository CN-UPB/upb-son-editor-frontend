/**
 * It is used in projectConfiguration.html
 */
var queryString = {};
/**
 * an instance of ProjectModel
 */
var projectModel;
/**
 * stores the available catalogues of the current workspace
 */
var availableCatalogues=[];

/**
 * Data binding model for all items in project configuration view
 */
var ProjectModel = function () {
	this.name = ko.observable();
	this.maintainer = ko.observable();
	this.vendor=ko.observable();
	this.version=ko.observable();
	this.description=ko.observable();
	this.publish_to=ko.observableArray();
	this.repo_url = ko.observable();

	this.init=function(data){
		this.name(data.name);
		this.maintainer(data.maintainer);
		this.vendor(data.vendor);
		this.version(data.version);
		this.description(data.description);
		this.publish_to(data.publish_to);
		this.repo_url(data.repo_url);
		var selected=[];
		for(var i=0;i<data.publish_to.length;i++)
		{
			var catalogueName=data.publish_to[i];
			if($.inArray(catalogueName,availableCatalogues)!=-1)
			{
				selected.push(catalogueName);
			}
		}
		$(".chosen-select").val(selected).trigger("chosen:updated");
	};
	this.setPublishTo=function(data)
	{
		this.publish_to(data);
	};
}

/**
 * It saves the configuration of the current project and it is called by clicking "save" button
 */
function saveConfiguration() {
	selected=$(".chosen-select").val();
	projectModel.setPublishTo(selected);
	$("#projectForm").parsley().validate();
	if ($("#projectForm").parsley().isValid())
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


/**
 * It loads the configuration of the current project.
 *
 * @param ptId
 */
function loadConfiguration(ptId) {
	showWaitAnimation("Loading project");
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			closeWaitAnimation();
			projectModel.init(data);
			document.getElementById("nav_project").text = "Project: " +data.name;
		}
	});
}

/**
 * It loads the available catalogues of the current workspace from the back-end server
 * and set configuration to the chosen box for "publish to".
 */
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
	projectModel=new ProjectModel();
	loadConfiguration(ptId);
	ko.applyBindings(projectModel);
});
