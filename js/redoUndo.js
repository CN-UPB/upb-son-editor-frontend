var stackUndo = [];
var stackRedo = [];
var lastAction=null;
function addAction() {
	if(lastAction!=null)
	{
		stackUndo.push(JSON.stringify(lastAction));
	}		
	lastAction=cur_ns;
		stackRedo.slice(0, stackRedo.length);
		if (stackUndo.length > 5) {
		stackUndo.slice(0, 1);
		}
}

function redo() {
    if (stackRedo.length > 0) {
	stackUndo.push(JSON.stringify(cur_ns));
	cur_ns = JSON.parse(stackRedo.pop());
	displayNS();
	updateServiceOnServer("redo");
    }
}

function undo() {
    if (stackUndo.length > 0) {

	lastAction=JSON.parse(stackUndo.pop());
	stackRedo.push(JSON.stringify(cur_ns));
	cur_ns=JSON.parse(stackUndo.pop());
	displayNS();
	updateServiceOnServer("undo");
    }
}