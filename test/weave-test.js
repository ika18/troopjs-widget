/*globals buster:false*/
buster.testCase("troopjs-widget/weave", function (run) {
	"use strict";

	var assert = buster.referee.assert;
	var refute = buster.referee.refute;

	require([
			"troopjs-widget/component",
			"troopjs-widget/weave",
			"jquery"
		],
		function (Widget, weave, $) {

			run({
				"setUp": function () {
					this.timeout = 2000;
					this.$el = $("<div></div>");
				},

				"one widget": {
					"weave": function () {
						var $el = this.$el.attr("data-weave", "troopjs-widget/component");

						return weave.call($el).spread(function (woven) {
							var widget = woven[0];

							// data-weave attribute is cleared.
							refute.defined($el.attr("data-weave"));
							assert.equals(widget.displayName, "troopjs-widget/component");
							assert.equals($el.attr("data-woven"), widget.toString());
							assert.equals(widget.phase, "started");
						});
					},

					"fail to initialize": function () {
						var $el = this.$el.attr("data-weave", "troopjs-widget/test/thrown");

						return weave.call($el).otherwise(function (e) {
							assert.equals(e.message, "initialize failure");
						});
					}
				},

				"two widgets": {
					"one with parameters": function () {
						var $el = this.$el.attr("data-weave", "troopjs-widget/component troopjs-widget/component(true, 1, 'string()')");

						return weave.call($el).spread(function (woven) {
							// Two widgets received.
							var foo = woven[0];
							var bar = woven[1];

							// data-weave attribute is cleared.
							refute.defined($el.attr("data-weave"));

							// Two widgets should share the same DOM element.
							assert.same($el.get(0), foo.$element.get(0));
							assert.same($el.get(0), bar.$element.get(0));

							// The woven attribute should consist of two widgets.
							assert.equals([foo.toString(), bar.toString()].join(" "), $el.attr("data-woven"));

							assert.equals(foo.phase, "started");
							assert.equals(bar.phase, "started");
						});
					},

					"dynamic weaving": function () {
						var $el = this.$el.attr("data-weave", "troopjs-widget/component");

						return weave.call($el).spread(function (widgets) {
							var foo = widgets[0];

							$el.attr("data-weave", "troopjs-widget/test/default");

							return weave.call($el).spread(function (widgets) {
								assert.equals(widgets.length, 1);

								var bar = widgets[0];

								assert.equals(bar.displayName, "troopjs-widget/test/default");

								// data-unweave attribute should be cleared afterward.
								refute.defined($el.attr("data-weave"));
								// "foo" and "bar" appears in data-woven attribute.
								assert.equals($el.attr("data-woven"), [ foo.toString(), bar.toString() ].join(" "));
							});
						});
					}
				},

				"tearDown": function () {
					this.$el.remove();
				}
			});
		});
});
