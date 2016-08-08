var serverURL = "http://131.234.73.193:5000/";
var queryString = {};

$(document).ready(function () {
	queryString = getQueryString();
	document.getElementById("nav_workspace").text = "Workspace: " + queryString["wsName"];
});

function cancelConfiguration() {
	window.location.href = history.back();
}
function saveConfiguration() {
	window.location.href = history.back();
}
