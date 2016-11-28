$(function() {
	$.ajax({
		url : serverURL + "workspaces/" + queryString["wsId"] + "/projects/" + queryString["ptId"] + "/services/" + queryString["nsId"],
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			$('#dsName').val(data.name);
		}
	});
});