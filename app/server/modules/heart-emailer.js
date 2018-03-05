var AM = require('./account-manager');
var EM = require('./email-dispatcher');

var HM = {};
module.exports = HM;

//callback(e,o)
HM.matchAndEmail = function(id, callback)
{
    //console.log('matchAndEmail')
    AM.match(id, function(e,o){
	if (o==null){//if not matched, don't dispatch emails!
	    //console.log('invalid match');
	    callback(e);
	}else{
	    //console.log('valid match');
	    HM.dispatchHeartEmails(id, callback);
	};
    });
}

HM.dispatchHeartEmails = function(id, callback)
{
    //console.log('2 emails');
    HM.dispatchHeartEmail(id, function(e, acct){
	if (!(e==null)){
	    callback(e);
	}else{
	    HM.dispatchHeartEmail(acct.current, function(e,acct2){
		callback(null,acct); //acct is intentional here
	    });
	}
    });
}

//do this twice
HM.dispatchHeartEmail = function(id, callback)
{
    //console.log('1 email');
    console.log('emailing');
    AM.findById(id, function(e,account){
	if (!(e==null)){
	    console.log(e);
	    callback(e);
	    return;
	}
	HM.heartEmail(account, function(e2,message){
	    if (!(e2==null)){
		console.log(e2);
		callback(e2);
		return;
	    };
	    EM.server.send({
		from         : process.env.EMAIL_FROM || 'Heart-to-hearts',
		to           : account.email,
	        cc           : EM.admin_email,
		subject      : 'Your heart-to-heart',
		text         : 'something went wrong... :(',
		attachment   : message
	    }, function(e3, message3){
		if (!(e3==null)){
		    console.log(e3);
		    callback(e3);
		}else{
		    console.log(message);
		    callback(null,account);
		};
	    });
	});
    });
};


HM.heartEmail = function(o, callback)
{
    AM.findById(o.current, function(e,o1){
	if (!(e==null)){
	    callback(e);
	}
	var heart_link = EM.base_url + '/hearts';
	var q_link = EM.base_url + '/questions';
	var html = "<html><body>";
	html += "Dear "+o.name+",<br><br>";
	html += "Thanks for participating in Artichoke Heart-to-Hearts! Your next conversation partner is "+o1.name+" ("+o1.email+").<br><br>";
	html += "Get in touch and schedule a meal and conversation (or other activity) together sometime this coming week.<br><br>";
	html += "For inspiration, check out <a href='"+q_link+"'>the conversation menu</a> (and add your own questions!).<br><br>"
	html += "Once you have finished your conversation, please log on to <a href='"+heart_link+"'>Heart-to-Hearts</a> and get your next match. (Only one person needs to do this.) If you will not be available, please change your availability beforehand.<br><br>";
	html += "Cheers,<br>";
	html += "Holden<br><br>";
	html += "</body></html>";
	callback(null, [{data:html, alternative:true}]);
    });
}


/*
Dear %s,

Thanks for participating in Artichoke Heart-to-Hearts! Your conversation partner is

%s %s

Get in touch and schedule a meal and conversation (or other activity) together sometime this coming week. 

Once you have finished your conversation, please log on to <a href=\"heart_link\">Heart-to-Hearts</a> and get your next match. (Only one person needs to do this.) If you will not be available, please change your availability beforehand.

Cheers,
Holden 
*/
