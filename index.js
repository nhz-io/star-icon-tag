'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.register = exports.render = exports.normalize = exports.paths = exports.path = exports.parseOpts = exports.points = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _riot = require('riot');

var _riot2 = _interopRequireDefault(_riot);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @desc namespace for svg tags */
var xmlns = 'http://www.w3.org/2000/svg';

/** @desc path default attributes */
var defaults = {
	arms: 5,
	fill: '#555',
	rotation: 0,
	ratio: 0.6,
	zoom: 1
};

/** @desc path attribute names */
var attributes = Object.keys(defaults);

/** @desc Just call the callback if no requestAnimationFrame is present */

var raf = typeof window !== 'undefined' && window.requestAnimationFrame || function (f) {
	return f();
};

/**
	* @desc Generate star points coordinates with options
	* @param {Object}
	* @param {Number} .arms - number of star arms
	* @param {Number} .ration - inner/outer radius ratio
	* @param {Number} .rotation - rotation in degrees
	* @param {Number} .zoom - zoom value (1 >= value > 0)
	* @return {Array<[x, y]>} star points coordinates
	*/
var points = exports.points = function points() {
	var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	var _defaults$opts = _extends({}, defaults, opts);

	var arms = _defaults$opts.arms;
	var ratio = _defaults$opts.ratio;
	var rotation = _defaults$opts.rotation;
	var zoom = _defaults$opts.zoom;

	var angle = Math.PI / arms;
	return Array(arms * 2).fill().map(function (_, i) {
		var radius = (i % 2 ? ratio : 1) * zoom / 2;
		var _angle = i * angle + rotation * Math.PI / -180;
		return [0.5 - Math.sin(_angle) * radius, 0.5 - Math.cos(_angle) * radius];
	});
};

/**
	* @desc parse options into array of options per each path
	* @param {Object} opts
	* @returns {Array<Object>}
	*/
var parseOpts = exports.parseOpts = function parseOpts() {
	var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	var _opts = {};
	var _opts$layers = opts.layers;
	var layers = _opts$layers === undefined ? 1 : _opts$layers;

	var result = [];
	attributes.forEach(function (a) {
		var value = opts[a].toString().split(/\s*,\s*/);
		var diff = layers - value.length;
		if (diff > 0) {
			value = value.concat(Array(diff).fill(value[0]));
		}
		_opts[a] = value;
	});
	for (var i = 0; i < layers; i++) {
		var item = {};
		for (var j = 0; j < attributes.length; j++) {
			var name = attributes[j];
			item[name] = _opts[name][i];
		}
		result.push(item);
	}
	return result;
};

/**
	* @desc path reducer
	* @param {Object} state
	* @param {String} state.d - previous d attribute value
	* @param {Array<[x, y]>} state.points - previous set of coordinates
	* @param {String} state.color - color to fill the path
	* @param {Object} opts
	* @return {Object} next state
	*/
var path = exports.path = function path() {
	var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
	var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	opts = _extends({}, defaults, opts);

	if (attributes.find(function (a) {
		return opts[a] !== state[a];
	})) {
		state = _extends({}, opts, {
			d: points(opts).reduce(function (s, p) {
				return s + (s ? ' L ' : 'M ') + p.join(' ');
			}, '')
		});
	}

	return state;
};

/**
	* @desc paths reducer
	* @param {Array<Object>} state - previous state
	* @param {Object} opts
	* @return {Array<Object>} next state
	*/
var paths = exports.paths = function paths() {
	var state = arguments.length <= 0 || arguments[0] === undefined ? { items: [] } : arguments[0];
	var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	opts = _extends({}, defaults, { layers: 1 }, opts);
	var force = opts.layers !== state.layers;
	if (force || attributes.find(function (a) {
		return opts[a] !== state[a];
	})) {
		state = _extends({}, state, opts, {
			items: parseOpts(opts).map(function (opts, i) {
				return path(state.items[i], opts);
			})
		});
	}
	return state;
};

/**
	* @desc Normalize the number of svg children (paths) to match the count
	* @param {SVGElement} svg
	* @param {Number} ?count
	* @return {SVGElement}
	*/
var normalize = exports.normalize = function normalize(svg) {
	var count = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

	var length = (svg.children || []).length;
	while (length > count) {
		svg.removeChild(svg.children[length - 1]);
		length--;
	}
	while (length < count) {
		svg.appendChild(document.createElementNS(xmlns, 'path'));
		length++;
	}
	return svg;
};

/**
	* @desc DOM Render the star
	* @param {SVGElement} svg
	* @param {Array<Object>} paths - array of path states
	* @return {SVGElement}
	*/
var render = exports.render = function render(svg, paths) {
	var _context;

	normalize(svg, paths.length);
	(_context = svg.children, Array.prototype.slice).call(_context).forEach(function (path, i) {
		['d', 'fill'].forEach(function (a) {
			return path.setAttribute(a, paths[i][a]);
		});
	});
	return svg;
};

/**
	* @desc register the riot tag
	* @return {Object}
	*/
var register = exports.register = function register() {
	var _this = this;

	var svg = document.createElementNS(xmlns, 'svg');
	svg.setAttribute('viewBox', '0 0 1 1');
	var state = void 0;
	this.root.appendChild(svg);

	this.on('mount', function () {
		state = paths(state, _this.opts);
		raf(function () {
			return render(svg, state.items);
		});
	});
};

exports.default = _riot2.default.tag('star-icon', '', register);
