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
	 * @private
	 * @alias feature.config
	 */

	return merge.call({}, config, {
		/**
		 * @cfg {Object} widget Widget related configuration
		 * @cfg {String} [widget.$weft=$weft] Property of the widget where the **weft** resides.
		 * @cfg {String} [widget.weave=data-weave] Attribute name of the element where the **weave** resides.
		 * @cfg {String} [widget.unweave=data-unweave] Attribute name of the element where the **unweave** resides.
		 * @cfg {String} [widget.woven=data-woven] Attribute name of the element where the **woven** resides.
		 */
		"widget": {
			"$weft" : "$weft",
			"weave" : "data-weave",
			"unweave" : "data-unweave",
			"woven" : "data-woven"
		}
	}, module.config());
});