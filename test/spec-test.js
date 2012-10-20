var bf = require('..'),
    assert = require('assert'),
    http = require('http'),
    express = require('express');
describe('Increment delay by 100ms on each request up to 500. Unban at eighth.', function () {
    var calls = [],
        app = express(),
        // set up a benji instance
        m = new bf({
            banFactor: 100,
            banMax: 500
        }),
        options = {
            host: '0.0.0.0',
            port: 4000,
            path: '/',
            method: 'GET'
        },
        notifyRequestTime = function (req, res, next) {
            var now = new Date();
            req.time = now.getTime();
            next();
        };
    app.get('*', notifyRequestTime, m.prevent, function (req, res) {
        var counter = (req.delayed && req.delayed.counter) || 0;
        if (counter === 7) {
            m.unban(req);
        } else {
            m.ban(req);
        }
        res.json({
            req: req.time,
            res: new Date().getTime(),
            counter: counter
        });
    });
    var lastCall = function () {
            return calls[calls.length - 1];
        };
    before(function (done) {
        var server = app.listen(4000, function () {
            done();
        });
    });
    after(function () {
			assert(calls.length === 10);
    });
    beforeEach(function (done) {
        var data = '';
        http.get(options, function (res) {
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                data = JSON.parse(data);
                calls.push({
                    delay: data.res - data.req,
                    counter: data.counter
                });
                done();
            });
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
