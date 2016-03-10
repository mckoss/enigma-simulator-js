// --------------------------------------------------------------------------
// Vector Functions
// --------------------------------------------------------------------------
global_namespace.Define('startpad.vector', function(NS) {

NS.Extend(NS, {
	x:0, y:1,
	x2:2, y2:3,

SubFrom: function(v1, v2)
	{
	for (var i = 0; i < v1.length; i++)
		{
		v1[i] = v1[i] - v2[i % v2.length];
		}
	return v1;
	},

Sub: function(v1, v2)
	{
	
	var vDiff = NS.Copy(v1);
	return NS.SubFrom(vDiff, v2);
	},

//In-place vector addition
// If smaller arrays are added to larger ones, they wrap around
// so that points can be added to rects, for example.
AddTo: function(vSum)
	{
	for (var iarg = 1; iarg < arguments.length; iarg++)
		{
		var v = arguments[iarg];
		for (var i = 0; i < vSum.length; i++)
			{
			vSum[i] += v[i % v.length];
			}
		}
	return vSum;
	},	

//Add corresponding elements of all arguments	
Add: function()
	{
	var vSum = NS.Copy(arguments[0]);
	var args = NS.Copy(arguments);
	args[0] = vSum;
	return NS.AddTo.apply(undefined, args);
	},
	
//Return new vector with element-wise max
//All arguments must be same dimensioned array
//TODO: Allow mixing scalars - share code with Mult - iterator/callback pattern
Max: function()
	{
	var vMax = NS.Copy(arguments[0]);
	for (var iarg = 1; iarg < arguments.length; iarg++)
		{
		var v = arguments[iarg];
		for (var i = 0; i < vMax.length; i++)
			{
			if (v[i] > vMax[i])
				{
				vMax[i] = v[i];
				}
			}
		}
	return vMax;
	},

//Multiply corresponding elements of all arguments (including scalars)
//All vectors must be the same dimension (length).
Mult: function()
	{
	var vProd = 1;
	var i;

	for (var iarg = 0; iarg < arguments.length; iarg++)
		{
		var v = arguments[iarg];
		if (typeof v === "number")
			{
			// Mult(scalar, scalar)
			if (typeof vProd === "number")
				{
				vProd *= v;
				}
			// Mult(vector, scalar)
			else
				{
				for (i = 0; i < vProd.length; i++)
					{
					vProd[i] *= v;
					}
				}				
			}
		else
			{
			// Mult(scalar, vector)
			if (typeof vProd === "number")
				{
				var vT = vProd;
				vProd = NS.Copy(v);
				for (i = 0; i < vProd.length; i++)
					{
					vProd[i] *= vT;
					}
				}
			// Mult(vector, vector)
			else
				{
				if (v.length !== vProd.length)
					{
					throw new Error("Mismatched Vector Size");
					}
				for (i = 0; i < vProd.length; i++)
					{
					vProd[i] *= v[i];
					}
				}
			}
		}
	return vProd;
	},
	
Floor: function(v)
	{
	var vFloor = [];
	for (var i = 0; i < v.length; i++)
		{
		vFloor[i] = Math.floor(v[i]);
		}
	return vFloor;
	},
	
DotProduct: function()
	{
	var v = NS.Mult.apply(undefined, arguments);
	var s = 0;
	for (var i = 0; i < v.length; i++)
		{
		s += v[i];
		}
	return s;
	},

//Append all arrays into a new array (Append(v) is same as Copy(v)
Append: function()
	{
	var v1 = [].concat.apply([], arguments);
	return v1;
	},

//Do a (shallow) comparison of two arrays	
Equal: function(v1, v2)
	{
	if (typeof v1 != typeof v2)
		return false;
	if (typeof v1 == 'undefined')
		return true;
	for (var i = 0; i < v1.length; i++)
		{
		if (v1[i] !== v2[i])
			{
			return false;
			}
		}
	return true;
	},
	
//Routines for dealing with Points [x, y] and Rects [left, top, bottom, right]

UL: function(rc)
	{
	return rc.slice(0, 2);
	},
	
LR: function(rc)
	{
	return rc.slice(2, 4);
	},
	
Size: function(rc)
	{
	return NS.Sub(NS.LR(rc), NS.UL(rc));
	},
	
NumInRange: function(num, numMin, numMax)
	{
	return num >= numMin && num <= numMax;
	},
	
ClipToRange: function(num, numMin, numMax)
	{
	if (num < numMin)
		return numMin;
	if (num > numMax)
		return numMax;
	return num;
	},
	
PtInRect: function(pt, rc)
	{
	return NS.NumInRange(pt[NS.x], rc[NS.x], rc[NS.x2]) &&
		NS.NumInRange(pt[NS.y], rc[NS.y], rc[NS.y2]);
	},
	
PtClipToRect: function(pt, rc)
	{
	return [NS.ClipToRange(pt[NS.x], rc[NS.x], rc[NS.x2]),
	        NS.ClipToRange(pt[NS.y], rc[NS.y], rc[NS.y2])];
	},
	
RcClipToRect: function(rc, rcClip)
	{
	return NS.Append(NS.PtClipToRect(NS.UL(rc), rcClip),
					 NS.PtClipToRect(NS.LR(rc), rcClip));
	},
	
RcExpand: function(rc, ptSize)
	{
	return NS.Append(NS.Sub(NS.UL(rc), ptSize),
					 NS.Add(NS.LR(rc), ptSize));
	},
	
KeepInRect: function(rcIn, rcBound)
	{
	// First, make sure the rectangle is not bigger than either bound dimension
	var ptFixSize = NS.Max([0,0],NS.Sub(NS.Size(rcIn), NS.Size(rcBound)));
	rcIn[NS.x2] -= ptFixSize[NS.x];
	rcIn[NS.y2] -= ptFixSize[NS.y];
	
	// Now move the rectangle to be totally within the bounds
	var dx = 0; dy = 0;
	dx = Math.max(0, rcBound[NS.x] - rcIn[NS.x]);
	dy = Math.max(0, rcBound[NS.y] - rcIn[NS.y]);
	if (dx == 0)
		dx = Math.min(0, rcBound[NS.x2] - rcIn[NS.x2]);
	if (dy == 0)
		dy = Math.min(0, rcBound[NS.y2] - rcIn[NS.y2]);
	NS.AddTo(rcIn, [dx, dy]);
	},
	
//Return pt (1-scale) * UL + scale * LR
PtCenter: function(rc, scale)
	{
	if (scale === undefined)
		{
		scale = 0.5;
		}
	if (typeof scale === "number")
		{
		scale = [scale, scale];
		}
	var pt = NS.Mult(scale, NS.LR(rc));
	scale = NS.Sub([1,1], scale);
	NS.AddTo(pt, NS.Mult(scale, NS.UL(rc)));
	return pt;
	},

// PtRegistration - return one of 9 registration points of a rectangle
// 0 1 2
// 3 4 5
// 6 7 8
PtRegistration: function(rc, iReg)
	{
	var xScale = (iReg % 3) * 0.5;
	var yScale = Math.floor(iReg/3) * 0.5;
	return NS.PtCenter(rc, [xScale, yScale]);
	},
	
IRegClosest: function(pt, rc)
	{
	var aPoints = [];
	for (var i = 0; i < 9; i++)
		{
		aPoints.push(NS.PtRegistration(rc, i));
		}
	return NS.IPtClosest(pt, aPoints)[0];
	},
	
// RectDeltaReg - Move or resize the rectangle based on the registration
// point to be modified.  Center (4) moves the whole rect.
// Others resize one or more edges of the rectangle
RectDeltaReg: function(rc, dpt, iReg, ptSizeMin, rcBounds)
	{
	if (iReg == 4)
		{
		var rcT = NS.Add(rc, dpt);
		if (rcBounds)
			NS.KeepInRect(rcT, rcBounds);
		return rcT;
		}
		
	var iX = iReg % 3;
	if (iX == 1)
		iX = undefined;
	
	var iY = Math.floor(iReg/3);
	if (iY == 1)
		iY = undefined;
		
	function ApplyDelta(rc, dpt)
		{
		var rcDelta = [0,0,0,0];
		if (iX != undefined)
			rcDelta[iX] = dpt[0];
		if (iY != undefined)
			rcDelta[iY+1] = dpt[1];
		return NS.Add(rc, rcDelta);
		}
		
	var rcT = ApplyDelta(rc, dpt);
	
	// Ensure the rectangle is not less than the minimum size
	if (!ptSizeMin)
		ptSizeMin = [0,0];
	var ptSize = NS.Size(rcT);
	var ptFixSize = NS.Max([0,0],NS.Sub(ptSizeMin, ptSize));
	if (iX == 0)
		ptFixSize[0] *= -1;
	if (iY == 0)
		ptFixSize[1] *= -1;
	rcT = ApplyDelta(rcT, ptFixSize);
	
	// Ensure rectangle is not outside the bounding box
	if (rcBounds)
		NS.KeepInRect(rcT, rcBounds);
	return rcT;
	},

// Find the closest point to the given point
// (multiple) arguments can be points, or arrays of points
// Returns [i, pt] result
IPtClosest: function(pt)
	{
	var d2Min = undefined;
	var ptClosest = undefined;
	var iClosest = undefined;
	
	var iPt = 0;
	for (var iarg = 1; iarg < arguments.length; iarg++)
		{
		var v = arguments[iarg];
		// Looks like a single point
		if (typeof v[0] == "number")
			{
			var d2 = NS.Distance2(pt, v);
			if (d2Min == undefined || d2 < d2Min)
				{
				d2Min = d2;
				ptClosest = v;
				iClosest = iPt;
				}
			iPt++;
			}
		// Looks like an array of points
		else
			{
			for (var i = 0; i < v.length; i++)
				{
				vT = v[i];
				var d2 = NS.Distance2(pt, vT);
				if (d2Min == undefined || d2 < d2Min)
					{
					d2Min = d2;
					ptClosest = vT;
					iClosest = iPt;
					}
				iPt++;
				}
			}
		}
	return [iClosest, ptClosest];
	},

// Return square of distance between to "points" (N-dimensional)
Distance2: function (v1, v2)
	{
	var d2 = 0;
	for (var i = 0; i < v1.length; i++)
		d2 += Math.pow((v2[i]-v1[i]), 2);
	return d2;
	},
	
//Return the bounding box of the collection of pt's and rect's
BoundingBox: function()
	{
	var vPoints = NS.Append.apply(undefined, arguments);
	if (vPoints.length % 2 !== 0)
		{
		throw Error("Invalid arguments to BoundingBox");
		}
	
	var ptMin = vPoints.slice(0,2),
		ptMax = vPoints.slice(0,2);

	for (var ipt = 2; ipt < vPoints.length; ipt += 2)
		{
		var pt = vPoints.slice(ipt, ipt+2);
		if (pt[0] < ptMin[0])
			{
			ptMin[0] = pt[0];
			}
		if (pt[1] < ptMin[1])
			{
			ptMin[1] = pt[1];
			}
		if (pt[0] > ptMax[0])
			{
			ptMax[0] = pt[0];
			}
		if (pt[1] > ptMax[1])
			{
			ptMax[1] = pt[1];
			}
		}

	return [ptMin[0], ptMin[1], ptMax[0], ptMax[1]];
	},

// Return JSON string for numeric array
JSON: function(v)
	{
	var sRect = "[";
	var chSep = "";
	for (i = 0; i < v.length; i++)
		{
		sRect += chSep + v[i];
		chSep = ",";
		}
	sRect += "]";
	return sRect;
	}
});

//Synonym - Copy(v) is same as Append(v)
NS.Copy = NS.Append;

}); // startpad.vector
