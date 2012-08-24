var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable"),
    URL = require("url"),
    sys = require("util"),
    crypto = require("crypto"),
    settings = require("./settings");

function base64URL(buf) {
        return buf.toString('base64').replace(/\+/g, "-").replace(/\//g, "_");
}

function moveFile(from, to, callback) {
    fs.readFile(from, function(err, data) {
        fs.open(to, "w", function (err, fd) {
            fs.write(fd, data, 0, data.length, 0, function(err, written, buffer) {
                fs.close(fd, function () {
                    fs.unlink(from, function() {
                        if (callback) {callback();}
                    })
                })
            })
        })
        });
}


function ignore(response, request) {
    response.end()
}

function error500(response, error, callback) {
    console.log("500\t"+error);
    response.writeHead(500, {"Content-Type": "text/plain"});
    response.write(error);
    response.end();
    if (callback) {callback();}
}

function error404(response, error, callback) {
    console.log("404\t"+error);
    fs.readFile("static/404.html", function(fserror, filedata) {
        if (fserror) {
            error500(error + fserror);
        } else {
            pagetext = filedata.toString().replace("ERROR_TEXT", error + "\n");
            response.writeHead(404, {"Content-Type": "text/html"});
            response.write(pagetext);
            response.end();
        }
        if (callback) {callback();}
    });
}


function static_file_writer(response, content_type) {
    return function(error, filedata) {
        if(error) {
            error500(error);
        } else {
            response.writeHead(200, {"Content-Type": content_type});
            response.write(filedata, "binary");
            response.end();
        }
    }
}

function start(response, request) {
  console.log("Request handler 'start' was called.");
  //fs.readFile("static/upload_index.htm", "binary",
  //              static_file_writer(response, "text/html"));
  fs.readFile("static/carousel.htm", "binary",
                static_file_writer(response, "text/html"));
}

function staticContent(response, request) {
  var url = URL.parse(request.url);
  console.log("Request handler 'staticContent' was called for url "+url.href);
  var filename = url.pathname.slice(1); // Strip off the leading /
  var extension = filename.split(".").slice(-1)[0];
  var content_type;
  switch (extension) {
      case "htm": 
      case "html": content_type = "text/html"; break;
      case "js": content_type = "application/javascript"; break;
      case "css": content_type = "text/css"; break;
      default: content_type = "text/plain"; break;
  }
  fs.readFile(filename, "binary", static_file_writer(response, content_type));
}

function displayResult(response, request) {
  var url = URL.parse(request.url);
  var filename = url.pathname.slice(3); // Strip off the leading /d/
  console.log("Request handler 'displayResult' was called for url "+url.href);
    fs.stat(settings.storage_location+filename, function (error, stats) {
        if (error) {
            error404(response, error + "\n");
        } else{
            fs.readFile("static/display.htm",
                    static_file_writer(response, "text/html"));
        }
    });
}

function bytes_to_int (bytes){
    offset = 1
    res = 0
    for (var i = 0; i < 4; i ++){
        res += bytes[i] * offset
        offset = offset * 256
    }
    return res
}

function extract_CR2_jpg (inf, filepath, filename, response){
    fs.readFile(inf, function(err, data){
        console.log("getting offset and length")
        var offset = bytes_to_int(data.slice(98, 98+4))
        var length = bytes_to_int(data.slice(122,122+4)) 
        console.log("offset is " + offset.toString() + "length is " + length.toString())
        fs.writeFile(filepath, data.slice(offset, offset + length), function(err){
            response.writeHead(200, {"Content-Type": "application/json"});
            response.write(JSON.stringify({loc: "/d/"+filename,
                                   is_image: true,
                                   errors: []}));
            console.log("Successful upload to "+filepath);
            response.end();
            fs.unlink(inf);
        });

    });
}

function upload(response, request, multi_file) {
  if (typeof(multi_file) === 'undefined'){
      multi_file = false
  }
  console.log("**********")
  console.log(request.url);
  console.log(sys.inspect(request))
  var form = new formidable.IncomingForm();
  var files = [],
      fields = [];

  form.uploadDir = settings.storage_location;

  form.on('field', function(field, value) {
    fields.push([field, value]);
  })

  form.on('file', function(field, file) {
    files.push([field, file]);
  })

  form.on('end', function() {
    console.log('-> upload done');
  });

  form.parse(request, function(error, fields, files) {
    var filebase = base64URL(crypto.randomBytes(6));
    var extension;
    var allow_any_filetype = !settings.only_allow_images;

    extension = files.upload.name.split(".").slice(-1)[0]

    var is_image = files.upload.type.slice(0, 5) === 'image';

    if (allow_any_filetype || extension.length > 0){
        if (extension == "CR2") {
            var filename = filebase + "." + "jpg"
            var filepath = settings.storage_location + filename;
            extract_CR2_jpg(files.upload.path, filepath, filename, response) 
        } else {
            //var filename = filebase + "." + extension;
            var filename = files.upload.name; 
            var filepath = settings.storage_location + filename;
            fs.rename(files.upload.path, filepath, function () {
                response.writeHead(200, {"Content-Type": "text/plain"});
            //    response.write(JSON.stringify({loc: "/d/"+filename,
            //                                   is_image: is_image,
            //                                   errors: []}));
                response.write("")  
                console.log("Successful upload to "+filepath);
                response.end();
            });
        }
    } else {
        fs.unlink(files.upload.path);
        response.writeHead(200, {"Content-Type": "application/json"});
        err = "Error, got content-type "+files.upload.type+
              " only image/jpeg and image/png allowed";
        console.log(err);
        response.write(JSON.stringify({loc: "", errors: [err]}))
        response.end();
    }
  });
}

function show(response, request) {
  var url = URL.parse(request.url);
  console.log("Request handler 'show' was called for url"+url.href);
  var filename = url.pathname.slice(3); // Strip off the leading /i/
  fs.readFile(settings.storage_location+filename, function(error, file) {
    var content_type;
    content_type = "binary"
    if (content_type !== null) {
        response.writeHead(200, {"Content-Type": content_type});
    }
    response.write(file.toString('binary'));
    response.end();
 });
}

function showBase64(response, request) {
  var url = URL.parse(request.url, true);
  console.log("Request handler 'show' was called for url"+url.href);
  var filename = url.pathname.slice(3); // Strip off the leading /i/
  fs.readFile(settings.storage_location+filename, function(error, file) {
    var content_type;
    content_type = "text/plain"
    if (content_type !== null) {
        response.writeHead(200, {"Content-Type": content_type});
    }
    response.write(file.toString('base64'));
    response.end();
 });
}


exports.start = start;
exports.upload = upload;
exports.show = show;
exports.showBase64 = showBase64;
exports.displayResult = displayResult;
exports.ignore = ignore;
exports.error404 = error404;
exports.staticContent = staticContent;
