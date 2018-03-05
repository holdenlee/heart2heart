var crypto 		= require('crypto');
var mongodb 	= require('mongodb');
//var Server 		= require('mongodb').Server;
var MongoClient = mongodb.MongoClient;
var moment 		= require('moment');

/*
	ESTABLISH DATABASE CONNECTION
*/

//don't hardcode in password
var uri = process.env.MLAB_URI || 'mongodb://<dbuser>:<dbpassword>@ds147864.mlab.com:47864/twodh2h'

var QM = {}
module.exports = QM;

// callback
function getQuestions(callback){
    //console.log(uri);
    MongoClient.connect(uri, function(err, db) {
	console.log(err);
	//console.log(db.collection('accounts'));
	//callback(db.collection('questions'));
	callback(db.collection('questions'));
	//db.collection('questions').find({}, function(err1, result){
	//    callback(result);
	//})		       
	//db.close();
    });
}

QM.getAllQs = function(callback)
{
    getQuestions(function(qs){
	qs.find({}).toArray(function(err, result){
	    //console.log(result);
	    callback(result);
	});
    });
}

QM.insertQuestion = function(q, callback)
{
    getQuestions(function(qs){
	qs.insertOne({ user: q.user, question : q.question }, function(err, res){
	    callback(res);
	});
    });
}

/*
QM.getRandomQuestion = function(callback)
{

}
*/
