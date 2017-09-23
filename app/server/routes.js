
//var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');

var sprintf = require('sprintf-js').sprintf,
    vsprintf = require('sprintf-js').vsprintf

//repeated code
var getObjectId = function(id)
{
	return new require('mongodb').ObjectID(id);
}

//question: how is current/past stored?
var getCurrentName = function(o, callback)
{
    //should be ID object
    console.log('getCurrentName');
    //console.log(o.current);
    if (o==null || o.current==null) {
	callback(null);
	return;
    }
    AM.getAccountByID(o.current, function(x) {
	//if (x){
	console.log(x); 
	if (x){
	    callback([x.name, x.email]);
	}else{
	    callback(null);
	};
    });
    /*AM.getAccountByID(o.current, function(x) {
	callback(x.name,x.email);
    });*/
}

var getNameAndEmail = function(id, callback)
{
    AM.findById(id, function(e,o) {
	console.log('getNameAndEmail');
	console.log(e);
	console.log(o);
	if (o){
	    callback([o.name, o.email]);
	}else{
	    callback(null);
	};
    });
/*    AM.getAccountByID(id, function(x) {
	if (x){
	    callback([x.name, x.email]);
	}else{
	    callback(null);
	};
    });*/
}
/*
var getAllNames = function(o, callback)
{
    AM.getAccountByID(o.current, function(x) {
	//if (x){
	console.log(x); 
	if (x){
	    callback([x.name, x.email]);
	}else{
	    callback(null);
	};
    });
}
*/
var getFormattedName = function(o, callback)
{
    getCurrentName(o, function(x) {
	if (x){
	    callback(vsprintf('%s (%s)', x));
	}else{
	    callback(null);
	}
    });
}

module.exports = function(app) {

// main login page //
	app.get('/', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
				    //should this be blocking or not?
				    //getCurrentName(o, function(name, email) {req.session.user.currentName = vsprintf('%s (%s)', [name, email]); console.log(req.session.user)});
				    getFormattedName(o, function(x){
					if (x){req.session.user.currentName = x;};
					//req.session.user.currentName = 
					res.redirect('/home');
				    });
				}else{
				    res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});
	
	app.post('/', function(req, res){
		AM.manualLogin(req.body['email'], req.body['pass'], function(e, o){
			if (!o){
				res.status(400).send(e);
			}	else{
				req.session.user = o;
			        //getCurrentName(o, function(name, email) {req.session.user.currentName = vsprintf('%s (%s)', [name, email]); console.log(req.session.user)});
			        getFormattedName(o,function(x){
				    if (x){
					req.session.user.currentName = x;};
			            console.log(req.session.user);
				    if (req.body['remember-me'] == 'true'){
					res.cookie('email', o.email, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				    }
				    res.status(200).send(o);
				});
			}
		});
	});
	
// logged-in user homepage //
	
	app.get('/home', function(req, res) {
		if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
			res.redirect('/');
		}	else{
			res.render('home', {
				title : 'Control Panel',
				//countries : CT,
				udata : req.session.user
			});
		}
	});
	
	app.post('/home', function(req, res){
		if (req.session.user == null){
			res.redirect('/');
		}	else{
			AM.updateAccount({
				id		: req.session.user._id,
				name	: req.body['name'],
				email	: req.body['email'],
				pass	: req.body['pass'],
				country	: req.body['country']
			}, function(e, o){
				if (e){
					res.status(400).send('error-updating-account');
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('email', o.email, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.status(200).send('ok');
				}
			});
		}
	});

	app.post('/logout', function(req, res){
		res.clearCookie('email');
		res.clearCookie('pass');
		req.session.destroy(function(e){ res.status(200).send('ok'); });
	})
	
// creating new accounts //
	
	app.get('/signup', function(req, res) {
		res.render('signup', {  title: 'Signup'//, countries : CT 
				     });
	});
	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.body['name'],
			email 	: req.body['email'],
			//user 	: req.body['user'],//
			pass	: req.body['pass'],
			country : req.body['country']
		}, function(e){
			if (e){
				res.status(400).send(e);
			}	else{
				res.status(200).send('ok');
			}
		});
	});

// password reset //

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.body['email'], function(o){
			if (o){
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// TODO add an ajax loader to give user feedback //
					if (!e){
						res.status(200).send('ok');
					}	else{
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			}	else{
				res.status(400).send('email-not-found');
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		var nPass = req.body['pass'];
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.status(400).send('unable to update password');
			}
		})
	});
	
// view & delete accounts //
	
	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});
	
	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('email');
				res.clearCookie('pass');
				req.session.destroy(function(e){ res.status(200).send('ok'); });
			}	else{
				res.status(400).send('record not found');
			}
	    });
	});
	//THIS SHOULD BE POST
	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});
        //need to pass user information
	app.get('/hearts', function(req, res) {
	        //if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
		//	res.redirect('/');
		//}	else{
		    //call by value (sortof) means this is hard to abstract to another function. https://stackoverflow.com/questions/518000/is-javascript-a-pass-by-reference-or-pass-by-value-language
	    AM.refresh(req.session.user, function(e,o){
		if (e){
		    res.redirect('/');
		}else{
		    console.log(o);
		    req.session.user = o;
		    getFormattedName(o, function(x){
			if (x){
			    req.session.user.currentName = x;
			}
			res.render('hearts', {
			    title : 'Your heart-to-hearts',
			    udata : req.session.user
			});
		    });
		};
	    });
	});
	app.get('/matchtest', function(req, res) {
	    //req.session.user
	    //get accounts... 
	    console.log(req.session.user.past);
	    console.log(req.session.user.excluded);
	    res.redirect('hearts');
	    /*res.render('hearts', {
		title : 'Your heart-to-hearts',
		udata : req.session.user
	    });*/
	});
        /*app.get('/resetall',function(req, res) {
	    res.redirect('/print');
	});*/
        //THIS SHOULD BE POST
        app.get('/resetall', function(req, res) {
	    AM.getAllRecords( function(e, accounts) {
		//for (a in accounts) {
		for (i = 0, len = accounts.length; i < len; i++){
		    a = accounts[i];
		    a.matched = false;
		    a.past = [];
		    a.excluded = [];
		    a.current = null;
		    a.onBreak = true;
		    //console.log(a);
		    AM.save(a, {safe: true}, function(e) {});
		};
		res.redirect('/print');
	    });
	});
        //THIS SHOULD BE POST
	app.get('/match', function(req, res) {
	    //if already matched, don't match!
	    if (req.session.user == null || req.session.user.current != null) {
		res.redirect('/hearts');
	    } else {
	    //get accounts... 
	  	AM.getAllUnmatched( function(e, accounts){
		    console.log(accounts);
		    sorted = accounts.sort(function(a1,a2){
			a1.freeSince > a2.freeSince})
		    var filtered = sorted.filter( function(elt) {
			//not in past
			//console.log(req.session.user.past.indexOf(elt._id));
			//console.log('match_types');
			//console.log(typeof(elt._id));//object
			//console.log(typeof(req.session.user._id));//string
			//console.log(String(elt._id));
			//console.log(req.session.user._id);
			//console.log(req.session.user.past);
			// past : [string]
			return req.session.user.past.indexOf(String(elt._id))==-1 &&
			//not in excluded
			    req.session.user.excluded.indexOf(String(elt._id))==-1 &&
			//not in other person's excluded list
			    elt.excluded.indexOf((req.session.user._id))==-1 &&
			    String(elt._id) != req.session.user._id &&
			    !elt.onBreak
		    });
		    console.log(filtered);
		    //get first
		    if (filtered.length>0) {
			var first_one = filtered[0];
			var other_id = first_one._id;
			console.log('req_body');
			console.log(req.body);
			var this_id = getObjectId(req.session.user._id);//THIS IS IMPORTANT!
			    //req.body['_id']; //THIS IS NULL
			console.log(other_id);
			console.log(this_id);
			console.log(typeof(other_id));
			console.log(typeof(this_id));
			//get this record and set the matched field
			AM.getAccountByID(this_id, function(o){ //why is this null?
			    console.log(o);
			    if (o){
				//!
				req.session.user = o;
				o.matched = true;
				o.current = other_id;
				//data consistency problems!
				//req.session.user.matched = true;
				//req.session.user.current = other_id;
				//now save
				//this is repeated code from account-manager
				AM.save(o, {safe: true}, function(e) {});
			    };
			});
			//do the same for the other guy
			AM.getAccountByID(other_id, function(o){
			    console.log(o);
			    if (o){
				o.matched = true;
				o.current = this_id;
				//now save
				//this is repeated code from account-manager
				AM.save(o, {safe: true}, function(e) {});
				req.session.user.currentName = vsprintf('%s (%s)', [o.name, o.email]);
				console.log(req.session.user);
			    };
			});
		    //redirect to hearts
		    };
		    res.redirect('hearts');
		    /*res.render('hearts', {
			title : 'Your heart-to-hearts',
			udata : req.session.user
		    });*/
		});
	    };
	});
        //THIS SHOULD BE POST
	app.get('/finish', function(req, res) {
	    //! if not logged in...
	    console.log('finish');
	    if (req.session.user.matched ==true){
		console.log('matched');
		AM.finishConv(getObjectId(req.session.user._id), function(e1){
		    //!Why is this a string?
		    AM.finishConv(getObjectId(req.session.user.current), function(e2){
			//! should re-match based on order
			//data duplication...
			/*
			req.session.user.past.push(req.session.user.current);
			req.session.user.currentName = null;
			req.session.user.matched = false;
			req.session.user.current = null;
			*/
			//res.redirect('/hearts');
			/*
			res.render('hearts', {
			    title : 'Your heart-to-hearts',
			    udata : req.session.user
			});*/
			if (req.session.user.onBreak) {
			    res.redirect('/hearts');
			}else{
			    AM.refresh(req.session.user, function(e,o){
				if (e){
				    res.redirect('/');
				}else{
				    req.session.user = o;
				    res.redirect('/match');
				}
			    });
			};
		    });
		});
	    }
	});
        //THIS IS A COPY OF FINISH EXCEPT THAT IT GOES TO EXCLUDED PILE
	app.get('/skip', function(req, res) {
	    //! if not logged in...
	    console.log('skip');
	    if (req.session.user.matched ==true){
		console.log('matched');
		AM.skipConv(getObjectId(req.session.user._id), function(e1){
		    //!Why is this a string?
		    AM.skipConv(getObjectId(req.session.user.current), function(e2){
			//also need do with other person
			if (req.session.user.onBreak) {
			    res.redirect('/hearts');
			}else{
			    AM.refresh(req.session.user, function(e,o){
				if (e){
				    res.redirect('/');
				}else{
				    req.session.user = o;
				    res.redirect('/match');
				}
			    });
			};
		    });
		});
	    }
	});
	app.get('/break', function(req, res) {
	    //! if not logged in...
	    if (req.session.user != null){
		AM.setBreak(getObjectId(req.session.user._id), true, function(e1){
		    res.redirect('/hearts');
		});
	    };
	});
	app.get('/resume', function(req, res) {
	    //! if not logged in...
	    if (req.session.user != null){
		AM.setBreak(getObjectId(req.session.user._id), false, function(e1){
		    //attempt to rematch
		    AM.refresh(req.session.user, function(e,o){
			if (e){
			    res.redirect('/');
			}else{
			    req.session.user = o;
			    res.redirect('/match');
			}
		    });
		    //res.redirect('/hearts');
		});
	    };
	});


    app.get('/getNameAndEmail', function(req,res) {
	console.log(req.query);
	getNameAndEmail(req.query['id'], function(x) {
	    console.log(x);
	    if (x){
		res.send(vsprintf('%s (%s)', x));
	    }else{
		res.send('');
	    };
	});
    });

	
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });


};
