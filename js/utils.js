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

//global error handler for ajax requests
$(document).ajaxError(function (event, response, request) {
	if (response.status == 401) //not authorized
	{
		var json = response.responseJSON;
		var authUrl = json.authorizationUrl;
		$('#loginButton').click(function () {
			//open github login in new window
			window.open(authUrl);
		});

		//open dialog with login button
		$("#loginDialog").dialog();

		//callback from new window
		window.onmessage = function (e) {
			//close dialog
			$("#loginDialog").dialog("close");
			//repeat the original request
			$.ajax(request);
		};
	}
});
