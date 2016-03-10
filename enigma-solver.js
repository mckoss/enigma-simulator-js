global_namespace.Define('startpad.enigma.solver', function (NS)
{
	var Enigma = NS.Import('startpad.enigma');
	var Event = NS.Import('startpad.events');
	var DOM = NS.Import('startpad.DOM');
	
NS.Extend(NS, {
Init: function()
	{
		NS.mParts = DOM.BindIDs();
		NS.mParts.text_input.focus();
		
		NS.worker = new Worker('enigma-solver-worker.js');
		NS.worker.onmessage = NS.OnMessage;
		NS.worker.onerror = NS.OnError;
		
		Event.AddEventFn(NS.mParts.solve, 'click', NS.Solve);
	},

Solve: function()
	{
	NS.worker.postMessage(NS.mParts.text_input.value);
	},
	
OnMessage: function(event)
	{
	alert(event.data);
	},
	
OnError: function(event)
	{
	alert("Worker error - " + event.message + " (" + event.filename + ": line #" + event.lineno + ")");
	}
});
});
