var vnfs = [];
var services = [];
var queryString = {};
var wsId = "";
var ptId = "";
var nsId = "";
var availableItems = [];
var itemDictionary = {};

var Descriptor = function(data) {
    this.name = ko.observable(data.name);
    this.description = ko.observable(data.description);
    this.type = ko.observable(data.type);
    this.id = ko.observable(data.id);
    var self = this;
    this.publish_to = function(event) {
        $("#PublishToDialog").dialog({
            modal: true,
            draggable: false,
            buttons: {
                Ok: function() {
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
    }
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
    this.addDescriptor = function(data) {
        self.descriptors.push(new Descriptor(data));
    }
}

var viewModel = new ViewModel();

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
// load infos of all network services from the server
function loadServices() {
    availableItems.push("Create new NS");
    $.ajax({
        url: serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/services/",
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            console.log("services:");
            console.log(data);
            // display available services and their onclick event.
            services = data;
            for (var i = 0; i < services.length; i++) {
                var serviceName = services[i].descriptor.name;
                availableItems.push("NS: " + serviceName);
                var serviceId = services[i].id;
                itemDictionary[serviceName] = serviceId;
                var serviceInfo = services[i].descriptor.description;
                if (!serviceInfo) {
                    serviceInfo = "";
                }
                var nsData = {
                    name: serviceName,
                    description: serviceInfo,
                    id: serviceId,
                    type: "NS"
                };
                viewModel.addDescriptor(nsData);
            }
        }
    });
}

// load infos of all VNFs from the server
function loadVnfs() {
    availableItems.push("Create new VNF");
    $.ajax({
        url: serverURL + "workspaces/" + wsId + "/projects/" + ptId + "/functions/",
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function(data) {
            console.log("vnfs:");
            console.log(data);
            // display available vnfs and their onclick event.
            vnfs = data;
            for (var i = 0; i < vnfs.length; i++) {
                var vnfName = vnfs[i].descriptor.name;
                availableItems.push("VNF: " + vnfName);
                var vnfId = vnfs[i].id;
                itemDictionary[vnfName] = vnfId;
                var vnfInfo = vnfs[i].descriptor.description;
                if (!vnfInfo) {
                    vnfInfo = "";
                }
                var vnfData = {
                    name: vnfName,
                    description: vnfInfo,
                    id: vnfId,
                    type: "VNF"
                };
                viewModel.addDescriptor(vnfData);
            }
        }
    });
}

// load all network services and vnfs from the server, which will be displayed
// to the user
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

// delete a network service from the server and it will be called by clicking
// "delete" button belongs to a service
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

// delete a VNF from the server and it will be called by clicking "delete"
// button belongs to a VNF
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

// clone a existing VNF to create a new one and it will be called by clicking
// "clone" button belongs to a VNF
function cloneVnf(vnfId) {
    window.location.href = "vnfView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&vnfId=" + vnfId + "&operation=" + "clone";
}

// clone a existing network service to create a new one and it will be called by
// clicking "clone" button belongs to a service
function cloneService(serviceId) {
    showCreateNSDialog(true, serviceId);
}

function createNewVnf() {
    window.location.href = "vnfView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&operation=" + "create";
}

// send the name of the new network service to server
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

// open the network service editor and it will be called by clicking "edit"
// button belongs to a service
function editService(serviceId) {
    window.location.href = "nsView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&nsId=" + serviceId;

}

// open the VNF editor and it will be called by clicking "edit" button belongs
// to a VNF
function editVnf(vnfId) {
    window.location.href = "vnfView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"] + "&vnfId=" + vnfId + "&operation=" + "edit";
}

// open configuration from the current project
function goToConfigurationView() {
    window.location.href = "project-configurationView.html?wsId=" + queryString["wsId"] + "&ptId=" + queryString["ptId"];
}

// create new networkservice dialog (uses jquery ui Dialog)
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
