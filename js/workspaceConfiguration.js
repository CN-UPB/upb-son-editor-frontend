/**
 * It is used in workspaceConfigurationView.html
 */
var queryString = {};

/**
 * an instance of WorkspaceModel
 */
var workspaceModel;

/**
 * an instance of SchemaModel
 */
var schemasModel;

/**
 * data binding class for platforms
 */
var Platform = function () {
	this.name = ko.observable("");
	this.url = ko.observable("");
	this.id = ko.observable(-1);
	this.init = function (data) {
		this.name(data.name);
		this.url(data.url);
		this.id(data.id);
		return this;
	};
};

/**
 * data binding class for catalogues
 */
var Catalogue = function () {
	this.name = ko.observable("");
	this.url = ko.observable("");
	this.id = ko.observable(-1);
	this.init = function (data) {
		this.name(data.name);
		this.url(data.url);
		this.id(data.id);
		return this;
	};
};

/**
 * data binding class for all workspace configuration items
 */
var WorkspaceModel = function () {
	this.name = ko.observable();
	this.platforms = ko.observableArray();
	this.catalogues = ko.observableArray();
	this.addPlatform = function () {
		this.platforms.push(new Platform());
		$("form").parsley().validate();
	};
	this.deletePlatform = function (platform) {
		this.platforms.remove(platform);
	}
		.bind(this);
	this.addCatalogue = function () {
		this.catalogues.push(new Catalogue());
		$("form").parsley().validate();
	};
	this.deleteCatalogue = function (catalogue) {
		this.catalogues.remove(catalogue);
	}
		.bind(this);
	this.init = function (data) {
		this.name(data.name);
		if (data.platforms.length != 0){this.platforms($.map(data.platforms, function (item) {
			return new Platform().init(item)
		}));}
		if (data.catalogues.length != 0){this.catalogues($.map(data.catalogues, function (item) {
			return new Catalogue().init(item)
		}));}
		$("form").parsley().validate();
		return this;
	}
};

/**
 * data binding class for VNF schema and NS schema.
 */
var SchemasModel = function () {
	this.schemas = ko.observableArray();
};


/**
 *  It saves the configuration of the current workspace and it is called by clicking "save" button.
 *
 */
function saveConfiguration() {
	$("form").parsley().validate();
	if ($("form").parsley().isValid()) {
		var configurationJson = ko.toJSON(workspaceModel);
		console.log("New configuration:");
		console.log(configurationJson);
		configurationJson = JSON.parse(configurationJson);
		configurationJson.vnf_schema_index = $('#selectVNFSchema').val();
		configurationJson.ns_schema_index = $('#selectNSchema').val();
		$.ajax({
			url: serverURL + "workspaces/" + queryString["wsId"],
			method: 'PUT',
			contentType: "application/json; charset=utf-8",
			dataType: 'json',
			xhrFields: {
				withCredentials: true
			},
			data: JSON.stringify(configurationJson),
			success: function (data) {
				$("#successSaveConfiDialog").dialog({
					modal: true,
					draggable: false,
					buttons: {
						ok: function () {
							$(this).dialog("close");
							window.location.reload();
						}
					}
				});
			},
			error: function (err) {
				$('#errorDialog').text(err.responseText);
				$('#errorDialog').dialog({
					modal: true,
					buttons: {
						Ok: function () {
							$(this).dialog("close");
						}
					}
				});
			}
		});
	} else {
		$("#FailedValidationDialog").dialog({
			modal: true,
			draggable: false,
			buttons: {
				ok: function () {
					$(this).dialog("close");
				}
			}
		});
	}
}

/**
 * It loads the current configuration of the workspace.
 *
 * @param wsId
 */
function loadConfiguration(wsId) {
	$.ajax({
		url: serverURL + "workspaces/" + wsId,
		dataType: "json",
		xhrFields: {
			withCredentials: true
		},
		success: function (data) {
			workspaceModel.init(data);
			$.ajax({
				url: serverURL + "workspaces/" + wsId + "/schema/",
				dataType: "json",
				xhrFields: {
					withCredentials: true
				},
				success: function (schema_data) {
					schemasModel.schemas(schema_data);
					$('#selectSchema').val(data.schema_index);
				}
			});
		}
	});
}


$(document).ready(function () {
	queryString = getQueryString();
	wsId = queryString["wsId"];
	$.ajax({
		url: serverURL + "workspaces/" + wsId,
		dataType: "json",
		xhrFields: {
			withCredentials: true
		},
		success: function (data) {
			document.getElementById("nav_workspace").text = "Workspace: " + data.name;
		}
	});
	workspaceModel = new WorkspaceModel();
	loadConfiguration(wsId);
	ko.applyBindings(workspaceModel, $('#workspaceMain')[0]);
	schemasModel = new SchemasModel();
	ko.applyBindings(schemasModel, $('#schemas')[0]);
	$("#accordion").accordion({
		active: false,
		collapsible: false,
		heightStyle: "content"
	});
});
