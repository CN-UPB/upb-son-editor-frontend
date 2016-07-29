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
$(function () {
	var availableProjects = [
		"Create new project",
	];
for (i = 0; i < projects.length; i++) {
		availableProjects.push(projects[i].name);
	}
	$("#search_pt").autocomplete({
		source : availableProjects
	});
});

$(document).ready(function () {
	for (i = 0; i < projects.length; i++) {
		var ptId = projects[i].id;
		(function (ptId) {
			var ptLink = document.createElement("a");
			ptLink.innerHTML = projects[i].name;
			ptLink.className = "list-group-item";
			$("#displayPT").append(ptLink);
			ptLink.addEventListener('click', function () {
				loadProject(ptId);
			}, false);
		})(ptId)
	}
});

function loadProject(id) {
	this.location.href = "projectView.html";
}
