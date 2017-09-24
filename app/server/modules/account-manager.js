
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

function getAccounts(callback){
    //console.log(uri);
    MongoClient.connect(uri, function(err, db) {
	//console.log(err);
	//console.log(db.collection('accounts'));
	callback(db.collection('accounts'));
	//db.close();
    });
}

/* login validation methods */

exports.autoLogin = function(email, pass, callback)
{
    getAccounts(function(accounts){
	accounts.findOne({email:email}, function(e, o) {
		if (o){
			o.pass == pass ? callback(o) : callback(null);
		}	else{
			callback(null);
		}
	});
    });
}

exports.manualLogin = function(email, pass, callback)
{
    getAccounts(function(accounts){
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
    });
}

/* record insertion, update & deletion methods */

exports.addNewAccount = function(newData, callback)
{
//find user not needed
    getAccounts(function(accounts){
			accounts.findOne({email:newData.email}, function(e, o) {
			    //console.log('in addNewAccount');
			    //console.log(e);
			    //console.log(o);
				if (o){
					callback('email-taken');
				}	else{
					saltAndHash(newData.pass, function(hash){
						newData.pass = hash;
					// append date stamp when record was created //
						newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
//matched, past, current. 
					        newData.freeSince = moment();
//o.freeSince = moment();
					        newData.matched = false;
					        newData.past = [];
					        newData.current = null;
					        newData.excluded = [];
					        newData.onBreak = true;
						accounts.insert(newData, {safe: true}, callback);
					});
				}
			});
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
    getAccounts(function(accounts){
	accounts.findOne({_id:getObjectId(newData.id)}, function(e, o){
		o.name 		= newData.name;
		//o.email 	= newData.email;
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
    });
}

exports.updatePassword = function(email, newPass, callback)
{
    getAccounts(function(accounts){
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
    });
}

/* account lookup methods */

exports.deleteAccount = function(id, callback)
{
    getAccounts(function(accounts){
	accounts.remove({_id: getObjectId(id)}, callback);
    });
}

exports.getAccountByEmail = function(email, callback)
{
    getAccounts(function(accounts){
	accounts.findOne({email:email}, function(e, o){ callback(o); });
    });
}

exports.getAccountByID = function(id, callback)
{
    getAccounts(function(accounts){
	accounts.findOne({_id:id}, function(e, o){ callback(o); });
    });
}

exports.validateResetLink = function(email, passHash, callback)
{
    getAccounts(function(accounts){
	accounts.find({ $and: [{email:email, pass:passHash}] }, function(e, o){
		callback(o ? 'ok' : null);
	});
    });
}

exports.getAllRecords = function(callback)
{
    getAccounts(function(accounts){
	accounts.find().toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
    });
}

exports.getAllUnmatched = function(callback)
{
    getAccounts(function(accounts){
	accounts.find({matched: false}).toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
    });
}

exports.delAllRecords = function(callback)
{
    getAccounts(function(accounts){
	accounts.remove({}, callback); // reset accounts collection for testing //
    });
}

//takes an OBJECT id
exports.finishConv = function(id, callback)
{
    getAccounts(function(accounts){
    //getObjectId(id)
    //console.log(id);
    //console.log(typeof(id));
    accounts.findOne({_id: id}, function(e, o){
	//console.log(o);
	o.past.push(o.current);
	//o.past = o.past + o.current;
	o.current = null;
	o.matched = false;
	o.freeSince = moment();
	accounts.save(o, {safe: true}, callback);});
	//attempt to match here
    });
}

exports.skipConv = function(id, excl, callback)
{
    getAccounts(function(accounts){
    //getObjectId(id)
    //console.log(id);
    //console.log(typeof(id));
    accounts.findOne({_id: id}, function(e, o){
	//console.log(o);
	if (excl){o.excluded.push(o.current)};
	//o.past = o.past + o.current;
	o.current = null;
	o.matched = false;
	o.freeSince = moment();
	accounts.save(o, {safe: true}, callback);
    });
	//attempt to match here
    });
}

exports.setBreak = function(id, br, callback)
{
    getAccounts(function(accounts){
    accounts.findOne({_id: id}, function(e, o){
	o.onBreak = br;
	accounts.save(o, {safe: true}, callback);
    });
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
    getAccounts(function(accounts){
        accounts.save(o, {safe: true}, callback);
    });
}

exports.findById = function(id, callback)
{
    findById(id, callback);
}

exports.match = function(id, callback)
{
    //assume id is string
    findById(id, function(e0,o){
	if ((!(e0==null)) || o.onBreak || o.current!=null){
	    callback(e0);
	    return;
	}
	//console.log('1');
	exports.getAllUnmatched( function(e, accounts){
	    if (!(e==null)){
		//console.log(e);
		callback(e);
		return;
	    }
	    //console.log(accounts);
	    var sorted = accounts.sort(function(a1,a2){
		if (a1<a2) {return -1};
		if (a1==a2) {return 0};
		return 1;});
	    var filtered = sorted.filter( function(elt) {
		return o.past.indexOf(String(elt._id))==-1 &&
			//not in excluded
		    o.excluded.indexOf(String(elt._id))==-1 &&
			//not in other person's excluded list
		    elt.excluded.indexOf(id)==-1 &&
		    String(elt._id) != id &&
		    !elt.onBreak
	    });
	    //console.log(filtered);
	    if (filtered.length>0) {
		var first_one = filtered[0];
		var other_id = String(first_one._id);
		//can be done in parallel, but I'm not going to bother
		o.matched = true;
		o.current = other_id;
		//console.log('2');
		exports.save(o, function(e2) {//{safe: true}
		    //console.log('2.5');
		    //do the same for the other guy
		    findById(other_id, function(e3,o2){
			//console.log('3');
			//console.log(o2);
			if (o2){
			    o2.matched = true;
			    o2.current = id;
			    //now save
			    exports.save(o2, function(e4) {
				if (!(e4==null)) {
				    callback(e4);
				} else{
				    callback(null, o)
				};
				return;
			    });
			};
		    });
		});
	    }else{
	    	callback(null);
	    };
	});
    });
    //callback(null);
    //return;
};

exports.include = function(id, id2, callback)
{
    //assume id is string
    getAccounts(function(accounts){
    findById(id, function(e0,o){
	if ((!(e0==null))){
	    callback(e0);
	    return;
	}
	o.excluded = o.excluded.filter(function(elt){
	    String(elt._id)!=id2
	});
	accounts.save(o, {safe: true}, function(e) {
	    if (e) callback(e);
	    else callback(null);
	});
    });
    });
};

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
    getAccounts(function(accounts){
	accounts.findOne({_id: getObjectId(id)},
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
    });
}

var findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
    getAccounts(function(accounts){
	accounts.find( { $or : a } ).toArray(
		function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
    });
}
