/**
 * @license MIT http://troopjs.mit-license.org/
 */
define([
	"./component",
	"troopjs-core/component/signal/initialize",
	"troopjs-core/component/signal/start",
	"troopjs-core/component/signal/stop",
	"troopjs-core/component/signal/finalize",
	"when"
], function (Widget, initialize, start, stop, finalize, when) {
	"use strict";

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
		}
	});
});
