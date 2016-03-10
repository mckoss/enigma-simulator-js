/* crypto.js

   Cryptographic utilities.
   

*/
global_namespace.Define('startpad.crypto', function (NS)
{
NS.Extend(NS, {
/*
	Calculate the entropy per character from a string sample:
	
		-SUM(P(X)*log2(P(X))
	
	Assuming each character is an independent outcome of a random variable, we infer the
	probability of each character from the distribution of characters in the string.
	
	Usage:
	
		e = new Entropy("hello, mom", Crypto.Entropy.AlphaOnly);
		console.log(e.BitsPerChar());
*/
Entropy: function(s, fnFilter)
	{
	if (fnFilter == undefined)
		fnFilter = NS.Entropy.AsciiOnly;
	this.fnFilter = fnFilter;
	this.Init();
	this.AddString(s);
	}
});

NS.Extend(NS.Entropy, {
AsciiOnly: function(ch)
	{
	var code = ch.charCodeAt(ch, 0);
	if (code >= 128)
		return undefined;
	return ch;
	},
	
AlphaOnly: function(ch)
	{
	ch = ch.toUpperCase();
	if (ch < 'A' || ch > 'Z')
		return undefined;
	return ch;
	}
});

NS.Extend(NS.Entropy.prototype, {
Init: function()
	{
	this.cch = 0;
	this.mHist = {};	
	return this;
	},
	
AddString: function(s)
	{
	if (s == undefined)
		s = '';
	s = s.toString();
	for (var i = 0; i < s.length; i++)
		{
		var ch = this.fnFilter(s[i]);
		if (ch == undefined)
			continue;
		if (!(ch in this.mHist))
			this.mHist[ch] = 0;
		this.mHist[ch] += 1;
		this.cch += 1;
		}
	return this;
	},
	
BitsPerChar: function()
	{
	var sum = 0;
	var log2 = Math.log(2);
	
	for (var ch in this.mHist)
		{
		var p = this.mHist[ch]/this.cch;
		sum += -Math.log(p)/log2*p;
		}
	return sum;
	}
});

});