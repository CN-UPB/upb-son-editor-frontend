/**
 * Created by Jonas on 28.01.2017.
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
			if (data.success) {
				$("#GitDialog").html(data.message.replace(/(\n)+/g, '<br />'));
			} else {
				$('#GitDialog').dialog().html(
					"<b>Exitcode:</b> " + data.exitcode + "<br/>"
					+ "<b>Reason:</b> " + data.message
				);
			}
		}
	});
}
function commit(pt_id) {
	$('#commitDialog').dialog({
		modal: true,
		buttons: {
			Commit: function () {
				$("#commitForm").parsley().validate();
				if ($("#commitForm").parsley().isValid()) {
					var commit_message = $('#commitInput').val();
					showWaitAnimation("Committing project...", "Committing");
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
							if (data.success) {
								$('#GitDialog').dialog().text(data.message);
							} else {
								$('#GitDialog').dialog().html(
									"<b>Exitcode:</b> " + data.exitcode + "<br/>"
									+ "<b>Reason:</b> " + data.message
								);
							}
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


function showStatus(wsId, pt_id, url) {
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

function init(model, repo_name) {
	showWaitAnimation("Initializing","Sharing project on Github",  0);
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
			if (data.success) {
				create(model, repo_name);
			}
		},
		error: function () {
			model.isShared(false);
		}
	});
}

function create(model, repo_name) {
	showWaitAnimation("Uploading","Sharing project on Github",  50);
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
			if (data.success) {
				loadProjects(wsId);
			}
			closeWaitAnimation();
		},
		error: function () {
			model.isShared(false);
		}
	});
}

function unshare(model) {
	$('#unshareDialog').dialog({
		modal: true,
		buttons: {
			"Delete from Github": function () {
				deletePJ(model);
				$(this).dialog("close");
			},
			Cancel: function () {
				$(this).dialog("close");
				model.isShared(true);
			}
		}
	});
}

function deletePJ(model) {
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/git/delete",
		method: 'POST',
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		xhrFields: {
			withCredentials: true
		},
		data: JSON.stringify({'project_id': model.id()}),
		success: function (data) {
			if (data.success) {
				closeWaitAnimation();
			}
		},
		error: function () {
			model.isShared(true);
		}
	});
}
