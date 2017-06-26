/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file. 
*
* JS client for using Melinda API (Union catalogue of the National library of Finland)
*
* Copyright (c) 2015-2017 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-api-client
*
* melinda-api-client is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
**/

/*jshint mocha:true*/

(function(root, testrunner) {
	"use strict";
	if (typeof define === 'function' && define.amd) {
		define(['chai', '../lib/index.js'], testrunner);
	} else if(typeof exports === 'object') {
		testrunner(
			require('./config'),
			require('chai'), 
			require('../lib/index'),
			require('marc-record-js'),
			require('marc-record-serializers'));  // jshint ignore:line
	} 
}(this, function(config, chai, MelindaClient, Record, Serializers) {
	"use strict";
	var pd = require('pretty-data').pd;

	var testCount = 0;

	var client = new MelindaClient(config);
	
	var start = new Date();

	function generateRandomId() {
		return Math.floor(Math.random()*7000000);
	}

	function runNext() {
		return testId(generateRandomId()).then(runNext);
	}

	runNext();
	
	function testId(id) {

		return client.loadRecord(id, true).then(function(response) {
			
			try {
				var inMARCXML = response.data;
				var record = Serializers.MARCXML.fromMARCXML(inMARCXML);

				var myMARCXML = Serializers.MARCXML.toMARCXML(record);
				myMARCXML = '<?xml version="1.0" encoding="UTF-8"?>\n' + myMARCXML;

				inMARCXML = inMARCXML.trim();
				myMARCXML = myMARCXML.trim();
				if (inMARCXML == myMARCXML) {
					var now = new Date();
					console.log(id,"OK", testCount, Math.floor((now-start)/1000) + "s");
				} else {
					console.log(id,"ERR");

					var fs = require('fs');
					fs.writeFileSync("in" + id, pd.xml(inMARCXML), 'utf8');
					fs.writeFileSync("my" + id, pd.xml(myMARCXML), 'utf8');
					console.log("meld in" + id + " my" + id);

				}
				
			} catch(error) {
				throw error;
			}

		}).catch(function(error) {
			throw error;
		});
	}

}));



