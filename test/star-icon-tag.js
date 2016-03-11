import test from 'ava'
import riot from 'riot'
import 'babel-register'
import '../src/star-icon-tag'

test('mount', t => {
	const test = global.document.createElement('div')
	test.setAttribute('fill', 'orange')
	global.document.body.appendChild(test)
	riot.mount(test, 'star-icon')
	t.is(test.children.length, 1)
	t.is(test.children[0].children.length, 1)
	t.is(test.children[0].children[0].getAttribute('fill'), 'orange')
	t.pass()
})
