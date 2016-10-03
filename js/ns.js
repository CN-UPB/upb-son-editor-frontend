//create networkservice descriptor dialog (uses jquery ui Dialog)
function showDialog() {
	//alert("here");
	$("#createDialog").dialog({
		modal : true,
		draggable : false,
		buttons : {
			Cancel : function (){
				$(this).dialog("close");
			},
			"Submit" : function () {
				createNewNetworkservice();
				$(this).dialog("close");
			}
		}
	});
}

//ui-accordin-hover
$(function() {
    $("#accordion").accordion({active : false,
		collapsible : true,
		heightStyle : "content" });
    $(".trigger").click(function() {
        $("#accordion").accordion("enable").accordion("activate", parseInt($(this).data("index"), 10)).accordion("disable");
    });
});
