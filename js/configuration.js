var queryString = {};
var workspaceModel;

var Platform = function () {
	this.name = ko.observable("");
	this.url = ko.observable("");
	this.id = ko.observable(-1);
	this.init = function (data) {
		this.name(data.name);
		this.url(data.url);
		this.id(data.id);
		return this;
	}
}

var Catalogue = function () {
	this.name = ko.observable("");
	this.url = ko.observable("");
	this.id = ko.observable(-1);
	this.init = function (data) {
		this.name(data.name);
		this.url(data.url);
		this.id(data.id);
		return this;
	}
}

var WorkspaceModel = function () {
	this.name = ko.observable(queryString["wsName"]);
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
		if (data.platforms.length != 0)
			this.platforms($.map(data.platforms, function (item) {
					return new Platform().init(item)
				}));
		if (data.catalogues.length != 0)
			this.catalogues($.map(data.catalogues, function (item) {
					return new Catalogue().init(item)
				}));
		$("form").parsley().validate();
		return this;
	}
}

function saveConfiguration() {
	$("form").parsley().validate();
	if ($("form").parsley().isValid()) {
		var configurationJson = ko.toJSON(workspaceModel);
		console.log("New configuration:");
		console.log(configurationJson);
		$.ajax({
			url : serverURL + "workspaces/" + queryString["wsId"],
			method : 'PUT',
			contentType : "application/json; charset=utf-8",
			dataType : 'json',
			xhrFields : {
				withCredentials : true
			},
			data : configurationJson,
			success : function (data) {
				$("#successSaveConfiDialog").dialog({
					modal : true,
					draggable : false,
					buttons : {
						ok : function () {
							$(this).dialog("close");
							window.location.reload();
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
	} else {
		$("#FailedValidationDialog").dialog({
			modal : true,
			draggable : false,
			buttons : {
				ok : function () {
					$(this).dialog("close");
				}
			}
		});
	}
}

function loadConfiguration(wsId) {
	$.ajax({
		url : serverURL + "workspaces/" + wsId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			workspaceModel.init(data);
		}
	});
}

function goToWorkspaceView() {
	window.location.href = "workspaceView.html?wsId=" + queryString["wsId"];
}

$(document).ready(function () {
	queryString = getQueryString();
	wsId = queryString["wsId"];
	$.ajax({
		url : serverURL + "workspaces/" + wsId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			document.getElementById("nav_workspace").text = "Workspace: " + data.name;
		}
	});
	workspaceModel = new WorkspaceModel();
	loadConfiguration(wsId);
	ko.applyBindings(workspaceModel);
	$("#accordion").accordion({
		active : false,
		collapsible : false,
		heightStyle : "content"
	});
});
