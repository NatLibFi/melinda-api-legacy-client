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
	    require('marc-record-js'));  // jshint ignore:line
    } 
}(this, function(config, chai, MelindaClient, Record) {
    "use strict";
    var expect = chai.expect;

    describe('Client', function() {

	it('should be a constructor', function() {

	    expect(MelindaClient).to.be.a('function');
	});

	it('should be instantiable', function() {
	    var client = new MelindaClient(config);

	    expect(client).to.be.an('object');
	});

	it('should be able to load a record', function(done) {
	    this.timeout(5000);
	    
	    var client = new MelindaClient(config);

	    client.loadRecord(30000).then(function(record) {

		expect(record).to.be.an.instanceof(Record); 
		
		done();
	    }).catch(function(error) {
		throw error;
	    }).done();
	});

	it('should throw an error if record is not found', function(done) {
	    this.timeout(5000);
	    
	    var client = new MelindaClient(config);

	    client.loadRecord("9999/9999999").then(function(record) {
		throw new Error("Loaded invalid record succesfully!");
	    }).catch(function(error) {
		
		if (error.name == "AssertionError") {
		    throw error;
		}
		
		expect(error.status_code).to.equal(404);
		expect(error.message).to.equal('Not Found');
		done();
	    }).done();

	});

	it('should be able to update a record', function(done) {
	    this.timeout(7000);
	    var client = new MelindaClient(config);

	    client.loadRecord(30001).then(function(record) {

		expect(record).to.be.an.instanceof(Record);
		
		//remove old test lines
		record.fields = record.fields.filter(function(field) {
		    return !(field.tag == "599" && field.subfields.map(toValues).indexOf("TEST") > -1);
		});

		//create new test lines
		var now = new Date();
		record.insertField( ["599",'','','a','TEST','c', now.toString()] );
		record.insertField( ["599",'','','a','TEST <TAG>'] );
		
		client.updateRecord(record).then(function(response) {
		    
		    expect(response.messages.map(to('message'))).to.contain('Document: 000030001 was updated successfully.');
		    expect(response.messages.map(to('code'))).to.contain('0018');


		    //validate that the update was ok
		    client.loadRecord(30001).then(function(record) {

			var testChange = record.fields.filter(function(field) {
			    return (field.tag == "599" && field.subfields.map(toValues).indexOf("TEST") > -1);
			});
			expect(testChange).length.to.be(1);
			expect(testChange[0].subfields.map(toValues)).to.contain(now.toString());

			done();
		    }).done();

		}).catch(function(e) {
		    throw e;
		}).done();
		
	    }).catch(function(error) {
		throw error;
	    }).done();

	});

	it('should be able to create a new record', function(done) {
	    this.timeout(7000);
	    var client = new MelindaClient(config);

	    client.loadRecord(30001).then(function(record) {

		client.createRecord(record).then(function(response) {
		    
		    expect(response.recordId).to.not.equal(30001);
		    console.log(response.recordId);
		    done();
		}).catch(function(e) {
		    throw e;
		}).done();

	    }).catch(function(error) {
		throw error;
	    }).done();

	});

	it('should retrieve child records', function(done) {

	    this.timeout(5000);
	    
	    var client = new MelindaClient(config);

	    client.loadChildRecords('foo').then(function(records) {

		expect(records).to.be.an('array');
		
		done();
	    }).catch(function(error) {
		throw error;
	    }).done();

	});

    });

    function to(attr) {
	return function(obj) {
	    return obj[attr];
	};
    }
    function toValues(obj) {
	return obj.value;
    }
}));



