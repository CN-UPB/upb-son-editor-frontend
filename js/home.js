var serverURL = "http://jonas-msi:5000/";
var workspaces = [];

$(document).ready(function () {
	var availableWorkspaces = ["Create new workspace"];
	$.ajax({
		url : serverURL + "workspaces/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			var newLink = document.createElement("a");
			newLink.innerHTML = "Create new workspace";
			newLink.className = "list-group-item";
			$("#displayWS").append(newLink);
			$(newLink).click(function () {
				$("#createWorkspaceDialog").dialog({
					modal : true,
					buttons : {
						Cancel : function () {
							$(this).dialog("close");
						},
						"Create" : function () {
							createNewWorkspace($('#wsNameInput').val());
							$(this).dialog("close");
						}
					}
				})
			});
			workspaces = data.workspaces;
			for (i = 0; i < workspaces.length; i++) {
				var wsId = workspaces[i].id;
				(function (wsId) {
					var wsLink = document.createElement("a");
					var workspace = workspaces[i];
					availableWorkspaces.push(workspace.name);
					wsLink.innerHTML = workspace.name;
					wsLink.className = "list-group-item";
					$("#displayWS").append(wsLink);
					$(wsLink).click(function () {
						goToWorkspaceView(wsId);
					});
				})(wsId)
			}
			$("#search_ws").autocomplete({
				source : availableWorkspaces
			});
		}
	})
});

function createNewWorkspace(wsName) {
	$.ajax({
		url : serverURL + "workspaces/",
		type : 'POST',
		xhrFields : {
			withCredentials : true
		},
		contentType : " application / json; charset = utf - 8 ",
		dataType : 'json',
		success : function (data) {
			alert('data: ' + data);
		},
		data : JSON.stringify({
			"name" : wsName
		})
	});
}

function goToWorkspaceView(wsId) {
	window.location.href = "workspaceView.html?wsId=" + wsId;
}
