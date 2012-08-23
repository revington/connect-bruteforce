[![build status](https://secure.travis-ci.org/revington/connect-bruteforce.png)](http://travis-ci.org/revington/connect-bruteforce)
# connect-bruteforce

> A connect middleware to prevent bruteforce.

## Example:

```js
// A simple application
// we want to require a captcha validation after 3 
// failed login attemts. 

// We want to introduce a delay in server response.
// Each failed login increments delay by 2 seconds. 
// With a maximun delay of 30 seconds.

var bruteForce = new (require('connect-bruteforce'))({banFactor: 2000, banMax: 30000});

/*...*/

app.post('/login', bruteForce.prevent, function(req,res){
	var useCaptcha = res.delay && res.delay.counter > 3;
	if(req.body.login === 'user' && req.body.password === 'root' && (!useCaptcha || testCaptcha(req))){
		// just in case client was already banned
		bruteForce.unban(req);
		// set user in session and bla, bla, bla…
		res.render('members');
	}else{
		bruteForce.ban(req);
	}
	res.render('login', {badLogin: true, useCaptcha: useCaptcha});
});

/*...*/

```
## Install 
	$ npm install connect-bruteforce

