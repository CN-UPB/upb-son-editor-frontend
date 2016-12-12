$(document).ready(function () {

	loadUserInfo();

});
function getQueryString() {
	var queryString = new Array();
	if (window.location.search.split('?').length > 1) {
		var params = window.location.search.split('?')[1].split('&');
		for (var i = 0; i < params.length; i++) {
			var key = params[i].split('=')[0];
			var value = decodeURIComponent(params[i].split('=')[1]);
			queryString[key] = value;
		}
	}
	return queryString;
};

function goToHomeView()
{
	window.location.href="index.html";
}

function goToWorkspaceView(wsId){
	var queryString = getQueryString();
	if (wsId == null){
		wsId = queryString["wsId"];
	}
	window.location.href="workspaceView.html?wsId="+wsId;
}
 
function goToProjectView(wsId, ptId){
	var queryString = getQueryString();
	if (wsId == null){
		wsId = queryString["wsId"];
	}
	if (ptId == null){
		ptId = queryString["ptId"];
	}
	window.location.href="projectView.html?wsId="+wsId+"&ptId="+ptId;
}
function setWorkspaceInNav(wsId)
{	
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
}

function setProjectInNav(wsId, ptId)
{
	$.ajax({
		url : serverURL + "workspaces/" + wsId + "/projects/" + ptId,
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			document.getElementById("nav_project").text = "Project: " + data.name;
		}
	});
}
var requests = [];
var LOGIN_DIALOG_STRING = "<div title='Login'><h3>{0}</h3></div>";
var ERROR_DIALOG_STRING = "<div id='errorDialog' title='Error'></div>";

//global error handler for ajax requests
$(document).ajaxError(function (event, response, request, thrownError) {
	if (response.status == 401) //not authorized
	{
		var json = response.responseJSON;
		var authUrl = json.authorizationUrl;
		var message = json.message;
		
		requests.push (request);
		if (requests.length > 1){
			//do not open more than one dialog at a time
			return;
		}

		//open dialog with login button
		var loginDialog = $(LOGIN_DIALOG_STRING.format(message)).dialog(
							{
								modal: true,
								buttons:[
									{
										text: "Login with Github",
										click: function () {
											//open github login in new window
											window.open(authUrl);
										}
									}
								]
							});
		

		//callback from new window
		window.onmessage = function (e) {
			//close dialog
			loginDialog.dialog("close");
			//repeat the original requests
			while(requests.length > 0) 
			{
				$.ajax(requests.pop());
			}
		};
	} else {
		if (!$("#errorDialog").length){
			$(ERROR_DIALOG_STRING).dialog();
		} else {
            $("#errorDialog").dialog();
        }
        if (response.status > 0)
		{
			var json = JSON.parse(response.responseText);
			$("#errorDialog").html(json.message);
		} else {
			$("#errorDialog").text("Connection Failed. Please Try again later")
		}

	}
});

function showWaitAnimation(text){
	$( "#wait" ).dialog({
		modal: true,
  		dialogClass: "no-close"
	});
	$("#wait").text(text);
}

function closeWaitAnimation(){
	$( "#wait" ).dialog("close");
}

function loadUserInfo(){

	$.ajax({
		url : serverURL + "user",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			//console.log(data);
			//console.log(data.login);
			//$('#username').css('float','right');
			document.getElementById("target-username").text = data.login;
			$('.avatar').attr("src", data.avatar_url);
		}
	});
}

function logOutFromEditor(){
	window.location.reload(true);
	$.ajax({
		url : serverURL + "logout",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function(){
			window.location.reload(true);
		}
	});
}

//register a string formatting method
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}