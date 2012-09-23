render_template_from_server = function(template_name, data, target, callback, mode){
    $.ajax({
      url: "/t/" + template_name + '.htm',
      context: document.body
    }).done(function(response) {
      var source = response
      var template = Handlebars.compile(source)
      if (mode && mode == 'append'){
          $(target).append(template(data))
      } else {
          $(target).html(template(data))
      }
      if (callback){
          callback(template_name, data, target, response)
      }
    });
}

$(document).ready(function() {
    // Register handlers for different filetypes
    grapher.dropbox.filedrop();
    grapher.dropbox.register('cr2', CR2_handler, 'b');
    grapher.dropbox.register('jpg', img_handler, 'u');
    grapher.dropbox.register('jpeg', img_handler, 'u');
    grapher.dropbox.register('bmp', img_handler, 'u');
    grapher.dropbox.register('gif', img_handler, 'u');
    grapher.dropbox.register('png', img_handler, 'u');
    grapher.dropbox.register('svg', img_handler, 'u');
    grapher.dropbox.register('csv', csv_handler, 't');
    grapher.dropbox.register('json', json_handler, 't');
    grapher.dropbox.register('c', code_handler, 't');
    grapher.dropbox.register('js', code_handler, 't');
    grapher.dropbox.register('py', code_handler, 't');
    grapher.dropbox.register('sh', code_handler, 't');
    grapher.dropbox.register('tex', code_handler, 't');
    grapher.dropbox.register('m', code_handler, 't');

    // Set up display carousel
    $('#myCarousel').carousel({
        interval: false
    });

    // Key bindings for left and right
    $(document).bind("keydown", function(event) {
        if ($('#bq-modal').hasClass('in')){
            return
        }
        if (event.keyCode == 39){
           $('#myCarousel').carousel('next') 
           return
        }
        if (event.keyCode == 37){
           $('#myCarousel').carousel('prev') 
           return
        }
    });

    // Set up drop box for drag n drop
    grapher.update_accessor_form()

    grapher.dropbox.filedrop({
        paramname: 'upload',
        url: '/upload', 
        uploadFinished: function(i, file, response) {
            handle_response(response);
            console.log("UPLOAD FINISHED")
        },
        beforeEach: function(file) {
            return true;
        },
        uploadStarted: function(i, file, len) {
        }
    });

    // Bind option update
    //grapher.update_accessor_form()

    //$('.g_option').change(grapher.option_update)
});
