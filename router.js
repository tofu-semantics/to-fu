var requestHandlers = require("./requestHandlers");

var urls = [
    {url: /^\/i\/[a-zA-Z0-9_-]{4}\.[a-zA-Z0-9]*$/,
     handler: requestHandlers.show},
    {url: /^\/d\/[a-zA-Z0-9_-]{4}\.[a-zA-Z0-9]*$/,
     handler: requestHandlers.displayResult},
    {url: /^\/g\/[a-zA-Z0-9_-]{4}\.[a-zA-Z0-9]*$/,
     handler: requestHandlers.showBase64},
    {url: /^\/t\/[a-zA-Z0-9_-]*.htm$/,
     handler: requestHandlers.template},
    {url: /^\/favicon.ico$/,
     handler: requestHandlers.ignore},
    {url: /^\/$/,
     handler: requestHandlers.start},
    {url: /^\/static\/([a-zA-Z0-9-_]+\/)*([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9-_]+$/,
     handler: requestHandlers.staticContent},
    {url: /^\/upload$/,
     handler: requestHandlers.upload},
    {url: /^\/a\/[a-zA-Z0-9_-]{8}\/$/,
     handler: requestHandlers.album}
];

function route(pathname, response, request) {
  var handled = false;
  for (var i = 0; i < urls.length; i++) {
     re = urls[i].url;
     if (re.test(pathname)) {
       handled = true;
       urls[i].handler(response, request);
       break;
     }
  }
  if (!handled) {
      requestHandlers.error404(response, "Invalid URL "+pathname);
  }
}

exports.route = route;
