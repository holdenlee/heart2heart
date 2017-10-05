
var EM = {};
module.exports = EM;

EM.server = require("emailjs/email").server.connect(
{
	host 	    : process.env.EMAIL_HOST || 'smtp.gmail.com',
	user 	    : process.env.EMAIL_USER || '2dheart2heart@gmail.com',
    //DON'T Hard-code in
	password    : process.env.EMAIL_PASS,
	ssl		    : true
});

EM.dispatchResetPasswordLink = function(account, callback)
{
	EM.server.send({
		from         : process.env.EMAIL_FROM || 'Heart-to-hearts <2dheart2heart@gmail.com>',
		to           : account.email,
		subject      : 'Password Reset',
		text         : 'something went wrong... :(',
		attachment   : EM.composeEmail(account)
	}, callback );
}

var base_url = process.env.BASE_URL || 'https://localhost:3000';
EM.base_url = base_url;

EM.admin_email = '2dheart2heart@gmail.com';

EM.composeEmail = function(o)
{
	var link = base_url+'/reset-password?e='+o.email+'&p='+o.pass;
	var html = "<html><body>";
		html += "Hi "+o.name+",<br><br>";
		html += "You have requested a password reset for your heart-to-hearts account. ";
		html += "<a href='"+link+"'>Click here to reset your password</a><br><br>";
		html += "Cheers,<br>";
		html += "Holden<br><br>";
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}

var heart_link = base_url + '/hearts';
