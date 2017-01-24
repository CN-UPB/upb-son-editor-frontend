var queryString = {};
var editor;

// validate the VNF descriptor and save it if it is valid
function saveTables() {
	var errors = editor.validate();
	if (errors.length == 0) {
		var descriptor = JSON.stringify(editor.getValue());
		if (queryString['operation'] != "edit") 
		{
			createNewVnf(descriptor);
		}
		else
		{
			updateVnf(descriptor);
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

// update a VNF to the server
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

// create a new VNF and it will be called by clicking "New VNF" button
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

// load a VNF from the server
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

function uploadFile(event) {
	var input = event.target;
	var reader = new FileReader();
	reader.onload = function() {
		var descriptor = jsyaml.safeLoad(reader.result);
		editor.setValue(descriptor);
	};
	reader.readAsText(input.files[0]);
};

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
					// get schema
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


//VNF Image Upload
function ImagesModel() {
	this.images = ko.observableArray([]);

	var self = this;

	this.last= function(index){
		return index() == self.images().length-1;
	};

	this.delete= function(data){
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
	}
}

var imagesModel = new ImagesModel();

function uploadImage(event) {
	var input = event.target;
	var formData = new FormData();
    formData.append("image", input.files[0]);
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
