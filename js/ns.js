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
				 updateDescriptor();
				$(this).dialog("close");
			}
		}
	});
}

//ui-accordin-hover
$(function() {
    $("#accordion").accordion({active : false,
		collapsible : true,
		heightStyle : "content" });
    $(".trigger").click(function() {
        $("#accordion").accordion("enable").accordion("activate", parseInt($(this).data("index"), 10)).accordion("disable");
    });
});

//showing msg on search bar
$(function () {
  $('[data-toggle="tooltip"]').tooltip()
});

//update network service descriptor
function updateDescriptor(){
	descriptorVersion = $('#descriptor_version').val();
	name    = $('#dsName').val();
	vendor  = $('#dsVendor').val();
	version = $('#dsVersion').val();
	author = $('#dsauthor').val();
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
			"descriptorVersion": descriptorVersion,
			"version": version,
			"vendor": vendor,
			"name": name,
			"author": author,
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