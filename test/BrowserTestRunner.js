
require.config({
	baseUrl: "../",
    paths: {
      'backbone': 'node_modules/backbone/backbone',
      'jquery': 'node_modules/jquery/dist/jquery',
      'underscore': 'node_modules/underscore/underscore',
      'chai': 'node_modules/chai/chai',

    }
});


require([
//Tests go here

], function() {
	"use strict";
	
	if (window.mochaPhantomJS) { 
		window.mochaPhantomJS.run(); 
	} else { 
		window.mocha.run(); 
	}

});