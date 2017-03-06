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

function goToHomeView() {
	window.location.href = "index.html";
}

function goToWorkspaceView(wsId) {
	var queryString = getQueryString();
	if (wsId == null) {
		wsId = queryString["wsId"];
	}
	window.location.href = "workspaceView.html?wsId=" + wsId;
}

function goToProjectView(wsId, ptId) {
	var queryString = getQueryString();
	if (wsId == null) {
		wsId = queryString["wsId"];
	}
	if (ptId == null) {
		ptId = queryString["ptId"];
	}
	if(queryString["fromNSEditor"]){
		//go back one step to editor
		window.location.href= document.referrer;
	} else {
		window.location.href = "projectView.html?wsId=" + wsId + "&ptId=" + ptId;
	}
}
function setWorkspaceInNav(wsId) {
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
}

function setProjectInNav(wsId, ptId) {
	$.ajax({
		url: serverURL + "workspaces/" + wsId + "/projects/" + ptId,
		dataType: "json",
		xhrFields: {
			withCredentials: true
		},
		success: function (data) {
			document.getElementById("nav_project").text = "Project: " + data.name;
		}
	});
}
var requests = [];
var LOGIN_DIALOG_STRING = "<div title='Login'><img src='http://www.sonata-nfv.eu/sites/sonata-nfv.eu/themes/zen/sonatina/images/sonata_logo.svg' alt='SONATA SDK Editor' width='180' height='50' align='middle' style='margin-left: 40px'><h3 style='margin-left: 60px'>{0}</h3></div>";
var ERROR_DIALOG_STRING = "<div id='errorDialog' title='Error'></div>";
var WAIT_DIALOG_STRING = "<div id='wait'><div id='waitText'></div><div id='progressbar'></div></div>";

//global error handler for ajax requests
$(document).ajaxError(function (event, response, request, thrownError) {
	//in case of any error close the wait animation
	closeWaitAnimation();
	if (response.status == 401) //not authorized
	{
		var json = response.responseJSON;
		var authUrl = json.authorizationUrl;
		var message = json.message;

		requests.push(request);
		if (requests.length > 1) {
			//do not open more than one dialog at a time
			return;
		}

		//open dialog with login button
		var loginDialog = $(LOGIN_DIALOG_STRING.format(message)).dialog(
			{
				modal: true,
				buttons: [
					{
						text: "Login with Github",
						style: "float:left; margin-left:70px",
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
			while (requests.length > 0) {
				$.ajax(requests.pop());
			}
		};
	} else {
		if (!$("#errorDialog").length) {
			$(ERROR_DIALOG_STRING).dialog();
		} else {
			$("#errorDialog").dialog();
		}
		if (response.status > 0) {
			var json = JSON.parse(response.responseText);
			$("#errorDialog").html(json.message.replace(/(?:\r\n|\r|\n)/g, '<br />'));
		} else {
			$("#errorDialog").text("Connection Failed. Please Try again later")
		}

	}
});

function showWaitAnimation(title, text, progress) {
	var titleText = title || "Loading";
	var waitText = text;
	if (!$("#wait").length) {
		$(WAIT_DIALOG_STRING).dialog({
			modal: true,
			dialogClass: "no-close"
		});
	} else {
		$("#wait").dialog({
			modal: true,
			dialogClass: "no-close"
		});
	}
	if (progress != null){
		$('#progressbar').progressbar({value: progress});
	} else {
		$('#progressbar').progressbar({value: false});
	}
	if (waitText)
		$('#waitText').text(waitText);
	else
		$('#waitText').html("<br/>");
	$('#wait').dialog('option', 'title', titleText);

}

function closeWaitAnimation() {
	$("#wait").dialog("close");
}

function loadUserInfo() {

	$.ajax({
		url: serverURL + "user",
		dataType: "json",
		xhrFields: {
			withCredentials: true
		},
		success: function (data) {
			//console.log(data);
			//console.log(data.login);
			//$('#username').css('float','right');
			document.getElementById("target-username").text = data.login;
			$('.avatar').attr("src", data.avatar_url);
		}
	});
}

function logOutFromEditor() {
	window.location.reload(true);
	$.ajax({
		url: serverURL + "logout",
		dataType: "json",
		xhrFields: {
			withCredentials: true
		},
		success: function () {
			window.location.reload(true);
		}
	});
}

//register a string formatting method
if (!String.prototype.format) {
	String.prototype.format = function () {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function (match, number) {
			return typeof args[number] != 'undefined'
				? args[number]
				: match
				;
		});
	};
}