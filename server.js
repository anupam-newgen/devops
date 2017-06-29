// variables
var querystring = require('./node_modules/querystring');
var http = require('http');
//var builds = require('./integration/builds');
var express = require('./node_modules/express');
var jenkinsClient = require('./modules/jenkins');
var jiraClient = require('./modules/Jira');
var commonDBClient = require('./modules/commonDBClient');
var sonarClient = require('./modules/sonar');
var svnClient = require('./modules/SVN');
var projects = require('./integration/projects');
var users = require('./integration/users');
var builds = require('./integration/builds');
var CronJob = require('./node_modules/cron').CronJob;
var _ = require('./node_modules/underscore');
var commonUtils = require('./modules/commonUtils');
// var angular=require('./node_modules/angular');
var fs = require('fs');
var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
// var http = require ('http'); // For serving a basic web page.
var mongoose = require("mongoose");
var express = require('./node_modules/express'), cons = require('consolidate'), swig = require('swig');
var secret = "1231";
var app = express();
var jenkinsFlag = false, sonarFlag = false, jiraFlag = false;
var jenkinsData, sonarData, jiraData;
var token;
var uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL
		|| 'mongodb://127.0.0.1/node';
var masterData = {
	jenkins : "jenkins Data",
	jira : "jira data",
	sonar : "sonar data",
	timestamp : "timestamp"
};
var finalData;
var app = express();

//Middleware: Allows cross-domain requests (CORS)

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}

 
// Configure an express app
app.configure(function() {
	app.set('port', process.env.PORT || 8888);
	app.engine('html', cons.swig);
	app.use(express(__dirname));
	//app.set('view engine', 'html');
	// app.set('views', __dirname+ "/views");
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.favicon());
	app.use(allowCrossDomain);
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
});

app.use(express.json()); // parses json data
app.use(express.urlencoded()); // parses url-encoded data
// functions
var render = function(resource, callback) {
	// resource = name of resource (i.e. index, site.min, jquery.min)
	console.log(__dirname);
	fs.readFile(__dirname + "/" + resource, function(err, file) {
		if (err)
			return false; // Do something with the error....
		header_type = ""; // Do some checking to find out what header type you
		// must send.
		data = file;
		callback(data);
	});
};

function insert(collection, response) {
	if (jenkinsFlag && sonarFlag && jiraFlag) {
		masterData.jenkins = jenkinsData;
		masterData.sonar = sonarData;
		masterData.jira = jiraData;
		masterData.timestamp = new Date().valueOf();
		response.end(JSON.stringify(masterData));
		commonDBClient.insertIntoDB(collection, masterData);
	}
}
function authenticateUser(reqToken) {
	if (!(reqToken == token)) {

		res.send(401, 'Wrong user or password');
		console.log('bad username or password');
		return false;
	} else {
		console.log("authentication successful");
		return true;

	}
	var profile = {
		first_name : 'Ayushi',
		last_name : 'Garg',
		email : 'ayushi.garg@newgen.co.in',
		id : 123
	};

	// We are sending the profile inside the token
	var token = jwt.sign(profile, secret, {
		expiresInMinutes : 60 * 5
	});

	res.json({
		token : token
	});
}

// routes
app.get('/complete', function(request, response) {
	var reqToken = request.param('token');
	console.log("hi" + reqToken);
	if (!authenticateUser(reqToken)) {
		res.render('login');
	} else {
		jenkinsFlag = false, sonarFlag = false, jiraFlag = false;
		response.write("retrieving data...");
		jenkinsClient.queryJenkinsAllProjects(function(data) {
			response.write("Jenkins data retreived" + data);
			jenkinsFlag = true;
			jenkinsData = data;
			insert('master', response);

		});

		jiraClient.queryJiraAllProjects(function(data) {
			response.write("Jira data retreived" + data);
			jiraFlag = true;
			jiraData = data;
			insert('master', response);
		});

		sonarClient.querySonarAllProjects(function(data) {
			response.write("Sonar data retreived" + data);
			sonarFlag = true;
			sonarData = data;
			insert('master', response);
		});
	}
});

app.get('/particular', function(request, response) {
	// project details hard coded for now
	var reqToken = request.param('token');
	console.log("hi" + reqToken);
	if (!authenticateUser(reqToken)) {
		res.render('login');
	} else {
		var project = 'devops';
		var build = '1';
		jenkinsFlag = false, sonarFlag = false, jiraFlag = false;
		response.write("retrieving data...");
		jenkinsClient.queryJenkinsProject(project, build, function(data) {
			response.write("Jenkins data retreived" + data);
			jenkinsFlag = true;
			jenkinsData = data;
			insert(project, response);
		});

		jiraClient.queryJiraProject(project, build, function(data) {
			response.write("Jira data retreived" + data);
			jiraFlag = true;
			jiraData = data;
			insert(project, response);
		});

		sonarClient.querySonarProject(project, build, function(data) {
			response.write("Sonar data retreived" + data);
			sonarFlag = true;
			sonarData = data;
			insert(project, response);
		});
	}

});

app.get('/insertIntegrated', function(request, response) {
	var reqToken = request.param('token');
	console.log("hi" + reqToken);
	if (!authenticateUser(reqToken)) {
		res.render('login');
	} else {
		response.write("retrieving data...");
		var startDate = new Date(2015, 01, 04, 10);
		commonDBClient.getTimestampData('master', startDate.valueOf(),
				function(data) {
					var masterData = data;
					var integratedData = commonUtils.integrate(masterData,
							startDate.valueOf());
					commonDBClient.insertIntoDB('integrated', integratedData);
					response.write("data retreived" + integratedData);
				});

		var endDate = new Date(2015, 01, 04, 17);
		commonDBClient.getTimestampData('master', endDate.valueOf(), function(
				data) {
			var masterData = data;
			var integratedData = commonUtils.integrate(masterData, endDate
					.valueOf());
			commonDBClient.insertIntoDB('integrated', integratedData);
			response.write("data retreived" + integratedData);
		});
		response.end("Done Integration");
	}
});
// add project information for SVN into database
app.get('/insertProject', function(request, response) {
	var reqToken = request.param('token');
	var startDate = new Date(2015, 01, 04, 10);
	commonDBClient.getDataLatest('master', function(data) {
		var masterData = data;
		var projectData = commonUtils.getProjects(masterData);
		response.end("data retrieved" + JSON.stringify(projectData));
	});
});
// generate the project hierarchy

/****************Working****************/

app.get('/devops/rest/api/v1.0/projects', function(request, response) {
	var reqToken = request.param('token');
	projects.getProjectHierarchy(function(data){
		response.end(JSON.stringify(data));
	});
});

/**************Get Project Effort -- Not working(Extra function)*********/
app.get('/devops/rest/api/v1.0/projects/getProjectEffort', function(request, response) {
	var reqToken = request.param('token');
	console.log("hi" + reqToken);
	if (!authenticateUser(reqToken)) {
		res.render('login');
	} else {
		projects.calculateProjectEffort(function(data){
			response.end(JSON.stringify(data));
		});
	}
});

// Calculate User Efforts in all Projects
app.get('/getUserEffort', function(request, response) {
	var reqToken = request.param('token');
	console.log("hi" + reqToken);
	if (!authenticateUser(reqToken)) {
		res.render('login');
	} else {
		var startDate = new Date(2015, 01, 04, 10);
		var endDate = new Date(2015, 01, 04, 17);
		commonDBClient.getTimestampData('master', startDate.valueOf(),
				function(initialData) {
					if (initialData) {
						commonDBClient.getTimestampData('master', endDate
								.valueOf(), function(finalData) {
							commonUtils.calculateUserEffort(initialData,
									finalData);
						});
					} else
						console.log('data not found' + data);
				});
		response.end("Done getUserEffort");
	}
});

// Calculate User Efforts ProjectWise
app.get('/getUserEffortProjectWise', function(request, response) {
	var reqToken = request.body.token;
	console.log("hi " + reqToken);
	if (!authenticateUser(reqToken)) {
		res.render('login');
	} else {
		var startDate = new Date(2015, 01, 04, 10);
		var endDate = new Date(2015, 01, 04, 17);
		commonDBClient.getTimestampData('integrated', startDate.valueOf(),
				function(initialData) {
					if (initialData) {
						commonDBClient.getTimestampData('integrated', endDate
								.valueOf(), function(finalData) {
							commonUtils.calculateUserEffortProjectWise(
									initialData, finalData);
						});
					} else
						console.log('data not found' + data);
				});
		response.end("Done getUserEffortProjectWise");
	}
});

// index page
app.get('/index', function(req, res) {
	commonDBClient.getData("projectEffort", function(data) {
		commonDBClient.getDataLatest("userEffort", function(data1) {
			res.render('pages/index', {
				json : '',
				userjson : data1.users
			});
		});
	});
});

// about page
app.get('/about', function(req, res) {
	res.render('pages/about');
});
app.get('/loginPage', function(req, res) {
	res.render('login');
});
app.get('/hello', function(req, res) {
	res.render('hello');
});
app.get('/errorAuthenticate', function(req, res) {
	res.render('errorAuthenticate');
});
app.get('/api/restricted', function(req, res) {
	console.log('user ' + req.user.email + ' is calling /api/restricted');
	res.json({
		name : 'ayushi'
	});

});
app.get('/AngularClient', function(req, res) {
	render('AngularClient.js', function(data) {
		res.end(data);
	});
});
app.get('/loginForm', function(req, res) {
	res.render('loginForm');
});
app.get('/token', function(req, res) {
	res.render('token');
});
app.post('/authenticate', function(req, res) {
	// TODO validate req.body.username and req.body.password
	// if is invalid, return 401
	if (!(req.body.username === 'a' && req.body.password === '1')) {
		res.send(401, 'Wrong user or password');
		console.log('bad username or password');
		return;
	} else {
		console.log("authentication successful");

	}
	var profile = {
		first_name : 'Ayushi',
		last_name : 'Garg',
		email : 'ayushi.garg@newgen.co.in',
		id : 123
	};
	
	/***********************Need to Check***************/
	
	app.post('/jenkins', function (request, response) { //http://localhost:8888/

	    var body = request.body;
	    var url = body.build.url;

	    response.send("ok");
	    var endpoint = url + 'api/json';
	    console.log(endpoint);
	    //login();
	    //loginWithURL(endpoint);
	    jenkinsClient.queryJenkinsJob(endpoint, 0);
	});
	
/*****************************************************/
	
	// We are sending the profile inside the token
	token = jwt.sign(profile, secret, {
		expiresInMinutes : 60 * 5
	});

	res.json({
		token : token
	});

});

// start
mongoose.connect(uristring, function(err, res) {
	if (err) {
		console.log('ERROR connecting to DB' + err);
	} else {
		console.log('Successfully connected to Mongoose DB ');
	}
});

// get team for a user

/************Working************/

app.get('/devops/rest/api/v1.0/teams/:userLoggedIn',
		function(request, response) {
			var userLoggedIn = request.param('userLoggedIn');
			console.log("user: " + userLoggedIn);
			   users.getTeam(userLoggedIn, function(data) {
				response.end(JSON.stringify(data));
			});

		});

// Gets the all the tasks for the project

/*********Working**********/

app.get('/devops/rest/api/v1.0/projects/:projectID/tasks', function(request, response) {
	var limit = request.param('limit');
	var offset = request.param('offset');
	var projectKey = request.param('projectID');
	projects.getIssueProjectWise(limit, offset, projectKey, function(data){
		response.end(JSON.stringify(data));
	});
});

// Gets the tasks for the user for a specific project

/*************Working**********/

app.get('/devops/rest/api/v1.0/projects/:projectID/users/:userID/tasks', function(request, response) {
	var limit = request.param('limit');
	var offset = request.param('offset');
	var projectKey = request.param('projectID');
	var userKey = request.param('userID');
	projects.getIssueProjectUserWise(limit, offset, projectKey, userKey, function(data){
		response.end(JSON.stringify(data));
	});
});

// Gets the team details visible to the user for the project selected

/****************Working***************/

app.get('/devops/rest/api/v1.0/projects/:projectID/team', function(request,	response) {
	var projectID = request.param("projectID");
	projects.getUserTeamForProject(projectID, function(data){
		response.end(JSON.stringify(data));
	});
});

// Gets the issues userWise
/********Working************/

app.get('/devops/rest/api/v1.0/users/:userID/task',
		function(request, response) {
	        var limit = request.param('limit');
         	var offset = request.param('offset');
         	var type = request.param('type');
			var userId = request.param('userID');
				users.getTaskUserWise(userId, type, limit, offset, function(data){
					 response.end(JSON.stringify(data));	
			});
		});
	

// get Build History

/************Working*************/

app.get('/devops/rest/api/v1.0/BuildHistory/:project', function(request,
		  response) {
		 var project = request.param('project');
		 builds.getBuildHistory(project, function(data){
		     response.end(JSON.stringify(data));
		 });
     });

/***************Working****************/

app.get('/devops/rest/api/v1.0/projects/jobs' , function(request , response){
	projects.calculateProjectsData(function(data){
		 response.end(JSON.stringify(data));
	});
});

/***************Working****************/

//projects details Build Json
app.get('/devops/rest/api/v1.0/projects/:projectID/tasks2', function(request, response) {
	var projectID = request.param('projectID');
	projects.calculateProjectDetails(projectID, function(data){
		response.end(JSON.stringify(data));
	});
});

/**************Working**************************/
/*Getting Revision Number from Jenkins*/
app.get('/devops/rest/api/v1.0/builds/revisions',function(request, response) {
		builds.getProjectBuildRevisions(function(data){
  		response.end(JSON.stringify(data));	
		});
});
/*************Working*********************/
/*Getting File Difference Data from SVN*/
app.get('/devops/rest/api/v1.0/builds/svn', function(request, response) {
	builds.getProjectData(function(data){
		response.end(JSON.stringify(data));
	});
});

/*****************doubtful**************/ 

app.get('/devops/rest/api/v1.0/svn11', function(request, response) {
	svnClient.getUpdatedCodeData(881,'/devops_node_1.1/modules/commonUtils.js',function(data){
		response.end(JSON.stringify(data));
	});
});

app.get('/devops/rest/api/v1.0/task/charts',function(request, response) {
	        var limit = request.param('limit');
         	var offset = request.param('offset');
			//var userID = request.param('userID');
				users.getTaskAllUserWiseCharts( limit, offset, function(data){
					 response.end(JSON.stringify(data));	
			});
});

 app.get('/devops/rest/api/v1.0/users/:userID/task/charts',function(request, response) {
	        var limit = request.param('limit');
         	var offset = request.param('offset');
			var userID = request.param('userID');
				users.getTaskUserWiseCharts(userID, limit, offset, function(data){
					 response.end(JSON.stringify(data));	
			});
});

 
/*************************Violation project wise***********************************************/
 
 app.get('/devops/rest/api/v1.0/sonar/violations',function(request, response) {
	  projects.getViolations(function(data){
	   response.end(JSON.stringify(data)); 
	    });
	});
 
 
 


app.listen(8888);
