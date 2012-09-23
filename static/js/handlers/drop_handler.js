(function($) {

  jQuery.event.props.push("dataTransfer");

  var default_opts = {
      fallback_id: '',
      url: '',
      refresh: 1000,
      readStr: false,
      maxfiles: 500,           // Ignored if queuefiles is set > 0
      maxfilesize: 50,         // MB file size limit
      queuefiles: 1,          // Max files before queueing (for large volume uploads)
      queuewait: 1000,         // Queue wait time if full
  }

  var errors = ["BrowserNotSupported", "TooManyFiles", "FileTooLarge"],
      files_count = 0,
      files;

  $.fn.register = function(ext, hdl, rdm){
      var proc = {}, read = {};
      proc[ext] = hdl
      read[ext] = rdm
      $.extend(grapher.process, proc)
      $.extend(grapher.readmode, read)
  }

  $.fn.filedrop = function(options, isupdate) {
    var opts = $.extend({}, default_opts, options);

    this.unbind('drop')
    this.bind('drop', drop)

    function drop(e) {
        e.preventDefault();
        files = e.dataTransfer.files;
        if (files === null || files === undefined) {
          return false;
        }
        files_count = files.length;
        console.debug(files)
        local_update();
        return false;
    }

    function local_update() {
        if (!files) return false;
        if (files_count > opts.maxfiles) return false;

        var filesDone = 0, filesRejected = 0;

        var workQueue = [],
            processingQueue = [],
            doneQueue = [];
        
        for (var i = 0; i < files_count; i++) {
            workQueue.push(i)
        }

        var pause = function(timeout) {
            setTimeout(process_func, timeout);
            return;
        };

        var process_func = function() {
            var fileIndex;
            if (opts.queuefiles > 0 && processingQueue.length >= opts.queuefiles) {
              console.debug('Pausing')
              return pause(opts.queuewait);
            } else {
              console.debug('Queue length is ' + processingQueue.length)
              fileIndex = workQueue[0];
              workQueue.splice(0, 1);
              processingQueue.push(fileIndex);
            }
            
            var name = files[fileIndex].name.split('.')[0]
            var ext = files[fileIndex].name.split('.')[1].toLowerCase()

            console.debug("Processing: " + fileIndex + " name is " + name + " ext is " + ext)

            try {
                if (fileIndex === files_count) return;
                var reader = new FileReader();
                reader.index = fileIndex;
                reader.onloadend = function(e){
                    console.debug(opts)
                    var uid = 'A' + grapher.gindex + Math.floor(Math.random()*10) + Math.floor(Math.random()*10)
                    grapher.process[ext](e.target.result, uid, name, ext)
                    send(e, uid, ext)
                    processingQueue.forEach(function(value, key) {
                      if (value === fileIndex) processingQueue.splice(key, 1);
                    });
                }
                switch (grapher.readmode[ext]){
                    case 'b':
                        reader.readAsBinaryString(files[fileIndex]);
                        break;
                    case 'u':
                        reader.readAsDataURL(files[fileIndex]);
                        break;
                    case 't':
                        reader.readAsText(files[fileIndex]);
                        break;
                    default:
                        reader.readAsBinaryString(files[fileIndex]);
                        break;
                }
            } catch (err) {
              processingQueue.forEach(function(value, key) {
                if (value === fileIndex) processingQueue.splice(key, 1);
              });
              return false;
            }
            // If we still have work to do,
            if (workQueue.length > 0) {
              process_func();
            }
        }

        var send = function(e, uid, ext) {

          var fileIndex = ((typeof(e.srcElement) === "undefined") ? e.target : e.srcElement).index
          
          // Sometimes the index is not attached to the
          // event object. Find it by size. Hack for sure.
          if (e.target.index == undefined) {
            e.target.index = getIndexBySize(e.total);
          }

          var xhr = new XMLHttpRequest(),
              upload = xhr.upload,
              file = files[e.target.index],
              index = e.target.index,
              start_time = new Date().getTime(),
              boundary = '------multipartformboundary' + (new Date).getTime(),
              builder;

          mime = file.type
          console.debug("******" + file.name)
          builder = getBuilder(uid+"."+ext, e.target.result, mime, boundary);

          upload.index = index;
          upload.file = file;
          upload.downloadStartTime = start_time;
          upload.currentStart = start_time;
          upload.currentProgress = 0;
          upload.startData = 0;
          upload.addEventListener("progress", progress, false);

          xhr.open("POST", opts.url, true);
          xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + boundary);

          xhr.sendAsBinary(builder);

          xhr.onload = function() {
            if (xhr.responseText) {
              var now = new Date().getTime(),
                  timeDiff = now - start_time

              filesDone++;

              // Add to donequeue
              doneQueue.push(fileIndex);
            }
          };
        }

        function getBuilder(filename, filedata, mime, boundary) {
          var dashdash = '--',
              crlf = '\r\n',
              builder = '';

          builder += dashdash;
          builder += boundary;
          builder += crlf;
          builder += 'Content-Disposition: form-data; name="' + opts.paramname + '"';
          builder += '; filename="' + filename + '"';
          builder += crlf;

          builder += 'Content-Type: ' + mime;
          builder += crlf;
          builder += crlf;

          builder += filedata;
          builder += crlf;

          builder += dashdash;
          builder += boundary;
          builder += dashdash;
          builder += crlf;
          return builder;
        }

        function progress(e) {
          if (e.lengthComputable) {
            var percentage = Math.round((e.loaded * 100) / e.total);
            if (this.currentProgress != percentage) {

              this.currentProgress = percentage;

              var elapsed = new Date().getTime();
              var diffTime = elapsed - this.currentStart;
            }
          }
        }

        process_func()

    };

  }

  try {
    if (XMLHttpRequest.prototype.sendAsBinary) return;
    XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
      function byteValue(x) {
        return x.charCodeAt(0) & 0xff;
      }
      var ords = Array.prototype.map.call(datastr, byteValue);
      var ui8a = new Uint8Array(ords);
      this.send(ui8a.buffer);
    }
  } catch (e) {}
})(jQuery);


// Factory methods for carousel items 
var createNewCarouselItem = function(uid){
    newdiv = document.createElement("div");
    newdiv.setAttribute("class","item");
    newdiv.setAttribute("id","item" + (uid)); 
    newdiv = document.getElementById("cinner").appendChild(newdiv)
    return newdiv
}

var createNewCaptionBar = function (uid, name, text){
    newcaption = document.createElement("div");
    newcaption.setAttribute("class", "carousel-caption");
    newactionpanel = createNewActionPanel(uid)
    newcaption.innerHTML = "<span style=\"float: left;\">" + text + name + "</span>"
    newcaption.appendChild(newactionpanel)
    return newcaption
}

var createNewActionPanel = function (uid){
    panelData = {uid: uid,
                 dropbtns: [{
                             icon:"icon-bar-chart", text:"", action:"graphchange",
                             subbtns:[{icon:"icon-picture", text:"Scatter Plot", value:"scatter"},
                                     {icon:"icon-picture", text:"Line Graph", value:"line"},
                                     {icon:"icon-picture", text:"Discrete Bar Chart", value:"dis_bar"}
                                     ]
                            }],
                 mbtns: [{
                             icon:"icon-share", text:"", value:uid, action:"share"
                         },{
                             icon:"icon-trash", text:"", value:uid, action:"trash"
                         },{
                             icon:"icon-save", text:"", value:uid, action:"save"
                         }
                        ]}
    newpanel = document.createElement("span");
    newpanel.style.cssFloat =  "right"
    render_template_from_server('action-panel-template', panelData, newpanel, '')
    return newpanel
}
