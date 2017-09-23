
var crypto 		= require('crypto');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;
var moment 		= require('moment');

/*
	ESTABLISH DATABASE CONNECTION
*/

var dbName = process.env.DB_NAME || 'node-login';
var dbHost = process.env.DB_HOST || 'localhost'
var dbPort = process.env.DB_PORT || 27017;

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
db.open(function(e, d){
	if (e) {
		console.log(e);
	} else {
		if (process.env.NODE_ENV == 'live') {
			db.authenticate(process.env.DB_USER, process.env.DB_PASS, function(e, res) {
				if (e) {
					console.log('mongo :: error: not authenticated', e);
				}
				else {
					console.log('mongo :: authenticated and connected to database :: "'+dbName+'"');
				}
			});
		}	else{
			console.log('mongo :: connected to database :: "'+dbName+'"');
		}
	}
});

var accounts = db.collection('accounts');

/* login validation methods */

exports.autoLogin = function(email, pass, callback)
{
	accounts.findOne({email:email}, function(e, o) {
		if (o){
			o.pass == pass ? callback(o) : callback(null);
		}	else{
			callback(null);
		}
	});
}

exports.manualLogin = function(email, pass, callback)
{
	accounts.findOne({email:email}, function(e, o) {
		if (o == null){
			callback('user-not-found');
		}	else{
			validatePassword(pass, o.pass, function(err, res) {
				if (res){
					callback(null, o);
				}	else{
					callback('invalid-password');
				}
			});
		}
	});
}

/* record insertion, update & deletion methods */

exports.addNewAccount = function(newData, callback)
{
//find user not needed
			accounts.findOne({email:newData.email}, function(e, o) {
				if (o){
					callback('email-taken');
				}	else{
					saltAndHash(newData.pass, function(hash){
						newData.pass = hash;
					// append date stamp when record was created //
						newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
//matched, past, current. 
					        newData.freeSince = moment().format('MMMM Do YYYY, h:mm:ss a');
					        newData.matched = false;
					        newData.past = [];
					        newData.current = null;
					        newData.excluded = [];
					        newData.onBreak = true;
						accounts.insert(newData, {safe: true}, callback);
					});
				}
			});
}
/*
exports.test = function(callback)
{
    exports.newAccount
}
*/

exports.updateAccount = function(newData, callback)
{
	accounts.findOne({_id:getObjectId(newData.id)}, function(e, o){
		o.name 		= newData.name;
		o.email 	= newData.email;
		o.country 	= newData.country;
		if (newData.pass == ''){
		    //need to save!
			accounts.save(o, {safe: true}, function(e) {
				if (e) callback(e);
				else callback(null, o);
			});
		}	else{
			saltAndHash(newData.pass, function(hash){
				o.pass = hash;
				accounts.save(o, {safe: true}, function(e) {
					if (e) callback(e);
					else callback(null, o);
				});
			});
		}
	});
}

exports.updatePassword = function(email, newPass, callback)
{
	accounts.findOne({email:email}, function(e, o){
		if (e){
			callback(e, null);
		}	else{
			saltAndHash(newPass, function(hash){
		        o.pass = hash;
		        accounts.save(o, {safe: true}, callback);
			});
		}
	});
}

/* account lookup methods */

exports.deleteAccount = function(id, callback)
{
	accounts.remove({_id: getObjectId(id)}, callback);
}

exports.getAccountByEmail = function(email, callback)
{
	accounts.findOne({email:email}, function(e, o){ callback(o); });
}

exports.getAccountByID = function(id, callback)
{
	accounts.findOne({_id:id}, function(e, o){ console.log(e);console.log(o);callback(o); });
}

exports.validateResetLink = function(email, passHash, callback)
{
	accounts.find({ $and: [{email:email, pass:passHash}] }, function(e, o){
		callback(o ? 'ok' : null);
	});
}

exports.getAllRecords = function(callback)
{
	accounts.find().toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

exports.getAllUnmatched = function(callback)
{
	accounts.find({matched: false}).toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

exports.delAllRecords = function(callback)
{
	accounts.remove({}, callback); // reset accounts collection for testing //
}

exports.finishConv = function(id, callback)
{
    //getObjectId(id)
    console.log(id);
    console.log(typeof(id));
    accounts.findOne({_id: id}, function(e, o){
	console.log(o);
	o.past.push(o.current);
	//o.past = o.past + o.current;
	o.current = null;
	o.matched = false;
	accounts.save(o, {safe: true}, callback);});
	//attempt to match here
}

exports.skipConv = function(id, callback)
{
    //getObjectId(id)
    console.log(id);
    console.log(typeof(id));
    accounts.findOne({_id: id}, function(e, o){
	console.log(o);
	o.excluded.push(o.current);
	//o.past = o.past + o.current;
	o.current = null;
	o.matched = false;
	accounts.save(o, {safe: true}, callback);
    });
	//attempt to match here
}

exports.setBreak = function(id, br, callback)
{
    accounts.findOne({_id: id}, function(e, o){
	o.onBreak = br;
	accounts.save(o, {safe: true}, callback);
    });
}


exports.refresh = function(o, callback)
{
    //accounts.findOne({_id:id}, function(e, o){ callback(o); });
    //console.log('refreshing');
    //console.log(typeof(o._id));
    try{
	id = o._id;
    }catch(err){
	callback(err);
	return;
    }
    findById(id, callback);
    //exports.getAccountByID({_id: getObjectId(o._id)}, callback);
}

// also: removeHearted //BAD - don't use
/*
exports.addHearted = function(id, id2, callback)
{
    accounts.findOne({_id: getObjectId(id)}, function(e, o){
		o.past 		= o.past + id2;
		if (e) callback(e);
		else callback(null, o);
	});
}
*/
exports.save = function(o, callback)
{
    accounts.save(o, {safe: true}, callback);
}

exports.findById = function(id, callback)
{
    findById(id, callback);
}

// unnecessary because object id's exist
/*
exports.getMax = function(callback)
{
    accounts.
}
*/

/* private encryption & validation methods */

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
}

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback)
{
	var salt = generateSalt();
	callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
	var salt = hashedPass.substr(0, 10);
	var validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
}

var getObjectId = function(id)
{
    //I need this error to propagate!
    try{
	return new require('mongodb').ObjectID(id);
    }catch(err){
	return null;
    }
}

var findById = function(id, callback)
{
	accounts.findOne({_id: getObjectId(id)},
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
}

var findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	accounts.find( { $or : a } ).toArray(
		function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
}
