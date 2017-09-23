# Heart-to-heart

This is built off of [Node-Login](https://nodejs-login.herokuapp.com).

Matches people in a community for conversation.

## Features from Node-Login

* New User Account Creation
* Secure Password Reset via Email
* Ability to Update / Delete Account
* Session Tracking for Logged-In Users
* Local Cookie Storage for Returning Users
* Blowfish-based Scheme Password Encryption


## Heart-to-heart is built on top of the following libraries :

* [Node.js](http://nodejs.org/) - Application Server
* [Express.js](http://expressjs.com/) - Node.js Web Framework
* [MongoDb](http://mongodb.org/) - Database Storage
* [Jade](http://jade-lang.com/) - HTML Templating Engine
* [Stylus](http://stylus-lang.com/) - CSS Preprocessor
* [EmailJS](http://github.com/eleith/emailjs) - Node.js > SMTP Server Middleware
* [Moment.js](http://momentjs.com/) - Lightweight Date Library
* [Twitter Bootstrap](http://twitter.github.com/bootstrap/) - UI Component & Layout Library

## Installation & Setup

1. Install [Node.js](https://nodejs.org/) & [MongoDB](https://www.mongodb.org/) if you haven't already.
2. Clone this repository and install its dependencies.
		
		> git clone git://github.com/holdenlee/heart2heart.git heart2heart
		> cd heart2heart
		> npm install
		
3. In a separate shell start the MongoDB daemon.

		> mongod

4. From within the node-login directory, start the server.

		> node app
		
5. Open a browser window and navigate to: [http://localhost:3000](http://localhost:3000)
