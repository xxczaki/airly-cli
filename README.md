# Airly CLI ☁️

> Get the latest info about air pollution in Poland using [Airly](https://airly.eu/en/)!

[![Build Status](https://travis-ci.org/xxczaki/airly-cli.svg?branch=master)](https://travis-ci.org/xxczaki/airly-cli) 
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo) 

![Animated SVG](https://rawcdn.githack.com/xxczaki/airly-cli/master/airly.svg)

---

## Install
```bash
npm install --global airly-cli
```

<a href="https://www.patreon.com/akepinski">
	<img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## Usage

> Please note that this app is highly experimental and it is not completed yet.

```bash
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
```

### License

MIT
