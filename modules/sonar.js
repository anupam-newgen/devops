var httpClient = require('./commonRestClient');
var property = require('../property');
var host = property.config.host;
var sonarPort = property.config.sonarPort;
var username = 'admin';
var password = 'admin';

module.exports.querySonarAllProjects = function(callback) {
	httpClient
			.performRestRequest(
					host,
					sonarPort,
					'/api/resources',
					'GET',
					{
						metrics : 'violations,blocker_violations,critical_violations,major_violations,minor_violations,info_violations,sqale_index,line_coverage,tests,test_execution_time,test_failures,coverage,lines,skipped_tests',
						format : 'json'
					}, function(err, data) {
						if (err) {
							callback('internal error');
						} else {
							callback(data);
						}
					});
};

module.exports.querySonarProject = function(project, build, callback) {
	httpClient
			.performRestRequest(
					host,
					sonarPort,
					'/api/resources',
					'GET',
					{
						metrics : 'violations,blocker_violations,critical_violations,major_violations,minor_violations,info_violations,sqale_index,line_coverage',
						format : 'json'
					}, function(err, data) {
						if (err) {
							callback('internal error');
						} else {
							callback(data);
						}
					});
};