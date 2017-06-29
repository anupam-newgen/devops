var querystring = require('./node_modules/querystring');
var http = require('http');
var express = require('./node_modules/express');
var jenkinsClient = require('./modules/jenkins');
var jiraClient = require('./modules/jira');
var commonDBClient = require('./modules/commonDBClient');
var sonarClient = require('./modules/sonar');	
var CronJob = require('./node_modules/cron').CronJob;
var _ = require('./node_modules/underscore');
var commonUtils = require('./modules/commonUtils');

// variables
var jenkinsFlag = false,
    sonarFlag = false,
    jiraFlag = false;
var jenkinsData, sonarData, jiraData;
var masterData = {
    jenkins: "jenkins Data",
    jira: "jira data",
    sonar: "sonar data",
    timestamp: "timestamp"
};
function insert(collection) {
    if (jenkinsFlag && sonarFlag && jiraFlag) {
        masterData.jenkins = jenkinsData;
        masterData.sonar = sonarData;
        masterData.jira = jiraData;
        masterData.timestamp = new Date().valueOf();
        commonDBClient.insertIntoDB(collection, masterData);
    }
}

var CronJob = require('cron').CronJob;
var job = new CronJob('0 0 */2 * * *',function(){               
	
	// Runs every 2 hour
	
	console.log(new Date());
	jenkinsFlag = false; 
	sonarFlag = false;
	jiraFlag = false;
    jenkinsClient.queryJenkinsAllProjects(function(data) {
    	
        jenkinsFlag = true;
        jenkinsData = data;
        insert('master')
       
    });

    jiraClient.queryJiraAllProjects(function(data) {
    	
        jiraFlag = true;
        jiraData = data;
        insert('master')
        
    });
   
    sonarClient.querySonarAllProjects(function(data) {
    
        sonarFlag = true;
        sonarData = data;
        insert('master')
    });
    
});
    
	job.start();
  
  
  
