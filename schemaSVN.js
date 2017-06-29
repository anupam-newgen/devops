var mongoose=require("mongoose");
//schema for SVN user
module.exports.userSVNSchema = new mongoose.Schema({
	Users:{ 
		userId: String,
		name: String, 
		email: String, 
		password:String, 
		phoneNumber: Number, 
		role: String, 
		projects:[
		{
			projectName: String, 
			projectID: Number
		}]
		}
	});
//schema for project
module.exports.projectSVNSchema=new mongoose.Schema({
				projectName : String ,
				projectStartDate : {type:Date},
				projectEndDate : {type:Date},
				language : {type:String},
				cQuality : 
					{
					cqProjectName : String,
					cqProjectKey : String,
					projectType : String,
					username : String,
					password : String,
					host : String,
					port : String,
					},
				
			
					cDefect : 
					{
					cdProjectName : String,
					cdProjectKey : String,
					projectType : String,
					username : String,
					password : String,
					host : String,
					port : String,
					}
					,
					cIntegration : 
					{
					ciProjectName : String,
					ciProjectKey : String,
					projectType : String,
					username : String,
					password : String,
					host : String,
					port : String,
					}
					,
					cSource :
					{
					csProjectName : String,
					csProjectKey : String,
					projectType : String,
					username : String,
					password : String,
					host : String,
					port : String,
					}
					,
					team : 
						[{
			        	name : String,
			        	role :String,
			        	environment : String,
						}]
			       ,
			server : 
				[{
					environment :String,
					serverName : String,
					serverType : String,
				}]
			 
		
		
	
});
//schema for team
module.exports.teamSVNSchema=new mongoose.Schema({
	Teams:{
		name: String,
		id: String,
		category: [
			{
				name: String,
				id: String,
				subcategory : [ 
					{
						name: String,
						id: String,
						projects : [
							{projectName : String, projectUID : Number}
						]
					},
					{
						name: String,
						id: String
					},
					{
						name: String,
						id: String
					}
				],
	}
			]
}
});
