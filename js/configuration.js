var serverURL = "http://131.234.73.193:5000/";
var queryString = {};
var workspaceModel;

var Platform=function()
{
	this.platformName=ko.observable("");
	this.platformURL=ko.observable("");
	this.init=function(data)
	{
		this.platformName(data.platformName);
		this.platformURL(data.platformURL);
		return this;
	}
}

var Catalogue=function()
{
	this.catalogueName=ko.observable("");
	this.catalogueURL=ko.observable("");
	this.init=function(data)
	{
		this.catalogueName(data.catalogueName);
		this.catalogueURL(data.catalogueURL);
		return this;
	}
}
var WorkspaceModel=function()
{
	this.name=ko.observable(queryString["wsName"]);
	this.platforms=ko.observableArray([new Platform()]);
	this.catalogues=ko.observableArray([new Catalogue()]);
	this.addPlatform=function()
	{
		this.platforms.push(new Platform());
	};
	this.deletePlatform=function(platform)
	{
		this.platforms.remove(platform);
	}.bind(this);
	this.addCatalogue=function()
	{
		this.catalogues.push(new Catalogue());
	};
	this.deleteCatalogue=function(catalogue)
	{
		this.catalogues.remove(catalogue);
	}.bind(this);
}

function cancelConfiguration() {
	window.location.href = history.back();
}
function saveConfiguration() {
	window.location.href = history.back();
}

$(document).ready(function () {
	queryString = getQueryString();
	document.getElementById("nav_workspace").text = "Workspace: " + queryString["wsName"];
	workspaceModel=new WorkspaceModel();
	$.ajax({
		url : serverURL + "workspaces/" + queryString["wsId"]+"/platforms/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			workspaceModel.platforms($.map(data, function(item){return new Platform().init(item)}));
		}
	});
	$.ajax({
		url : serverURL + "workspaces/" + queryString["wsId"]+"/catalogues/",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			workspaceModel.catalogues($.map(catalogues, function(item){return new Catalogue().init(item)}));
		}
	});
	ko.applyBindings(workspaceModel);
	$("#accordion").accordion({
		active : false,
		collapsible : false,
		heightStyle : "content"
	});
});

