require("./common");

var Fakes = require("./Fakes"),
    DefaultController = require("../controllers/defaultcontroller");

(function() {
    var configuredHost, host, config, request, response, requestHost, gently;

    describe("The default controller")

    before(function() {
        configuredHost = "boxsocial.fm";
        config = {
            host: configuredHost
        };
        request = new Fakes.Request();
        response = new Fakes.Response();
        request.originalUrl = "/somepath?key=value";
        gently = new Gently();
    });

    it("passes to the next controller if host of request matches configuration", function() {
        whenRequestHostIs(configuredHost);
        deferControll();
    });

    it("redirects to the correct host if request does not match configuration", function() {
        whenRequestHostIs("www.boxsocial.fm");
        expect301RedirectTo("http://boxsocial.fm/somepath?key=value");
    });

    it("includes port in redirect if specified", function() {
        whenRequestHostIs("www.boxsocial.fm");
        andPortIs("8080");
        expect301RedirectTo("http://boxsocial.fm:8080/somepath?key=value");
    });

    it("does not include port if port 80", function() {
        whenRequestHostIs("www.boxsocial.fm");
        andPortIs("80");
        expect301RedirectTo("http://boxsocial.fm/somepath?key=value");
    });

    function whenRequestHostIs(requestHost) {
        gently.expect(request, "header", function(key) {
            return requestHost;
        });
    }

    function andPortIs(port) {
        config.port = port;
    }

    function deferControll() {
        var controller = new DefaultController(config);
        controller.default.all(request, null, gently.expect(function() {
        }));
    }

    function expect301RedirectTo(expectedUrl) {
        gently.expect(response, "redirect", function(actualUrl, statusCode) {
            assert.equal(expectedUrl, actualUrl);
            assert.equal(301, statusCode);
        });
        var controller = new DefaultController(config);
        controller.default.all(request, response);
    }
})();
