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
const getCoords = require('city-to-coords');

const spinner = new Ora();
const config = new Conf();
const {bar} = ervy;

// Meow configuration
const cli = meow(`
	Usage
	  $ airly <options>
	Options
	  --city, -c    		Search using city name
	  --installation, -i    Search using specific sensor id
      --reset, -r           Reset API key
	Examples
	  $ airly --city Krakow
      $ airly --installation 204
      $ airly -r
`, {
	flags: {
		installation: {
			type: 'string',
			alias: 'i'
		},
		city: {
			type: 'string',
			alias: 'c'
		},
		reset: {
			type: 'boolean',
			alias: 'r',
			default: 'false'
		}
	}
});

// Search by installation id
const startId = async () => {
	try {
		spinner.start('Fetching data...');

		// Fetch pollution data from airly api
		const pollutions = await got(`https://airapi.airly.eu/v2/measurements/installation?installationId=${cli.flags.installation}`, {
			headers: {
				apikey: `${config.get('key')}`
			},
			json: true
		});
		// Fetch installation info from airly api
		const id = await got(`https://airapi.airly.eu/v2/installations/${cli.flags.installation}`, {
			headers: {
				apikey: `${config.get('key')}`
			},
			json: true
		});

		spinner.succeed('Done:\n');

		const data = pollutions.body.current.values.filter(item => (
			item.name === 'PM1' || item.name === 'PM25' || item.name === 'PM10'
		));

		const newData = data.map(el => ({...el, key: el.name}));

		// Show user the table with envy
		console.log(boxen(
			`Particulate Matter (PM) in μg/m3:\n\n${bar(newData, {style: `${chalk.green('+')}`, padding: 3, barWidth: 5})} \n\n${chalk.dim.gray(`[Data from sensor nr. ${id.body.id} located in ${id.body.address.street}, ${id.body.address.city}, ${id.body.address.country}]`)}`
			, {padding: 1, borderColor: 'yellow', borderStyle: 'round'}));

		// Some info about air quality guidelines
		console.log('\nAir quality guidelines recommended by WHO (24-hour mean):\n');
		console.log(`${chalk.cyan('›')} PM 10: 50 μg/m3`);
		console.log(`${chalk.cyan('›')} PM 2.5: 25 μg/m3`);
		console.log('\nReady more about air quality here: https://bit.ly/2tbIhek');
	} catch (error) {
		spinner.fail('Something went wrong :(');
		process.exit(1);
	}
};

// Search by city
const startLocation = () => {
	try {
		// Get coordinates from provided location
		getCoords(cli.flags.city)
			.then(async coords => {
				const {lat, lng} = coords;

				// Search for the nearest installation
				const search = await got(`https://airapi.airly.eu/v2/installations/nearest?lat=${lat}&lng=${lng}&maxResults=3&maxDistanceKM=-1`, {
					headers: {
						apikey: `${config.get('key')}`
					},
					json: true
				});
				// Select the installation
				const sensor = search.body.map(v => v.id);
				const address = search.body.map(v => v.address.street);

				const response = await prompts({
					type: 'select',
					name: 'value',
					message: 'Available sensors:',
					choices: [
						{title: `${address[0]}`, value: `${sensor[0]}`},
						{title: `${address[1]}`, value: `${sensor[1]}`},
						{title: `${address[2]}`, value: `${sensor[2]}`}
					],
					initial: 1
				});

				spinner.start('Fetching data...');

				// Fetch pollution data from airly api
				const pollutions = await got(`https://airapi.airly.eu/v2/measurements/installation?installationId=${response.value}`, {
					headers: {
						apikey: `${config.get('key')}`
					},
					json: true
				});

				// Fetch installation info from airly api
				const id = await got(`https://airapi.airly.eu/v2/installations/${response.value}`, {
					headers: {
						apikey: `${config.get('key')}`
					},
					json: true
				});

				spinner.succeed('Done:\n');

				const data = pollutions.body.current.values.filter(item => (
					item.name === 'PM1' || item.name === 'PM25' || item.name === 'PM10'
				));

				const newData = data.map(el => ({...el, key: el.name}));

				// Show user the table with envy
				console.log(boxen(
					`Particulate Matter (PM) in μg/m3:\n\n${bar(newData, {style: `${chalk.green('+')}`, padding: 3, barWidth: 5})} \n\n${chalk.dim.gray(`[Data from sensor nr. ${id.body.id} located in ${id.body.address.street}, ${id.body.address.city}, ${id.body.address.country}]`)}`
					, {padding: 1, borderColor: 'yellow', borderStyle: 'round'}));

				// Some info about air quality guidelines
				console.log('\nAir quality guidelines recommended by WHO (24-hour mean):\n');
				console.log(`${chalk.cyan('›')} PM 10: 50 μg/m3`);
				console.log(`${chalk.cyan('›')} PM 2.5: 25 μg/m3`);
				console.log('\nReady more about air quality here: https://bit.ly/2tbIhek');
			});
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
		console.log('API key successfully set! Type `airly --help` for usage instructions.');
	})();
} else if (cli.flags.city) {
	startLocation();
} else if (cli.flags.reset) {
	firstRun.clear();
	config.clear();

	console.log('API key deleted! Type `airly` to configure a new one.');
} else if (cli.flags.installation) {
	startId();
} else {
	console.log('Type `airly --help` for usage instructions.');
}
