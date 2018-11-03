#!/usr/bin/env node

'use strict';

const meow = require('meow');
const got = require('got');
const boxen = require('boxen');
const chalk = require('chalk');
const Ora = require('ora');
const firstRun = require('first-run');
const Conf = require('conf');
const prompts = require('prompts');
const ervy = require('ervy');

const spinner = new Ora();
const config = new Conf();
const {bar} = ervy;

// Meow configuration
const cli = meow(`
	Usage
	  $ airly <options>
    Options
      --installation, -i    Specify installation id
      --reset, -r           Reset API key
	Examples
      $ airly --installation 204
      $ airly -r
`, {
	flags: {
		installation: {
			type: 'string',
			alias: 'i',
			default: '204'
		},
		reset: {
			type: 'boolean',
			alias: 'r',
			default: 'false'
		}
	}
});

const start = async () => {
	try {
		spinner.start('Fetching data...');

		// Fetch data from airly api
		const response = await got(`https://airapi.airly.eu/v2/measurements/installation?installationId=${cli.flags.installation}`, {
			headers: {
				apikey: `${config.get('key')}`
			},
			json: true
		});

		const id = await got(`https://airapi.airly.eu/v2/installations/${cli.flags.installation}`, {
			headers: {
				apikey: `${config.get('key')}`
			},
			json: true
		});

		// Generate weather report
		spinner.succeed('Done:\n');

		const data = response.body.current.values.slice(0, -3).map(el => ({...el, key: el.name}));

		console.log(boxen(
			`Particulate Matter (PM) in μg/m3:\n\n${bar(data, {style: `${chalk.green('+')}`, padding: 3, barWidth: 5})} \n\n${chalk.dim.gray(`[Data from sensor nr. ${id.body.id} located in ${id.body.address.city}, ${id.body.address.country}]`)}`
			, {padding: 1, borderColor: 'yellow', borderStyle: 'round'}));

		console.log('\nAir quality guidelines recommended by WHO (24-hour mean):\n');
		console.log(`${chalk.cyan('›')} PM 10: 50 μg/m3`);
		console.log(`${chalk.cyan('›')} PM 2.5: 25 μg/m3`);
		console.log('\nReady more about air quality here: https://bit.ly/2tbIhek');
	} catch (error) {
		spinner.fail('Something went wrong :(');
		process.exit(1);
	}
};

if (firstRun() === true) {
	(async () => {
		console.log('Welcome to airly-cli. If you want to use this CLI tool, you need to paste your Airly API Key below.');
		console.log('You can get it here: https://bit.ly/2JAQGPK\n');

		const response = await prompts({
			type: 'text',
			name: 'api',
			message: 'Paste your API key here:'
		});

		config.set('key', response.api);
		console.log('API key successfully set! Type `airly --help` for help.');
	})();
} else if (cli.flags.reset) {
	firstRun.clear();
	config.clear();

	console.log('API key deleted! Type `airly` to configure a new one.');
} else {
	start();
}
