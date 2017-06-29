
var devops_jira_client = require('../modules/jira');
function getLineChartEntries(job) {
    var arrayOfLineChartEntries = [];
    for (var j = 0; j < job.builds.length; j++) {
        var build = job.builds[j];
        var percentage = [];
        for (var k = 0; k < build.actions.length; k++) {
            var action = build.actions[k];
            var failureTC = action.failCount;
            var totalTC = action.totalCount;
            var successPercentage = ((totalTC - failureTC) * 100) / totalTC;
            if (successPercentage != null && isNaN(successPercentage)) {
                percentage.push(successPercentage);
            }
        }
        if (percentage.isEmpty) {
            var pushLineChartEntries = {
                displayName: job.displayName,
                totalBuilds: job.builds.length,
                percentage: percentage
            };
            arrayOfLineChartEntries.push(pushLineChartEntries);
        }
    }
    return {
        lineChartEntriesPercentage: arrayOfLineChartEntries
    };
}

function getJenkinsCharts(jobs, transJenkinsJobData) {
    for (var i = 0; i < jobs.length; i++) {
        var job = jobs[i];

        var barChartEntries = {barChartEntries: _.countBy(_.flatten(_.pluck(job.builds, "result")))};
        _.extend(transJenkinsJobData[i], barChartEntries);

        var success = transJenkinsJobData[i].barChartEntries.SUCCESS;
        var failure = transJenkinsJobData[i].barChartEntries.FAILURE;
        var total = success + failure;

        var lineChartEntries = {
            lineChartEntries: {
                displayName: job.displayName,
                totalBuilds: total,
                pass: success,
                fail: failure
            }
        };
        _.extend(transJenkinsJobData[i], lineChartEntries);

        var lineChartEntriesPercentage = getLineChartEntries(job);
        _.extend(transJenkinsJobData[i], lineChartEntriesPercentage);
    }
    return transJenkinsJobData;
}


exports.getDashboard = function() {
    devops_jenkins_client.queryJenkinsWithDepth(2, function(data) {
        var jenkinsData = data;
        var mapArrayforGetDashboardJenkins = devops_mapper_utility.mapArrayforGetDashboardJenkins();
        var transJenkinsJobData = devops_transformation_utility.transformJSON(jenkinsData, mapArrayforGetDashboardJenkins);

        var jobs = jenkinsData.jobs;
        transJenkinsJobData = getJenkinsCharts(jobs, transJenkinsJobData);

        var metrics = {
            metrics : [
                'violations,blocker_violations,critical_violations,major_violations,minor_violations,info_violations,sqale_index'
            ]
        };
        devops_sonar_client.querySonarResources(metrics, function(data) {

            for (var l = 0 ; l < transJenkinsJobData.length ; l++) {
                var jenkinsDataTemp = transJenkinsJobData[l];
                console.log(jenkinsDataTemp);
                for(var m = 0 ; m < data.length ;m++) {
                    var dataTemp = data[m];
                   // console.log(dataTemp);
                    if (dataTemp.key.indexOf(jenkinsDataTemp.displayName) != -1) {
                        transJenkinsJobData[l] = _.extend(jenkinsDataTemp, dataTemp);
                        break;
                    }
                }
            }
            console.log("transJenkinsJobData = " + JSON.stringify(transJenkinsJobData));
        });

        metrics = {
            projectsOrCategories : 'allprojects',
            showStats : true
        };

        /*devops_jira_client.queryJIRAProjectResources(metrics, function(data){
            console.log("transJenkinsJobData = " + JSON.stringify(transJenkinsJobData));
        });*/
        metrics = {
            projectsOrCategories : 'allprojects',
            showStats : true,
            project: '',
            type: 'bug',
            fixVersion: ''
        };
        //project="+projectName+"&type=bug&fixVersion="+affectedVersion;
        /*devops_jira_client.queryJIRAProjectForFixVersion(metrics, function(data){
            console.log("transJenkinsJobData = " + JSON.stringify(transJenkinsJobData));
        });*/
    });
    //return jenkinsData;
};

exports.createJIRAVersion = function(projectName, startVersion, endVersion,success) {

    var start = parseInt(startVersion);
    var end = parseInt(endVersion);
    for(var i = start ; i < end; i++) {
        metrics = {
            'description' : '#' + i,
            'name' : '#' + i,
            'project' : projectName
        };
        console.log('dashboard');
        devops_jira_client.createJIRAVersion('/rest/gadget/1.0/project/generate?projectsOrCategories=allprojects&showStats=true', 'GET',
            metrics, function (err, data) {
                if(err) {
                    console.log('Error occured while creating the Version for project. ');
                } else {
                	
                    console.log('Version Created ' + data);
                    success(data);
                }
            });
    }

    //return jiraData;
};



