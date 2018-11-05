import test from 'ava';
import execa from 'execa';

test('Help message', async t => {
	const ret = await execa.shell('node cli.js --help');
	t.regex(ret.stdout, /Usage/);
});

test('Reset API key', async t => {
	const ret = await execa.shell('node cli.js --reset');
	t.regex(ret.stdout, /API key deleted/);
});
