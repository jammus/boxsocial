
module.exports = function(config) {
    return {
        default: {
            all: function(req, res, next) {
                if (req.header("host").indexOf(config.host) != 0) {
                    var url = "http://" + config.host;
                    if (config.port && config.port != "80") {
                        url += ":" + config.port;
                    }
                    url += req.originalUrl;
                    res.redirect(url);;
                    return;
                }
                next();
            }
        }
    };
};
