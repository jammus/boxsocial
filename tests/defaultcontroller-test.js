require("./common");
var Mocks = require("./Mocks");
var DefaultController = require("../controllers/defaultcontroller");

(function() {
    var host, config, request, response, gently, requestHost;

    describe("The default controller")
    before(function() {
        configuredHost = "boxsocial.fm";
        config = {
            host: configuredHost
        };
        request = new Mocks.MockRequest();
        gently = new Gently();
        response = new Mocks.MockResponse();
        request.originalUrl = "/somepath?key=value";
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

    function expectRedirectTo(expectedUrl) {
        gently.expect(response, "redirect", function(actualUrl) {
            assert.equal(expectedUrl, actualUrl);
        });
        var controller = new DefaultController(config);
        controller.default.all(request, response);
    }

    it("passes to the next controller if host of request matches configuration", function() {
        whenRequestHostIs(configuredHost);
        deferControll();
    });

    it("redirects to the correct host if request does not match configuration", function() {
        whenRequestHostIs("www.boxsocial.fm");
        expectRedirectTo("http://boxsocial.fm/somepath?key=value");
    });

    it("includes port in redirect if specified", function() {
        whenRequestHostIs("www.boxsocial.fm");
        andPortIs("8080");
        expectRedirectTo("http://boxsocial.fm:8080/somepath?key=value");
    });

    it("does not include port if port 80", function() {
        whenRequestHostIs("www.boxsocial.fm");
        andPortIs("80");
        expectRedirectTo("http://boxsocial.fm/somepath?key=value");
    });
})();
