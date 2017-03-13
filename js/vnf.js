/**
 * Written by Linghui
 * This is the implementation of the VNF editor.
 * It uses js-yaml.js library to convert a descriptor in .yaml file to a javascript object.
 * It uses jsoneditor.js library to generate an HTML form by taking the VNF descriptor schema from the back-end server.
 * It is used in vnfView.html.
 */
var queryString = {};
/**
 * JSON editor object
 */
var editor;

/**
 * It validates the VNF descriptor and save it if it is valid
 *
 */
function saveTables() {
	var errors = editor.validate();
	if (errors.length == 0) {
		var data= {};
		data.descriptor = editor.getValue();
		data.edit_mode =$('#editMode')[0].checked?"replace_refs":"create_new";
		data = JSON.stringify(data);
		if (queryString['operation'] != "edit")
		{
			createNewVnf(data);
		}
		else
		{
			updateVnf(data);
		}
	}
else {
		$("#FailedValidationDialog").dialog({
			modal : true,
			draggable : false,
			buttons : {
				ok : function() {
					$(this).dialog("close");
				}
			}
		});
	}
}

/** It updates a VNF to the back-end server.
 *
 * @param jsonData
 */
function updateVnf(jsonData) {
	$.ajax({
		url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/"
				+ queryString["ptId"] + "/functions/" + queryString["vnfId"],
		method : 'PUT',
		contentType : "application/json; charset=utf-8",
		dataType : 'json',
		xhrFields : {
			withCredentials : true
		},
		data : jsonData,
		success : function(data) {
			$("#successVnfDialogUpdated").dialog({
				modal : true,
				draggable : false,
				buttons : {
					ok : function() {
						$(this).dialog("close");
					}
				}
			});
		},
		error : function(err) {
			$('#errorDialog').text(err.responseText);
			$('#errorDialog').dialog({
				modal : true,
				buttons : {
					Ok : function() {
						$(this).dialog("close");
					}
				}
			});
		}
	});
}

/**
 * It creates a new VNF and it is called by clicking "New VNF" button.
 *
 * @param jsonData
 */
function createNewVnf(jsonData) {
	$.ajax({
		url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/"
				+ queryString["ptId"] + "/functions/",
		method : 'POST',
		contentType : "application/json; charset=utf-8",
		dataType : 'json',
		xhrFields : {
			withCredentials : true
		},
		data : jsonData,
		success : function(data) {
			$("#successVnfDialog").dialog(
					{
						modal : true,
						draggable : false,
						buttons : {
							ok : function() {
								$(this).dialog("close");
								window.location.href = "vnfView.html?wsId="
										+ queryString["wsId"] + "&ptId="
										+ queryString["ptId"] + "&vnfId="
										+ data.id + "&operation=" + "edit";
							}
						}
					});
		},
		error : function(err) {
			$('#errorDialog').text(err.responseText);
			$('#errorDialog').dialog({
				modal : true,
				buttons : {
					Ok : function() {
						$(this).dialog("close");
					}
				}
			});
		}
	});
}

/**
 * It loads a VNF from the back-end server.
 *
 * @param vnfId
 */
function loadVnf(vnfId) {
	$.ajax({
		url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/"
				+ queryString["ptId"] + "/functions/" + vnfId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function(data) {
			document.getElementById("nav_vnf").text = "VNF: " + data.name;
			editor.setValue(data.descriptor);
			closeWaitAnimation();
		}
	});
}

/**
 * It uploads a descriptor .yaml file and converts it to js object.
 * @param event
 */
function uploadFile(event) {
	var input = event.target;
	var reader = new FileReader();
	reader.onload = function() {
		var descriptor = jsyaml.safeLoad(reader.result);
		editor.setValue(descriptor);
	};
	reader.readAsText(input.files[0]);
};



/**
 * It is the data binding model for VNF image
 *
 * @returns
 */
function ImagesModel() {
	this.images = ko.observableArray([]);

	var self = this;

	this.last= function(index){
		return index() == self.images().length-1;
	};

	this.deleteImage= function(data){
		$.ajax({
			url: serverURL + "workspaces/" + queryString["wsId"] + "/projects/"
				+ queryString["ptId"] + "/functions/" + queryString["vnfId"]+ "/upload/"+data,
			type: 'DELETE',
			xhrFields : {
				withCredentials : true
			},
			success: function (message) {
				//on success: reload images list
				showImageFiles();
				$("#deletedMessage").text(message);
				$("#deletedMessage").show();
			}
		});
	};
}

var imagesModel = new ImagesModel();

/**
 * It uploads an image of VNF.
 * @param event
 */
function uploadImage(event) {
	var input = event.target;
	var formData = new FormData();
    formData.append("image", input.files[0]);
    showWaitAnimation("Uploading", "Uploading " +input.files[0].name);
	$.ajax({
		url: serverURL + "workspaces/" + queryString["wsId"] + "/projects/"
			+ queryString["ptId"] + "/functions/" + queryString["vnfId"]+ "/upload",
		type: 'POST',
		data: formData,
		xhrFields : {
			withCredentials : true
		},
		processData: false,  // tell jQuery not to process the data
		contentType: false,   // tell jQuery not to set contentType
		success: function (message) {
		    	closeWaitAnimation();
			$('#uploadSuccess').dialog({
				modal: true,
				draggable: false,
				buttons: {
					ok: function () {
						$(this).dialog("close");
					}
				}
			}).text(message);
		}
	});
	$(input).filestyle('clear');
}

/**
 * It shows image files dialog.
 */
function showImageFiles(){
	$("#deletedMessage").hide();
	$.ajax({
		url: serverURL + "workspaces/" + queryString["wsId"] + "/projects/"
			+ queryString["ptId"] + "/functions/" + queryString["vnfId"]+ "/upload",
		xhrFields : {
			withCredentials : true
		},
		success: function (image_files) {
			imagesModel.images(image_files);
			$('#imageFilesDialog').dialog({
				modal: true,
				draggable: false,
				buttons: {
					Close: function () {
						$(this).dialog("close");
					}
				}
			});
		}
	});
}
$(document)
.ready(
		function() {
			queryString = getQueryString();
			var wsId = queryString["wsId"];
			var ptId = queryString["ptId"];
			setWorkspaceInNav(wsId);
			setProjectInNav(wsId, ptId);
			JSONEditor.defaults.theme = 'bootstrap3';
			JSONEditor.defaults.iconlib = 'jQueryUI';
			JSONEditor.defaults.editors.object.options.remove_empty_properties = true;
			// get VNF schema from the back-end server
			showWaitAnimation("Loading Schema");
			$.ajax({
				url : serverURL + "workspaces/" + wsId + "/schema/vnf",
				dataType : "json",
				xhrFields : {
					withCredentials : true
				},
				success : function(vnfd_schema) {
					vnfd_schema["title"] = "VNF Descriptor";
					editor = new JSONEditor(document
							.getElementById('vnfForm'), {
						ajax : true,
						show_errors : "always",
						display_required_only : true,
						schema : vnfd_schema,
					});
					editor.watch('root.name', function() {
						$("#nav_vnf").text(
								"VNF: "
										+ editor.getEditor(
												'root.name')
												.getValue());
					});
					if (queryString["operation"] != "create") {
						showWaitAnimation("Loading VNF");
						loadVnf(queryString["vnfId"]);
					} else {
						closeWaitAnimation();
					}
				}
			});
			windowHeight = $(window).innerHeight();
			$('#vnfForm').css(
					'height',
					windowHeight - $('#vnfForm').offset().top - 2
							* $('#buttons').height());

			ko.applyBindings(imagesModel);
		});
