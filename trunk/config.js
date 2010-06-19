/**
 * This file contains all the configuration parameters which can be used to
 * customize the semantic graph setup.
 * 
 * @author Felix Stahlberg
 */

/**
 * CoreConfig defines very basic static parameters.
 */
var CoreConfig = {
	maxDepth : 1,
	configurator : Configurators.panel,
	augmentInterval: 500,
	prefix : "PREFIX foaf: <http://xmlns.com/foaf/0.1/> \n"
		+ "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
		+ "PREFIX dc: <http://purl.org/dc/elements/1.1/>\n"
		+ "PREFIX dcterms: <http://purl.org/dc/terms/>\n"
		+ "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
};

/**
 * This is used by configurators to set up the final runtime environment.
 */
var AvailableConfigs = {
	colors : {
		"red" : "#f00",
		"yellow" : "#ff0",
		"green" : "#0f0"
	},
	nodeTypes : {
		"rdf:type foaf:person" : {
			name: "person",
			defaultStyle: "circle",
			defaultServer: "deri",
			sameAsType: "http://www.w3.org/2002/07/owl#sameAs",
			contentLoader: ContentLoaders.uri,
			displayName: "http://www.w3.org/2000/01/rdf-schema#label",
			displayNameFormatter: Formatters.raw
		},
		"dc:type <http://purl.org/dc/dcmitype/Text>" : {
			name: "text",
			defaultStyle: "square",
			defaultServer: "l3s",
			sameAsType: "http://www.w3.org/2002/07/owl#sameAs",
			contentLoader: ContentLoaders.uri,
			displayName: "http://www.w3.org/2000/01/rdf-schema#label",
			displayNameFormatter: Formatters.raw
		},
		"rdf:type <http://xmlns.com/foaf/0.1/Agent>" : {
			name: "agent",
			defaultStyle: "square",
			defaultServer: "l3s",
			sameAsType: "http://www.w3.org/2002/07/owl#sameAs",
			contentLoader: ContentLoaders.uri,
			displayName: "http://www.w3.org/2000/01/rdf-schema#label",
			displayNameFormatter: Formatters.raw
		}
	},
	nodeStyles : {
		"circle" : true, 
		"triangle" : true,
		"rectangle" : true,
		"star" : true,
		"square" : true,
		"none" : true
	},
	edgeTypes : {
		"dcterms:references" : {
			name: "references",
			defaultStyle: "hyperline",
			defaultServer: "l3s",
			fromType: "dc:type <http://purl.org/dc/dcmitype/Text>",
			toType: "dc:type <http://purl.org/dc/dcmitype/Text>",
			traverser: Traversers.uri,
			contentLoader : ContentLoaders.none,
			displayName: false,
			displayNameFormatter: Formatters.none
		},
		"dc:creator" : {
			name: "creator",
			defaultStyle: "hyperline",
			defaultServer: "l3s",
			fromType: "dc:type <http://purl.org/dc/dcmitype/Text>",
			toType: "rdf:type <http://xmlns.com/foaf/0.1/Agent>",
			traverser: Traversers.uri,
			contentLoader : ContentLoaders.none,
			displayNameFormatter: Formatters.none
		},
		"foaf:knows" : {
			name: "knows",
			defaultStyle: "hyperline",
			defaultServer: "deri",
			fromType: "rdf:type foaf:person",
			toType: "rdf:type foaf:person",
			traverser: Traversers.uri,
			contentLoader : ContentLoaders.none,
			displayNameFormatter: Formatters.none
		}
	},
	edgeStyles : {
		"hyperline" : true,
		"line" : true,
		"none" : true
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
	}
};