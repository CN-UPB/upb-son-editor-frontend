var editor;
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

function uploadFile(event){
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function (){
        cur_ns.descriptor = jsyaml.safeLoad(reader.result);
        editor.setValue(cur_ns.descriptor);
    };
    reader.readAsText(input.files[0]);
};


function saveNsConfiguration() {
    if (validate()) {
	cur_ns.descriptor = editor.getValue();
	updateService();
	$("#successDescriptorDialogUpdated").dialog();
    }
}

function closeNsConfiguration() {
    if (validate()) {
	cur_ns.descriptor = editor.getValue();
	updateService();
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
		    // get schema
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