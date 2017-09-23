//document.getElementById("name").textContent=uname.name;

/* illegal on client side!
var AM = require('./modules/account-manager');
var sprintf = require('sprintf-js').sprintf,
    vsprintf = require('sprintf-js').vsprintf;

var people = document.getElementsByClassName("person");

for (i = 0; i < x.length; i++) {
    AM.getAccountByID(x[i].idn, function(x) {
	//if (x){
	//console.log(x); 
	if (x){
	    x[i].textContent = vsprintf('%s (%s)', [x.name, x.email]);
	};
    });
}*/

var people = Array.prototype.slice.call(document.getElementsByClassName("person"));

console.log(typeof(people));
console.log(people);

var promises = people.map(function(p) {
    fetch("".concat('/getNameAndEmail/?id=', p.getAttribute('idn')))
	.then(function(data) {
	    return (data.text());})
/*
	    t = data.text();
	    if (t=='' || t==null) {
		return "No one";
	    }else{
		return t;
	    }}, function(err) {p.textContent = "No one";})*/
	.then(function(data) {
	    //if (p.tagName=='A'){
		//p.setAttribute('href',concat('/include/?id=', p.getAttribute('idn')));
	    //}else{
	    p.textContent=data;
	    //}
	});
});
//    new Promise((resolve, reject) => {

Promise.all(promises);

//this doesn't work because the fetch stuff happens after iterated through!
/*
for (i = 0; i < people.length; i++) {
    //these can be parallel
    console.log(i);
    console.log(people[i]);
    console.log(people[i].getAttribute('idn'));
    person = people[i];
    fetch("".concat('/getNameAndEmail/?id=', people[i].getAttribute('idn')))
	.then(function(data) {
	    data.text().then(function (text) {
		console.log(text);
		console.log(i);
		//console.log(people[i]);
		console.log(person);
		person.textContent=data;
		//console.log(document.getElementsByClassName("person")[i]);
		//document.getElementsByClassName("person")[i].textContent=data;
		//people[i].textContent=data;
		// do something with the text response 
	    });
	    //console.log(data);
	    //console.log(data['body']);
	    //console.log(people[i]);
	    //people[i].textContent=data;
	    // Here you get the data to modify as you please
	})
	.catch(function(error) {
	    console.log(error);
	    // If there is any error you will catch them here
	});
};
*/
