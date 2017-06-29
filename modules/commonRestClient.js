var querystring = require('../node_modules/querystring');
var http = require('http');

module.exports.performRestRequest = function(host, port, endpoint, method,
		data, success) {
	var dataString = querystring.stringify(data);
	var headers = {};

	if (method === 'GET') {
		endpoint += '?' + dataString;
	} else {
		headers = {
			'Content-Type' : 'application/json',
			'Content-Length' : dataString.length
		};
	}
	var options = {
		host : host,
		port : port,
		path : endpoint,
		method : method,
		headers : headers
	};

	var responseObject;
	var req = http.request(options, function(res) {
		res.setEncoding('utf-8');
		var responseString = '';

		res.on('data', function(data) {
			responseString += data;
		});

		res.on('end', function() {
			responseObject = JSON.parse(responseString);
			success(false, responseObject);
		});
		res.on('error', function() {
			responseObject = JSON.parse(responseString);
			success(true, responseObject);
		});
	});

	req.write(dataString);
	req.end();
};

exports.performRequestJIRA = function(host, port, endpoint, method, headers,
		success) {

	var options = {
		host : host,
		port : port,
		path : endpoint,
		method : method,
		headers : headers
	};

	var responseObject;
	var req = http.request(options, function(res) {
		res.setEncoding('utf-8');
		var responseString = '';

		res.on('data', function(data) {
			responseString += data;
		});

		res.on('end', function() {
			responseObject = JSON.parse(responseString);
			success(false, responseObject);
		});
		res.on('error', function() {
			responseObject = JSON.parse(responseString);
			success(true, responseObject);
		});
	});
	req.end();
};