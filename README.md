[![build status](https://secure.travis-ci.org/revington/connect-bruteforce.png)](http://travis-ci.org/revington/connect-bruteforce)
# connect-bruteforce

> A connect middleware to prevent brute force by delaying responses.

## Install 
	$ npm install connect-bruteforce

## Usage (express)

	// See examples/express-hello-world/index.js
	var loginBruteforce = require('connect-bruteforce')();

	app.get('/login', function (req, res) {
    	res.render('login');
	});
	app.post('/login', loginBruteForce.prevent, function (req, res, next) {
    	authenticate(req.body.username, req.body.password, function (err, user) {
        	if (user) {
            	req.session.user = user;
            	loginBruteForce.unban(req);
            	req.session.success = 'Authenticated as ' + user + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/restricted">/restricted</a>.';
            	res.redirect('back');
        	} else {
            	loginBruteForce.ban(req);
            	req.session.error = 'Authentication failed. Hint u: root, p: root';
            	res.redirect('login');
        	}
    	});
	});
