var Config = {
	//rootNodeId: "http://harth.org/andreas/foaf#ah",
	rootNodeId: "http://dblp.l3s.de/d2r/resource/publications/books/aw/AbiteboulHV95",
	defaultNodeLayout : {
		rendering: "stroke-rect",
		color: "default",
		//server: "deri",
		server: "l3s",
		style: [ ]
	},
	nodeRenderings : {
		"stroke-rect" : true,
		"stroke-ellipse" : true
	},
	colors : {
		"default" : "#ddddaa",
		"blue" : "#aaaaff",
		"gray" : "#aaaaaa",
		"green" : "#00ff00",
		"red" : "#ff0000",
		"turquoise" : "#008888",
		"white" : "#ffffff",
		"yellow" : "#ffff00"
		
	},
	servers : {
		"deri" : {
			uri: "http://localhost/semanticgraph/proxy.php",
			req: {
				async: false,
				accept: "application/sparql-results+json"
			},
			reqQueryField: "query"
		},
		"l3s" : {
			uri: "http://localhost/semanticgraph/proxy2.php",
			req: {
				output: "json"
			},
			reqQueryField: "query"
		}
	},
	prefix : "PREFIX foaf: <http://xmlns.com/foaf/0.1/> \n"
		+ "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
		+ "PREFIX dc: <http://purl.org/dc/elements/1.1/>\n"
		+ "PREFIX dcterms: <http://purl.org/dc/terms/>\n"
		+ "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n",
	augmentSteps : 30,
	desiredChildren : 10,
	desiredAttributes : 40,
	defaultDisplayedChildrenCount : 15,
	maxNodeNameLength : 14,
	sameAsPredicate :  {
		"http://www.w3.org/2002/07/owl#sameAs" : true
	},
	nodeNamePredicate : {
		"http://www.w3.org/2000/01/rdf-schema#label" : Formatters.raw
	},
	nodeTypePredicate : {
		"rdf:type" : Formatters.raw,
		"http://www.w3.org/1999/02/22-rdf-syntax-ns#type" : Formatters.raw
	}
};

(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport 
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  Config["labelType"] = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  Config["nativeTextSupport"] = Config["labelType"] == 'Native';
  Config["useGradients"] = nativeCanvasSupport;
  Config["animate"] = !(iStuff || !nativeCanvasSupport);
})();