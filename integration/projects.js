var commonDBClient = require('../modules/commonDBClient');
var commonUtils = require('../modules/commonUtils');
var _ = require('underscore');

//generate project hierarchy from data fetched from the database
var getProjectHierarchy = module.exports.getProjectHierarchy=function(projectsData){
	
	var projects = {
		project: [ {
		label: "Newgen",
		id: "Newgen",
		children: [{
			label:"CST",
				id:"CST",
				children:[{
					label:"Implementation",
					id:"Implementation",
					children:[{
					          label: "EAANetApp",
					        	  id:"EAANetApp",
					}]
				}]},
				{label:"CSD",
				id:"CSD",
				children:[{
					label:"Testing",
					id:"Testing",
					children:[]
				}]
		}]
	},{label: "Newgen Infinite",
		id: "Newgen Infinite",
		children: [{
			label:"PES",
			id:"PES",
			children:[{
				label:"Eagle",
				id:"Eagle",
				children:[]
			},
			{label:"KM",
			id:"KM",
			children:[]
			}	
			]
	}]}] };
	console.log(JSON.stringify(projectsData));
	_.each(projectsData,function(project,i){
		var k=i+1;
		var j=i +2;
		console.log("job:"+ project.projectName);
		var newgen = projects.project[0].children[1].children[0].children;
		var newgenInfiniteEagleProjects=projects.project[1].children[0].children[0].children;
		var newgenInfiniteKMProjects=projects.project[1].children[0].children[1].children;
		
		//var abcChild= abc.children;
		//console.log("abc:"+JSON.stringify(abc));
		var dummyParent = {
			projectName : project.projectName,
			id: k
			
			
						};
		
		newgen.push(dummyParent);
		newgenInfiniteEagleProjects.push(dummyParent);
		newgenInfiniteKMProjects.push(dummyParent);
		
	});
	
	return projects;

}

//generate the project hierarchy
module.exports.getProjectHierarchy = function(callback) {
	commonDBClient.getData('projects', function(data) {
		var projects = data;
		var projectData = getProjectHierarchy(projects);
		callback(projectData);
	});
};


//Gets all the tasks for the project
module.exports.getIssueProjectWise = function(limit, offset, projectKey, callback) {
	commonUtils.getProjectNameFromKey(projectKey, function(error, projectName) {
		if (error) {
			callback(projectName);
		} else {
			commonUtils.getIssueProjectWise(projectName, projectKey, limit, offset, function(data) {
				callback(data);
			});
		}
	});
};

//Gets the tasks for the user for a specific project
module.exports.getIssueProjectUserWise = function(limit, offset, projectKey, userKey, callback) {
	commonUtils.getProjectNameFromKey(projectKey, function(error, projectName) {
		if (error) {
			callback(projectName);
		} else {
			commonUtils.getUserNameFromKey(userKey, function(error, userName) {
				if (error) {
					callback(userName);
				} else {
					commonUtils.getIssueProjectUserWise(projectName, projectKey, userName, limit, offset,
							function(data) {
							callback(data);
							});
				}
			});
		}
	});
};

//Gets the team details visible to the user for the project selected
module.exports.getUserTeamForProject = function(projectID, callback) {
	commonUtils.getUserTeamForProject(projectID, function(team) {
		callback(team);
	});
};

//Get Project Effort
module.exports.calculateProjectEffort = function(projectID, callback) {
	var startDate = new Date(2015, 01, 04, 10);
	var endDate = new Date(2015, 01, 04, 17);
	commonDBClient.getTimestampData('integrated', startDate.valueOf(), function(initialData) {
				if (initialData) {
					commonDBClient.getTimestampData('integrated', endDate.valueOf(), function(finalData) {
						commonUtils.calculateProjectEffort(initialData,finalData, function(data){
							callback(data);
						});
					});
				} else
					callback('data not found' + data);
	});
};


/***********Aman***~Jobs****************************/
module.exports.calculateProjectsData = function(callback) {
	commonUtils.getProjectNameId(function(data) {
	    commonUtils.getJenkinsData(data, function(data) {
	    	commonUtils.getProjectsData(data, function(data) {                
	            commonUtils.getIssueData(data, function(data, masterData) {
	                    commonUtils.getHealth(data, masterData, function(data) {
	                        commonUtils.getThreshold(data, function(data) {
	                                callback(data);
	                            });
	                        });
	                    });
	                });
	            });
	        });
         };


// Project details
module.exports.calculateProjectDetails = function(projectID, callback){
	commonUtils.getProjectDetails(projectID, function(data) {
	   commonUtils.getProjectSonarkey(data, function(data) {
	      commonUtils.getProjectSonar(data,function(data, masterData){
	         commonUtils.getProjectJenkins(data, masterData, function(data, masterData){
			    commonUtils.getProjectMetrics(data, masterData, function(data, masterData){
			       commonUtils.getProjectLastBuild(data, masterData, function(data, masterData){
			          commonUtils.getLastBuildHealth(data, masterData, function(data,masterData){
				         commonUtils.getTask(data , masterData , function(data, masterdata){
				            commonUtils.getDefects(data , masterData , function(data, masterData){
					            commonUtils.getMetrics(data, masterData, function(data){
					               callback(data);
						         });
							  });
						   });
					    });
				     });
			      });
		       });
	        });		 
         });
      });		
   };

// get projects from jenkins 
var getProjectRevisions = module.exports.getProjectRevisions = function(limit, offset, callback){
	   
	commonDBClient.getDataLatest('master', function(masterData){
		
	var result = [];
	 
	 _.each(masterData.jenkins.jobs, function(job){
		 var dummy = {
					"project" : job.displayName,
					//"Builds" : []
		 };
		 result.push(dummy);
		   
		});
	          callback(result, masterData);
	 });
};

// get project builds revision
var getBuildRevisions = module.exports.getBuildRevisions = function(result, masterData, limit, offset, callback){
	
   _.each(result, function(project){
	   project.builds = [];
	     
	     _.each(masterData.jenkins.jobs, function(job){
	    	 if(job.displayName == project.project){
	    		 _.each(job.builds, function(builds) {
	    			 var dummy = {
								"BuildNumber" : builds.number,
								//"RevisionNumber" : build.changeSet.revisions[0].revision
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
   
  
   // get revision of the builds per project 
   module.exports.getProjectBuildRevisions = function(limit, offset, callback) {
		getProjectRevisions( limit, offset, function(data, masterData) {
			getBuildRevisions( data, masterData, limit, offset, function(data) {
			   callback(data);
			});
		});
   };

   
   
   /*  
     // revisions of builds
     module.exports.getProjectRevisions = function(limit, offset, callback){
  	   
  		commonDBClient.getDataLatest('master', function(data){
  			
  		 _.each(data.jenkins.jobs, function(job){

  			 console.log(JSON.stringify(job.displayName));
  			 
  			 var result = [{
  				"project-name" : job.displayName,
  				"Builds": []
  			}]; 
  			 
  			  
  			// _.each(data.jenkins.jobs, function(job){
  			 _.each(job.builds, function(build) {
  					var dummy = {
  							"BuildNumber" : build.number,
  							//"RevisionNumber" : build.changeSet.revisions[0].revision
  					};
  					_.each(build.changeSet.revisions, function (revision){
  						_.extend(dummy, {
  							"RevisionNumber" : revision.revision
  						});
  					});
  					result.Builds.push(dummy);
  				//});	
  			  });
  			 
  			 callback(result);
  			     
  			});
  		
  		 });
  	
     };
     
     
     */
   
 //json for bubble chart ( violations)
   module.exports.getViolations = function(callback){
  
  commonDBClient.getDataLatest('master', function(data){
     var result = [];
     var Violations;
      var Blocker;
    var Critical;
    var Major;
    var Minor;
    var Info; 
    _.each(data.sonar, function(sonar){
    // console.log(JSON.stringify(sonar.name));
    var dummy = {
      "ProjectName" : sonar.name
                };
    
      _.each(sonar.msr, function (msr){
     //console.log(msr.key);
            if( msr.key == "violations") {
       //console.log(msr.val);
           Violations = msr.val;
         //console.log(Violations);
          }
         if( msr.key == "blocker_violations") {
           Blocker = msr.val;
         // console.log(Blocker);
        }
         if( msr.key == "critical_violations") {
            Critical = msr.val;
         }
            if( msr.key == "major_violations") {
            Major = msr.val;
         }
        if( msr.key == "minor_violations") {
           Minor = msr.val;
        }
        if( msr.key == "info_violations") {
           Info = msr.val;
         }
         
        //  _.extend (dummy,{ "abc": "abc"});
     
          _.extend ( dummy, 
          {
      "Violations" : Violations,
      "Major" :Major ,
      "Critical" : Critical ,
      "Blocker" : Blocker,
      "Minor": Minor,
      "Info" : Info
     });
  });
           result.push(dummy);
});
   callback(result);
 });
  
}
