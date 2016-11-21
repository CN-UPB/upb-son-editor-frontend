//create networkservice descriptor dialog (uses jquery ui Dialog)
function showDialog() {
	$("#createDialog").dialog({
		modal : true,
		draggable : true,
		buttons : {
			Cancel : function (){
				$(this).dialog("close");
			},
				"Submit" : function () {
				 updateConfig();
				$(this).dialog("close");
			}
		}
	});
}


//showing msg on search bar
$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});


//update network service descriptor
function updateConfig(){
	name    = $('#dsName').val();
	vendor  = $('#dsVendor').val();
	version = $('#dsVersion').val();
	maintainer = $('#dsmaintainer').val();
	description = $('#dsdescription').val();

	$.ajax({
		url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/" + queryString["nsId"],
		method : 'PUT',
		contentType : "application/json; charset=utf-8",
		dataType : 'json',
		xhrFields : {
			withCredentials : true
		},
		
		data : JSON.stringify({
			"name": name,
			"version": version,
			"vendor": vendor,
			"maintainer": maintainer,
			"description": description 
		}),
		success : function (data) {
			$("#successDescriptorDialogUpdated").dialog({
				modal : true,
				draggable : false,
				buttons : {
					ok : function () {
						$(this).dialog("close");
					}
				}
			});
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