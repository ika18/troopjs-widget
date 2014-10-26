/*globals buster:false*/
buster.testCase("troopjs-widget/application", function (run) {
	"use strict";

	var assert = buster.referee.assert;

	require( [
		"troopjs-widget/application",
		"jquery"
	],
		function (Application, $) {

		run({
			"setUp": function () {
				this.$el = $("<div></div>");
			},

			"start/stop": function () {
				var app = Application(this.$el);

				return app
					.start()
					.then(function (phase) {
						assert.equals(phase, "started");
					})
					.then(function () {
						return app.stop();
					})
					.then(function (phase) {
						assert.equals(phase, "finalized");
					});
			},

			"tearDown": function () {
				this.$el.remove();
			}
		});
	});
});
