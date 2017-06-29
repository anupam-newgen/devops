// Retrieve Modules 
var MongoClient = require('mongodb').MongoClient, Server = require('mongodb').Server;

// Connect to the db (Change Db Address Accordingly)
var mongoClient = new MongoClient(new Server('127.0.0.1', 27017, {
	'native_parser' : true
}));
var db = mongoClient.db('node');

// insertion in MongoDB
module.exports.insertIntoDB = function(collection, data) {
	db.collection(collection).insert(data, {
		w : 1
	}, function(err, result) {
	});
};

// Retrieving Latest Data from MongoDB
module.exports.getDataLatest = function(collectionName,callback) {
	var collection = db.collection(collectionName);
	collection.find().sort({$natural: -1}).limit(1).toArray(function(err,results){
		if (err)
			console.log("err"+err);
		else
			{
			/*console.log("hi"+results[0]);*/
			callback(results[0]);
			}
	});
};
 
// Retrieving All Data From Db (Limit 25)
module.exports.getData = function(collectionName,callback) {
	var collection = db.collection(collectionName);
	collection.find().limit(25).toArray(function(err,results){
		if (err)
			console.log("err"+err);
		else
			{
			callback(results);
			}
	});
};

// Retrieving Data using Query along with options Field
module.exports.queryData = function(collectionName, options, callback) {
	var collection = db.collection(collectionName);
	console.log('options : '+JSON.stringify(options));
	collection.find(options).toArray(function(err, results) {
		if (err) {
			console.log('err'+err);
		} else {
			/*console.log('data'+results);*/
			callback(results);
		}
	});
};

// use queryData instead of this
module.exports.getTimestampData = function(collectionName, timestamp, callback) {
	var collection = db.collection(collectionName);
	collection.find({
		timestamp : {
			$lte : timestamp + 300000,
			$gte : timestamp - 300000
		}
	}).toArray(function(err, results) {
		if (err)
			console.log(err);
		else
			callback(results[0]);
		//console.log("result"+ JSON.stringify(results));
	});
};


mongoClient.open(function(err, mongoclient) {
	if (!err)
		console.log("DB Server Started");
	else
		console.log("Error starting DB Server");
});
