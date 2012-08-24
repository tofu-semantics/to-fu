var http = require("http");
var url = require("url");
var settings = require("./settings");

function start(route) {
  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    console.log("Request for " + pathname + " received.");
    route(pathname, response, request);
  }

  http.createServer(onRequest).listen(settings.listen_port);
  console.log("Server has started.");
}

exports.start = start;
