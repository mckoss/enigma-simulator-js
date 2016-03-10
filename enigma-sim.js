/*
	Web UI for the Enigma machine simulator.
	
	Copyright (c) 2009, Mike Koss - mckoss@startpad.org
*/
global_namespace.Define('startpad.enigma.sim', function (NS) {
	var Enigma = NS.Import('startpad.enigma');
	var DOM = NS.Import('startpad.DOM');
	var Event = NS.Import('startpad.events');
	var Format = NS.Import('startpad.format-util');
	
	Enigma.fnTrace = function(s) {console.log(s);}
	var machine = new Enigma.Enigma();
	
NS.Extend(NS, {
	aInitFields: ['rotors', 'position', 'rings', 'plugs', 'keep_spacing'],
	sTwitter: "http://twitter.com/home?source=Enigma&status={key}{code} - http://bit.ly/enigma-machine",
	reMessageKey: /^([A-Z]{3})(\1)/i,

Init: function()
	{
	NS.mParts = DOM.BindIDs();
	NS.mParts.plain.focus();
	
	NS.mState = machine.StateStrings();
	
	DOM.InitValues(NS.aInitFields, NS.mParts, NS.mState);
	
	Event.AddEventFn(NS.mParts.plain, 'change', NS.UpdateDisplay);
	Event.AddEventFn(window, 'keydown', NS.UpdateDisplay);
	Event.AddEventFn(window, 'keyup', NS.UpdateDisplay);
	Event.AddEventFn(NS.mParts.keep_spacing, 'click', NS.UpdateDisplay);
	Event.AddEventFn(NS.mParts.passkey, 'click', NS.GetPasskey);
	
	NS.UpdateDisplay();
	},
	
GetPasskey: function()
	{
	var s = prompt("Enter passkey to set initial Enigma settings.", Format.FormatDate(new Date()));
	if (s)
		{
		var mStrings = Enigma.StringsFromSettings(Enigma.SettingsFromPasskey(s));
		DOM.InitValues(['rotors', 'position', 'rings', 'plugs'], NS.mParts, mStrings);
		NS.UpdateDisplay();
		}
	},
	
UpdateDisplay: function()
	{
	var sPlain = NS.mParts.plain.value;
	
	DOM.ReadValues(NS.aInitFields, NS.mParts, NS.mState);
	
	machine.Init(Enigma.SettingsFromStrings(NS.mState));
	var sCipher = machine.Encode(sPlain);
	var sKeyOut = sCipher.substr(0,6) + " ";
	
	// Special case message key in either text - 3 charcters repeated twice
	var sKey = ""
	if (NS.reMessageKey.test(sPlain))
		sKey = sPlain.substr(0,3);
	else if (NS.reMessageKey.test(sCipher))
		sKey = sCipher.substr(0,3);
	
	if (sKey)
		{
		NS.mState.position = sKey;
		machine.Init(Enigma.SettingsFromStrings(NS.mState));
		sCipher = machine.Encode(sPlain.substr(6).Trim());
		}
	else
		sKeyOut = "";
		
	DOM.SetText(NS.mParts.key_out, sKeyOut);

	if (!NS.mState.keep_spacing)
		sCipher = Enigma.GroupLetters(sCipher);
	DOM.SetText(NS.mParts.cipher_out, sCipher);
	
	NS.mParts.twitter.setAttribute('href',
		Format.ReplaceKeys(NS.sTwitter, {code:sCipher, key:sKeyOut}));
	
	for (var i = 1; i <= 3; i++)
		DOM.SetText(NS.mParts['rot_'+i], Enigma.ChFromI(machine.position[i-1]));
	}

});
});
