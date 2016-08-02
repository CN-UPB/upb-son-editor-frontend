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
	$.ajax({
		url: serverURL + "workspaces/",
		dataType: "json",
		xhrFields: {
		    withCredentials: true
	    },
		success: function (data) {
			workspaces = data.workspaces;
			for (i = 0; i < workspaces.length; i++) {
				var wsId = workspaces[i].id;
				(function (wsId) {
					var wsLink = document.createElement("a");
					var workspace = workspaces[i];
					wsLink.innerHTML = workspace.name;
					wsLink.className = "list-group-item";
					$("#displayWS").append(wsLink);
					$(wsLink).click(function () {
						loadProjects(wsId);
					});
				})(wsId)
			}
		}
	});
});

//global error handler for ajax requests
$( document ).ajaxError(function(event, response, request) {
	if (response.status == 401)//not authorized
	{
		var json= response.responseJSON;
		var authUrl = json.authorizationUrl;
		$('#loginButton').click(function(){
			//open github login in new window
			window.open(authUrl);
		});
		
		//open dialog with login button
		$("#loginDialog").dialog();

		//callback from new window
		window.onmessage = function (e) {
			//close dialog
			$("#loginDialog").dialog("close");
			//repeat the original request
			$.ajax(request);
		};
	}
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
