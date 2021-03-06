/**
 * It is used in workspaceView.html
 */

/**
 * stores projects in a list
 */
var projects = [];
/**
 * stores id of the current workspace
 */
var wsId = "";
var queryString = {};
/**
 * an instance of TableViewModel
 */
var tableViewModel;

var Project = function(data) {
	this.name = ko.observable(data.name);
    this.id = ko.observable(data.id);
    this.isShared = ko.observable(data.repo_url != null);
    this.repo_url = data.repo_url;
	var self = this;
	this.delete_pj = function() {
		deletePt(self.id());
    };

    this.edit = function() {
        goToProjectView(wsId, self.id());
    };
    this.show_diff = function() {
    	showStatus(wsId, self.id(), self.repo_url);
	};

    this.toggleShared = function() {
    	if (!self.isShared()){
    		unshare(self);
		} else {
    		share(self);
		}
		return true;
	};
};

var TableViewModel = function (){
	this.projects = ko.observableArray([]);
	this.repos = ko.observableArray([]);
	var self = this;
	this.addProject = function(data){
		self.projects.push(new Project(data));
	};
};

/**
 * It loads projects of the current workspace from the back-end server.
 * @param wsId
 */
function loadProjects(wsId){
	var availableProjects = ["Create new project"];
	var ptDictionary = {};
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/projects/",
		dataType: "json",
		xhrFields: {
			withCredentials: true
		},
		success: function (data) {
			//clean arrays
			availableProjects = [];
			tableViewModel.projects().splice(0,tableViewModel.projects().length);
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
				source: availableProjects,
				select: function (event, ui) {
					if (ui.item.label == "Create new project") {
						showCreateDialog();
					} else {
						var selectedId = ptDictionary[ui.item.label];
						goToProjectView(wsId, selectedId);
					}
				}
			});
		}
	});
}



function urlSelected(item){
	if (item.selectedIndex >0){
		$('#ptUrlInput').val(item.value);
		$('#ptNameInput').val(item.options[item.selectedIndex].text);
	} else {
		$('#ptUrlInput').val("");
		$('#ptNameInput').val("");
	}
}



/**
 * It shows "create new project dialog" (uses jquery ui Dialog).
 *
 */
function showCreateDialog() {
	$("#createProjectDialog").dialog({
		modal : true,
		draggable : false,
		buttons : {
			Cancel : function () {
				$(this).dialog("close");
			},
			Create : function () {
				$('#createForm').parsley().validate();
				if($('#createForm').parsley().isValid())
				{
					createNewProject(wsId, $('#ptNameInput').val(), $('#ptUrlInput').val());
					$(this).dialog("close");
				}
			}
		}
	});
}

/**
 * It creates a new project and sends the name of it to back-end server.
 *
 * @param wsId
 * @param ptName
 * @param repoURL
 */
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

/**
 * It opens configuration view of the current workspace.
 *
 */
function goToConfigurationView() {
	window.location.href = "workspaceConfigurationView.html?wsId=" + queryString["wsId"];
}

/**
 * It deletes a project from the back-end server and it is called by clicking "delete" button belongs to a project.
 *
 * @param ptId
 */
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

$(document).ready(function () {
	queryString = getQueryString();
	wsId = queryString["wsId"];
	setWorkspaceInNav(wsId);
	tableViewModel = new TableViewModel();
	ko.applyBindings(tableViewModel);
	loadProjects(wsId);
	loadRepos(wsId);
});

