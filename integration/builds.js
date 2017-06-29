var commonDBClient = require('../modules/commonDBClient');
var commonUtils = require('../modules/commonUtils');
var svn = require('../modules/SVN');
var _ = require('underscore');

//get Build History
var getProjectBuildIssues = module.exports.getProjectBuildIssues = function(projectName, buildNumber, previousTimestamp, currentTimestamp, jira){
		var result = {         
			"ticketSummary":{  
				"resolved": 0,
				"reported": 0,
				"reopened": 0
			},
			"issue": [{
				"resolved": [],
				"reported": [],
				"reopened": []
			}]
		};   
		_.each(jira.issues, function(issue){
			if((new Date(previousTimestamp) < new Date(issue.fields.resolutiondate)) && (new Date(issue.fields.resolutiondate) <= new Date(currentTimestamp))){
				var dummy = {
						"key" :issue.key,
						"description" :issue.fields.description,
						"issueType" :issue.fields.issuetype.name,
						"raisedBy" :issue.fields.reporter.displayName,
						"status" :issue.fields.status.name,
						"priority" :issue.fields.priority.name
				};
				result.issue[0].resolved.push(dummy);
				result.ticketSummary.resolved++;
			}	
			if((new Date(previousTimestamp) < new Date(issue.fields.created)) && (new Date(issue.fields.created) <= new Date(currentTimestamp))){
				var dummy = {
						"key" :issue.key,
						"description" :issue.fields.description,
						"issueType" :issue.fields.issuetype.name,
						"raisedBy" :issue.fields.reporter.displayName,
						"status" :issue.fields.status.name,
						"priority" :issue.fields.priority.name
				};
				result.issue[0].reported.push(dummy);
				result.ticketSummary.reported++;
			}
			if((new Date(previousTimestamp) < new Date(issue.fields.updated)) && (new Date(issue.fields.updated) <= new Date(currentTimestamp)) && (issue.fields.status.name = 'Reopened')){
				var dummy = {
						"key" :issue.key,
						"description" :issue.fields.description,
						"issueType" :issue.fields.issuetype.name,
						"raisedBy" :issue.fields.reporter.displayName,
						"status" :issue.fields.status.name,
						"priority" :issue.fields.priority.name
				};
				result.issue[0].reopened.push(dummy);
				result.ticketSummary.reopened++;
			}
		});
		return(result);
}

//get project build history
//get Build History
module.exports.getBuildHistory = function(project, callback) {
	
	commonDBClient.getDataLatest('master', function(masterData) {
		var buildHistory = {
			"projectName" : project,
			"builds" : []
		};
		
		var builds = _.filter(masterData.jenkins.jobs, function(job) {
			return job.name == project;
		});
		if(builds[0] == undefined){
			callback("Project Not Found");
		} else {
			builds = builds[0].builds;
			var previousBuildTimestamp = 0;
			_.each(builds.reverse(), function(build) {
				var buildIssues = getProjectBuildIssues(project, build.number, previousBuildTimestamp, build.timestamp, masterData.jira);
				var dummy = {
						"buildNumber" : build.number,
						"result" : build.result,
						"buildDate" : new Date(build.timestamp)
					};
				_.extend(dummy, buildIssues);
				buildHistory.builds.push(dummy);
				previousBuildTimestamp = build.timestamp;
			});
			callback(buildHistory);
		}
	});
};



/*Get All projects Names from Jenkins*/ 
var getProjectRevisions = module.exports.getProjectRevisions = function(callback){
commonDBClient.getDataLatest('master', function(masterData){
	var result = [];	 
	 _.each(masterData.jenkins.jobs, function(job){
		 var dummy = {
					"project" : job.displayName,
		 };
		 result.push(dummy);
		   });
	     callback(result, masterData);
	  }); 
   };
   
 /*Get Revision number and Build Number from Jenkins*/
   var getBuildRevisions = module.exports.getBuildRevisions = function(result, masterData, callback){
      _.each(result, function(project){
   	   project.builds = [];
   	   _.each(masterData.jenkins.jobs, function(job){
   	    	 if(job.displayName == project.project){
   	    		 _.each(job.builds, function(builds) {
   	    			 var dummy = {
   								"BuildNumber" : builds.number
   						};
   						_.each(builds.changeSet.revisions, function (revision){
   							_.extend(dummy, {
   								"RevisionNumber" : revision.revision
   							});
   						});
   						project.builds.push(dummy);
   	    	        });
   	    	     } 
   	        });
         });
          callback(result);
      };
      
/*Get Build Number or Revision Number Per Project*/
var getProjectBuildRevisions = module.exports.getProjectBuildRevisions = function(callback) {
	getProjectRevisions(function(data, masterData) {
		getBuildRevisions( data, masterData, function(data) {
		   callback(data);
		});
	});
};

/**************************************************************************************************************************/
/* Calling SVN Data */    
    module.exports.getProjectData = function(callback){		
    		getProjectBuildRevisions(function(data){
    			var builds= [];
    			_.each(data , function(buildData){
    				if(buildData.project=='devops')
    					{
    					_.each(buildData.builds , function(Build){
    						
    						if(Build.RevisionNumber!= null){					
    						var buildNumber ={
    								"BuildNumber":Build.BuildNumber,
    								"RevisionNumber":Build.RevisionNumber
    						};
    						builds.push(buildNumber);
    						//console.log(builds[0].RevisionNumber);
    						}
    					  });
    				    }
    				});
    			
    			/* var list = ["907:899",
    			             "899:898",
    			             "898:897",
    			             "897:896"
    			             ];*/
    			//	console.log("Length of build" +builds.RevisionNumber);
    		var list = [];
    			
    			var i;
    			for(i=0 ; i < builds.length -1 ; i++ ){
    				var j = i+1;
    					var revision =   builds[i].RevisionNumber  + ':' + builds[j].RevisionNumber;
    					list.push(revision);
    			}
    			
    		
    				  // return(revision);
  
    			//console.log("Length of build" +builds.length);
    		//	var revision =  builds[0].RevisionNumber + ':' + builds[2].RevisionNumber;
    		//	var buildNumber = builds[0].BuildNumber;
    			//callback(revision);
    		//Fetches svn changes data for a particular date range in xml format
    			
    			
    			svn.getSVNLogForRevision(list, function(data) {
    				console.log("++++++++++++++++++++++++++++++++++++++++++++data = " + data);
    				svn.integrateSVNLogSVNDiff(builds[0].RevisionNumber, builds[2].RevisionNumber, data, function(svnDiffResponse){
    					callback(data);
    				});
    			});
    			//callback(list);
    		});
    		
    	};
    		