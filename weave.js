/**
 * @license MIT http://troopjs.mit-license.org/
 */
define([
	"./config",
	"troopjs-core/component/signal/start",
	"require",
	"when",
	"jquery",
	"mu-getargs",
	"poly/array"
], function (config, start, parentRequire, when, $, getargs) {
	"use strict";

	/**
	 * @class widget.weave
	 * @mixin widget.config
	 * @mixin Function
	 * @static
	 */

	var UNDEFINED;
	var NULL = null;
	var ARRAY_PROTO = Array.prototype;
	var ARRAY_MAP = ARRAY_PROTO.map;
	var ARRAY_PUSH = ARRAY_PROTO.push;
	var DEFERRED = "deferred";
	var MODULE = "module";
	var LENGTH = "length";
	var $WEFT = config["$weft"];
	var ATTR_WEAVE = config["weave"];
	var ATTR_WOVEN = config["woven"];
	var RE_SEPARATOR = /[\s,]+/;

	/**
	 * Instantiate all {@link widget.component widgets}  specified in the {@link widget.config#weave weave attribute}
	 * of this element, and to signal the widget for start with the arguments.
	 *
	 * The weaving will result in:
	 *
	 *  - Updates the {@link widget.config#weave woven attribute} with the created widget instances names.
	 *  - The {@link widget.config#$weft $weft data property} will reference the widget instances.
	 *
	 * @localdoc
	 *
	 * It also lives as a jquery plugin as {@link $#method-weave}.
	 *
	 * **Note:** It's not commonly to use this method directly, use instead {@link $#method-weave jQuery.fn.weave}.
	 *
	 * 	// Create element for weaving
	 * 	var $el = $('<div data-weave="my/widget(option)"></div>')
	 * 	// Populate `data`
	 * 	.data("option",{"foo":"bar"})
	 * 	// Instantiate the widget defined in "my/widget" module, with one param read from the element's custom data.
	 * 	.weave();
	 *
	 * @method constructor
	 * @param {...*} [start_args] Arguments that will be passed to each widget's {@link widget.component#start start} method
	 * @return {Promise} Promise for the completion of weaving all widgets.
	 */
	return function weave() {
		/**
		 * Weaves `$element`
		 * @param {String} weave_attr
		 * @return {Promise}
		 * @private
		 */
		var $weave = function (weave_attr) {
			// Let `$element` be `this`
			var $element = this;

			/**
			 * Maps `value` to `$data[value]`
			 * @param {*} value
			 * @return {*}
			 * @private
			 */
			var $map = function (value) {
				return $data.hasOwnProperty(value)
					? $data[value]
					: value;
			};

			// Get all data from `$element`
			var $data = $element.data();
			// Let `$weft` be `$data[$WEFT]` or `$data[$WEFT] = []`
			var $weft = $data.hasOwnProperty($WEFT)
				? $data[$WEFT]
				: $data[$WEFT] = [];
			// Scope `weave_re` locally since we use the `g` flag
			var weave_re = /[\s,]*(((?:\w+!)?([\w\/\.\-]+)(?:#[^(\s]+)?)(?:\((.*?)\))?)/g;
			// Let `weave_args` be `[]`
			var weave_args = [];
			var weave_arg;
			var args;
			var matches;

			// Iterate while `weave_re` matches
			// matches[1] : max widget name with args - "mv!widget/name#1.x(1, 'string', false)"
			// matches[2] : max widget name - "mv!widget/name#1.x"
			// matches[3] : min widget name - "widget/name"
			// matches[4] : widget arguments - "1, 'string', false"
			while ((matches = weave_re.exec(weave_attr)) !== NULL) {
				// Let `weave_arg` be [ $element, widget display name ].
				// Push `weave_arg` on `weave_args`
				ARRAY_PUSH.call(weave_args, weave_arg = [ $element, matches[3] ]);

				// Let `weave_arg[MODULE]` be `matches[2]`
				weave_arg[MODULE] = matches[2];
				// If there were additional arguments ...
				if ((args = matches[4]) !== UNDEFINED) {
					// .. parse them using `getargs`, `.map` the values with `$map` and push to `weave_arg`
					ARRAY_PUSH.apply(weave_arg, getargs.call(args).map($map));
				}

				// Let `weave_arg[DEFERRED]` be `when.defer()`
				// Push `weave_arg[DEFERRED].promise` on `$weft`
				ARRAY_PUSH.call($weft, (weave_arg[DEFERRED] = when.defer()).promise);
			}

			// Start async promise chain
			return when
				// Require, instantiate and start
				.map(weave_args, function (widget_args) {
					// Let `deferred` be `widget_args[DEFERRED]`
					var deferred = widget_args[DEFERRED];

					// Extract `resolve`, `reject` and `promise` from `deferred`
					var resolve = deferred.resolve;
					var reject = deferred.reject;

					// Require `weave_arg[MODULE]`
					parentRequire([ widget_args[MODULE] ], function (Widget) {
						var widget;
						var $deferred;

						// Create widget instance
						widget = Widget.apply(Widget, widget_args);

						// TroopJS <= 1.x
						if (widget.trigger) {
							// Let `$deferred` be `$.Deferred()`
							$deferred = $.Deferred();

							// Get trusted promise
							when($deferred)
								// Yield
								.yield(widget)
								// Link
								.then(resolve, reject);

							// Start widget
							start.call(widget, $deferred);
						}
						// TroopJS >= 2.x
						else {
							// Start widget
							start.apply(widget, start_args)
								// Yield
								.yield(widget)
								// Link
								.then(resolve, reject);
						}
					}, reject);

					// Return `deferred.promise`
					return deferred.promise;
				})
				// Update `ATTR_WOVEN`
				.tap(function (widgets) {
					// Bail fast if no widgets were woven
					if (widgets[LENGTH] === 0) {
						return;
					}

					// Map `Widget[]` to `String[]`
					var woven = widgets.map(function (widget) {
						return widget.toString();
					});

					// Update `$element` attribute `ATTR_WOVEN`
					$element.attr(ATTR_WOVEN, function (index, attr) {
						// Split `attr` and concat with `woven`
						var values = (attr === UNDEFINED ? ARRAY_PROTO : attr.split(RE_SEPARATOR)).concat(woven);
						// If `values[LENGTH]` is not `0` ...
						return values[LENGTH] !== 0
							// ... return `values.join(" ")`
							? values.join(" ")
							// ... otherwise return `NULL` to remove the attribute
							: NULL;
					});
				});
		};

		// Let `start_args` be `arguments`
		var start_args = arguments;

		// Wait for map (sync) and weave (async)
		return when.all(ARRAY_MAP.call(this, function (element) {
			// Bless `$element` with `$`
			var $element = $(element);
			// Get ATTR_WEAVE attribute or default to `""`
			var weave_attr = $element.attr(ATTR_WEAVE) || "";
			// Make sure to remove ATTR_WEAVE asap in case someone else tries to `weave` again
			$element.removeAttr(ATTR_WEAVE);
			// Attempt weave
			return $weave.call($element, weave_attr);
		}));
	}
});
