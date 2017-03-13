/**
 * Written by Linghui
 * It is used in index.html.
 */

/**
 * stores the list of workspaces.
 */
var workspaces = [];

/**
 * It loads all available workspaces from the back-end server and displays them.
 * It also implements the search for a specific workspace in the search bar.
 */
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
			//display available workspaces in the table and their onclick event.
			workspaces = data;
			for (i = 0; i < workspaces.length; i++) {
				var wsName=workspaces[i].name;
				var wsId = workspaces[i].id;
				var workspace = workspaces[i];
				availableWorkspaces.push(wsName);
				wsDictionary[workspace.name] = workspace.id;
				var tdName = document.createElement("td");
				tdName.innerHTML = wsName;
				var tdOptions = document.createElement("td");
				var optionTable = document.createElement("table");
				var trOptionTable = document.createElement("tr");
				var tdEdit = document.createElement("td");
				tdEdit.className = "btn btn-primary btn-sm";
				tdEdit.style.marginLeft = "5px";
				tdEdit.style.marginRight = "5px";
				tdEdit.innerHTML = "<span style='margin-right: 2px;' class='glyphicon glyphicon-pencil'></span>Edit";
				var tdDelete = document.createElement("td");
				tdDelete.className = "btn btn-danger btn-sm";
				tdDelete.innerHTML ="<span style='margin-right: 2px;' class='glyphicon glyphicon-trash'></span>Delete";
				trOptionTable.appendChild(tdEdit);
				trOptionTable.appendChild(tdDelete);
				optionTable.appendChild(trOptionTable);
				tdOptions.appendChild(optionTable);
				var trWs = document.createElement("tr");
				trWs.appendChild(tdName);
				trWs.appendChild(tdOptions);
				document.getElementById("display_wsTable").appendChild(trWs);
				(function(wsName,wsId){
					tdEdit.addEventListener('click', function () {
						goToWorkspaceView(wsId);
					}, false);
					tdDelete.addEventListener('click', function () {
						deleteWs(wsId);
					}, false);
				})(wsName, wsId)
			}
			//search bar(uses jquery ui Autocomplete)
			$("#search_ws").autocomplete({
				source : availableWorkspaces,
				select : function (event, ui) {
					if (ui.item.label == "Create new workspace") {
						showCreateDialog();
					} else {
						var selectedId = wsDictionary[ui.item.label];
						goToWorkspaceView(selectedId);
					}
				}
			});
		}
	})
});

/**
 * It shows the "create new workspace" dialog.
 */
function showCreateDialog() {
	$("#createWorkspaceDialog").dialog({
		modal : true,
		draggable : false,
		buttons : {
			Cancel : function () {
				$(this).dialog("close");
			},
			"Create" : function () {
				if($('form').parsley().isValid())
				{
					createNewWorkspace($('#wsNameInput').val());
					$(this).dialog("close");
				}
			}
		}
	});
}

/**
 * It creates a new workspace and sends the name of the new workspace to the back-end server.
 */
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
			goToWorkspaceView(data.id);
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
 * It deletes a workspace from the back-end server.
 */
function deleteWs(wsId) {
	$("#ConfirmDeletionDialog").dialog({
		modal : true,
		draggable : false,
		buttons : {
			Yes : function () {
				$(this).dialog("close");
				$.ajax({
					url : serverURL + "workspaces/" + wsId,
					dataType : "json",
					type : 'DELETE',
					xhrFields : {
						withCredentials : true
					},
					success : function (data) {
						$("#DeleteWsDialog").dialog({
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