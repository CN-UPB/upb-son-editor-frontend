var projects = [];
var wsId = "";
var queryString = {};

$(document).ready(function () {
	$( "[title]" ).tooltip();
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
			//display available projects and their onclick event.
			projects = data;
			console.log("projects:")
			console.log(projects);
			for (i = 0; i < projects.length; i++) {
				var ptName = projects[i].name;
				var ptId = projects[i].id;
				var project = projects[i];
				availableProjects.push(project.name);
				ptDictionary[project.name] = project.id;
				var tdName = document.createElement("td");
				tdName.innerHTML = ptName;
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
				document.getElementById("display_ptTable").appendChild(trWs);
				(function(ptName,ptId){
					tdEdit.addEventListener('click', function () {
						goToProjectView(ptName, ptId);
					}, false);
					tdDelete.addEventListener('click', function () {
						deleteWs(ptId);
					}, false);
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
				if($('form').parsley().isValid())
				{
					createNewProject(wsId, $('#ptNameInput').val());
					$(this).dialog("close");
				}
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

function deleteWs(ptId) {
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