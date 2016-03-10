importScripts('namespace.js', 'base.js', 'enigma.js', 'crypto.js');
global_namespace.Define('startpad.enigma.solver.worker', function(NS)
{
	var Enigma = NS.Import('startpad.enigma');
	var Crypto = NS.Import('startpad.crypto');

	onmessage = function(event)
		{
		var sCipher = event.data;
		var sBest = sCipher;
		
		var machine = new Enigma.Enigma();
		var ent = new Crypto.Entropy('', Crypto.Entropy.AlphaOnly);
		var cBitsBest = ent.AddString(sCipher).BitsPerChar();

		var c = 26*26*25;
		for (var i = 0; i < c; i++)
			{
			var posSave = machine.position.concat();
			var sDecode = machine.Encode(sCipher);
			var cBits = ent.Init().AddString(sDecode).BitsPerChar();
			machine.position = posSave;
			if (cBits < cBitsBest)
				{
				cBitsBest = cBits;
				sBest = sDecode + "(" + machine.toString() + ")";
				}
			machine.IncrementRotors();
			}
		postMessage(sBest);
		};
});

