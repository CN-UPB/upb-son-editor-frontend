/**
 * Written by Linghui
 * This is the implementation of the configuration in network service editor
 * It uses js-yaml.js library to convert a descriptor in .yaml file to a javascript object.
 * It uses jsoneditor.js library to generate an HTML form by taking the NS descriptor schema from the back-end server.
 * It is used in nsView.html.
 */

/**
 * JSON editor object
 */
var editor;

/**
 * It shows the configuration view of the current network service
 * and it is called by clicking the "Configure" button.
 */
function showNsConfiguration() {
    $("#editorContainer").hide();
    editor.setValue(cur_ns.descriptor);
    $("#nsConfigurationContainer").show();
    windowHeight = $(window).innerHeight();
    $('#nsConfigurationForm').css(
	    'height',
	    windowHeight - $('#nsConfigurationForm').offset().top - 2
		    * $('#buttons').height());
}
/**
 * It validates the inputs according to the schema.
 * @returns {Boolean}
 */
function validate() {
    var errors = editor.validate();
    if (errors.length == 0) {
	return true;
    } else {
	var errorMsgs = "";
	for (var i = 0; i < errors.length; i++) {
	    errorMsgs += errors[i].message + " (Path:" + errors[i].path
		    + ")<br/>";
	}
	$("#errorDialog").dialog().html(errorMsgs);
	$(editor.getEditor(errors[0].path).container)[0].scrollIntoView({
	    behavior : "smooth", // or "auto" or "instant"
	    block : "start" // or "end"
	});
	return false;
    }
}

/**
 * It uploads a descriptor .yaml file.
 * @param event
 */
function uploadFile(event){
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function (){
        cur_ns.descriptor = jsyaml.safeLoad(reader.result);
        editor.setValue(cur_ns.descriptor);
    };
    reader.readAsText(input.files[0]);
};

/**
 * It saves the configuration of the current network service to the back-end server.
 */
function saveNsConfiguration() {
    if (validate()) {
	cur_ns.descriptor = editor.getValue();
	updateServiceOnServer();
	$("#successDescriptorDialogUpdated").dialog();
    }
}

/**
 * It closes the configuration view.
 */
function closeNsConfiguration() {
    if (validate()) {
	cur_ns.descriptor = editor.getValue();
	updateServiceOnServer();
	$("#nsConfigurationContainer").hide();
	location.reload();
	$("#editorContainer").show();
    }
}

$(document)
	.ready(
		function() {
		    JSONEditor.defaults.theme = 'bootstrap3';
		    JSONEditor.defaults.iconlib = 'jQueryUI';
		    JSONEditor.defaults.editors.object.options.remove_empty_properties = true;
		    // get the descriptor schema from the back-end server
		    $
			    .ajax({
				url : serverURL+ "workspaces/" + wsId + "/schema/ns",
				dataType : "json",
				xhrFields : {
					withCredentials : true
				},
				success : function(nsd_schema) {
				    nsd_schema["title"] = "NS Descriptor";
				    editor = new JSONEditor(
					    document
						    .getElementById('nsConfigurationForm'),
					    {
						ajax : true,
						show_errors : "always",
						display_required_only : true,
						schema : nsd_schema,
					    });
				    editor.watch('root.name', function() {
					$("#nav_ns").text(
						"NS: "
							+ editor.getEditor(
								'root.name')
								.getValue());
				    });

				}
			    });
		});