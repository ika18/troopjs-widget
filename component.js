/**
 * @license MIT http://troopjs.mit-license.org/
 */
define([
	"troopjs-dom/component",
	"./config",
	"./weave",
	"./unweave",
	"./woven"
], function (Component, config, weave, unweave, woven) {
	"use strict";

	/**
	 * @class widget.component
	 * @extend dom.component
	 * @alias widget.component
	 * @mixin widget.config
	 * @localdoc Adds functionality for working with the loom
	 */

	var $ELEMENT = "$element";
	var SELECTOR_WEAVE = "[" + config["weave"] + "]";
	var SELECTOR_WOVEN = "[" + config["woven"] + "]";

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
		 * @method weave
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
