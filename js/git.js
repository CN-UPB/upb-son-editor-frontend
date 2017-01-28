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
					"View on Github":function(){
						window.open(url,'_blank');
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
						window.location.reload();
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
