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