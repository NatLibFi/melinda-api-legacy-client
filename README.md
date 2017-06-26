# melinda-api-client

JS client for using Melinda API (Union catalogue of the National library of Finland)


## Installation

```
npm install melinda-api-client
```

## Usage

Usage examples can be found from the test/ directory. Each function returns a promise.

```

var MelindaClient = require('melinda-api-client');

var client = new MelindaClient(config);

```

config should be in following format:
```
{
	endpoint: "API-ENDPOINT-URL",
	user: "USERNAME",
	password: "PASSWORD"
}
```


To retrieve a record from Melinda use loadRecord
```
client.loadRecord(30000).then(function(record) {
	// do something with record
}).done();

```
The records are marc-record-js instances.



To update or create a record in Melinda use updateRecord and createRecord respectively
```
client.updateRecord(record).then(function(response) {
	// contains reponse from Melinda
}).done();

client.createRecord(record).then(function(response) {
	// contains reponse from Melinda
}).done();

```

The responses are in the following format:

```
{
	messages: [arrayOfMessages],
	errors: [arrayOfErrors],
	triggers: [arrayOfTriggerMessages],
	warnings: [arrayOfWarnings]
	recordId: "id of the changed/created record"
}
```

## Contributions

The grunt default task will run jshint, tests and coverage for the module. Tests can be found from test/ directory.

To test that everything is ok, just run:
```
grunt
```

The ci will do the same when commits are pushed to this repository.

## License and copyright

Copyright (c) 2015-2017 University Of Helsinki (The National Library Of Finland)

This project's source code is licensed under the terms of **GNU General Public License Version 3**.