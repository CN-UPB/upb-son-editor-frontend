var queryString = {};
var editor;

//validate the VNF descriptor and save it if it is valid 
function saveTables() {
    var errors = editor.validate();
    if (errors.length == 0) {
        var descriptor = JSON.stringify(editor.getValue());
        if (queryString['operation']== "create"){
            createNewVnf(descriptor);
        } else {
            updateVnf(descriptor);
        }
    } else {
        $("#FailedValidationDialog").dialog({
            modal: true,
            draggable: false,
            buttons: {
                ok: function() {
                    $(this).dialog("close");
                }
            }
        });
    }
}

//update a VNF to the server 
function updateVnf(jsonData) {
    $.ajax({
        url: serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/functions/" + queryString["vnfId"],
        method: 'PUT',
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        data: jsonData,
        success: function(data) {
            $("#successVnfDialogUpdated").dialog({
                modal: true,
                draggable: false,
                buttons: {
                    ok: function() {
                        $(this).dialog("close");
                    }
                }
            });
        },
        error: function(err) {
            $('#errorDialog').text(err.responseText);
            $('#errorDialog').dialog({
                modal: true,
                buttons: {
                    Ok: function() {
                        $(this).dialog("close");
                    }
                }
            });
        }
    });
}

//create a new VNF and it will be called by clicking "New VNF" button 
function createNewVnf(jsonData) {
    $.ajax({
        url: serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/functions/",
        method: 'POST',
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        xhrFields: {
            withCredentials: true
        },
        data: jsonData,
        success: function(data) {
            $("#successVnfDialog").dialog({
                modal: true,
                draggable: false,
                buttons: {
                    ok: function() {
                        $(this).dialog("close");
                        window.location.href = "vnfView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&vnfId=" + data.id + "&operation=" + "edit";
                    }
                }
            });
        },
        error: function(err) {
            $('#errorDialog').text(err.responseText);
            $('#errorDialog').dialog({
                modal: true,
                buttons: {
                    Ok: function() {
                        $(this).dialog("close");
                    }
                }
            });
        }
    });
}

//load a VNF from the server 
function loadVnf(vnfId) {
    $.ajax({
        url: serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/functions/" + vnfId,
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            document.getElementById("nav_vnf").text = "VNF: " + data.name;
            editor.setValue(data.descriptor);
        }
    });
}

function uploadFile(event){
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function (){
        var descriptor = jsyaml.safeLoad(reader.result);
        editor.setValue(descriptor);
    }
    reader.readAsText(input.files[0]);
};

$(document).ready(function() {
    queryString = getQueryString();
    var wsId = queryString["wsId"];
    var ptId = queryString["ptId"];
    $.ajax({
        url: serverURL + "workspaces/" + wsId,
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            document.getElementById("nav_workspace").text = "Workspace: " + data.name;
        }
    });
    $.ajax({
        url: serverURL + "workspaces/" + wsId + "/projects/" + ptId,
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            document.getElementById("nav_project").text = "Project: " + data.name;
        }
    });
    JSONEditor.defaults.theme = 'bootstrap3';
    JSONEditor.defaults.iconlib = 'jQueryUI';
    JSONEditor.defaults.editors.object.options.remove_empty_properties = true;
    // get schema
    $.ajax({
        url: "https://raw.githubusercontent.com/sonata-nfv/son-schema/master/function-descriptor/vnfd-schema.yml",
        success: function(data) {
            var vnfd_schema = jsyaml.safeLoad(data);
            vnfd_schema["title"] = "VNF Descriptor";
            editor = new JSONEditor(document.getElementById('vnfForm'),{
                ajax: true,
                show_errors: "always",
                display_required_only: true,
                schema: vnfd_schema,
            });
            if (queryString["operation"] != "create") {
                loadVnf(queryString["vnfId"]);
            }
        }
    });
});