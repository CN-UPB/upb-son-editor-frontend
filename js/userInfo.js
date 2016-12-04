$(document).ready(function () {

	loadUserInfo();

});

function loadUserInfo(){

	$.ajax({
		url : serverURL + "user",
		dataType : "json",
		xhrFields : {
			withCredentials : true
		},
		success : function (data) {
			console.log(data);
			console.log(data.login);
			//$('#username').css('float','right');
			document.getElementById("target-username").text = "Signed in as " + data.login;
			$('.avatar').attr("src", data.avatar_url);
		}
	});
}

function showMyInfo() {
    document.getElementById("myDropdown").classList.toggle("show");

}

/*	window.onclick = function(event) {
  		if (!event.target.matches('.dropbtn')) {

    		var dropdown = document.getElementById("myDropdown");
    		
      		if (dropdown.classList.contains('show')) {
        		dropdown.classList.remove('show');
      		}
    		
  		}
	}*/