import riot from 'riot'

/** @desc namespace for svg tags */
const xmlns = 'http://www.w3.org/2000/svg'

/** @desc path default attributes */
const defaults = {
	arms: 5,
	fill: '#555',
	rotation: 0,
	ratio: 0.6,
	zoom: 1,
}

/** @desc path attribute names */
const attributes = Object.keys(defaults)

/** @desc Just call the callback if no requestAnimationFrame is present */

const raf = (typeof window !== 'undefined' && window.requestAnimationFrame) ||
	function (f) {
		return f()
	}

/**
	* @desc Generate star points coordinates with options
	* @param {Object}
	* @param {Number} .arms - number of star arms
	* @param {Number} .ration - inner/outer radius ratio
	* @param {Number} .rotation - rotation in degrees
	* @param {Number} .zoom - zoom value (1 >= value > 0)
	* @return {Array<[x, y]>} star points coordinates
	*/
export const points = (opts = {}) => {
	const {arms, ratio, rotation, zoom} = {...defaults, ...opts}
	const angle = Math.PI / arms
	return (
		Array(arms * 2)
			.fill()
			.map((_, i) => {
				const radius = (i % 2 ? ratio : 1) * zoom / 2
				const _angle = i * angle + rotation * Math.PI / -180
				return [
					0.5 - Math.sin(_angle) * radius,
					0.5 - Math.cos(_angle) * radius,
				]
			})
	)
}

/**
	* @desc parse options into array of options per each path
	* @param {Object} opts
	* @returns {Array<Object>}
	*/
export const parseOpts = (opts = {}) => {
	const _opts = {}
	const {layers = 1} = opts
	const result = []
	attributes.forEach(a => {
		let value = opts[a].toString().split(/\s*,\s*/)
		const diff = layers - value.length
		if (diff > 0) {
			value = value.concat(Array(diff).fill(value[0]))
		}
		_opts[a] = value
	})
	for (let i = 0; i < layers; i++) {
		const item = {}
		for (let j = 0; j < attributes.length; j++) {
			const name = attributes[j]
			item[name] = _opts[name][i]
		}
		result.push(item)
	}
	return result
}

/**
	* @desc path reducer
	* @param {Object} state
	* @param {String} state.d - previous d attribute value
	* @param {Array<[x, y]>} state.points - previous set of coordinates
	* @param {String} state.color - color to fill the path
	* @param {Object} opts
	* @return {Object} next state
	*/
export const path = (state = {}, opts = {}) => {
	opts = {...defaults, ...opts}

	if (attributes.find(a => opts[a] !== state[a])) {
		state = {
			...opts,
			d: points(opts).reduce((s, p) => {
				return s + (s ? ' L ' : 'M ') + p.join(' ')
			}, ''),
		}
	}

	return state
}

/**
	* @desc paths reducer
	* @param {Array<Object>} state - previous state
	* @param {Object} opts
	* @return {Array<Object>} next state
	*/
export const paths = (state = {items: []}, opts = {}) => {
	opts = {...defaults, layers: 1, ...opts}
	const force = (opts.layers !== state.layers)
	if (force || attributes.find(a => opts[a] !== state[a])) {
		state = {
			...state,
			...opts,
			items: parseOpts(opts).map((opts, i) => path(state.items[i], opts)),
		}
	}
	return state
}

/**
	* @desc Normalize the number of svg children (paths) to match the count
	* @param {SVGElement} svg
	* @param {Number} ?count
	* @return {SVGElement}
	*/
export const normalize = (svg, count = 0) => {
	let length = (svg.children || []).length
	while (length > count) {
		svg.removeChild(svg.children[length - 1])
		length--
	}
	while (length < count) {
		svg.appendChild(document.createElementNS(xmlns, 'path'))
		length++
	}
	return svg
}

/**
	* @desc DOM Render the star
	* @param {SVGElement} svg
	* @param {Array<Object>} paths - array of path states
	* @return {SVGElement}
	*/
export const render = (svg, paths) => {
	normalize(svg, paths.length)
	svg.children::Array.prototype.slice().forEach((path, i) => {
		['d', 'fill'].forEach(a => path.setAttribute(a, paths[i][a]))
	})
	return svg
}

/**
	* @desc register the riot tag
	* @return {Object}
	*/
export const register = function () {
	const svg = document.createElementNS(xmlns, 'svg')
	svg.setAttribute('viewBox', '0 0 1 1')
	let state
	this.root.appendChild(svg)

	this.on('mount', () => {
		state = paths(state, this.opts)
		raf(() => render(svg, state.items))
	})
}

export default riot.tag('star-icon', '', register)
