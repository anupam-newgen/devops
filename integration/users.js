var commonDBClient = require('../modules/commonDBClient');
var commonUtils = require('../modules/commonUtils');
var _ = require('underscore');

// get projects for a user
function getUserProjects(user, callback) {

	var options = {
		name : user
	};

	// console.log('optioins'+JSON.stringify(options));
	commonDBClient.queryData('users', options, function(data) {
		console.log('data' + JSON.stringify(data));
		if (data != '')
			callback(data[0].projects);
		else
			callback('Invalid user')
	});
}

// get team for a user
module.exports.getTeam = function(user, callback) {
	getUserProjects(user, function(projects) {
		var options = {
			$or : []
		};
		_.each(projects, function(project) {
			options.$or.push({
				projectName : project.projectName
			});
		});
		// options = JSON.stringify(options) + ",{'projectName' : 1}";
		// console.log("options" + JSON.stringify(options));
		commonDBClient.queryData('projects', options, function(data) {
			console.log('data:' + JSON.stringify(data));
			var result = {
				user : user,
				team : []
			};
			var uniqueResult = {
				user : user,
				team : []
			};

			_.each(data, function(project) {
				var dummy = {
					project : project.projectName,
					team : []
				};
				_
						.each(project.team,
								function(team) {
									if (team.name.toLowerCase() != user
											.toLowerCase())
										dummy.team.push(team.name);
									if (uniqueResult.team.indexOf(team.name
											.toLowerCase()) == -1
											&& team.name.toLowerCase() != user
													.toLowerCase())
										uniqueResult.team.push(team.name
												.toLowerCase());
								});
				result.team.push(dummy);
			});

			console.log('result : ' + JSON.stringify(result));
			// callback(uniqueResult);
			callback(result);
		});
	});
};
// gets the Issues userWise
var getIssueUserWise = module.exports.getIssueUserWise = function(name, userId, type, limit, offset, callback) {
	commonDBClient.getDataLatest('master',function(data) {
						var result = [ {
							"user-id" : userId,
							"user-name" : name,
							"issueStatus" : {},
							"issueType" : {},
							"issues" : []
						} ];
						_.each(data.jira.issues,function(issue) {
											if ((type == "assigned")
													&& ((issue.fields.assignee != null ? issue.fields.assignee.name
															: '') == name)) {
												var dummy = {
													"name" : issue.key,
													"description" : issue.fields.description,
													"summary" : issue.fields.summary,
													"assigneeName" : (issue.fields.assignee != null ? issue.fields.assignee.name
															: ''),
													"creationDate" : issue.fields.created,
													"dueDate" : issue.fields.duedate,
													"issueType" : issue.fields.issuetype.name,
													"reporterName" : (issue.fields.reporter != null ? issue.fields.reporter.displayName
															: ''),
													"status" : issue.fields.status.name,
													"priority" : issue.fields.priority.name,
													"estimatedMinutes" : issue.fields.aggregatetimeoriginalestimate / 60,
													"remainingEstimateMinutes" : issue.fields.aggregatetimeestimate / 60
												};
												result[0].issues.push(dummy);
											} else if ((type == "raised")
													&& ((issue.fields.reporter != null ? issue.fields.reporter.displayName
															: '') == name)) {
												var dummy = {
													"name" : issue.key,
													"description" : issue.fields.description,
													"summary" : issue.fields.summary,
													"assigneeName" : (issue.fields.assignee != null ? issue.fields.assignee.name
															: ''),
													"creationDate" : issue.fields.created,
													"dueDate" : issue.fields.duedate,
													"issueType" : issue.fields.issuetype.name,
													"reporterName" : (issue.fields.reporter != null ? issue.fields.reporter.displayName
															: ''),
													"status" : issue.fields.status.name,
													"priority" : issue.fields.priority.name,
													"estimatedMinutes" : issue.fields.aggregatetimeoriginalestimate / 60,
													"remainingEstimateMinutes" : issue.fields.aggregatetimeestimate / 60
												};
												result[0].issues.push(dummy);
											}
										});
						offset = (offset == undefined ? '0' : offset);
						limit = (limit == undefined ? result[0].issues.length
								: limit);
						end = parseInt(limit) + parseInt(offset);
						result[0].issues = result[0].issues.slice(offset, end);
						_.each(result[0].issues, function(issue) {
							var bugStatus = issue.status;
							if (result[0].issueStatus[bugStatus] == undefined) {
								result[0].issueStatus[bugStatus] = 1;
							} else {
								result[0].issueStatus[bugStatus]++;
							}
							var bugtype = issue.issueType;
							if (result[0].issueType[bugtype] == undefined) {
								result[0].issueType[bugtype] = 1;
							} else {
								result[0].issueType[bugtype]++;
							}
						});
						callback(result);
					});
}

module.exports.getTaskUserWise = function(userId, type, limit, offset, callback) {
	commonUtils.getUserNameFromKey(userId, function(error, name) {
		if (error) {
			callback(name);
		} else {
			getIssueUserWise(name, userId, type, limit, offset, function(data) {
				callback(data);
			});
		}
	});

};

//projects from jira

module.exports.getTaskAllUserWiseCharts = function(limit, offset, callback) {
			module.exports.getIssueAllUserWiseCharts( limit, offset, function(data) {
				callback(data);
			});
};

module.exports.getIssueAllUserWiseCharts = function( limit, offset, callback) {
	var dummy = {
			//"userName": userName,
			"projects": [],
			"Closed": [],
			"Resolved": [],
			"Opened": [],
			"Reopened": [],
			"InProgress": []
	}
	commonDBClient.getDataLatest('master',function(data){
		_.each(data.jira.issues, function(issue){
		
				if(dummy.projects.indexOf(issue.fields.project.name) == -1){
					dummy.projects.push(issue.fields.project.name);
					dummy.Closed.push(0);
					dummy.Resolved.push(0);
					dummy.Opened.push(0);
					dummy.Reopened.push(0);
					dummy.InProgress.push(0);
				}
				if((issue.fields.status.name == "Resolved") || (issue.fields.status.name == "Done")){
					dummy.Resolved[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
				if (issue.fields.status.name == "Open" || issue.fields.status.name == "New"
				    || issue.fields.status.name == "Deferred"
				        || issue.fields.status.name == "To Do"){
					dummy.Opened[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
				if(issue.fields.status.name == "In Progress"){
					dummy.InProgress[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
				if(issue.fields.status.name == "Closed"){
					dummy.Closed[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
				if(issue.fields.status.name == "Reopened"){
					dummy.Reopened[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
			
		});
		callback(dummy);
	});
} 


//jenkins jobs

/*module.exports.getIssueUserWiseCharts = function( limit, offset, callback) {
	var dummy = {
			//"userName": userName,
			"projects": [],
			"Closed": [],
			"Resolved": [],
			"Opened": [],
			"Reopened": [],
			"InProgress": []
	}
	commonDBClient.getDataLatest('master',function(data){
		_.each(data.jenkins.jobs, function(job){
			_.each(data.jira.issues, function(issue){ 
				if(dummy.projects.indexOf(job.displayName) == -1){
			//	if(job.displayName == issue.fields.project.name){
					dummy.projects.push(job.displayName);
					dummy.Closed.push(0);
					dummy.Resolved.push(0);
					dummy.Opened.push(0);
					dummy.Reopened.push(0);
					dummy.InProgress.push(0);
				//		}
				}
				if((issue.fields.status.name == "Resolved") || (issue.fields.status.name == "Done")){
					dummy.Resolved[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
				if (issue.fields.status.name == "Open" || issue.fields.status.name == "New"
				    || issue.fields.status.name == "Deferred"
				        || issue.fields.status.name == "To Do"){
					dummy.Opened[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
				if(issue.fields.status.name == "In Progress"){
					dummy.InProgress[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
				if(issue.fields.status.name == "Closed"){
					dummy.Closed[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
				if(issue.fields.status.name == "Reopened"){
					dummy.Reopened[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
			
		});
	});
		callback(dummy);
	});
}
*/

 module.exports.getTaskUserWiseCharts = function(userID, limit, offset, callback) {
	commonUtils.getUserNameFromKey(userID, function(error, userName) {
		if (error) {
			callback(userName);
		} else {
			module.exports.getIssueUserWiseCharts(userName, limit, offset, function(data) {
				callback(data);
			});
		}
	});
};

module.exports.getIssueUserWiseCharts = function(userName, limit, offset, callback) {
	var dummy = {
			"userName": userName,
			"projects": [],
			"Closed": [],
			"Resolved": [],
			"Opened": [],
			"Reopened": [],
			"InProgress": []
	}
	commonDBClient.getDataLatest('master',function(data){
		_.each(data.jira.issues, function(issue){
			if(((issue.fields.assignee != null ? issue.fields.assignee.name: '') == userName) || ((issue.fields.reporter != null ? issue.fields.reporter.displayName: '') == userName)){
				if(dummy.projects.indexOf(issue.fields.project.name) == -1){
					dummy.projects.push(issue.fields.project.name);
					dummy.Closed.push(0);
					dummy.Resolved.push(0);
					dummy.Opened.push(0);
					dummy.Reopened.push(0);
					dummy.InProgress.push(0);
				}
				if((issue.fields.status.name == "Resolved") || (issue.fields.status.name == "Done")){
					dummy.Resolved[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
				if (issue.fields.status.name == "Open" || issue.fields.status.name == "New"
				    || issue.fields.status.name == "Deferred"
				        || issue.fields.status.name == "To Do"){
					dummy.Opened[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
				if(issue.fields.status.name == "In Progress"){
					dummy.InProgress[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
				if(issue.fields.status.name == "Closed"){
					dummy.Closed[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
				if(issue.fields.status.name == "Reopened"){
					dummy.Reopened[dummy.projects.indexOf(issue.fields.project.name)]++;
				}
			}
		});
		callback(dummy);
	});
} 