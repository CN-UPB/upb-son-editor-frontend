/**
 * Written by Linghui
 * The idea is to push the last 10 states(versions) of the NS descriptor into an undo stack.
 * By clicking undo button in the editor one state s will be pop out and pushed into
 * redo stack. The editor cleans up the current state and displays the last state s.
 * It is used in nsView.html.
 */
/**
 * undo stack to store the last 10 states of the NS descriptor.
 */
var stackUndo = [];
/**
 * redo stack to store the last undo states.
 */
var stackRedo = [];
/**
 * stores the last state of the NS descriptor.
 */
var lastState = null;

/**
 * It adds the last state of the descriptor to a stack, it is called in nsEditor.js by updateServiceOnServer() function.
 */
function addAction() {
	if (stackRedo.length > 0) {
		stackRedo=[];
	}
	if (lastState != null) {
		stackUndo.push(lastState);
	}
	lastState = JSON.stringify(cur_ns);
	if (stackUndo.length > 10) {
		stackUndo.splice(0, 1);
	}
}
/**
 * It is called by clicking "redo" button in editor.
 *
 */
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
/**
 * It is called by clicking "undo" button in editor.
 */
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