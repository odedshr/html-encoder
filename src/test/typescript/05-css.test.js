const { test } = require('./utils.js');

describe('html-encoder-typescript: css class', () => {
	it('supports <?css class?> for sibling', () =>
		test(
			'<div>Hello <b>World</b><?css state?></div>',
			{ state: 'active' },
			'<div>Hello <b class="active">World</b></div>'
		));

	it('supports <?css array?> for sibling', () =>
		test(
			'<div>Hello <b>World</b><?css state?></div>',
			{ state: ['active', 'idle'] },
			'<div>Hello <b class="active idle">World</b></div>',
		));

	it('supports <?css condition?class?> for sibling', () =>
		test(
			'<div>Hello <b>World</b><?css c1?idx c2?lvl ?></div>',
			{ idx: 'active', lvl: 'one', c1: true, c2: false },
			'<div>Hello <b class="active">World</b></div>'
		));

	it('supports <?css class?> from a looped item', () =>
		test(
			'<ul><?item@items?><li><?css item.color?>foo</li><?/?></ul>',
			{ items: [{ color: 'red' }, { color: 'green' }, { color: 'blue' }] },
			'<ul><li class="red">foo</li><li class="green">foo</li><li class="blue">foo</li></ul>'
		));
});
