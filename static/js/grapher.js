var grapher = {}
grapher.dropbox = $('#dropbox');
grapher.process = {};
grapher.readmode = {};
//var message = $('.message', dropbox);
grapher.update_functions = [], grapher.gindex = 1;
grapher.data_store = {}
grapher.data_func = {}
grapher.uid_store = []
grapher.carouselID = 'myCarousel'

// UGLY CONFIGURATION CONSTANTS
grapher.defaults = {x: 'contrast', y:'signal', z:'', s:'genotype0', k:'', graphmode:'scatter'}
grapher.field_structs = {x: {id:'x', name:'x'},
                 y: {id:'y', name:'y'}, 
                 z: {id:'z', name:'z'}, 
                 s: {id:'s', name:'shape'}, 
                 k: {id:'k', name:'series'}
                }

grapher.graph_fields = {scatter: ['x', 'y', 'z', 's', 'k'],
                    line: ['x', 'y', 'k'],
                    dis_bar: ['y', 'k']
                   }               
// UGLY CONFIGURATION CONSTANTS


// Set up the form to define graph defaults
grapher.update_accessor_form = function(){
    template_data = {fields: []}
    for (var f = 0; f < grapher.graph_fields[grapher.defaults['graphmode']].length; f++){
        template_data['fields'].push(grapher.field_structs[grapher.graph_fields[grapher.defaults['graphmode']][f]])
    }
    render_template_from_server('defaults-template', template_data, '#accessor-default-form',function(){ 
        $('.g_option').change(grapher.option_update)
    },'')
}

// Binding option sub-menu
grapher.option_update = function(e) {
  console.debug(e.target.id.split("-")[0])
  field_name = e.target.id.split("-")[0]
  grapher.defaults[field_name] = e.target.value
  if (field_name == 'graphmode'){
      grapher.update_accessor_form()
  }
}

grapher.update_graph = function(uid, value){
    $('#chart'+uid).html("<svg></svg>")
    $('#control'+uid).html("")
    graph_handler(uid, "", value)
}

grapher.actionpanel = {}
grapher.actionpanel.handler = function(uid, action, value){
    // Hide the dropdown menu if we select something
    $('[data-toggle="dropdown"]').parent().removeClass('open');

    // Delete panel of the carousel
    if (action=="trash"){
        grapher.actionpanel.trash(uid)
    }

    // Switch graph types
    // TODO: Update instead of re-render?

    if (action=="graphchange"){
        grapher.update_graph(uid, value)
    }

    if (action=="save"){
        // TODO: Figure out how to export svg with css styling to image format
        // on client-side... worst case is to resort to server-side processing
        // using cairoSVG
    }
}

// Deletes the current panel
grapher.actionpanel.trash = function(uid){
    $('#'+grapher.carouselID).carousel('prev') 
    delete grapher.data_store[uid]
    grapher.gindex = grapher.gindex - 1
    setTimeout(function(){$('#item' + uid).remove()}, 1000)
}

// Use history API to make sure that URLs work properly
//$('#'+grapher.carouselID).bind('kslid',function(){
//    console.debug('slid')
//    uid = $('#myCarousel .active')[0].id.replace('item', '')
//    console.debug($.param(grapher.defaults))
//    if (uid == ''){
//        history.pushState(null,null,'')
//    } else{
//        history.pushState(null,null,uid+'.json'+$.param(grapher.defaults))
//    }
//});
//
//window.addEventListener("popstate", function(e) {
//    uid = location.pathname
//    console.debug(location.pathname)
//    //$('#'+grapher.carouselID).carousel($(
//})

grapher.getAttr = function(uid, graphmode){
    console.debug(graphmode)
    fields = grapher.graph_fields[graphmode]
    attr = {}
    for (i = 0;i < fields.length; i++){
        field = fields[i]
        fieldval = $('#select' + uid + grapher.field_structs[field].name).val()
        attr[field] = (fieldval == '') ? grapher.defaults[field] : fieldval
    }
    return attr 
}

grapher.addJSONPanel = function(name, data){
    var uid = 'A' + grapher.gindex + Math.floor(Math.random()*10) + Math.floor(Math.random()*10)
    grapher.process['json'](data, uid, name, 'json')
    sendJSON(uid, data)
}

// Helper function to send a json file stored as a variable in base64
// encoding to the server
var sendJSON = function (uid, data){
  var xhr = new XMLHttpRequest(),
      upload = xhr.upload,
      index = 1,
      start_time = new Date().getTime(),
      boundary = '------multipartformboundary' + (new Date).getTime(),
      builder;

  mime = 'application/json'
  builder = getBuilder(uid+".json", data, mime, boundary);

  xhr.open("POST", '/upload', true);
  xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + boundary);

  xhr.sendAsBinary(builder);
}

// Helper function to build the file blob
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
