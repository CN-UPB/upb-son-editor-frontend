var projects = [];
var wsId = "";
var queryString = {};
var tableViewModel;

var Project = function(data) {
	this.name = ko.observable(data.name);
    this.id = ko.observable(data.id);
	var self = this;
	this.delete_ws = function() {
		deleteWs(self.id());
    };

    this.edit = function() {
        goToProjectView(wsId, self.id());
    };
};

var TableViewModel = function (){
	this.projects = ko.observableArray([]);
	var self = this;
	this.addProject = function(data){
		self.projects.push(new Project(data));
	}
};


$(document).ready(function () {
	queryString = getQueryString();
	wsId = queryString["wsId"];
	setWorkspaceInNav(wsId);
	var availableProjects = ["Create new project"];
	var ptDictionary = {};
	tableViewModel = new TableViewModel();
	ko.applyBindings(tableViewModel);
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			//display available projects and their onclick event.
			projects = data;
			for (var i = 0; i < projects.length; i++) {
				var project = projects[i];
				availableProjects.push(project.name);
				ptDictionary[project.name] = project.id;
				tableViewModel.addProject(project);
			}

			//search bar(uses jquery ui Autocomplete)
			$("#search_pt").autocomplete({
				source : availableProjects,
				select : function (event, ui) {
					if (ui.item.label == "Create new project") {
						showCreateDialog();
					} else {
						var selectedId = ptDictionary[ui.item.label];
						goToProjectView(wsId, selectedId);
					}
				}
			});
		}
	})
});

//create new project dialog (uses jquery ui Dialog)
function showCreateDialog() {
	$("#createProjectDialog").dialog({
		modal : true,
		draggable : false,
		buttons : {
			Cancel : function () {
				$(this).dialog("close");
			},
			Create : function () {
				$('form').parsley().validate();
				if($('form').parsley().isValid())
				{
					createNewProject(wsId, $('#ptNameInput').val(), $('#ptUrlInput').val());
					$(this).dialog("close");
				}
			}
		}
	});
}

//send the name of the new workspace to server
function createNewProject(wsId, ptName, repoURL) {
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/",
		method : 'POST',
		contentType : "application/json; charset=utf-8",
		dataType : 'json',
		xhrFields : {
			withCredentials : true
		},
		data : JSON.stringify({
			"name" : ptName,
			"repo" : repoURL
		}),
		success : function (data) {
			goToProjectView(wsId, data.id);
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

//open configuration from the current workspace
function goToConfigurationView() {
	window.location.href = "workspace-configurationView.html?wsId=" + queryString["wsId"];
}

//delete a project from the server and it will be called by clicking "delete" button belongs to a project
function deletePt(ptId) {
	$("#ConfirmDeletionDialog").dialog({
		modal : true,
		draggable : false,
		buttons : {
			Yes : function () {
				$(this).dialog("close");
				$.ajax({
					url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + ptId,
					dataType : "json",
					type : 'DELETE',
					xhrFields : {
						withCredentials : true
					},
					success : function (data) {
						$("#DeletePtDialog").dialog({
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

