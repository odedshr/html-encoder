const { test } = require('./utils.js');

describe('html-encoder-typescript: conditionals', () => {
	it('supports <??booleans?>[content]<?/?>', () =>
		test('<div><??flag1?>True<?/?><??flag2?>False<?/?></div>', { flag1: true, flag2: false }, '<div>True</div>'));

	it('supports nested conditionals <??boolean?>foo<??boolean?>bar</?><?/?>', () =>
		test(`<section><??outerCondition?>
		<div>
	    <input type="checkbox" id="CheckBoxId" /><?attr id=CheckBoxId?><?attr name=CheckBoxId?>` +
			`<??nestedCondition?><?attr checked="checked"?><?/?>
	    <label for="CheckBoxId"><?attr for=CheckBoxId?>foo</label>
	  </div><?/?>
	</section>`, { outerCondition: true, CheckBoxId: 'id', nestedCondition: true }, `<section>
		<div>
	    <input type="checkbox" id="id" name="id" checked="checked"/>
	    <label for="id">foo</label>
	  </div>
	</section>`));

	it('supports <??!booleans?>[content]<?/?>', () =>
		test('<div><??!flag1?>True<?/?><??!flag2?>False<?/?></div>', { flag1: true, flag2: false }, '<div>False</div>'));
});
