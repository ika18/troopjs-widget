/**
 * @license MIT http://troopjs.mit-license.org/
 */
define([ "./default" ], function (Widget) {
	return Widget.extend(function () {
		this.args = Array.prototype.slice.call(arguments);
	});
});
