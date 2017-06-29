var Client = require('../node_modules/svn-spawn');
var _ = require('../node_modules/underscore');
var parseString = require('../node_modules/xml2js').parseString;
//var projectData = require('../integration/projects.js');
var client = new Client({
    cwd: './svn_dependency', //this directory is required to be created.
    username: 'admin',
    password: 'admin'

});

//svn log -l 2 -v <Remote Repo URL> : this command fetches data from the Remote repository for last 2 check-ins
/*client.cmd(['log','-l', '5', '-v', 'https://192.168.54.31/svn/Test_Repo/devops_node_1.1'], function(err, data) {
    console.log(data);
    var str=[data];
    var logs = data.split("------------------------------------------------------------------------");
    var json = [];
    for(var i=1;i<logs.length-1;i++){
     var logData = logs[i].split('|');
     var demo =  logData[3].split("\n");
     
     var  arry2 = [];
     var dummy = [];
     
     _.each(demo,function(data,i){
      if( !(i == 0 || i == 1 || i == (demo.length)-1 || i == (demo.length)-2 || i == (demo.length)-3)){
       dummy.push(data);
      }
      
     });
     var oo = {};
     //callback(JSON.stringify(dummy));   
     _.each(dummy, function(data) {
      var arry1 = data.split(/\s+/);
      
      if(oo[arry1[1]] == undefined){
       oo[arry1[1]] = 1;
      } else {
       oo[arry1[1]]++;
      }
      
     })
     
     //callback(JSON.stringify(oo));   
      var log = {
       revision : logData[0].trim(),
       author : logData[1].trim(),
       checkin_date : logData[2].trim(),
       //lines : logData[3].trim(),
       
       
       
       lines_changed:demo[0].trim(),
       //lines_: demo[1].trim(),
       changed_by:demo[(demo.length)-2].trim(),
       changed_paths:dummy,
     //  test:arry2
              
      };
     _.extend(log, oo);
     json.push(log);
    }
callback(JSON.stringify(json));   
});
} */ 

//svn info -R <Remote Repo URL> : this command fetches data (last check-in) from the Remote repository recursively for all the files.
//client.cmd(['info','-R', 'https://192.168.54.31/svn/Test_Repo/devops_node_1.1'], function(err, data) {
//   console.log('sub command done');
//});

/*module.exports.getProjectData = function(callback){
	
	projectData.getProjectBuildRevisions(20,0,function(data){
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
		
		console.log("Length of build" +builds.length);
		var revision =  builds[0].RevisionNumber + ':' + builds[2].RevisionNumber;
		//callback(revision);
		//Fetches svn changes data for a particular date range in xml format
		getSVNLogForRevision(revision, function(data) {
			console.log("++++++++++++++++++++++++++++++++++++++++++++data = " + data);
			integrateSVNLogSVNDiff(builds[0].RevisionNumber, builds[2].RevisionNumber, data, function(svnDiffResponse){
				callback(svnDiffResponse);
			});
		});
		
		
		/*for(i=0 ; i < builds.length; i++){
			var revision =  builds[i].RevisionNumber + ':' + builds[i+1].RevisionNumber;
			//callback(revision);
			//Fetches svn changes data for a particular date range in xml format
			getSVNLogForRevision(revision, function(data) {
				console.log("++++++++++++++++++++++++++++++++++++++++++++data = " + data);
				integrateSVNLogSVNDiff(builds[i].RevisionNumber, builds[i+1].RevisionNumber, data, function(svnDiffResponse){
					callback(svnDiffResponse);
				});
			});
		}
	});
	
}; 
	
	/*var revision =  builds[0].RevisionNumber + ':' + builds[1].RevisionNumber;
	//Fetches svn changes data for a particular date range in xml format
	getSVNLogForRevision(revision, function(data) {
		console.log("++++++++++++++++++++++++++++++++++++++++++++data = " + data);
		integrateSVNLogSVNDiff(builds[0].RevisionNumber, builds[1].RevisionNumber, data, function(svnDiffResponse){
			callback(svnDiffResponse);
		});
	});

};*/

/**
 * @param builds
 */  module.exports.integrateSVNLogSVNDiff =  function(revisionNumberOld, revisionNumberNew, tempFileData, callback){
	 var svnDiffResponse = {
			totalFiles: 0,
			files: []
	 };
	 module.exports.getUpdatedCodeData(revisionNumberOld, revisionNumberNew, function(data) {
		 
	  _.each(tempFileData.files, function(fileData){
		  _.each(data, function(fileChangeMetadata){
			  //console.log( "fileData = " + fileData.name + " fileChangeMetadata" + fileChangeMetadata.fileName);
			  if(fileData.name.indexOf(fileChangeMetadata.fileName) != -1) {
				  console.log("fileData.name.indexOf(fileChangeMetadata.fileName) = " + fileData.name.indexOf(fileChangeMetadata.fileName));
				  var fileStructureDiffResponse = {
						 "fileData" : fileData,
						 "fileChangeMetadata" : fileChangeMetadata
				  };
				  svnDiffResponse.totalFiles = tempFileData.totalFiles;
				  svnDiffResponse.files.push(fileStructureDiffResponse);
			  }
		  });
	  });
	  callback(svnDiffResponse);
	 });
}

/**
 * 
 */

 module.exports.getSVNLogForRevision = function(list, callback){
	 var dummy1 = [];
	 _.each(list, function(list){
		 console.log("list*************************************" +list);
		var revision  = list;
		 var dummy = {
				   "list" : revision, 
			       totalFiles: 0,
			       files: []
			  	 };
	 client.cmd(['log','--limit', '20', '-v', 'https://192.168.50.66/svn/Test_Repo/CI_1412015', '-r', revision ,'--xml'], function(err, data) {
		 
		 if(err){
			 console.log("error");
			 //callback(err);
		 }
		 
		 else 
		
		 { parseString(data, function (err, result) {
	    	 _.each(result.log.logentry, function(revision,i){
	    	      _.each(revision.paths[0].path, function(file,j){
	    	    	  dummy.totalFiles++;
	    	    	  var revisionData={
	    	    			  name:file._,
	    	    			  "change-type":file.$.action,
	    	    			  author:revision.author[0],
	    	    			  checkinDate:revision.date[0],
	    	    			  revision:revision.$.revision,
	    	    			  //BuildNo:buildNumber,
	    	    	  }
	    	    	  dummy.files.push(revisionData);
	    	      });
	    	  });
	      });
		 }
		 console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!! dummy = " + dummy);
		 dummy1.push(dummy);
	 });
 }); 
 callback(dummy1);
}

// gets updates on files from SVN based on revision number and file path--Ayushi
module.exports.getUpdatedCodeData=function(revisionNumberOld, revisionNumberNew,callback) {
   //var str = (parseInt(revisionNumberOld)+1).toString()
	var path= 'https://192.168.50.66/svn/Test_Repo/CI_1412015@'+revisionNumberOld;
	var pathNew='https://192.168.50.66/svn/Test_Repo/CI_1412015@'+revisionNumberNew;
	var completeRevisionData = getSVNDiffForRevision(path, pathNew, function(completeRevisionData){
		callback(completeRevisionData);	
	});
	

} 
/*client.cmd(['diff', 'https://192.168.54.31/svn/Test_Repo/devops_node_1.1@880','https://192.168.54.31/svn/Test_Repo/devops_node_1.1@881'], function(err, data) {
	  console.log('sub command done'+data);
	  callback(data);
});*/

/**
 * @param path
 * @param pathNew
 */
function getSVNDiffForRevision(path,pathNew, callback){
	var completeRevisionData = [];
	 client.cmd(['diff', path,pathNew], function(err, data) {
		 //callback(data);
		  var files = data.split('===================================================================');
		  var count=0;
		  var filechange;
		  /*get file name from revisions*/
		  _.each(files,function(file){
			  var addedRows=0;
			  var deletedRows=0;
			  var addedLines=[],deletedLines=[];
			  var rows=file.split('\n');
			  var fileName;
			  
			  _.each(rows, function(row) {
				  //console.log("Index of row " + row + " index of --- " + row.trim().indexOf("---"));
				  
				  if(row.trim().indexOf("---") === 0) {
					  
					  var fileNameRow = row.split(/\s+/);
					  fileName = fileNameRow[1];
				  } 
				  if(row.trim().indexOf("-") === 0 && row.indexOf("---") !== 0) { 
					  deletedRows++;
					  deletedLines.push(row);
				  } else if (row.trim().indexOf("+") === 0 && row.indexOf("+++") !== 0) {
					  addedRows++;
					  addedLines.push(row);
				  }
			  });
			  var rowData= {
					"fileName" : fileName,
					"lines-added" : addedRows,
					"linesAdded" : addedLines.join(""),
			  		"lines-deleted" : deletedRows,
			  		"linesDeleted" : deletedLines.join(" ")
			  };
			  completeRevisionData.push(rowData);
		  });
		  callback(completeRevisionData);
	});
}

//Fetches data for a particular revision range
//client.cmd(['log','-v','https://192.168.54.31/svn/Test_Repo/devops_node_1.1', '-r', '250:HEAD','--xml'], function(err, data) {
//   console.log('sub command done');
//});

//Fetches all the code changes from the URL procided ex. diff between 250 revision and HEAD
//client.cmd(['diff', 'https://getusroi.devguard.com/svn/wms20/branches/NonAngular@250','https://getusroi.devguard.com/svn/wms20/branches/NonAngular@HEAD'], function(err, data) {
//    console.log('sub command done'+data);
//});

//Fetches the just the files names added/modified or deleted
//client.cmd(['diff', 'https://getusroi.devguard.com/svn/wms20/branches/NonAngular@248','https://getusroi.devguard.com/svn/wms20/branches/NonAngular@HEAD','--summarize'], function(err, data) {
//    console.log('sub command done');
//});

//svn log -l 10 pom.xml\