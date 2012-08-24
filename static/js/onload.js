function showMessage(msg) {
	message.html(msg);
}

var dropbox = $('#dropbox');
var process = {};
var readmode = {};
var message = $('.message', dropbox);
var update_functions = [], gindex = 1;
var data_store = {}
var uid_store = []
var defaults = {x: 'con', y:'sig', z:'sig', s:'gen0', k:'dis', graphmode:'scatter'}
var field_structs = {x: {id:'x', name:'x'},
                     y: {id:'y', name:'y'}, 
                     z: {id:'z', name:'z'}, 
                     s: {id:'s', name:'shape'}, 
                     k: {id:'k', name:'series'}
                    }

function update_accessor_form(){
    data = {fields: []}
    if (defaults['graphmode'] == 'scatter'){
        data['fields'].push(field_structs['x'])
        data['fields'].push(field_structs['y'])
        data['fields'].push(field_structs['z'])
        data['fields'].push(field_structs['s'])
        data['fields'].push(field_structs['k'])
    }
    if (defaults['graphmode'] == 'line'){
        data['fields'].push(field_structs['x'])
        data['fields'].push(field_structs['y'])
        data['fields'].push(field_structs['k'])
    }
    if (defaults['graphmode'] == 'dis_bar'){
        data['fields'].push(field_structs['y'])
        data['fields'].push(field_structs['k'])
    }
    var source = $('#defaults-template').html()
    var template = Handlebars.compile(source)
    $("#accessor-default-form").html(template(data))
}

// Registering file handlers
$(document).ready(function() {
    $('.alert').hide()
    // Register handlers for different files
    dropbox.filedrop();
    dropbox.register('cr2', CR2_handler, 'b');
    dropbox.register('jpg', img_handler, 'u');
    dropbox.register('jpeg', img_handler, 'u');
    dropbox.register('bmp', img_handler, 'u');
    dropbox.register('gif', img_handler, 'u');
    dropbox.register('png', img_handler, 'u');
    dropbox.register('svg', img_handler, 'u');
    dropbox.register('csv', csv_handler, 't');
    dropbox.register('json', json_handler, 't');
    dropbox.register('c', code_handler, 't');
    dropbox.register('js', code_handler, 't');
    dropbox.register('py', code_handler, 't');
    dropbox.register('sh', code_handler, 't');
    // Set up display carousel
    $('#myCarousel').carousel({
        interval: false
    });

    // Could be slid or slide (slide happens before animation, slid happens after)
    $('#myCarousel').bind('slid', function() {
        for (var i = 0; i < update_functions.length; i++){
            update_functions[i]()
        }
    });
    $(document).bind("keydown", function(event) {
        console.debug($('#myCarousel').carousel())
        if (event.keyCode == 39){
           $('#myCarousel').carousel('next') 
           return
        }
        if (event.keyCode == 37){
           $('#myCarousel').carousel('prev') 
           return
        }
    });
    update_accessor_form()

    dropbox.filedrop({
        paramname: 'upload',
        url: '/upload', 

        uploadFinished: function(i, file, response) {
            handle_response(response);
            console.log("UPLOAD FINISHED")
        },
        
        // Called before each upload is started
        beforeEach: function(file) {
            // This used to check file.type to only allow
            // images, but we're gonna allow anything at all.
            return true;
        },
        
        uploadStarted: function(i, file, len) {
            //createImage(file);
        }
    });

    $('.g_option').change(option_update)
});

// Sticky captions
//$(document).scroll(function(){
//    if ($('.carousel-caption').length == 0)
//        return
//
//    caption = $('.carousel-caption').filter(function(){
//                            return $(this).parent().hasClass('active')})
//    if (caption.hasClass('carousel-caption-fixed')){
//        console.debug(' ')
//    } else {
//        var offset = caption.position().top +
//                     caption.outerHeight()
//        caption.attr('data-bottom', offset);
//        caption.attr('data-top', caption.position().top);
//    }
//
//    var curr_pos = $(window).scrollTop() + $(window).height() -
//                   $('.navbar').outerHeight()
//
//    if (curr_pos <= caption.attr('data-bottom')){
//        if (caption.hasClass('carousel-caption-fixed')) return;
//        caption.addClass('carousel-caption-fixed');
//        caption.css('top', $(window).height() - $('.navbar').outerHeight() - 
//                caption.outerHeight());
//    }
//
//    if ($(window).scrollTop() >= caption.attr('data-top')){
//        if (caption.hasClass('carousel-caption-fixed')) return;
//        caption.css('height', caption.height());
//        caption.addClass('carousel-caption-fixed');
//        caption.css('top', 0);
//    } 
//
//    if ((curr_pos > caption.attr('data-bottom')) && 
//        ($(window).scrollTop() < caption.attr('data-top'))){
//        caption.removeClass('carousel-caption-fixed');
//        caption.css('top','') 
//    }
//
//});

// Binding option menu
var option_update = function(e) {
  console.debug(e.target.id.split("-")[0])
  field_name = e.target.id.split("-")[0]
  defaults[field_name] = e.target.value
  if (field_name == 'graphmode'){
      update_accessor_form()
      $('.g_option').change(option_update)
  }
}


var actionpanel = function(uid, action, value){
    console.debug(action)
    console.debug(uid)
    console.debug(value)
    $('[data-toggle="dropdown"]').parent().removeClass('open');
    if (action=="trash"){
        trash(uid)
    }
    if (action=="graphchange"){
        $('#chart'+uid).html("<svg></svg>")
        $('#control'+uid).html("")
        graph_handler(uid, "", value)
    }
    if (action=="save"){
        svgElems = document.getElementById('chart'+uid).getElementsByTagName('*')
        cssInclude  = ''
        //for (i=0;i<svgElems.length;i++){ 
        //    cssRules = getMatchedCSSRules(svgElems[i],null); 
        //    if (cssRules) {
        //        for (j=0;j<cssRules.length;j++){
        //            cssInclude = cssInclude + '\n' + cssRules[j].cssText
        //        }
        //    }
        //}
        svgBody =  document.getElementById('chart'+uid).innerHTML.slice(5) // Remove <svg>
        svgBody = '<svg><style type="text/css" ><![CDATA[' + cssInclude + ']]></style>' + svgBody
        console.debug(svgBody)
        canvg(document.getElementById('canvas'), svgBody)
        var canvas = document.getElementById('canvas');
        var img = canvas.toDataURL('image/png').slice(22);
        //sendPNG(uid, img) 
    }
}

var trash = function(uid){
       $('#myCarousel').carousel('prev') 
       delete data_store[uid]
       gindex = gindex - 1
       setTimeout(function(){$('#item' + uid).remove()}, 1000)
}

var sendPNG = function (uid, data){
  var xhr = new XMLHttpRequest(),
      upload = xhr.upload,
      index = 1,
      start_time = new Date().getTime(),
      boundary = '------multipartformboundary' + (new Date).getTime(),
      builder;

  mime = 'image/png'
  builder = getBuilder(uid+".png", $.base64.decode(data), mime, boundary);

  xhr.open("POST", '/upload', true);
  xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + boundary);

  xhr.sendAsBinary(builder);
}

function getBuilder(filename, filedata, mime, boundary) {
  var dashdash = '--',
      crlf = '\r\n',
      builder = '';

  builder += dashdash;
  builder += boundary;
  builder += crlf;
  builder += 'Content-Disposition: form-data; name="upload"';
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
