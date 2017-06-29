var httpClient = require('./commonRestClient');
var property = require('../property');
var host = property.config.host;
var jenkinsPort = property.config.jenkinsPort;
var username = 'admin';
var password = 'admin';

// The below script will execute every 10 minutes in order to check if a new
// project is created in jenkins.
/*
 * module.exports.queryJenkins = function(returnData) {
 * 
 * httpClient.performRestRequest(host, jenkinsPort, '/api/json', 'GET', { depth :
 * 2, pretty : false }, function(data) { returnData(data); }); };
 */

module.exports.queryJenkinsProject = function(project, build, callback) {
	httpClient.performRestRequest(host, jenkinsPort, '/job/' + project + '/'
			+ build + '/api/json', 'GET', {
		depth : 2,
		pretty : false
	}, function(err, data) {
		if (err) {
			callback('Internal error');
		} else {
			callback(data);
		}
	});
};

module.exports.queryJenkinsAllProjects = function(callback) {
	httpClient.performRestRequest(host, jenkinsPort, '/api/json', 'GET', {
		depth : 2,
		pretty : false
	}, function(err, data) {
		if (err) {
			callback('Internal error');
		} else {
			callback(data);
		}
	});
};

// [5:29:54 PM] Amandeep singh:

	exports.queryJenkinsJob = function (url, depth) {
    var jenkinsJobData = performRequestOld(host, jenkinsPort,'/' + url, 'GET', {
        depth: depth//,
        //pretty: true
    }, function(data) {
        //sessionId = data.result.id;
        //console.log('Logged in:', sessionId);
        //console.log('data = ' + data);
        //return data;
    });
    return jenkinsJobData;
};

exports.performRequestOld = function (host, jenkinsPort, endpoint, method, data, success) {
    var dataString = querystring.stringify(data);

    var headers = {};

    if (method == 'GET') {
        endpoint += '?' + querystring.stringify(data);
    }
    else {
        headers = {
            'Content-Type': 'application/json',
            'Content-Length': dataString.length
        };
    }
    var options = {
        host: host,
        port: jenkinsPort,
        path: endpoint,
        method: method,
        headers: headers
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
            success(responseObject);
        });
        res.on('error', function() {

            responseObject = JSON.parse(responseString);
            success(responseObject);
        });
    });
    req.write(dataString);
    req.end();
};


