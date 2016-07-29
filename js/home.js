var serverURL = "http://jonas-msi:5000/"
	var workspaces = [];

$(function () {
	var availableWorkspaces = ["Create new workspace"];
	for (i = 0; i < workspaces.length; i++) {
		availableWorkspaces.push(workspaces[i].name);
	}
	$("#search_ws").autocomplete({
		lookup : availableWorkspaces
	});
});

$(document).ready(function () {
	$.getJSON(serverURL + "workspaces/", function (data) {
		workspaces = data.workspaces;
		for (i = 0; i < workspaces.length; i++) {
			var wsId = workspaces[i].id;
			(function (wsId) {
				var wsLink = document.createElement("a");
				var workspace = workspaces[i];
				wsLink.innerHTML = workspace.name;
				wsLink.className = "list-group-item";
				$("#displayWS").append(wsLink);
				wsLink.addEventListener('click', function () {
					loadProjects(wsId);
				}, false);
			})(wsId)
		}
	});
});

function loadProjects(id) {
	var projects = [{
			"name" : "project1",
			"id" : "12sf34"
		}, {
			"name" : "project2",
			"id" : "13sf4"
		}, {
			"name" : "project3",
			"id" : "14fsd"
		}
	];
	this.location.href = "workspaceView.html";
}
