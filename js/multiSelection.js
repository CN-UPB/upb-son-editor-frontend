var area;
var x1 = 0, y1 = 0, x2 = 0, y2 = 0;
function reCalc() { // This will restyle the area
	var x3 = Math.min(x1, x2); // Smaller X
	var x4 = Math.max(x1, x2); // Larger X
	var y3 = Math.min(y1, y2); // Smaller Y
	var y4 = Math.max(y1, y2); // Larger Y
	area.style.left = x3 + 'px';
	area.style.top = y3 + 'px';
	area.style.width = x4 - x3 + 'px';
	area.style.height = y4 - y3 + 'px';
}
$(document).ready(function() {
	area = document.getElementById('selectArea');
	$("#editor").mousedown(function(e) {
		area.hidden = 0; // Unhide the area
		x1 = e.clientX; // Set the initial X
		y1 = e.clientY; // Set the initial Y
		reCalc();
	});

	$("#editor").mousemove(function(e) {
		x2 = e.clientX; // Update the current position X
		y2 = e.clientY; // Update the current position Y
		reCalc();
	});
	$("#editor").mouseup(function(e) {
		area.hidden = 1; // Hide the area
	});
	$("#selectArea").mouseup(function(e) {
		area.hidden = 1; // Hide the div
	});
});