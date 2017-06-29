var _ = require('underscore');
var commonDBClient = require('./commonDBClient');
var mongoose = require('mongoose');
var schema = require('../schemaSVN');
/*var uristring =
	process.env.MONGOLAB_URI ||
	process.env.MONGOHQ_URL ||
	'mongodb://192.168.56.57/node';
mongoose.connect(uristring, function (err, res) {
	  if (err) {
	  console.log ('ERROR connecting to: ' + uristring + '. ' + err);
	  } else {
	  console.log ('Succeeded connected to: ' + uristring);
	  }
	});
*/
module.exports.integrate = function(masterData, timestamp) {

    var integratedData = {
        devops: [],
        timestamp: timestamp
    };

    _.each(masterData.jenkins.jobs, function(job) {
        var dummy = {
            "project": job.displayName
        };
        var jenkinsData = job;
        var sonarData = module.exports.getSonarData(masterData.sonar,
            job.displayName);
        var jiraData = module.exports.getJiraData(masterData.jira,
            job.displayName);
        var latestBuild = job.lastBuild;
        _.extend(dummy, {
            "jenkins": jenkinsData,
            "sonar": sonarData,
            "jira": jiraData,
            "latestBuild": latestBuild,
        });
        integratedData.devops.push(dummy);
    });
    return integratedData;
};
var listItem= mongoose.model('demo', schema.projectSVNSchema);
module.exports.getProjects = function(integratedData)
{
	var projects = {
			project: [],
	};
	_.each(integratedData.jenkins.jobs,function(job){
		console.log("job:"+ job.displayName);
		var dummy = new listItem({
			projectName : job.displayName,
			projectStartDate: new Date,
			projectEndDate: [new Date],
			language: "",
			cQuality:{
				cqProjectName : job.displayName,
				cqProjectKey : job.displayName,
				projectType : '',
				username : 'admin',
				password : 'admin',
				host : '192.168.54.31',
				port : '9000'
			},
			cDefect: {
				cdProjectName : job.displayName,
				cdProjectKey : job.displayName,
				projectType : '',
				username : 'satpal.singh',
				password : 'newgen',
				host : '192.168.54.31',
				port : '8100'
			},
			cIntegration: {
				ciProjectName : job.displayName,
				ciProjectKey : job.displayName,
				projectType : '',
				username : '',
				password : '',
				host : '192.168.54.31',
				port : '8080'
			},
			cSource: {
				csProjectName : job.displayName,
				csProjectKey : job.displayName,
				projectType : '',
				username : 'admin',
				password : 'admin',
				host : '192.168.54.31',
				port : ''
			},
			team: [ 
			       {name : 'DevLead',
			      role :'',
			      environment : ''},
			    {name : 'DevUser1',
			      role :'',
			      environment : ''},
			    {name : 'DevUser2',
			      role :'',
			      environment : ''},
			       {name : 'configmngr',
			            role :'',
			            environment : ''},
			          {name : 'mgruser',
			         role :'',
			         environment : ''},
			       {name : 'QaMangr',
			      role :'',
			      environment : ''},
			    {name : 'DirUser',
			      role :'',
			      environment : ''}
			    ],
				server: {
				environment :'',
				serverName : '',
				serverType : '',
			}
				
				});
		projects.project.push(dummy);
		console.log("dummy data:"+dummy);
		dummy.save(function (err) {
			if (err)
			{
				console.log ('Error on save!');
			}
		});
	});
	
	return projects;
}

// Sonar Data
module.exports.getSonarData = function(sonarData, project) {
    var sonar = _.select(sonarData, function(data) {
        return data.name === project;
    });
    return sonar;
};

// Jira Data
module.exports.getJiraData = function(jiraData, project) {
    var jira = _.select(jiraData.issues, function(issue) {
        return issue.fields.project.name.toUpperCase() === project.toUpperCase();
    });
    return jira;
};

// Calculate Project Effort in a week
module.exports.calculateProjectEffort = function(initialData, finalData, callback) {
    var effort = {
        effort: []
    };
    _.each(finalData.devops, function(project) {
        var dummy = {
            "project": project.project
        };
        var totaleffort = 0;
        var finalIssues = _.select(project.jira, function(issue) {
            return (issue.fields.status.name === "Resolved" || issue.fields.status.name === "Closed" || issue.fields.status.name === "Reopened");
        });
        var finalIssueCount = finalIssues.length;
        _.each(finalIssues, function(issue) {
            var effortPerIssue = issue.fields.timeoriginalestimate == null ? 28800 : issue.fields.timeoriginalestimate;
            totaleffort += effortPerIssue;
        });
        _.extend(dummy, {
            "finalEffort": totaleffort,
            "finalIssueCount": finalIssueCount
        });
        effort.effort.push(dummy);
    });
    _.each(initialData.devops, function(project, i) {
        var totaleffort = 0;
        var initialIssues = _.select(project.jira, function(issue) {
            return (issue.fields.status.name === "Resolved" || issue.fields.status.name === "Closed" || issue.fields.status.name === "Reopened");
        });
        var initialIssueCount = initialIssues.length;
        _.each(initialIssues, function(issue) {
            var effortPerIssue = issue.fields.timeoriginalestimate == null ? 28800 : issue.fields.timeoriginalestimate;
            totaleffort += effortPerIssue;
        });
        _.each(effort.effort, function(effort) {
            if (effort.project == project.project) {
                _.extend(effort, {
                    "initialEffort": totaleffort,
                    "initialIssueCount": initialIssueCount,
                    "deltaIssues": effort.finalIssueCount - initialIssueCount,
                    "effort": effort.finalEffort - totaleffort
                });
            }
        });
    });
    callback(effort);
};

//Calculate User Efforts in all Projects
module.exports.calculateUserEffort = function(initialData, finalData) {
    var users = module.exports.getUsers(finalData); // Returns a JSON structure with user names
    var finalEffort = module.exports.getUserEffort(users, initialData, finalData); // Populate the JSON structure with real Data
    commonDBClient.insertIntoDB('userEffort', finalEffort);
};

module.exports.getUsers = function(masterData) {
    var assignees = [];
    _.each(masterData.jira.issues, function(issue, i) {
        if (issue.fields.assignee != null && (assignees.length === 0 || assignees.indexOf(issue.fields.assignee.name) === -1)) {
            assignees.push(issue.fields.assignee.name);
        }
    });
    var users = {
        users: []
    };
    _.each(assignees, function(assignee) {
        var dummy = {
            name: assignee,
            initialEffort: 0,
            initialCountOfIssues: 0,
            finalCountOfIssues: 0,
            deltaIssues: 0,
            finalEffort: 0,
            resolvedIssuesCount: 0,
            effort: 0
        };
        users.users.push(dummy);
    });
    return users;
};

module.exports.getUserEffort = function(effort, initialData, finalData) {
    _.each(initialData.jira.issues, function(issue) {
        if (issue.fields.status.name == "Resolved" || issue.fields.status.name == "Reopened" || issue.fields.status.name == "Closed") {
            _.each(effort.users, function(user) {
                if (issue.fields.assignee != null && issue.fields.assignee.name == user.name) {
                    var effortPerIssue = issue.fields.timeoriginalestimate == null ? 28800 : issue.fields.timeoriginalestimate;
                    user.initialEffort += effortPerIssue;
                    user.initialCountOfIssues++;
                }
            });
        }
    });
    _.each(finalData.jira.issues, function(issue) {
        if (issue.fields.status.name == "Resolved" || issue.fields.status.name == "Reopened" || issue.fields.status.name == "Closed") {
            _.each(effort.users, function(user) {
                if (issue.fields.assignee != null && issue.fields.assignee.name == user.name) {
                    var effortPerIssue = issue.fields.timeoriginalestimate == null ? 28800 : issue.fields.timeoriginalestimate;
                    user.finalEffort += effortPerIssue;
                    user.finalCountOfIssues++;
                }
                user.resolvedIssuesCount = module.exports.getResolvedIssuesCountThisWeek(issue, user);
            });
        }
    });
    _.each(effort.users, function(user) {
        user.effort = user.finalEffort - user.initialEffort;
        user.deltaIssues = user.finalCountOfIssues - user.initialCountOfIssues;
    });
    return effort;
};

// Calculate User Efforts ProjectWise
module.exports.calculateUserEffortProjectWise = function(initialData, finalData) {
    var projectEffort = module.exports.getUsersProjectWise(finalData); // Returns a JSON structure with user names
    var finalEffort = module.exports.getUserEffortProjectWise(projectEffort, initialData, finalData); // Populate the JSON structure with real Data
    commonDBClient.insertIntoDB('userEffortProjectWise', finalEffort);
};

module.exports.getUsersProjectWise = function(integratedData) {
    var projectEffort = {
        effort: []
    };
    _.each(integratedData.devops, function(project) {
        var dummy = {
            projectName: project.project,
            users: []
        };
        projectEffort.effort.push(dummy);
    });

    _.each(projectEffort.effort, function(project) {
        var assignees = [];
        var currentProject = _.filter(integratedData.devops, function(integratedproject) {
            return integratedproject.project == project.projectName;
        });
        _.each(currentProject[0].jira, function(issue, i) {
            if (issue.fields.assignee != null && (assignees.length === 0 || assignees.indexOf(issue.fields.assignee.name) === -1)) {
                assignees.push(issue.fields.assignee.name);
            }

        });

        _.each(assignees, function(assignee) {
            var dummy = {
                name: assignee,
                initialEffort: 0,
                initialCountOfIssues: 0,
                finalCountOfIssues: 0,
                deltaIssues: 0,
                finalEffort: 0,
                resolvedIssuesCount: 0,
                effort: 0,
                loggedHours:0,
                originalEstimate:0,
                actual:0,
                assignedIssuesCount: 0,
                assignedIssuesWeekStart: 0,
                deltaAssigned: 0,
                assignedIssuesWeekEnd: 0
            };
            project.users.push(dummy);
        });
    });
    return projectEffort;
};

module.exports.getUserEffortProjectWise = function(projectEffort, initialData, finalData) {
    _.each(projectEffort.effort, function(project, i) {
        var currentProject = _.filter(initialData.devops, function(integratedproject) {
            return integratedproject.project == project.projectName;
        });
        _.each(currentProject[0].jira, function(issue) {
            if (issue.fields.status.name == "Resolved" || issue.fields.status.name == "Reopened" || issue.fields.status.name == "Closed") {
                _.each(project.users, function(user) {

                    if (issue.fields.assignee != null && issue.fields.assignee.name == user.name) {
                        user.assignedIssuesWeekStart++;
                        var effortPerIssue = issue.fields.timeoriginalestimate == null ? 28800 : issue.fields.timeoriginalestimate;
                        user.initialEffort += effortPerIssue;
                        user.initialCountOfIssues++;
                        user.originalEstimate=issue.fields.aggregatetimeoriginalestimate;
                        user.actual=issue.fields.aggregatetimeestimate;
                        user.loggedHours=issue.fields.aggregatetimeoriginalestimate-issue.fields.aggregatetimeestimate;
                    }
                });
            }
        });
        var currentProject1 = _.filter(finalData.devops, function(integratedproject) {
            return integratedproject.project == project.projectName;
        });
        _.each(currentProject1[0].jira, function(issue) {
            if (issue.fields.status.name == "Resolved" || issue.fields.status.name == "Reopened" || issue.fields.status.name == "Closed") {
                _.each(project.users, function(user) {
                    if (issue.fields.assignee != null && issue.fields.assignee.name == user.name) {
                        user.assignedIssuesWeekEnd++;
                        var effortPerIssue = issue.fields.timeoriginalestimate == null ? 28800 : issue.fields.timeoriginalestimate;
                        user.finalEffort += effortPerIssue;
                        user.finalCountOfIssues++;
                    }
                    user.resolvedIssuesCount = module.exports.getResolvedIssuesCountThisWeek(issue, user);
                });
            }
        });
        _.each(project.users, function(user) {
            user.effort = user.finalEffort - user.initialEffort;
            user.deltaIssues = user.finalCountOfIssues - user.initialCountOfIssues;
            user.deltaAssigned = user.assignedIssuesWeekEnd - user.assignedIssuesWeekStart;
            user.assignedIssuesCount = user.deltaAssigned + user.assignedIssuesWeekStart + user.resolvedIssuesCount;
        });

    });
    return projectEffort;
};

module.exports.getResolvedIssuesCountThisWeek = function(issue, user) {
    var today = new Date;
    var weekStart = new Date;
    var weekEnd = new Date;
    var weekStartDay = (today.getDate() - today.getDay()) - 7;
    var weekEndDay = weekStartDay + 6;
    weekStartTimeStamp = weekStart.setDate(weekStartDay).valueOf();
    weekEndTimeStamp = weekEnd.setDate(weekEndDay).valueOf();
    if (issue.fields.resolutiondate >= weekStartTimeStamp && issue.fields.resolutiondate <= weekEndTimeStamp) {
        user.resolvedIssuesCount++;
    }
    return user.resolvedIssuesCount;
}

// project name from key
module.exports.getProjectNameFromKey = function(key, callback){
	 commonDBClient.getData('users', function(data){
		 var x = true;
		 _.each(data, function(user) {
			 _.each(user.projects, function(project) {
				 if(project.projectUID == key){
					 x= false;
					 callback(false, project.projectName);
				 }
			 });
		 });
		 if(x){
			 callback(true, 'Error - Project Not Found'); 
		 }
	 });
}

// user name from key
module.exports.getUserNameFromKey = function(key, callback){
	 commonDBClient.getData('users', function(data){
		 var x = true;
		 _.each(data, function(user) {
			 if(user.userId == key){
				 x= false;
				 callback(false, user.name);
			 }01
		 });
		 if(x){
			 callback(true, 'Error - User Not Found'); 
		 }
	 });
}

// Issues project Wise
module.exports.getIssueProjectWise = function(projectName, projectKey, limit, offset, callback){
	commonDBClient.getDataLatest('master', function(data){
		var result = [{
			"project-key" :projectKey,
			"project-name" :projectName,
			"issueStatus" : {},
			"issueType" : {},
			"issues": []
		}];   
		_.each(data.jira.issues, function(issue){
			if(issue.fields.project.name == projectName){
				var dummy = {
						"name" :issue.key,
						"description" :issue.fields.description,
						"summary" :issue.fields.summary,
						"assigneeName" :(issue.fields.assignee != null ? issue.fields.assignee.name : ''),
						"creationDate" :issue.fields.created,
						"dueDate" :issue.fields.duedate,
						"issueType" :issue.fields.issuetype.name,
						"reporterName" :issue.fields.reporter.displayName,
						"status" :issue.fields.status.name,
						"priority" :issue.fields.priority.name,
						"estimatedMinutes" :issue.fields.aggregatetimeoriginalestimate/60,
						"remainingEstimateMinutes" :issue.fields.aggregatetimeestimate/60
				};
				result[0].issues.push(dummy);
			}			
		});
		offset = ( offset == undefined ? '0' : offset);
		limit = ( limit == undefined ? result[0].issues.length : limit);
		end = parseInt(limit)+parseInt(offset);
		result[0].issues = result[0].issues.slice(offset, end);
		_.each(result[0].issues, function(issue){
			var bugStatus = issue.status;
			if (result[0].issueStatus[bugStatus] == undefined){
				result[0].issueStatus[bugStatus] = 1;
			} else {
				result[0].issueStatus[bugStatus]++;
			}
			var bugtype = issue.issueType;
			if (result[0].issueType[bugtype] == undefined){
				result[0].issueType[bugtype] = 1;
			} else {
				result[0].issueType[bugtype]++;
			}
		});
		callback(result);
	});
}

// Issues project-user Wise
module.exports.getIssueProjectUserWise = function(projectName, projectKey, userName, limit, offset, callback){
	commonDBClient.getDataLatest('master', function(data){
		var result = [{
			"project-key" :projectKey,
			"project-name" :projectName,
			"issueStatus" : {},
			"issueType" : {},
			"issues": []
		}];   
		_.each(data.jira.issues, function(issue){
			if(issue.fields.project.name == projectName && issue.fields.assignee.name == userName){
				var dummy = {
						"name" :issue.key,
						"description" :issue.fields.description,
						"summary" :issue.fields.summary,
						"assigneeName" :(issue.fields.assignee != null ? issue.fields.assignee.name : ''),
						"creationDate" :issue.fields.created,
						"dueDate" :issue.fields.duedate,
						"issueType" :issue.fields.issuetype.name,
						"reporterName" :issue.fields.reporter.displayName,
						"status" :issue.fields.status.name,
						"priority" :issue.fields.priority.name,
						"estimatedMinutes" :issue.fields.aggregatetimeoriginalestimate/60,
						"remainingEstimateMinutes" :issue.fields.aggregatetimeestimate/60
				};
				result[0].issues.push(dummy);
			}			
		});
		offset = ( offset == undefined ? '0' : offset);
		limit = ( limit == undefined ? result[0].issues.length : limit);
		end = parseInt(limit)+parseInt(offset);
		result[0].issues = result[0].issues.slice(offset, end);
		_.each(result[0].issues, function(issue){
			var bugStatus = issue.status;
			if (result[0].issueStatus[bugStatus] == undefined){
				result[0].issueStatus[bugStatus] = 1;
			} else {
				result[0].issueStatus[bugStatus]++;
			}
			var bugtype = issue.issueType;
			if (result[0].issueType[bugtype] == undefined){
				result[0].issueType[bugtype] = 1;
			} else {
				result[0].issueType[bugtype]++;
			}
		});
		callback(result);
	});
}

//get team for a particular project based on its project ID
module.exports.getUserTeamForProject = function(projectID, callback) {
    var team = [];
    module.exports.getProjectNameFromKey(projectID, function(err,selectedProject) {
        commonDBClient.getData('projects', function(projectsData) {
            var projectSelect = _.select(projectsData, function(project) {
                return (project.projectName == selectedProject);
            });
            _.each(projectSelect[0].team, function(member) {
                var dummy = {
                    name: member.name
                };
                team.push(dummy);
            });
            callback(team);
        });
    });
}

/*****************Aman*******~ Calling Data From User Collection***********************************/

module.exports.getProjectNameId = function (callback)
{
commonDBClient.getData('users' , function(data){
		var result = {
		"projects": [
		           
		],
		          	             
   };  
	
	_.each(data , function(user) {
		_.each(user.projects, function(project) { 
			
			var dummy = {
					"name" :(project != null ? project.projectName : ''),
					"id" : (project != null ? project.projectUID : ''),
					
			};
			result.projects.push(dummy);
		});
});
		callback(result);
	});	
}

/***************Aman**********~Calling Data from Master-Jenkins Collection**************************************/

module.exports.getJenkinsData = function(result, callback){
	commonDBClient.getDataLatest('master' , function(data){
		_.each(data.jenkins.jobs, function(job){
			_.each(result.projects, function(project){
				if(job.name == project.name){
					_.extend(project,{
						"currentBuildId":(job.builds[0] != null ? job.builds[0].number : '') ,
	                    "currentBuildStatus": (job.builds[0] != null ? job.builds[0].result : '') ,
						"lastSuccessfulBuildNumber": (job.lastSuccessfulBuild != null ? job.lastSuccessfulBuild.number : ''),
		                "lastFailedBuildNumber": (job.lastFailedBuild != null ? job.lastFailedBuild.number : ''),
		                "lastStableBuildNumber": (job.lastStableBuild != null ? job.lastStableBuild.number : '')
					});
				}
			});
		});
		callback(result);
	});
}

/*****************Aman******~Calling Jira Issues from master collection*************************************************/

module.exports.getIssueData= function (result , callback){
	/*
	var options ={
			jenkins:1
	};
	*/
	
	commonDBClient.getDataLatest('master' , function(masterData) {
		
		_.each(result.projects, function(jiraissues){

			a= {
					"totalIssues":'',
					"issues":[]
			};
			_.extend(jiraissues,a);
			
		});
		
		//callback(data);
		_.each(masterData.jira.issues , function(issuedata){
		      _.each(result.projects , function(project){
		    	  
		    	  //console.log(JSON.stringify(issues.fields.project.name));
		           //console.log(JSON.stringify(project.name) );
		    	  if (issuedata.fields.project.name.toLowerCase() == project.name.toLowerCase() )
		    		  
		    		  {     
		    		         
		    		        	
		    		        	var dummy = {
		    		        			

		    		        			"type": (issuedata.fields.issuetype != null ? issuedata.fields.issuetype.name : ''),

			                            "count": "count",

			                            "percentage": "percentage",

			                            "priority": (issuedata.fields.issuetype != null ? issuedata.fields.priority.name : ''),	
		    		        	};
		    		        	
		    		        	
		    		        	project.issues.push(dummy);
		    		        	//project.push()
		    		        			
		    		  }
		    		  		});
		      		
						});
		_.each(result.projects, function(jiraissues){

			jiraissues.totalIssues= jiraissues.issues.length;
		});
		
					callback(result, masterData);
			    });
	
}

//Calling team, server, Sonar from projects collection
var getProjectsData = module.exports.getProjectsData = function(result, callback){
	commonDBClient.getData('projects' , function(data) {
      _.each(result.projects, function(result){
			result.team = [];
			result.dependencies = [];
			result.server = [];
			result.health = [];
			
		});
		
		_.each(data , function(data){
			_.each(result.projects, function(result){
				
				if(data.projectName.toLowerCase() == result.name.toLowerCase()){
					_.each(data.team, function(member){
			        
							var team = {
						
									"name": (member != null ? member.name : ''),

									"role": "role",

									"email": "email",

									"environment": "qa or dev or staging or prod"
						
									};
			
							result.team.push(team);
					    });
					
					    var server = {
						     "name" :(data.server !=null ? data.server.serverName : '') , 
					         "currentDeployedBuild" : "currentDeployedBuild",
					         "isDeployable" : "isDeployable"
					         };
					    
					    result.server.push(server);
					    
					    var health =  {"sonarName" :(data.cQuality !=null ? data.cQuality.cqProjectName : '') , //not to be displayed
						               "sonarKey" :(data.cQuality !=null ? data.cQuality.cqProjectKey : '')  //not to be displayed
					    };
					    
			        	result.health.push(health);
				}
		    });
		});
		
		callback(result);

	});

}
	
/*****************Aman******~Calling Sonar Health from master collection***********************************************/
module.exports.getHealth= function(result, masterData, callback){
         _.each(masterData.sonar, function(sonardata){
			_.each(result.projects, function(project){
				_.each(project.health , function(healthCompare){
				if(sonardata.name == healthCompare.sonarName){
					_.each(sonardata.msr, function(msrdata){
									var dummy = {"name" :(msrdata != null ? msrdata.key : ''), 
												"value" :(msrdata !=null ? msrdata.val :'')
						    					};
				                     	
									project.health.push(dummy);
											});
					                 }
					            });
							}); 
		                });
		             callback(result);
	         };
	         
 // Threshold 
module.exports.getThreshold= function(result, callback){
	    _.each(result.projects, function(threshold){
	     	    threshold.threshold= [
	     		                            {

	     		                                "name": "loc",

	     		                                "value": 12000

	     		                            },

	     		                            {

	     		                                "name": "total-tests-executed-count",

	     		                                "value": 36

	     		                            },

	     		                            {

	     		                                "name": "total-tests-success-count",

	     		                                "value": 32

	     		                            },

	     		                            {

	     		                                "name": "total-tests-failure-count",

	     		                                "value": 3

	     		                            },

	     		                            {

	     		                                "name": "code-coverage-percentage",

	     		                                "value": 68

	     		                            },

	     		                            {

	     		                                "name": "total-violations",

	     		                                "value": 567

	     		                            },

	     		                            {

	     		                                "name": "blocker-violations",

	     		                                "value": 1

	     		                            },

	     		                            {

	     		                                "name": "critical-violations",

	     		                                "value": 6

	     		                            },

	     		                            {

	     		                                "name": "major-violations",

	     		                                "value": 6

	     		                            },

	     		                            {

	     		                                "name": "normal-violations",

	     		                                "value": 6

	     		                            },

	     		                            {

	     		                                "name": "minor-violations",

	     		                                "value": 6

	     		                            },

	     		                            {

	     		                                "name": "info-violations",

	     		                                "value": 6

	     		                            }
                                        ];

	     		});
	    
	    callback(result); 
}
	         

/*****************************Json for Builds / Projects********************************************/

// Project name and key from users collection	        	
	 module.exports.getProjectDetails =  function(projectID, callback){
	       module.exports.getProjectNameFromKey(projectID, function(error, projectName){
	        		   if(error){
	        		    callback(projectName);
	        		   } else {
	        		    result = [{
	        		     "displayName" : projectName,
	        		              // "id" : projectID
	        		    }];
	        		    callback(result);
	        		   }
	        		  });
	        		 };
 	
// sonar name and key from projects collection
	module.exports.getProjectSonarkey = function(result, callback){
	      commonDBClient.getData('projects' , function(data){
	        	 _.each(data, function(projectsdata){
	        	    _.each(result, function(project){
	        	    	if(projectsdata.projectName == project.displayName) {
	        	    		_.extend(project,{
	        	    				"key" : projectsdata.cQuality.cqProjectKey,
	        	    				"name" :projectsdata.cQuality.cqProjectName
	        	    			});
	        	    		}
	        	    	});
	        	    });
	        	    callback(result);
	        		});
	        	};
	        	
// sonar data from master collection
module.exports.getProjectSonar = function(result, callback){
	       commonDBClient.getDataLatest('master' , function(masterData){
	       	    _.each(masterData.sonar, function(sonardata){
	        	    	_.each(result, function(project){
	        	    		if(sonardata.key == project.key) {
	        	    			_.extend(project,{
	        	    				"id" : sonardata.id,
	        	    				"lname" : sonardata.lname,
	        	    				"scope": sonardata.scope,
	        	    				"qualifier" : sonardata.qualifier,
	        	    				"lang" : sonardata.lang,
	        	    				"version" :sonardata.version ,
	        	    				"date" :sonardata.date,
	        	    				"creationDate" :sonardata.creationDate
	        	    			});
	        	    		}
	        	    	});
	        	    });
	        	    callback(result, masterData);
	        		});
	        	};
	        	
// Jenkins data from masterData       	  
module.exports.getProjectJenkins = function(result, masterData, callback){
	  _.each(masterData.jenkins.jobs, function(job){
		  _.each(result, function(project){
			  if(job.displayName == project.displayName){
				  var totalBuilds = job.builds.length;
			         var totalSuccessBuilds = 0, totalFailureBuilds = 0;
			           _.each(job.builds, function(build){
			        	   if(build.result == 'SUCCESS'){
			        		   totalSuccessBuilds++;
			        		   }
			        		if(build.result == 'FAILURE'){
			        			totalFailureBuilds++;
			        		}
			           });
			        		_.extend(project,{
			        			"totalBuilds" : totalBuilds,
			        			"totalSuccessBuilds" : totalSuccessBuilds,
			        			"totalFailureBuilds" : totalFailureBuilds
			        		});
			  }
		  });
	  });
	  callback(result, masterData);
};


//project metrics using masterData
module.exports.getProjectMetrics = function(result, masterData, callback){
	/*_.each(result , function(result){
		result.metrics=[];
	});
	*/
	   _.each(result, function(project){
			var dummy = {
				    "metrics": [{
				        "name": "averageStablityOfBuilds",
				        "value": "0.2",
				        "uom": "Success Builds/TotalBuilds"
				    },
				    {
				        "name": "projectDelinquentFixes",
				        "value": 12,
				        "uom": "(fixes exceeding SLA) * 100/(Fixes within SLA) "
				    },
				    {
				        "name": "projectEffortEstimateAccuracy",
				        "value": 12,
				        "uom": "(Actual total effort)/(Estimated effort) "
				    }]
				};
			var SuccessBuilds = 0;
			var TotalBuilds;
			_.each(masterData.jenkins.jobs, function(data){
				if(data.name == project.displayName){
					_.each(data.builds, function(build){
						if(build.result == "SUCCESS"){
							SuccessBuilds++;
						}
					});
				TotalBuilds = data.builds.length;
				}
			});
			dummy.metrics[0].value = SuccessBuilds/TotalBuilds;
			var fixesExceedingSLA = 0;
			var fixesWithinSLA = 0;
			var actualTotalEffort = 0;
			var estimatedEffort = 0;
			_.each(masterData.jira.issues, function(issue){
				if(issue.fields.project.name == project.displayName){
					if(issue.fields.timeoriginalestimate != null && issue.fields.timespent != null){
						actualTotalEffort += issue.fields.timeoriginalestimate;
						estimatedEffort += issue.fields.timespent;
						if(issue.fields.timeoriginalestimate < issue.fields.timespent){
							fixesExceedingSLA++;
						} else {
							fixesWithinSLA++;
						}
					}
				}
			});
			dummy.metrics[1].value = fixesExceedingSLA * 100 / fixesWithinSLA;
			dummy.metrics[2].value = actualTotalEffort / estimatedEffort;
			_.each(result, function(result){
				_.extend(result , dummy);
			});
			//result.push(dummy);
			callback(result, masterData);
		});
	
};

// project builds using masterData
module.exports.getProjectLastBuild= function(result, masterData, callback){
    	   _.each(result, function(result){
   	        result.builds= [];
    	   						});
    	   
	     	    	 _.each(masterData.jenkins.jobs, function(job){
	     	    			_.each(result, function(result){
	     	    				if(job.displayName == result.displayName){
	     	    					var buildId = job.builds.length;
	     	    					_.uniq(job.builds, function(build){
	     	    						if(build.number == buildId)
	     	    							{
	     	    							
	     	    							var dummy = {
	     	    							
	     	    									"buildId" : (buildId!= null ? buildId : '' ),
	     	    									"status": (build!= null ? build.result : ''),
	     	    									"date": (build!=null ? build.id :'')
	     	    							};
	     	    							result.builds.push(dummy);
	     	    					      }
	     	    					   });
	     	    					}
	     	    				});
	     	    		   });
	    	      	   callback(result, masterData);
};

//Last Build Health
module.exports.getLastBuildHealth = function(result, masterData, callback){
	
	_.each(result, function(result){
		      _.each(result.builds , function(build){
		    	  build.health=[];
		      			});
				});

	_.each(masterData.sonar, function(sonar){
		 _.each(result, function(result){
	     	if(sonar.key == result.key){
			  _.each(sonar.msr, function(msrdata){
				   _.each(result.builds, function(build){
				  		var dummy = {   "name" :(msrdata != null ? msrdata.key : ''), 
										"value" :(msrdata !=null ? msrdata.val :'')
				    					};
		                     	
							build.health.push(dummy);
									});
				              });
	                     	}
			            });
			        });
             callback(result, masterData);
     };
     
 // Tasks inside Builds Array  
 module.exports.getTask = function(result, masterData, callback){
     _.each(result, function(result){
     		 
       	/*******Golbal Variables*****/ 
       	    var totalTask = 0;
            var openTask= 0;
            var resolvedTask = 0;
            var progressTask = 0;
            var criticalTask = 0;
            var blockerTask = 0;
            var majorTask = 0;
            var minorTask =0;
            var trivalTask = 0;
            
       	 
       	 _.each(masterData.jira.issues, function(jira){
       		      if(result.displayName == jira.fields.project.name){
       				  if(jira.fields.issuetype.name == "Task"){ 
       					  totalTask ++;	  
       					  if(jira.fields.status.name == "Open"){
       						  openTask++;
       						  }
       					  if(jira.fields.status.name == "Resolved"){
       						  resolvedTask++
       					      }
       				      if(jira.fields.status.name == "In Progress"){
       					     progressTask++
       				      	 }
       				      if(jira.fields.priority.name == "Critical"){
       				    	  criticalTask++
       					  	 }
       				      if(jira.fields.priority.name == "Blocker"){
       				    	  blockerTask++
   						  	 }
       				      if(jira.fields.priority.name == "Major"){
   	    					  majorTask++
       				      	 }
       				      if(jira.fields.priority.name == "Minor"){
   	    					  minorTask++
   						     }
       				      if(jira.fields.priority.name == "Trivial"){
   	    					  trivalTask++
   						     }
       				     }
       				  }	  	   
       	    });
       	       _.each(result.builds , function(build){
   		    	  var dummy = {
   		    		"Tasks" : [
                               {
                                "name" : "total",
                                 "value": totalTask
                               },
                               {		
   			    			 	"name" : "open",
   								"value": openTask 
   			    		 		},
   			    		 	 {
   				    			 "name" : "resolved",
   								 "value": resolvedTask 
   				    		 	},
   				    		 {
   				    			  "name" : "Inprogress",
   								"value": progressTask 
   				    		  	},
   				    		  {
   				    			  "name" : "critical-defects",
   								"value": criticalTask 
   				    		  	},
   				    		  {
   				    			  "name" : "blocker-defects",
   								"value": blockerTask 
   				    		    },
   				    	       {
   				    			  "name" : "major-defects",
   								"value": majorTask 
   				    	  		},
   				    	       {
   				    			  "name" : "minor-defects",
   								"value": minorTask 
   				    	  		},
   				    	       {
   				    			  "name" : "trivial-defects",
   								"value": trivalTask 
   				    	  		} 
   		    	                  ]
   		    	                };
       	 
       	 dummy.Tasks[0].value = totalTask;
   		 dummy.Tasks[1].value = openTask;
   		 dummy.Tasks[2].value = resolvedTask;
   		 dummy.Tasks[3].value = progressTask;
   		 dummy.Tasks[4].value = criticalTask;
   		 dummy.Tasks[5].value = blockerTask;
   		 dummy.Tasks[6].value = majorTask;
   		 dummy.Tasks[7].value = minorTask;
   		 dummy.Tasks[8].value = trivalTask;
   		
             _.extend(build, dummy);
   	
   		  
     		     });
           });
       callback(result, masterData);
        };
        
// Defects Inside Builds 
 module.exports.getDefects = function(result, masterData, callback){
     _.each(result, function(result){
      		 
          /******Global Variables******/
      	     	 var totalDefects = 0;
      	         var criticalDefects = 0;
      	         var blockerDefects = 0;
      	         var majorDefects = 0;
      	         var minorDefects =0;
      	         var trivialDefects = 0;
               
      	     _.each(masterData.jira.issues, function(jira){
      		      if(result.displayName == jira.fields.project.name){
      				      if(jira.fields.issuetype.name == "Bug"){ 
      					       totalDefects ++;	  
      					  if(jira.fields.priority.name == "Critical")
      						  {
      						  criticalDefects++
      						  }
      					  if(jira.fields.priority.name == "Blocker")
      						  {
      						  blockerDefects++
      						  }
      					    
      					  if(jira.fields.priority.name == "Major")
      						  {
      						  majorDefects++
      						  }
      					  
      					  if(jira.fields.priority.name == "Minor")
      						  {
      						  minorDefects++
      						  }
      					  
      					  if(jira.fields.priority.name == "Trivial")
      						  {
      						  trivialDefects++
      						  }
      			 		}
      				 }	  
      		  	});	   
      	     
      	    _.each(result.builds , function(build){
      	  	 var dummy = {
          	  "Defects": [
                               {
       		                   "name" : "total",
       		                   "value": totalDefects
       		                 },
       	                     {
      	  	                   "name" : "critical-defects",
      		                   "value": criticalDefects 
       	                   	},
                              {
      	                       "name" : "blocker-defects",
      		                   "value": blockerDefects
      		                },
                              {
      	                       "name" : "major-defects",
      		                   "value": majorDefects
       		                },
                            	{
      	                       "name" : "minor-defects",
      		                   "value": minorDefects 
       		                },
       	                    {
      	  	                   "name" : "trivial-defects",
      		                   "value": trivialDefects 
       		                }
          	              ]
          	            };
      	  	 
            dummy.Defects[0].value = totalDefects;
            dummy.Defects[1].value = criticalDefects;
            dummy.Defects[2].value = blockerDefects;
            dummy.Defects[3].value = majorDefects;
            dummy.Defects[4].value = minorDefects;
            dummy.Defects[5].value = trivialDefects;
            
      	          _.extend(build, dummy);
      	          
          	 });
         });
      callback(result, masterData);
  };
        
        
  // Metrics Inside Builds
 module.exports.getMetrics= function(result, masterData, callback){
    _.each(result, function(result){
       	// Global Variable 
       	 var timeEstimate = 0;
       	 _.each(masterData.jira.issues, function(jira){
      		  		if(result.displayName == jira.fields.project.name){
      		  					if(jira.fields.issuetype.name == "Bug" || jira.fields.issuetype.name == "Task" ){
      		  						if(jira.fields.timeoriginalestimate !=null){
      		  							timeEstimate = timeEstimate + jira.fields.timeoriginalestimate ;
      		  							}
      		  						}
      		  					}
      		  				});
       	 
       		
       		 var dataArray = [];
       		 _.each(masterData.jira.issues, function(issue){
       		    if(issue.fields.project.name == result.displayName) {
       		    	   if(issue.fields.issuetype.name == "Bug"){
       		               if(issue.fields.fixVersions[0] != null){
       		                 _.each(issue.fields.fixVersions, function(fixVersions){
       		                 var name = fixVersions.name;
       		                // console.log(name);
       		                var splitName =  name.slice(1, 2);
       		                 //console.log(splitName);
       		                 dataArray.push(splitName);
       		                 
       		                   			});
       		                 		}
       		                     }
       		       			  }
       		              });
       		 
       		 var TaskArray = [];
       		 _.each(masterData.jira.issues, function(issue){
       		     if(issue.fields.project.name == result.displayName) {
       		    	   if(issue.fields.issuetype.name == "Task"){
       		               if(issue.fields.fixVersions[0] != null){
       		                 _.each(issue.fields.fixVersions, function(fixVersions){
       		                 var name = fixVersions.name;
       		                // console.log(name);
       		                var splitName =  name.slice(1, 2);
       		                 //console.log(splitName);
       		                 dataArray.push(splitName);
       		                 
       		                   			});
       		                 		 }
       		                       }
       		       				 }
       		                 });
       		 
       		 var uniqArray = _.uniq( _.collect( dataArray, function( uniqArray ){
       			    return ( uniqArray );
       			}));
                
       		 var uniqTaskArray = _.uniq( _.collect( dataArray, function( uniqTaskArray ){
    			    return ( uniqTaskArray );
    			}));
       		 var averageDefects = uniqArray.length;
       		 var totalDefects = dataArray.length;
       		 
       		 var averageTasks = uniqTaskArray.length;
       		 var totalTasks = TaskArray.length;
       		 
       	
       		 _.each(result.builds , function(build){
       			 	var dummy={
       			 			"Metrics" :[
   			    		{
   			    			"name" : "defectInjectionRate",
   			 			    "value" :totalDefects/1000 ,
   			 			    "uom" : "defects per 1000 lines of code"
       			 		},
   	    		
       			 	    {
   			    		"name" : "projectEstimate",
   			    		"value": (((timeEstimate/60)/60)/8),
   			    		"uom" : "Project Estimate in Person Days Based on current Status of Defects and tasks"
   	    				},
   	    		        {
   	    		    		"name" : "averageDefectsPerBuild",
   				 			"value" :totalDefects/averageDefects ,
   				 			"uom" : "Average Number of Defects per build into QA"	
   	    		    		
   	    		    	},
   	    		       {
   	    		    		"name" : "averageTasksPerBuild",
   				 			"value" :totalTasks/averageTasks ,
   				 			"uom" : "Average Number of Tasks per build into QA"
   	    		    	}			
       		          ]
       			 	};
       	dummy.Metrics[0].value = totalDefects/1000;
       	dummy.Metrics[1].value = (((timeEstimate/60)/60)/8);
       	dummy.Metrics[2].value = totalDefects/averageDefects;
       	dummy.Metrics[3].value = totalTasks/averageTasks;
       		 
       	 _.extend(build, dummy);
       	 
       	 
                });
   	        });
       	callback(result);
    };
    
 
     
    