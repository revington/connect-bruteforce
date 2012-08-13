exports = module.exports = function (options) {
    var self = this,
        settings = options || {};
    settings.banMax = settings.banMax || 30 * 1000;
    settings.banFactor = settings.banFactor || 2 * 1000;
    self.db = {};
    self.clientID = function (req) {
        return req.connection.remoteAddress;
    };
    self.delay = function (responseAt, next) {
        if (responseAt < new Date().getTime()) {
            next();
        } else {
            process.nextTick(function(){self.delay(responseAt, next);});
        }
    };
    self.responseAt = function (delay) {
        var factor = Math.min(delay.counter * settings.banFactor, settings.banMax);
        return new Date().getTime() + factor;
    };
    self.prevent = function (req, res, next) {
        req.delayed = self.db[self.clientID(req)];
        if (req.delayed) {
            var responseAt = self.responseAt(req.delayed);
            process.nextTick(function(){self.delay(responseAt, next);});
        } else {
            next();
        }
    };
    self.ban = function (req) {
        var clientID = self.clientID(req),
            delay = self.db[clientID] || (self.db[clientID] = {
                at: new Date(),
                counter: 0
            });
        delay.counter++;
        delay.lastTimeBanned = new Date();
    };
    self.unban = function (req) {
        delete self.db[self.clientID(req)];
				delete req.delayed;
    };
};
