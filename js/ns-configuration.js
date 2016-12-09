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


//update network service descriptor
function updateConfig(){

    cur_ns.descriptor.name    = $('#dsName').val();
    cur_ns.descriptor.vendor  = $('#dsVendor').val();
    cur_ns.descriptor.version = $('#dsVersion').val();
    cur_ns.descriptor.author = $('#dsAuthor').val();
    cur_ns.descriptor.description = $('#dsDescription').val();
    cur_ns.descriptor.descriptor_version = $('#dsDescriptorVersion').val();

    $.ajax({
        url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/" + queryString["nsId"],
        method : 'PUT',
        contentType : "application/json; charset=utf-8",
        dataType : 'json',
        xhrFields : {
            withCredentials : true
        },

        data : JSON.stringify(cur_ns),
        success : function (data) {
            $("#successDescriptorDialogUpdated").dialog({
                modal : true,
                draggable : false,
                buttons : {
                    ok : function () {
                        $(this).dialog("close");
                        $("#nav_ns").html("NS: " + data.name);
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


$(document).ready(function() {
	//show hint texts for input fields
    $('[data-toggle="tooltip"]').tooltip();

    $.ajax({
        url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/" + queryString["nsId"],
        dataType : "json",
        xhrFields : {
            withCredentials : true
        },
        success : function (data) {
            $('#dsName').val(data.descriptor.name);
            $('#dsVendor').val(data.descriptor.vendor);
            $('#dsVersion').val(data.descriptor.version);
            $('#dsAuthor').val(data.descriptor.author);
            $('#dsDescription').val(data.descriptor.description);
            $('#dsDescriptorVersion').val(data.descriptor.descriptor_version);
        }
    });
});