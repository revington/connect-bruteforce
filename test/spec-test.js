var preventBruteForce = new(require('..'))({
    banFactor: 100,
    banMax: 500
}),
    connect = require('connect'),
    assert = require('assert'),
    request = require('supertest'),
    notifyRequestTime = function (req, res, next) {
        req.time = new Date().getTime();
        next();
    },
    app = connect();
app.use(notifyRequestTime);
app.use(preventBruteForce.prevent);
app.use(function (req, res) {
    var counter = (req.delayed && req.delayed.counter) || 0;
    if (counter === 7) {
        preventBruteForce.unban(req);
    } else {
        preventBruteForce.ban(req);
    }
    res.end(JSON.stringify({
        req: req.time,
        res: new Date().getTime(),
        counter: counter
    }));
});
describe('Increment delay by 100ms on each request up to 500. Unban at eighth.', function () {
    var calls = [],
        lastCall = function () {
            return calls[calls.length - 1];
        };
    after(function () {
        assert(calls.length === 10);
    });
    beforeEach(function (done) {
        request(app).get('/').end(function (err, res) {
            var data = JSON.parse(res.text);
            calls.push({
                delay: data.res - data.req,
                counter: data.counter
            });
            done();
        });
    });
    it('First call. No delay.', function () {
        var lc = lastCall();
        assert(lc.delay < 100);
        assert(lc.counter === 0);
    });
    it('Second call. 100ms delay.', function () {
        var lc = lastCall();
        assert(lc.delay >= 100);
        assert(lc.delay < 200);
        assert(lc.counter === 1);
    });
    it('Third call. 200ms delay.', function () {
        var lc = lastCall();
        assert(lc.delay >= 200);
        assert(lc.delay < 300);
        assert(lc.counter === 2);
    });
    it('Fourth call. 300ms delay.', function () {
        var lc = lastCall();
        assert(lc.delay >= 300);
        assert(lc.delay < 400);
        assert(lc.counter === 3);
    });
    it('Fifth call. 400ms delay.', function () {
        var lc = lastCall();
        assert(lc.delay >= 400);
        assert(lc.delay < 500);
        assert(lc.counter === 4);
    });
    it('Sixth call. 500ms delay', function () {
        var lc = lastCall();
        assert(lc.delay >= 500);
        assert(lc.delay < 600);
        assert(lc.counter === 5);
    });
    it('Seventh call. 500ms delay', function () {
        var lc = lastCall();
        assert(lc.delay >= 500);
        assert(lc.delay < 600);
        assert(lc.counter === 6);
    });
    it('Eighth call. 500ms delay.', function () {
        var lc = lastCall();
        assert(lc.delay >= 500);
        assert(lc.delay < 600);
        assert(lc.counter === 7);
    });
    it('Ninth call. Should be unbanned', function () {
        var lc = lastCall();
        assert(lc.delay < 100);
        assert(!lc.counter);
    });
    it('Tenth call, 100ms delay.', function () {
        var lc = lastCall();
        assert(lc.delay >= 100);
        assert(lc.delay < 200);
        assert(lc.counter === 1);
    });
});
