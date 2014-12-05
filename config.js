/**
 * @license MIT http://troopjs.mit-license.org/
 */
define([
	"troopjs-dom/config",
	"module",
	"mu-merge"
], function (config, module, merge) {
	"use strict";

	/**
	 * Provides configuration for the widget package
	 * @class widget.config
	 * @extends dom.config
	 * @protected
	 * @alias feature.config
	 */

	return merge.call(config, {
		/**
		 * @cfg {String} $weft Property of the widget where the **weft** resides.
		 * @protected
		 */
		"$weft" : "$weft",

		/**
		 * @cfg {String} weave Attribute name of the element where the **weave** resides.
		 * @protected
		 */
		"weave" : "data-weave",

		/**
		 * @cfg {String} unweave Attribute name of the element where the **unweave** resides.
		 * @protected
		 */
		"unweave" : "data-unweave",

		/**
		 * @cfg {String} woven Attribute name of the element where the **woven** resides.
		 * @protected
		 */
		"woven" : "data-woven"
	}, module.config());
});