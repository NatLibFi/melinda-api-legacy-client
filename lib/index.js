(function(root, factory) {
	"use strict";
	if (typeof define === 'function' && define.amd) {
		define([
			'../node_modules/q/q',
			'../node_modules/axios/axios',
			'../node_modules/sprintf/sprintf',
			'../node_modules/marc-record-serializers/lib/index',
			

		], factory);
	} else if(typeof exports === 'object') {
		module.exports = factory(
			require('q'), 
			require('axios'), 
			require('sprintf').sprintf,
			require('marc-record-serializers'),
			require('btoa'),
			require('xmldom'));  // jshint ignore:line
	} 
}(this, function(Q, axios, sprintf, Serializers, btoa, xmldom) {
	"use strict";

	function constructor(config) {

		function loadRecord(id, params, raw) {
			var defer = Q.defer();
			raw = raw || false;

			var url = sprintf("%s/bib/%s", config.endpoint, id);
			
			var opts = {};
			if (params !== undefined) {
				opts.params = params;
			}

			axios.get(url, opts).then(function(response) {
				if (raw === true) {
					return defer.resolve(response);
				}

				try {
					var record = Serializers.MARCXML.fromMARCXML(response.data);
					defer.resolve(record);
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

			var url = sprintf("%s/bib/", config.endpoint);

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
			var url = sprintf("%s/bib/%s", config.endpoint, id);

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
			updateRecord: updateRecord,
			createRecord: createRecord
		};

	}

	return constructor;
}));