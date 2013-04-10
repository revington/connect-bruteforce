function clientID(req) {
    return req.connection.remoteAddress;
}

function connectBruteForce(options) {
    var self = this;
    optinons = options || {};
    options.banMax = options.banMax || 30 * 1000;
    options.banFactor = options.banFactor || 2 * 1000;
    this.db = {};

    function delayResponse(req, res, next) {
        var factor = Math.min(req.delayed.counter * options.banFactor, options.banMax);
        setTimeout(function (next) {
            next();
        }, factor, next);
    }
    this.prevent = function (req, res, next) {
        req.delayed = self.db[clientID(req)];
        if (req.delayed) {
            delayResponse(req, res, next);
        } else {
            next();
        }
    };
}
exports = module.exports = connectBruteForce;
connectBruteForce.prototype.ban = function (req) {
    var client = clientID(req),
        delay = this.db[client] || (this.db[client] = {
            at: new Date(),
            counter: 0
        });
    delay.counter++;
    delay.lastTimeBanned = new Date();
};
connectBruteForce.prototype.unban = function (req) {
    delete this.db[clientID(req)];
    delete req.delayed;
};
