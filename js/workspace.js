var serverURL = "http://jonas-msi:5000/";
var projects = [];
var wsId = "";

$(document).ready(function () {
	var availableProjects = ["Create new project"];
	wsId = getQueryString()["wsId"];
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			var newLink = document.createElement("a");
			newLink.innerHTML = "Create new project";
			newLink.className = "list-group-item";
			$("#displayPT").append(newLink);
			$(newLink).click(function () {
				$("#createProjectDialog").dialog({
					modal : true,
					buttons : {
						Cancel : function () {
							$(this).dialog("close");
						},
						"Create" : function () {
							$(this).dialog("close");
						}
					}
				})
			});
			projects = data.projects;
			for (i = 0; i < projects.length; i++) {
				var ptId = projects[i].id;
				(function (ptId) {
					var ptLink = document.createElement("a");
					var project = projects[i];
					availableProjects.push(project.name);
					ptLink.innerHTML = project.name;
					ptLink.className = "list-group-item";
					$("#displayPT").append(ptLink);
					$(ptLink).click(function () {
						goToProjectView(ptId);
					});
				})(ptId)
			}
			$("#search_pt").autocomplete({
				source : availableProjects
			});
		}
	})
});

function createNewProject(ptName) {
	$.ajax({
		url : serverURL + "projects/projects/",
		type : 'POST',
		contentType : "application/json; charset=utf-8",
		dataType : 'json',
		success : function (data) {
			alert('data: ' + data);
		},
		data : JSON.stringify({
			"name" : ptName,
			"id" : ptId
		})
	});
	$.cookie("ptId", ptId);
	window.location.href = "projectView.html";
}

function goToProjectView(wsId) {
	window.location.href = "projectView.html?ptId=" + ptId;
}
