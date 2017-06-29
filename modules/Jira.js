var devopsHttpClient = require('./commonRestClient');
var property = require('../property');
var host = property.config.host;
var port = property.config.jiraPort;
var username = 'satpal.singh';
var password = 'newgen';

// to get all project data
exports.queryJiraAllProjects = function(callback) {
	var credentials = new Buffer(username + ':' + password);
	var encryptedCredentials = credentials.toString('base64');

	var headers = {
		'Authorization' : 'Basic ' + encryptedCredentials,
		'Content-Type' : 'application/json'
	};

	var jiraData = devopsHttpClient.performRequestJIRA(host, port,
			'/rest/api/2/search?maxResults=2000', 'GET', headers, function(err,
					data) {
				if (err) {
					callback('Internal error');
				} else {
					callback(data);
				}
			});
};

// to get single project data
exports.queryJiraProject = function(project, build, callback) {
	var credentials = new Buffer(username + ':' + password);
	var encryptedCredentials = credentials.toString('base64');

	var headers = {
		'Authorization' : 'Basic ' + encryptedCredentials,
		'Content-Type' : 'application/json'
	};

	var jiraData = devopsHttpClient.performRequestJIRA(host, port,
			'/rest/api/2/search?maxResults=2000&jql=project=' + project, 'GET',
			headers, function(err, data) {
				if (err) {
					callback('Internal error');
				} else {
					callback(data);
				}
			});
};

exports.queryJira = function(project, build, callback) {

	var b = new Buffer(username + ':' + password);
	var s = b.toString('base64');

	var headers = {
		'Authorization' : 'Basic ' + s,
		'Content-Type' : 'application/json'
	};

	var jiraData = devopsHttpClient.performRequestJIRA(host, port,
			'/rest/api/2/search?maxResults=2000&jql=project=' + project, 'GET',
			headers, function(res, data) {
				callback(data);
			});
	return jiraData;
};

exports.createJIRAVersion = function(url, method, metrics, callback) {

	var b = new Buffer(username + ':' + password);
	var s = b.toString('base64');
	for ( var i = 40; i < 41; i++) {
		metrics = {
			'description' : i,
			'name' : i,
			'project' : 'DevOps'
		};
		var headers = {
			'Authorization' : 'Basic ' + s,
			'Content-Type' : 'application/json'
		};
		console.log('createJIRAVersion');
		devopsHttpClient.performRequestJIRA(host, port, url, method, headers,
				metrics, callback);
	}
};
