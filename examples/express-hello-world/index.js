var express = require('express'),
    bruteforce = require('../../');
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
// Express config
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.bodyParser());
app.use(express.cookieParser('secret'));
app.use(express.session());
// Session-persisted message middleware
app.use(function (req, res, next) {
    var err = req.session.error,
        msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) {
        res.locals.message = '<p class="msg error">' + err + '</p>';
    }
    if (msg) {
        res.locals.message = '<p class="msg success">' + msg + '</p>';
    }
    next();
});
// Routes
app.get('/', function (req, res) {
    res.redirect('/login');
});
app.get('/login', function (req, res) {
    res.render('login', {
        badLoginAttempts: req.delayed && req.delayed.counter || 0
    });
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
    console.log('connect-bruteforce express-hello-world example started on port 3000');
}
