module.exports = function(config) {
    return {
        default: {
            all: function(req, res, next) {
                if (isRequestForConfiguredHost(req)) {
                    return next();
                }
                redirectToCorrectHost(req, res);
            }
        }
    };

    function isRequestForConfiguredHost(req) {
        return req.header("host").indexOf(config.host) === 0;
    }

    function redirectToCorrectHost(req, res) {
        var url = "http://" + config.host;
        if (config.port && config.port != "80") {
            url += ":" + config.port;
        }
        url += req.originalUrl;
        res.redirect(url, 301);;
    }
};
