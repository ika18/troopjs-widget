/**
 * @license MIT http://troopjs.mit-license.org/
 */
/*globals require:false*/
require({
	"baseUrl" : "bower_components",
	"packages" : [ "jquery", "when", "poly", "troopjs-compose", "troopjs-core", "troopjs-dom", "mu-merge", "mu-getargs", "mu-unique", "mu-selector-set", "mu-jquery-destroy", "troopjs-widget" ].map(function (name) {
		var main;
		var location;

		switch (name) {
			case "jquery":
				location = "jquery/dist";
				/* falls through */

			case "when":
				main = name;
				break;

			case "poly":
				main = "es5";
				break;

			case "troopjs-widget":
				location = "..";
				break;
		}

		return {
			"name": name,
			"location": location,
			"main": main
		}
	})
});