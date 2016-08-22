var projects = [];
var wsId = "";
var queryString = {};

$(document).ready(function () {
	queryString = getQueryString();
	document.getElementById("nav_workspace").text = "Workspace: " + queryString["wsName"];
	var availableProjects = ["Create new project"];
	var ptDictionary = {};
	wsId = queryString["wsId"];
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			//display "Create new project" and its onclick event(show dialog to ask inputs).
			var newLink = document.createElement("a");
			newLink.innerHTML = "Create new project";
			newLink.className = "list-group-item";
			$("#displayPT").append(newLink);
			$(newLink).click(function () {
				showCreateDialog();
			});
			//display available projects and their onclick event.
			projects = data;
			console.log("projects:")
			console.log(projects);
			for (i = 0; i < projects.length; i++) {
				var ptName = projects[i].name;
				var ptId = projects[i].id;
				var ptLink = document.createElement("a");
				var project = projects[i];
				availableProjects.push(project.name);
				ptDictionary[project.name] = project.id;
				ptLink.innerHTML = project.name;
				ptLink.className = "list-group-item";
				$("#displayPT").append(ptLink);
				(function (ptName, ptId) {
					$(ptLink).click(function () {
						goToProjectView(ptName, ptId);
					});
				})(ptName, ptId)
			}

			//search bar(uses jquery ui Autocomplete)
			$("#search_pt").autocomplete({
				source : availableProjects,
				select : function (event, ui) {
					if (ui.item.label == "Create new project") {
						showCreateDialog();
					} else {
						var selectedId = ptDictionary[ui.item.label];
						goToProjectView(ui.item.label, selectedId);
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
			"Create" : function () {
				createNewProject(wsId, $('#ptNameInput').val());
				$(this).dialog("close");
			}
		}
	});
}

//send the name of the new workspace to server
function createNewProject(wsId, ptName) {
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/",
		method : 'POST',
		contentType : "application/json; charset=utf-8",
		dataType : 'json',
		xhrFields : {
			withCredentials : true
		},
		data : JSON.stringify({
			"name" : ptName
		}),
		success : function (data) {
			goToProjectView(data.name, data.id);
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

function goToConfigurationView() {
	window.location.href = "workspace-configurationView.html?wsName=" + queryString["wsName"] + "&wsId=" + queryString["wsId"];
}

function goToProjectView(ptName, ptId) {
	window.location.href = "projectView.html?wsName=" + queryString["wsName"] + "&wsId=" + queryString["wsId"] + "&ptName=" + ptName + "&ptId=" + ptId;
}
