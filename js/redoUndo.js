var stackUndo = [];
var stackRedo = [];
var lastState = null;
function addAction() {
	if (stackRedo.length > 0) {
		stackRedo=[];
	}
	if (lastState != null) {
			stackUndo.push(lastState);
	}
	lastState = JSON.stringify(cur_ns);
	if (stackUndo.length > 5) {
		stackUndo.splice(0, 1);
	}
}

function redo() {
	if (stackRedo.length > 0) {
		var doAction = stackRedo.pop();
		stackUndo.push(JSON.stringify(cur_ns));
		clean();
		cur_ns = JSON.parse(doAction);
		displayNS();
		updateServiceOnServer("redo");
		lastState = JSON.stringify(cur_ns);
	}
}

function undo() {
	if (stackUndo.length > 0) {
		var doAction = stackUndo.pop();
		stackRedo.push(JSON.stringify(cur_ns));
		clean();
		cur_ns = JSON.parse(doAction);
		displayNS();
		updateServiceOnServer("undo");
		lastState = JSON.stringify(cur_ns);
	}
}