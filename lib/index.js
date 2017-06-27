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

(function(root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
	define([
	    'q',
	    'axios/dist/axios.amd',
	    'marc-record-converters'
	], factory);
    } else if(typeof exports === 'object') {
	module.exports = factory(
	    require('q'), 
	    require('axios'), 
	    require('marc-record-converters'),
	    require('btoa'),
	    require('xmldom'));  // jshint ignore:line
    } 
}(this, function(Q, axios, marc_converters, btoa, xmldom) {
    "use strict";

    function constructor(config) {

	function loadRecord(id, params, raw) {
	    var defer = Q.defer();
	    raw = raw || false;

	    var url = config.endpoint + '/bib/' + id;
	    
	    var opts = {};
	    if (params !== undefined) {
		opts.params = params;
	    }

	    axios.get(url, opts).then(function(response) {
		if (raw === true) {
		    return defer.resolve(response);
		}

		try {
		    var record = marc_converters.marcxml.convertFrom(response.data);
		    defer.resolve(record);
		} catch(e) {
		    defer.reject(e);
		}
		

	    }).catch(axiosErrorHandler(defer));

	    return defer.promise;
	}

	function loadChildRecords(id, params, raw) {

	    var defer = Q.defer();
	    raw = raw || false;

	    var url = config.endpoint + '/bib/' +  id + '/children';
	    
	    var opts = {};
	    if (params !== undefined) {
		opts.params = params;
	    }

	    axios.get(url, opts).then(function(response) {

		var collection_children,
		serializer = new xmldom.XMLSerializer(),
		records = [];

		if (raw === true) {
		    return defer.resolve(response);
		}

		try {

		    collection_children = new xmldom.DOMParser()
			.parseFromString(response.data)
			.getElementsByTagName('record');

		    for (var i=0;i < collection_children.length; i++) {
			records.push(marc_converters.marcxml.convertFrom(
			    serializer.serializeToString(collection_children.item(i))
			));
		    }

		    defer.resolve(records);

		} catch(e) {
		    defer.reject(e);
		}
		

	    }).catch(axiosErrorHandler(defer));

	    return defer.promise;
	}
	
	function createRecord(record, params) {
	    var defer = Q.defer();

	    record.fields = record.fields.filter(function(f) { 
		return f.tag !== "001";
	    });

	    var url = config.endpoint + 'bib/';

	    try {
		var inMARCXML = Serializers.MARCXML.toMARCXML(record);
		
		var opts = {
		    headers: {
			"Content-Type": "text/xml",
			"Authorization": "Basic " + btoa(config.user +":"+ config.password)
		    },
		    params: params
		};
		
		axios.post(url, inMARCXML, opts).then(function(response) {
		    
		    var parsedResponse = parseResponse(response.data);
		    if (parsedResponse.errors.length === 0) {
			defer.resolve(parsedResponse);	
		    } else {
			defer.reject(parsedResponse);	
		    }
		}).catch(axiosErrorHandler(defer));
	    } catch(e) {
		
		defer.reject(e);
	    }
	    
	    return defer.promise;
	}

	function updateRecord(record, params) {
	    var defer = Q.defer();

	    var idFields = record.fields.filter(function(f) { return f.tag == "001";});
	    if (idFields.length !== 1 || isNaN(idFields[0].value)) {
		defer.reject(new Error("Could not determine record id"));
		return defer.promise;
	    }

	    var id = idFields[0].value;
	    var url = config.endpoint + '/bib/' + id;

	    try {
		var inMARCXML = Serializers.MARCXML.toMARCXML(record);
		
		var opts = {
		    headers: {
			"Content-Type": "text/xml",
			"Authorization": "Basic " + btoa(config.user +":"+ config.password)
		    },
		    params: params
		};
		
		axios.put(url, inMARCXML, opts).then(function(response) {
		    var parsedResponse = parseResponse(response.data);
		    if (parsedResponse.errors.length === 0) {
			defer.resolve(parsedResponse);	
		    } else {
			defer.reject(parsedResponse);	
		    }
		    
		}).catch(axiosErrorHandler(defer));
	    } catch(e) {
		
		defer.reject(e);
	    }
	    
	    return defer.promise;

	}

	function parseResponse(response) {
	    var parser = new xmldom.DOMParser();
	    var doc = parser.parseFromString(response);

	    var messages = textContents(doc.getElementsByTagName('message')).map(parseMessage);
	    var errors = textContents(doc.getElementsByTagName('error')).map(parseMessage);
	    var triggers = textContents(doc.getElementsByTagName('trigger')).map(parseMessage);
	    var warnings = textContents(doc.getElementsByTagName('warning')).map(parseMessage);


	    var parsedResponse = {
		messages: messages,
		errors: errors,
		triggers: triggers,
		warnings: warnings
	    };

	    var successMessages = messages.filter(function(message) {
		return message.code == '0018';
	    });

	    var idList = successMessages.map(function(message) {
		var match = /^Document: ([0-9]+) was updated successfully.$/.exec(message.message);
		if (match) {
		    return match[1];
		}
	    }).filter(function(f) { return f !== undefined; });

	    if (idList.length > 1) {
		throw new Error("Multiple ids from success messages");
	    }
	    if (idList.length == 1) {
		parsedResponse.recordId = idList[0];
	    }
	    
	    return parsedResponse;

	    function parseMessage(alephMessage) {
		var match = /\[([0-9]+)\](.*)/.exec(alephMessage);
		if (match !== null) {
		    return {
			code: match[1],
			message: match[2].trim()
		    };
		} else {
		    return {
			code: -1,
			message: "melinda-api-client unable to parse: " + alephMessage
		    };
		}
	    }

	    function textContents(nodeList) {
		var contents = [];
		Array.prototype.slice.call(nodeList).forEach(function(node) {
		    Array.prototype.slice.call(node.childNodes).forEach(function(node) {
			if (node.nodeType === 3) { //3 -> textNode
			    contents.push(node.data);
			}
			
		    });
		});
		return contents;
		
	    }

	}


	function axiosErrorHandler(deferred) {
	    return function(axiosErrorResponse) {
		if (axiosErrorResponse instanceof Error) {
		    return deferred.reject(axiosErrorResponse);
		}
		
		var error = new Error(axiosErrorResponse.statusText);
		error.status_code = axiosErrorResponse.status;
		deferred.reject(error);
	    };
	}

	return {
	    loadRecord: loadRecord,
	    loadChildRecords: loadChildRecords,
	    updateRecord: updateRecord,
	    createRecord: createRecord
	};

    }

    return constructor;
}));
