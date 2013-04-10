exports = module.exports = function (options) {
    var self = this,
        settings = options || {};
    settings.banMax = settings.banMax || 30 * 1000;
    settings.banFactor = settings.banFactor || 2 * 1000;
    self.db = {};
    self.clientID = function (req) {
        return req.connection.remoteAddress;
    };

    function delayResponse(req, res, next) {
        var factor = Math.min(req.delayed.counter * settings.banFactor, settings.banMax);
        setTimeout(function (next) {
            next();
        }, factor, next);
    }
    self.prevent = function (req, res, next) {
        req.delayed = self.db[self.clientID(req)];
        if (req.delayed) {
            delayResponse(req, res, next);
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
