/**
 * Created by Jonas on 15.03.2017.
 *
 * This view configures the backend to set the
 * GitHub clientID and secret and maintain the
 * list of users
 *
 */

/**
 * JSON editor object
 */
var editor;

/**
 * Writes the configuration back to the server
 *
 */
function saveConfig() {
	var data = JSON.stringify(editor.getValue());
	$.ajax({
		url: serverURL + "config",
		method: 'POST',
		contentType: "application/json; charset=utf-8",
		dataType: 'json',
		xhrFields: {
			withCredentials: true
		},
		data: data,
		success: function () {
			$("#successDialog").dialog({
				modal: true,
				draggable: false,
				buttons: {
					ok: function () {
						$(this).dialog("close");
					}
				}
			});
		}
	});
}

/**
 * It loads the Backend Servers configuration.
 *
 */
function loadConfig() {
	$.ajax({
		url: serverURL + "config",
		dataType: "json",
		xhrFields: {
			withCredentials: true
		},
		success: function (data) {
			editor.setValue(data);
			closeWaitAnimation();
		}
	});
}

$(document).ready(function () {
	JSONEditor.defaults.theme = 'bootstrap3';
	JSONEditor.defaults.iconlib = 'jQueryUI';

	editor = new JSONEditor(document.getElementById('configForm'), {
		schema: {
			type: "object"
		}
	});

	var windowHeight = $(window).innerHeight();
	var configForm = $('#configForm');
	configForm.css(
		'height',
		windowHeight - configForm.offset().top - 2
		* $('#buttons').height());
	loadConfig();
});
