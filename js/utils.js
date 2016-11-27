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


//global error handler for ajax requests
$(document).ajaxError(function (event, response, request) {
	if (response.status == 401) //not authorized
	{
		var json = response.responseJSON;
		var authUrl = json.authorizationUrl;
		var message = json.message;
		
		//open dialog with login button
		var loginDialog = $("<div title='Please Login'>"
							 +"<h3>"+ message+"</h3>"
							+"</div>").dialog(
							{
								modal: true,
								buttons:[
									{
										text: "Login with Github",
										icon: "icon-github-sign",
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
			//repeat the original request
			$.ajax(request);
		};
	} else {
		$("#errorDialog").dialog();
		var json = JSON.parse(response.responseText);
		$("#errorDialog").text(json.message);

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