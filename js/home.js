var workspaces = [];

$(document).ready(function () {
	$( "[title]" ).tooltip();
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
				tdEdit.style.marginLeft = "10px";
				tdEdit.style.marginRight = "15px";
				tdEdit.innerHTML = "Edit";
				var tdDelete = document.createElement("td");
				tdDelete.className = "btn btn-danger btn-sm";
				tdDelete.innerHTML = "Delete";
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
						goToWorkspaceView(wsName, wsId);
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
				if($('form').parsley().isValid())
				{
					createNewWorkspace($('#wsNameInput').val());
					$(this).dialog("close");
				}
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