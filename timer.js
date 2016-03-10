//--------------------------------------------------------------------------
// Timer Functions
//--------------------------------------------------------------------------


global_namespace.Define('startpad.timer', function(NS) {

NS.Extend(NS, {
MSNow: function()
	{
	return new Date().getTime();
	}
});

NS.Timer = function(ms, fnCallback)
{
	this.ms = ms;
	this.fnCallback = fnCallback;
	return this;
};

NS.Timer.prototype = {
	constructor: NS.Timer,
	fActive: false,
	fRepeat: false,
	fInCallback: false,
	fReschedule: false,

Repeat: function(f)
{
	if (f === undefined)
		{
		f = true;
		}
	this.fRepeat = f;
	return this;
},

Ping: function()
{
	// In case of race condition - don't call function if deactivated
	if (!this.fActive)
		{
		return;
		}

	// Eliminate re-entrancy - is this possible?
	if (this.fInCallback)
		{
		this.fReschedule = true;
		return;
		}

	this.fInCallback = true;
	try
		{
		this.fnCallback();
		}
	catch (e)
		{
		console.error("Error in timer callback: " + e.message + "(" + e.name + ")");
		}
	this.fInCallback = false;

	if (this.fActive && (this.fRepeat || this.fReschedule))
		{
		this.Active(true);
		}
},

// Calling Active resets the timer so that next call to Ping will be in this.ms milliseconds from NOW
Active: function(fActive)
{
	if (fActive === undefined)
		{
		fActive = true;
		}
	this.fActive = fActive;
	this.fReschedule = false;

	if (this.iTimer)
		{
		window.clearTimeout(this.iTimer);
		this.iTimer = undefined;
		}

	if (fActive)
		{
		this.iTimer = window.setTimeout(this.Ping.FnMethod(this), this.ms);
		}

	return this;
}
}; // NS.Timer

}); // startpad.timer