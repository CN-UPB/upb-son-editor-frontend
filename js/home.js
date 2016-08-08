var serverURL = "http://131.234.73.193:5000/";
var workspaces = [];

$(document).ready(function () {
	var availableWorkspaces = ["Create new workspace"];
	var wsDictionary = {};
	$.ajax({
		url : serverURL + "workspaces/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			//display "Create new workspace" and its onclick event(show dialog to ask inputs).
			var newLink = document.createElement("a");
			newLink.innerHTML = "Create new workspace";
			newLink.className = "list-group-item";
			$("#displayWS").append(newLink);
			$(newLink).click(function () {
				showCreateDialog();
			});
			//display available workspaces and their onclick event.
			workspaces = data.workspaces;
			for (i = 0; i < workspaces.length; i++) {
				var wsName=workspaces[i].name;
				var wsId = workspaces[i].id;
				var wsLink = document.createElement("a");
				var workspace = workspaces[i];
				availableWorkspaces.push(wsName);
				wsDictionary[workspace.name] = workspace.id;
				wsLink.innerHTML = wsName;
				wsLink.className = "list-group-item";
				$("#displayWS").append(wsLink);
				(function (wsName,wsId) {
					$(wsLink).click(function () {
						goToWorkspaceView(wsName, wsId);
					});
				})(wsName,wsId)
			}
			//search bar(uses jquery ui Autocomplete)
			$("#search_ws").autocomplete({
				source : availableWorkspaces,
				select : function (event, ui) {
					if (ui.item.label == "Create new workspace") {
						showCreateDialog();
					} else {
						var selectedId = wsDictionary[ui.item.label];
						goToWorkspaceView(ui.item.label, selectedId);
					}
				}
			});
		}
	})
});

//create new workspace dialog (uses jquery ui Dialog)
function showCreateDialog() {
	$("#createWorkspaceDialog").dialog({
		modal : true,
		draggable : false,
		buttons : {
			Cancel : function () {
				$(this).dialog("close");
			},
			"Create" : function () {
				createNewWorkspace($('#wsNameInput').val());
				$(this).dialog("close");
			}
		}
	});
}

//send the name of the new workspace to server
function createNewWorkspace(wsName) {
	$.ajax({
		url : serverURL + "workspaces/",
		method : 'POST',
		contentType : "application/json; charset=utf-8",
		dataType : 'json',
		xhrFields : {
			withCredentials : true
		},
		data : JSON.stringify({
			"name" : wsName
		}),
		success : function (data) {
			goToWorkspaceView(data.name, data.id);
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

function goToWorkspaceView(wsName, wsId) {
	window.location.href = "workspaceView.html?wsName=" + wsName + "&wsId=" + wsId;
}
