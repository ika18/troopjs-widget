define('troopjs-widget/version',[], { 'toString': function () { return ; } });

/**
 * @license MIT http://troopjs.mit-license.org/
 */
define('troopjs-widget/config',[
	"troopjs-dom/config",
	"module",
	"mu-merge/main"
], function (config, module, merge) {
	

	/**
	 * @class widget.config.widget
	 * @enum
	 * @private
	 */
	var WIDGET = {
		/**
		 * Property of the widget where the **weft** resides.
		 */
		"$weft" : "$weft",
		/**
		 * Attribute name of the element where the **weave** resides.
		 */
		"weave" : "data-weave",
		/**
		 * Attribute name of the element where the **unweave** resides.
		 */
		"unweave" : "data-unweave",
		/**
		 * Attribute name of the element where the **woven** resides.
		 */
		"woven" : "data-woven"
	};

	/**
	 * Provides configuration for the widget package
	 * @class widget.config
	 * @extends dom.config
	 * @private
	 * @alias feature.config
	 */

	return merge.call({}, config, {
		/**
		 * Widget related configuration
		 * @cfg {widget.config.widget}
		 * @protected
		 */
		"widget": WIDGET
	}, module.config());
});

/**
 * @license MIT http://troopjs.mit-license.org/
 */
define('troopjs-widget/weave',[
	"./config",
	"troopjs-core/component/signal/start",
	"require",
	"when/when",
	"jquery",
	"mu-getargs/main",
	"poly/array"
], function (config, start, parentRequire, when, $, getargs) {
	

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
	var $WEFT = config.widget.$weft;
	var ATTR_WEAVE = config.widget.weave;
	var ATTR_WOVEN = config.widget.woven;
	var RE_SEPARATOR = /[\s,]+/;

	/**
	 * Weaves `$element`
	 * @param {String} weave_attr
	 * @param {Array} constructor_args
	 * @return {Promise}
	 * @ignore
	 */
	function $weave(weave_attr, constructor_args) {
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

			// Push `constructor_args` on `weave_arg`
			ARRAY_PUSH.apply(weave_arg, constructor_args);
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

					// TroopJS <= 1.x (detect presence of ComposeJS)
					if (widget.constructor._getBases) {
						// Let `$deferred` be `$.Deferred()`
						$deferred = $.Deferred();

						// Get trusted promise
						when($deferred)
							// Yield
							.yield(widget)
							// Link
							.then(resolve, reject);

						// Start widget
						widget.start($deferred);
					}
					// TroopJS >= 2.x
					else {
						// Start widget
						start.call(widget)
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
	}

	/**
	 * Instantiate all {@link widget.component widgets}  specified in the `data-weave` attribute
	 * of this element, and to signal the widget for start with the arguments.
	 *
	 * The weaving will result in:
	 *
	 *  - Updates the `data-woven` attribute with the created widget instances names.
	 *  - The `$weft` data property will reference the widget instances.
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
	 * @param {...*} [args] Arguments that will be passed to the {@link core.component.signal.start start} signal
	 * @return {Promise} Promise for the completion of weaving all widgets.
	 */
	return function weave() {
		// Let `constructor_args` be `arguments`
		var constructor_args = arguments;

		// Wait for map (sync) and weave (async)
		return when.all(ARRAY_MAP.call(this, function (element) {
			// Bless `$element` with `$`
			var $element = $(element);
			// Get ATTR_WEAVE attribute or default to `""`
			var weave_attr = $element.attr(ATTR_WEAVE) || "";
			// Make sure to remove ATTR_WEAVE asap in case someone else tries to `weave` again
			$element.removeAttr(ATTR_WEAVE);
			// Attempt weave
			return $weave.call($element, weave_attr, constructor_args);
		}));
	}
});

/**
 * @license MIT http://troopjs.mit-license.org/
 */
define('troopjs-widget/unweave',[
	"./config",
	"troopjs-core/component/signal/finalize",
	"when/when",
	"jquery",
	"poly/array"
], function (config, finalize, when, $) {
	

	/**
	 * @class widget.unweave
	 * @mixin widget.config
	 * @mixin Function
	 * @static
	 */
	var UNDEFINED;
	var NULL = null;
	var ARRAY_PROTO = Array.prototype;
	var ARRAY_MAP = ARRAY_PROTO.map;
	var LENGTH = "length";
	var $WEFT = config.widget.$weft;
	var ATTR_WOVEN = config.widget.woven;
	var ATTR_UNWEAVE = config.widget.unweave;
	var RE_SEPARATOR = /[\s,]+/;

	/**
	 * Unweaves `$element`
	 * @param {String} unweave_attr
	 * @param {Array} finalize_args
	 * @return {Promise}
	 * @ignore
	 */
	function $unweave(unweave_attr, finalize_args) {
		// Let `$element` be `this`
		var $element = this;
		// Get all data from `$element`
		var $data = $element.data();
		// Let `$weft` be `$data[$WEFT]` or `$data[$WEFT] = []`
		var $weft = $data.hasOwnProperty($WEFT)
			? $data[$WEFT]
			: $data[$WEFT] = [];
		// Scope `unweave_re` locally since we use the `g` flag
		var unweave_re = /[\s,]*([\w\/\.\-]+)(?:@(\d+))?/g;
		var unweave_res = [];
		var unweave_res_length = 0;
		var matches;

		// Iterate unweave_attr (while unweave_re matches)
		// matches[1] : widget name - "widget/name"
		// matches[2] : widget instance id - "123"
		while ((matches = unweave_re.exec(unweave_attr)) !== NULL) {
			unweave_res[unweave_res_length++] = "^" + matches[1] + "@" + (matches[2] || "\\d+") + "$";
		}

		// Redefine `unweave_re` as a combined regexp
		unweave_re = new RegExp(unweave_res.join("|"));

		// Start async promise chain
		return when
			// Filter $weft
			.filter($weft, function (widget, index) {
				// Bail fast if we don't want to unweave
				if (!unweave_re.test(widget.toString())) {
					return false;
				}

				// Let `deferred` be `when.defer()`
				var deferred = when.defer();
				// Extract `resolve`, `reject` from `deferred`
				var resolve = deferred.resolve;
				var reject = deferred.reject;
				// Let `$weft[index]` be `deferred.promise`
				// Let `promise` be `$weft[index]`
				var promise = $weft[index] = deferred.promise;
				var $deferred;

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

					// Stop widget
					widget.stop($deferred);
				}
				// TroopJS >= 2.x
				else {
					// Finalize widget
					finalize.apply(widget, finalize_args)
						// Yield
						.yield(widget)
						// Link
						.then(resolve, reject);
				}

				return promise
					// Make sure to remove the promise from `$weft`
					.tap(function () {
						delete $weft[index];
					})
					.yield(true);
			})
			.tap(function (widgets) {
				// Bail fast if no widgets were unwoven
				if (widgets[LENGTH] === 0) {
					return;
				}

				// Let `unwoven` be a combined regexp of unwoven `widget.toString()`
				var unwoven = new RegExp(
					widgets
						.map(function (widget) {
							return "^" + widget.toString() + "$";
						})
						.join("|")
				);

				/**
				 * Filters values using `unwoven`
				 * @param {String} value
				 * @return {boolean}
				 * @ignore
				 */
				var filter = function (value) {
					return !unwoven.test(value);
				};

				// Update `$element` attribute `ATTR_WOVEN`
				$element.attr(ATTR_WOVEN, function (index, attr) {
					// Split `attr` and filter with `filter`
					var values = (attr === UNDEFINED ? ARRAY_PROTO : attr.split(RE_SEPARATOR)).filter(filter);
					// If `values[LENGTH]` is not `0` ...
					return values[LENGTH] !== 0
						// ... return `values.join(" ")`
						? values.join(" ")
						// ... otherwise return `NULL` to remove the attribute
						: NULL;
				});
			});
	}

	/**
	 * Destroy all {@link widget.component widget} instances living on this element, that are created
	 * by {@link widget.weave}, it is also to clean up the attributes
	 * and data references to the previously instantiated widgets.
	 *
	 * @localdoc
	 *
	 * It also lives as a jquery plugin as {@link $#method-unweave}.
	 *
	 * @method constructor
	 * @param {...*} [args] Arguments that will be passed to the {@link core.component.signal.finalize finalize} signal
	 * @return {Promise} Promise to the completion of unweaving all woven widgets.
	 */
	return function unweave() {
		// Let `finalize_args` be `arguments`
		var finalize_args = arguments;

		// Wait for map (sync) and weave (async)
		return when.all(ARRAY_MAP.call(this, function (element) {
			// Bless `$element` with `$`
			var $element = $(element);
			// Get ATTR_WEAVE attribute or default to `""`
			var unweave_attr = $element.attr(ATTR_UNWEAVE) || "";
			// Make sure to remove ATTR_UNWEAVE asap in case someone else tries to `unweave` again
			$element.removeAttr(ATTR_UNWEAVE);
			// Attempt weave
			return $unweave.call($element, unweave_attr, finalize_args);
		}));
	};
});

/**
 * @license MIT http://troopjs.mit-license.org/
 */
define('troopjs-widget/woven',[
	"./config",
	"when/when",
	"jquery",
	"poly/array"
], function (config, when, $) {
	

	/**
	 * @class widget.woven
	 * @mixin widget.config
	 * @mixin Function
	 * @static
	 */

	var NULL = null;
	var ARRAY_MAP = Array.prototype.map;
	var LENGTH = "length";
	var $WEFT = config.widget.$weft;
	var RE_ANY = /.*/;
	var RE_WIDGET = /([\w\/\.\-]+)(?:@(\d+))?/;

	/**
	 * Retrieve all or specific {@link widget.component widget} instances living on this element, that are
	 * created by {@link widget.weave}.
	 *
	 * It also lives as a jquery plugin as {@link $#method-woven}.
	 * @method constructor
	 * @param {...String} [selector] One or more widget selectors to narrow down the returned ones.
	 *
	 *   * (empty string) retrieves all woven widgets
	 *   * `module/name` retrieves widgets matching module name
	 *   * `module/name@instance` retrieves widgets matching both module name and instance id
	 * @return {Promise} Promise to the completion of retrieving the woven widgets array.
	 */
	return function woven() {
		var woven_re = arguments[LENGTH] > 0
			? new RegExp(
				ARRAY_MAP
					.call(arguments, function (arg) {
						var matches;

						// matches[1] : widget name - "widget/name"
						// matches[2] : widget instance id - "123"
						return ((matches = RE_WIDGET.exec(arg)) !== NULL)
							? "^" + matches[1] + "@" + (matches[2] || "\\d+") + "$"
							: NULL;
					})
					.filter(function (arg) {
						return arg !== NULL
					})
					.join("|")
			)
			: RE_ANY;

		return when.all(ARRAY_MAP.call(this, function (element) {
			return when.filter($.data(element, $WEFT) || false, function (widget) {
				return woven_re.test(widget);
			});
		}));
	};
});

/**
 * @license MIT http://troopjs.mit-license.org/
 */
define('troopjs-widget/component',[
	"troopjs-dom/component",
	"./config",
	"./weave",
	"./unweave",
	"./woven"
], function (Component, config, weave, unweave, woven) {
	

	/**
	 * @class widget.component
	 * @extend dom.component
	 * @alias feature.component
	 * @mixin widget.config
	 * @localdoc Adds functionality for working with the loom
	 */

	var $ELEMENT = "$element";
	var SELECTOR_WEAVE = "[" + config.widget.weave + "]";
	var SELECTOR_WOVEN = "[" + config.widget.woven + "]";

	function widget_weave() {
		return weave.apply(this[$ELEMENT].find(SELECTOR_WEAVE), arguments);
	}

	/**
	 * @method constructor
	 * @inheritdoc
	 */
	return Component.extend({
		"displayName" : "widget/component",

		/**
		 * Handles component render
		 * @handler
		 * @inheritdoc
		 * @localdoc Calls {@link #method-weave} to ensure newly rendered html is woven
		 */
		"sig/render": widget_weave,

		/**
		 * @handler
		 * @inheritdoc
		 * @localdoc Calls {@link #method-unweave} to ensure this element is unwoven
		 */
		"dom/destroy" : function () {
			if (this.phase !== "finalize") {
				unweave.call(this[$ELEMENT]);
			}
		},

		/**
		 * @method
		 * @inheritdoc widget.weave#constructor
		 */
		"weave" : widget_weave,

		/**
		 * @inheritdoc widget.unweave#constructor
		 */
		"unweave" : function () {
			return unweave.apply(this[$ELEMENT].find(SELECTOR_WOVEN), arguments);
		},

		/**
		 * @inheritdoc widget.woven#constructor
		 */
		"woven" : function () {
			return woven.apply(this[$ELEMENT].find(SELECTOR_WOVEN), arguments);
		}
	});
});

/**
 * @license MIT http://troopjs.mit-license.org/
 */
define('troopjs-widget/application',[
	"./component",
	"troopjs-core/component/signal/initialize",
	"troopjs-core/component/signal/start",
	"troopjs-core/component/signal/stop",
	"troopjs-core/component/signal/finalize",
	"when/when"
], function (Widget, initialize, start, stop, finalize, when) {
	

	/**
	 * The application widget serves as a container for all troop components that bootstrap the page.
	 * @class widget.application
	 * @extend widget.component
	 * @alias widget.application
	 */

	var ARRAY_SLICE = Array.prototype.slice;
	var COMPONENTS = "components";

	/**
	 * @method constructor
	 * @inheritdoc
	 * @param {jQuery|HTMLElement} $element The element that this widget should be attached to
	 * @param {String} displayName A friendly name for this widget
	 * @param {...core.component.emitter} component List of components to start before starting the application.
	 */
	return Widget.extend(function ($element, displayName, component) {
		/**
		 * Application components
		 * @private
		 * @readonly
		 * @property {core.component.emitter[]} components
		 */
		this[COMPONENTS] = ARRAY_SLICE.call(arguments, 2);
	}, {
		"displayName" : "widget/application",

		/**
		 * @handler
		 * @localdoc Initialize all registered components (widgets and services) that are passed in from the {@link #method-constructor}.
		 * @inheritdoc
		 */
		"sig/initialize" : function () {
			var args = arguments;

			return when.map(this[COMPONENTS], function (component) {
				return initialize.apply(component, args);
			});
		},

		/**
		 * @handler
		 * @localdoc weave all widgets that are within this element.
		 * @inheritdoc
		 */
		"sig/start" : function () {
			var me = this;
			var args = arguments;

			return when
				.map(me[COMPONENTS], function (component) {
					return start.apply(component, args);
				}).then(function () {
					return me.weave.apply(me, args);
				});
		},

		/**
		 * @handler
		 * @localdoc stop all woven widgets that are within this element.
		 * @inheritdoc
		 */
		"sig/stop": function () {
			var me = this;
			var args = arguments;

			return me.unweave.apply(me, args).then(function () {
				return when.map(me[COMPONENTS], function (child) {
					return stop.apply(child, args);
				});
			});
		},

		/**
		 * @handler
		 * @localdoc finalize all registered components (widgets and services) that are registered from the {@link #method-constructor}.
		 * @inheritdoc
		 */
		"sig/finalize" : function () {
			var args = arguments;

			return when.map(this[COMPONENTS], function (component) {
				return finalize.apply(component, args);
			});
		},

		/**
		 * Start the component life-cycle, sends out {@link #event-sig/initialize} and then {@link #event-sig/start}.
		 * @param {...*} [args] arguments
		 * @return {Promise}
		 * @fires sig/initialize
		 * @fires sig/start
		 */
		"start": start,

		/**
		 * Stops the component life-cycle, sends out {@link #event-sig/stop} and then {@link #event-sig/finalize}.
		 * @param {...*} [args] arguments
		 * @return {Promise}
		 * @fires sig/stop
		 * @fires sig/finalize
		 */
		"stop": finalize
	});
});

/**
 * @license MIT http://troopjs.mit-license.org/
 */
define('troopjs-widget/plugin',[
	"jquery",
	"when/when",
	"./config",
	"./weave",
	"./unweave",
	"./woven",
	"poly/array"
], function ($, when, config, weave, unweave, woven) {
	

	/**
	 * Extends {@link jQuery} with:
	 *
	 *  - {@link $#property-woven} property
	 *  - {@link $#method-weave}, {@link $#method-unweave} and {@link $#method-woven} methods
	 *
	 * @class widget.plugin
	 * @static
	 * @alias plugin.jquery
	 */

	var UNDEFINED;
	var $FN = $.fn;
	var $EXPR = $.expr;
	var WEAVE = "weave";
	var UNWEAVE = "unweave";
	var WOVEN = "woven";
	var ATTR_WOVEN = config.widget.woven;

	/**
	 * Tests if element has a data-woven attribute
	 * @param element to test
	 * @return {boolean}
	 * @ignore
	 */
	function hasDataWovenAttr(element) {
		return $(element).attr(ATTR_WOVEN) !== UNDEFINED;
	}

	/**
	 * @class $
	 */

	/**
	 * jQuery `:woven` expression
	 * @property woven
	 */
	$EXPR[":"][WOVEN] = $EXPR.createPseudo(function (widgets) {
		// If we don't have widgets to test, quick return optimized expression
		if (widgets === UNDEFINED) {
			return hasDataWovenAttr;
		}

		// Scope `woven_re` locally since we use the `g` flag
		var woven_re = /[\s,]*([\w\d_\/\.\-]+)(?:@(\d+))?/g;
		var woven_res = [];
		var woven_res_length = 0;
		var matches;

		// Iterate `widgets` (while woven_re matches)
		// matches[1] : widget name - "widget/name"
		// matches[2] : widget instance id - "123"
		while ((matches = woven_re.exec(widgets)) !== null) {
			woven_res[woven_res_length++] = "(?:^|[\\s,]+)" + matches[1] + "@" + (matches[2] || "\\d+") + "($|[\\s,]+)";
		}

		// Redefine `woven_re` as a combined regexp
		woven_re = new RegExp(woven_res.join("|"));

		// Return expression
		return function (element) {
			var attr_woven = $.attr(element, ATTR_WOVEN);

			// Check that attr_woven is not UNDEFINED, and that widgets test against a processed attr_woven
			return attr_woven !== UNDEFINED && woven_re.test(attr_woven);
		};
	});

	/**
	 * @method weave
	 * @inheritdoc widget.weave#constructor
	 */
	$FN[WEAVE] = weave;

	/**
	 * @method unweave
	 * @inheritdoc widget.unweave#constructor
	 */
	$FN[UNWEAVE] = unweave;

	/**
	 * @method woven
	 * @inheritdoc widget.woven#constructor
	 */
	$FN[WOVEN] = woven;
});

define(['troopjs-widget/version'], function (version) {
	return version;
});