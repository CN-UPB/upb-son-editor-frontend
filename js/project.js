/**
 * Written by Linghui
 *
 * It is used in project.html.
 */

/**
 * stores list of VNFs in current project
 */
var vnfs = [];
/**
 * stores list of NSs in current project
 */
var services = [];
var queryString = {};
/**
 * stores id of the current workspace
 */
var wsId = "";
/**
 * stores id of the current project
 */
var ptId = "";
/**
 * stores id of the created new network service
 */
var nsId = "";
/**
 * Used for searching a specific VNF or NS in the search bar
 */
var availableItems = [];
/**
 * Dictionary stores the name and id of each VNF or NS in form of <VnfName, id> or <NsName,id>
 */
var itemDictionary = {};

/**
 * data binding class for a descriptor
 * It implements the options to a project such as edit, delete, clone and publish to a catalogue.
 */
var Descriptor = function(data, id , type) {
	this.name = ko.observable(data.name);
	this.vendor = ko.observable(data.vendor);
	this.version = ko.observable(data.version);
    this.description = ko.observable(data.description);
    this.type = ko.observable(type);
    this.id = ko.observable(id);
    var self = this;
    this.publish_to = function(event) {
        $("#PublishToDialog").dialog({
            modal: true,
            draggable: false,
            buttons: {
            	Cancel: function() {
                    $(this).dialog("close");
                },
                Publish: function() {
                    var catalogueID = $("#selectCatalogue").val();
                    var myurl = "";
                    if (self.type() == "VNF") {
                        myurl = serverURL + "workspaces/" + wsId + "/catalogues/" + catalogueID + "/functions/";
                    } else {
                        myurl = serverURL + "workspaces/" + wsId + "/catalogues/" + catalogueID + "/services/";
                    }

                    $.ajax({
                        url: myurl,
                        method: 'POST',
                        contentType: "application/json; charset=utf-8",
                        dataType: 'json',
                        xhrFields: {
                            withCredentials: true
                        },
                        data: JSON.stringify({
                            "id": self.id()
                        }),
                        success: function(data) {
                            $("#PublishSuccessDialog").dialog({
                                modal: true,
                                draggable: false,
                                buttons: {
                                    Ok: function() {
                                        $(this).dialog("close");
                                    }
                                }
                            });
                        },
                    });
                    $(this).dialog("close");
                }
            }
        });
    };
    this.delete_desc = function() {
        if (self.type() === "VNF") {
            deleteVnf(self.id());
        } else {
            deleteService(self.id());
        }
    }
    ;

    this.clone = function() {
        if (self.type() === "VNF") {
            cloneVnf(self.id());
        } else {
            cloneService(self.id());
        }
    }
    ;

    this.edit = function() {
        if (self.type() === "VNF") {
            editVnf(self.id());
        } else {
            editService(self.id());
        }
    }
    ;
};

function ViewModel() {
    this.descriptors = ko.observableArray([]);
    this.catalogues = ko.observableArray([]);
    var self = this;
    	this.addDescriptor= function(data, id, type){
		self.descriptors.push(new Descriptor(data, id, type));
    }
}

var viewModel = new ViewModel();

/**
 * It loads the user defined catalogues from the back-end server.
 */
function loadCatalogues() {
    $.ajax({
        url: serverURL + "workspaces/" + wsId,
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            viewModel.catalogues(data.catalogues);
        }
    });
}

/**
 *It loads infos of all network services from the back-end server.
 */
function loadServices() {
	availableItems.push("Create new NS");
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/services/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			console.log("services:");
			console.log(data);
			// display available services and their onclick event.
			services = data;
			for (var i = 0; i < services.length; i++) {
				var serviceName = services[i].descriptor.name;
				availableItems.push("NS: " + serviceName);
				var serviceId = services[i].id;
				itemDictionary[serviceName] = serviceId;
				viewModel.addDescriptor(services[i].descriptor, serviceId, "NS");
			}
		}
	});
}

/**
 * It loads infos of all VNFs from the back-end server.
*/
function loadVnfs() {
	availableItems.push("Create new VNF");
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/functions/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			console.log("vnfs:");
			console.log(data);
			// display available vnfs and their onclick event.
			vnfs = data;
			for (var i = 0; i < vnfs.length; i++) {
				var vnfName = vnfs[i].descriptor.name;
				availableItems.push("VNF: " + vnfName);
				var vnfId = vnfs[i].id;
				itemDictionary[vnfName] = vnfId;
				viewModel.addDescriptor(vnfs[i].descriptor, vnfId, "VNF");
			}
		}
	});
}

/**
 * It loads all network services and vnfs from the back-end server, which will be displayed
 *	to the user.
 */
function loadList(selectedIndex) {
    document.getElementById("display_NS_VNFS").innerHTML = "";
    availableItems = [];
    itemDictionary = {};
    switch (selectedIndex) {
    case 0:
        loadServices();
        loadVnfs();
        break;
    case 1:
        loadServices();
        break;
    default:
        loadVnfs();
        break;
    }
}

/** It deletes a network service from the server and it is called by clicking
 * "delete" button belongs to a service.
 */
function deleteService(serviceId) {
    $("#ConfirmDeletionDialog_Service").dialog({
        modal: true,
        draggable: false,
        buttons: {
            Yes: function() {
                $(this).dialog("close");
                $.ajax({
                    url: serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/" + serviceId,
                    dataType: "json",
                    type: 'DELETE',
                    xhrFields: {
                        withCredentials: true
                    },
                    success: function(data) {
                        $("#DeleteServiceDialog").dialog({
                            modal: true,
                            draggable: false,
                            buttons: {
                                Ok: function() {
                                    $(this).dialog("close");
                                    window.location.reload();
                                }
                            }
                        });
                    }
                });
            },
            No: function() {
                $(this).dialog("close");
            }

        }
    });
}

/**delete a VNF from the server and it is called by clicking "delete"
 * button belongs to a VNF.
 */
function deleteVnf(vnfId) {
    $("#ConfirmDeletionDialog_VNF").dialog({
        modal: true,
        draggable: false,
        buttons: {
            Yes: function() {
                $(this).dialog("close");
                $.ajax({
                    url: serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/functions/" + vnfId,
                    dataType: "json",
                    type: 'DELETE',
                    xhrFields: {
                        withCredentials: true
                    },
                    success: function(data) {
                        $("#DeleteVnfDialog").dialog({
                            modal: true,
                            draggable: false,
                            buttons: {
                                Ok: function() {
                                    $(this).dialog("close");
                                    window.location.reload();
                                }
                            }
                        });
                    }
                });
            },
            No: function() {
                $(this).dialog("close");
            }

        },

    });
}

/** It clones a existing VNF to create a new one and it is called by clicking
 * "clone" button belongs to a VNF.
 */
function cloneVnf(vnfId) {
    window.location.href = "vnfView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&vnfId=" + vnfId + "&operation=" + "clone";
}

/** It clones a existing network service to create a new one and it is called by
 * clicking "clone" button belongs to a service
 */
function cloneService(serviceId) {
    showCreateNSDialog(true, serviceId);
}
/**
 *  It opens the VNF view page for a new VNF.
 */
function createNewVnf() {
    window.location.href = "vnfView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&operation=" + "create";
}

/**
 *  It creates a new network service and sends the name of it to the back-end server.
 */
function createNewService(clone, cloneId) {
    if (clone) {
        // load cloned service from server
        $.ajax({
            url: serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/services/" + cloneId,
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            success: function(newData) {
                newData.descriptor.name = $('#nsNameInput').val();
                newData.descriptor.vendor = $('#nsVendorInput').val();
                newData.descriptor.version = $('#nsVersionInput').val();
                newData.descriptor.descriptor_version = $('#nsDescriptorVersionInput').val();
                $.ajax({
                    url: serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/",
                    method: 'POST',
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                    xhrFields: {
                        withCredentials: true
                    },
                    data: JSON.stringify(newData),
                    success: function(data) {
                        window.location.href = "nsView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&nsId=" + data.id;
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
            },
        });
    } else {
        var name = $('#nsNameInput').val();
        var vendor = $('#nsVendorInput').val();
        var version = $('#nsVersionInput').val();
        var descriptor_version = $('#nsDescriptorVersionInput').val();
        var newData = {};
        newData["meta"] = {};
        newData["descriptor"] = {
            "version": version,
            "vendor": vendor,
            "name": name,
            "descriptor_version": descriptor_version
        };
        $.ajax({
            url: serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/",
            method: 'POST',
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            xhrFields: {
                withCredentials: true
            },
            data: JSON.stringify(newData),
            success: function(data) {
                window.location.href = "nsView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&nsId=" + data.id;
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
}

/** It opens the network service editor and it will be called by clicking "edit"
 *	button belongs to a service.
 */
function editService(serviceId) {
    window.location.href = "nsView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&nsId=" + serviceId;

}

/** It opens the VNF editor and it will be called by clicking "edit" button belongs
 *  to a VNF.
 */
function editVnf(vnfId) {
    window.location.href = "vnfView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&vnfId=" + vnfId + "&operation=" + "edit";
}

/**
 * It opens the configuration view of the current project
 */
function goToConfigurationView() {
    window.location.href = "projectConfigurationView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"];
}

/**
*  open emulator view
*/ 
function goToEmulatorView() {
	window.location.href = "emuIndex.html?wsId=" + queryString["wsId"]+"&ptId=" + queryString["ptId"];
}

/**
 * It shows the "create new network service" dialog (uses jquery ui Dialog)
 */
function showCreateNSDialog(clone, cloneId) {
    $("#createNetworkserviceDialog").dialog({
        modal: true,
        draggable: true,
        buttons: {
            Cancel: function() {
                $(this).dialog("close");
            },
            "Create": function() {
                createNewService(clone, cloneId);
                $(this).dialog("close");
            }
        }
    });
}

/**
 * It loads available VNFs, NSs and catalogues from the back-end server
 * and sets configurations for the search bar.
 */
$(document).ready(function() {
    queryString = getQueryString();
    wsId = queryString["wsId"];
    ptId = queryString["ptId"];
    setWorkspaceInNav(wsId);
    setProjectInNav(wsId, ptId);
    ko.applyBindings(viewModel);
    loadServices();
    loadVnfs();
    // search bar(uses jquery ui Autocomplete)
    $("#search_item").autocomplete({
        source: availableItems,
        select: function(event, ui) {
            var item = ui.item.label;
            var selectedId;
            if (item.startsWith("Create")) {
                if (item == "Create new NS") {
                    showCreateNSDialog();
                } else {
                    createNewVnf();
                }
            } else {
                if (item.startsWith("NS")) {
                    item = item.substring(4, item.length);
                    selectedId = itemDictionary[item];
                    editService(selectedId);
                } else {
                    item = item.substring(5, item.length);
                    selectedId = itemDictionary[item];
                    editVnf(selectedId);
                }
            }
        }
    });
    loadCatalogues();
});