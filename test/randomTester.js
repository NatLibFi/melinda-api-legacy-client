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



