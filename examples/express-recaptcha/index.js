var express = require('express'),
    bruteforce = require('../../'),
    Recaptcha = require('recaptcha').Recaptcha;
// Express application
var app = module.exports = express(),
    // Set max delay and factor in ms
    loginBruteForce = new bruteforce({
        banFactor: 500,
        banMax: 2000
    });

function authenticate(name, password, callback) {
    if (name === 'root' && password === 'root') {
        return callback(null, 'root');
    } else {
        return callback(new Error('bad login'));
    }
}

function restrict(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied';
        res.redirect('/login');
    }
}
//////////////////////////////////////////////////////////////////
// Recaptcha integration
//
// We require recaptcha validation after a *number* of
// bad logins.
//
//////////////////////////////////////////////////////////////////

function requireRecaptchaAfterTries(number) {
    /*
     * Recaptcha keypair
     * http://www.google.com/recaptcha/whyrecaptcha
     */
    var recaptchaKeys = {
        PUBLIC: '6Ler-9cSAAAAALgxcaiMpgfDb6tL36IvM2dCb7g7',
        PRIVATE: '6Ler-9cSAAAAAMO0RJB39zFvYwLHvykldkml2uWK'
    };
    return function (req, res, next) {
        var badAttempts = req.delayed && req.delayed.counter || -1;
        // Note: We show recaptcha form PRIOr to require it
        if (badAttempts >= number) {
            req.session.recaptchaForm = (new Recaptcha(recaptchaKeys.PUBLIC, recaptchaKeys.PRIVATE)).toHTML();
        }
        if ((req.requireRecaptcha = badAttempts > number)) {
            var data = {
                remoteip: req.connection.remoteAddress,
                challenge: req.body.recaptcha_challenge_field,
                response: req.body.recaptcha_response_field
            },
                recaptcha = new Recaptcha(recaptchaKeys.PUBLIC, recaptchaKeys.PRIVATE, data);
            recaptcha.verify(function (success, error) {
                req.isValidRecaptcha = {
                    success: success,
                    error: error
                };
                next();
            });
        } else {
            next();
        }
    };
}
/*
 * Just a simple middleware to redirect bad
 */

function redirectToLoginOnBadRecaptcha(req, res, next) {
    if (!req.requireRecaptcha || req.isValidRecaptcha.success) {
        next();
    } else {
        req.session.error = 'Authentication failed. Bad captcha';
        loginBruteForce.ban(req);
        res.redirect('login');
    }
}
var recaptchaValidation = [requireRecaptchaAfterTries(3), redirectToLoginOnBadRecaptcha];
// Express config
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.bodyParser());
app.use(express.cookieParser('secret'));
app.use(express.session());
// Session-persisted message middleware
app.use(function (req, res, next) {
    var err = req.session.error,
        msg = req.session.success,
        recaptchaForm = req.session.recaptchaForm || '';
    delete req.session.error;
    delete req.session.success;
    delete req.session.recaptchaForm;
    res.locals.message = '';
    if (err) {
        res.locals.message = '<p class="msg error">' + err + '</p>';
    }
    if (msg) {
        res.locals.message = '<p class="msg success">' + msg + '</p>';
    }
    res.locals.recaptcha_form = recaptchaForm;
    next();
});
// Routes
app.get('/', function (req, res) {
    res.redirect('/login');
});
app.get('/login', function (req, res) {
    res.render('login');
});
// Just add recaptchaValidation to the url
app.post('/login', loginBruteForce.prevent, recaptchaValidation, function (req, res, next) {
    authenticate(req.body.username, req.body.password, function (err, user) {
        if (user) {
            req.session.user = user;
            loginBruteForce.unban(req);
            req.session.success = 'Authenticated as ' + user + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/restricted">/restricted</a>.';
            delete req.session.recaptchaForm;
            res.redirect('back');
        } else {
            loginBruteForce.ban(req);
            req.session.error = 'Authentication failed. Hint u: root, p: root';
            res.redirect('login');
        }
    });
});
app.get('/logout', function (req, res) {
    req.session.destroy(function () {
        res.redirect('/');
    });
});
app.all('/restricted', restrict, function (req, res) {
    res.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
});
if (!module.parent) {
    app.listen(3000);
    console.log('connect-bruteforce express-recaptcha example started on port 3000');
}
