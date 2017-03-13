/**
 * Created by Jonas on 28.01.2017.
 * This is the implementation for GitHub integration and is used in the workspace.html.
 * It uses the knockout.js library for data binding.
 * It is used in workspace.html.
 *
 */

/**
 * It loads list of repositories of the user.
 */
function loadRepos(wsId) {
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/list",
		dataType: "json",
		xhrFields: {
			withCredentials: true
		},
		success: function (data) {
			tableViewModel.repos(data);
		}
	});
}

/**
 *It pulls from Git repository.
 * @param pt_id
 */
function pull(pt_id) {
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/pull",
		method: 'POST',
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		xhrFields: {
			withCredentials: true
		},
		data: JSON.stringify({'project_id': pt_id}),
		success: function (data) {
			$("#GitDialog").html(data.message.replace(/(\n)+/g, '<br />'));
		}
	});
}
/**
 *It commits changes to Git repository.
 * @param pt_id
 */
function commit(pt_id) {
	$('#commitDialog').dialog({
		modal: true,
		buttons: {
			Commit: function () {
				$("#commitForm").parsley().validate();
				if ($("#commitForm").parsley().isValid()) {
					var commit_message = $('#commitInput').val();
					showWaitAnimation("Committing", "Committing project...");
					$.ajax({
						method: "POST",
						url: serverURL + "workspaces/" + wsId + "/git/commit",
						contentType: "application/json; charset=utf-8",
						dataType: "json",
						xhrFields: {
							withCredentials: true
						},
						data: JSON.stringify({
							"project_id": pt_id,
							"commit_message": commit_message
						}),
						success: function (data) {
							closeWaitAnimation();
							$('#GitDialog').dialog().text(data.message);
						}
					});
					$(this).dialog("close");
				}
			},
			Cancel: function () {
				$(this).dialog("close");
			}
		}
	});

}
/**
 * It shows differences between the local version and remote version in Git repository.
 * @param pt_id
 */
function diff(pt_id) {
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/diff",
		method: 'POST',
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		xhrFields: {
			withCredentials: true
		},
		data: JSON.stringify({'project_id': pt_id}),
		success: function (data) {
			if (data.message) {
				$("#GitDialog").html(data.message.replace(/(\n)+/g, '<br />'));
			} else {
				$("#GitDialog").text("No differences!");
			}
		}
	});
}

/**
 * It shows if there is local changes.
 * @param wsId
 * @param pt_id
 * @param url
 */
function showStatus(wsId, pt_id, url) {
	showWaitAnimation();
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/status",
		method: 'POST',
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		xhrFields: {
			withCredentials: true
		},
		data: JSON.stringify({'project_id': pt_id}),
		success: function (data) {
			closeWaitAnimation();
			diffDialog = $("#GitDialog").dialog({
				modal: true,
				draggable: true,
				buttons: {
					"View on Github": function () {
						window.open(url, '_blank');
					},
					Diff: function () {
						diff(pt_id);
					},
					Pull: function () {
						pull(pt_id);
					},
					Commit: function () {
						commit(pt_id);
					},
					Ok: function () {
						$(this).dialog("close");
					}
				}
			});
			if (data.message) {
				diffDialog.html(data.message.replace(/(\n)+/g, '<br />'));
			} else {
				diffDialog.text("No differences!");
			}

		}
	});
}

/**
 * It shows the share dialog.
 * @param model
 */
function share(model) {
	$('#shareDialog').dialog({
		modal: true,
		buttons: {
			Share: function () {
				$('#shareForm').parsley().validate();
				if ($('#shareForm').parsley().isValid()) {
					var repo_name = $('#repoNameInput').val();
					//call share method on server
					init(model, repo_name);
					$(this).dialog("close");
				}
			},
			Cancel: function () {
				$(this).dialog("close");
				model.isShared(false);
			}
		}
	});
}

/**
 * It initializes the Git repository.
 * @param model
 * @param repo_name
 */
function init(model, repo_name) {
	showWaitAnimation("Sharing project on Github", "Initializing", 0);
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/init",
		method: 'POST',
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		xhrFields: {
			withCredentials: true
		},
		data: JSON.stringify({'project_id': model.id()}),
		success: function (data) {
			create(model, repo_name);
		},
		error: function () {
			model.isShared(false);
		}
	});
}

/**
 * It creates the remote Git repository.
 * @param model
 * @param repo_name
 */
function create(model, repo_name) {
	showWaitAnimation("Sharing project on Github", "Uploading", 50);
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/create",
		method: 'POST',
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		xhrFields: {
			withCredentials: true
		},
		data: JSON.stringify({'project_id': model.id(), 'repo_name': repo_name}),
		success: function (data) {
			loadProjects(wsId);
			closeWaitAnimation();
		},
		error: function () {
			model.isShared(false);
		}
	});
}

/**
 * It shows the unshare dialog.
 * @param model
 */
function unshare(model) {
	$('#unshareDialog').dialog({
		modal: true,
		buttons: {
			"Delete from Github": function () {
				$('#unShareForm').parsley().validate();
				if ($('#unShareForm').parsley().isValid()) {
					var repo_name = $('#delRepoNameInput').val();
					deletePJ(model, repo_name);
					$(this).dialog("close");
				}
			},
			Cancel: function () {
				$(this).dialog("close");
				model.isShared(true);
			}
		}
	});
}

/**
 * It deletes project from Git repository.
 * @param model
 * @param repo_name
 */
function deletePJ(model, repo_name) {
	showWaitAnimation("Deleting", "Deleting project from Github");
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/delete",
		method: 'DELETE',
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		xhrFields: {
			withCredentials: true
		},
		data: JSON.stringify({'project_id': model.id(), "repo_name": repo_name}),
		success: function (data) {
				closeWaitAnimation();
		},
		error: function () {
			model.isShared(true);
		}
	});
}
