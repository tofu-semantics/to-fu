var bq = {};
bq.clientId = '2434762320.apps.googleusercontent.com'
bq.scopes = 'https://www.googleapis.com/auth/bigquery'
bq.projectID = ''
bq.tableID = ''
bq.timeExpire = 0
bq.resultBuffer = {}
bq.test = {}
bq.editor_text = ''

bq.done = function (jobId){
    console.debug('adding panel')
    var name = bq.tableID + '-' + jobId
    grapher.addJSONPanel(name, JSON.stringify(bq.resultBuffer[jobId]))
    //bq.resultBuffer[jobId] = [] // we should cache results but large query sets are nasty
}

bq.upload = function (uid, data, name){
  var xhr = new XMLHttpRequest(),
      upload = xhr.upload,
      index = 1,
      start_time = new Date().getTime(),
      boundary = '------multipartformboundary' + (new Date).getTime(),
      builder;

  mime = 'application/json'
  builder = getBuilder(uid+".json", $.base64.decode(data), mime, boundary);
  xhr.open("POST", '/upload', true);
  xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + boundary);
  xhr.sendAsBinary(builder);
}

bq.tablerize = function (jobId, response){
    console.debug(response)
    console.debug(bq.resultBuffer)
    bq.test = response
    $.each(bq.resultBuffer[jobId], function(i, v){
        var temp = {}
        $.each(response.schema.fields, function(k, l){
            console.debug(bq.resultBuffer[jobId][i].f)
            if (response.schema.fields[k].type == 'FLOAT' || response.schema.fields[k].type == 'INTEGER'){
                temp[response.schema.fields[k].name] = parseFloat(bq.resultBuffer[jobId][i].f[k].v)
            } else {
                console.debug(response.schema.fields[k].type)
                temp[response.schema.fields[k].name] = bq.resultBuffer[jobId][i].f[k].v
            }
        })
        console.debug(temp)
        bq.resultBuffer[jobId][i] = temp
    })
}

bq.queryCallbackFactory = function(idx){
    return function(response){
        console.debug('response')
        console.debug(response)
        jobId = response.jobReference.jobId
        if (bq.resultBuffer[jobId] == undefined){
            bq.resultBuffer[jobId] = []
        }
        idx = idx + response.rows.length
        bq.resultBuffer[jobId] = bq.resultBuffer[jobId].concat(response.rows)
        if (idx < response.totalRows){
            var request = gapi.client.bigquery.jobs.getQueryResults({
              'projectId': bq.projectID,
              'jobId': response.jobReference.jobId,
              'startIndex': idx+1,
              'timeoutMs': '30000',
            });
            request.execute(function(response) {
                if (response && !response.error){
                    bq.queryCallbackFactory(idx)(response)
                } 
                if (response && response.error){
                    console.debug(bq.error_template(response))
                    response.projectId = bq.safeName(bq.projectID)
                    $('#message-area').append(bq.error_template(response))
                    $('#bq-error-'+bq.safeName(bq.projectID)).fadeIn()
                    $('#bq-loading-'+bq.safeName(bq.projectID)).fadeOut()
                    $('#bq-loading-'+bq.safeName(bq.projectID)).remove()
                }
            });
        } else {
            bq.tablerize(jobId, response)
            $('#bq-loading-'+bq.safeName(bq.projectID)).fadeOut()
            $('#bq-loading-'+bq.safeName(bq.projectID)).remove()
            bq.done(jobId)
        } 
    }
}

bq.queryCallback = bq.queryCallbackFactory(0)

bq.editor = false

bq.config = {
    'client_id': bq.clientId,
    'scope': 'https://www.googleapis.com/auth/bigquery'
}

bq.auth = function(callback) {
    if (bq.timeExpire < $.now()){
        gapi.auth.authorize(bq.config, 
           function(response) {
                if (response && !response.error){
                    bq.timeExpire = $.now() - 10000 + (response.expires_in * 1000)
                    gapi.client.load('bigquery', 'v2', callback);
                }
                if (response && response.error){
                    console.debug(bq.error_template(response))
                    response.projectId = bq.safeName(bq.projectID)
                    $('#message-area').append(bq.error_template(response))
                    $('#bq-error-'+bq.safeName(bq.projectID)).fadeIn()
                    $('#bq-loading-'+bq.safeName(bq.projectID)).fadeOut()
                    $('#bq-loading-'+bq.safeName(bq.projectID)).remove()
                }
            }
        );
     } else {
         callback()
     }

}

bq.launchQuery = function(){
    auth_callback = function(){
        if (bq.projectID == ''){
            bq.getProjectID();
        } else {
            if (bq.tableID == ''){
                bq.getTableID();
            } else {
                bq.renderQueryEditor()
            }
        }
    }

    bq.auth(auth_callback);
}

bq.queryProgress = function(){
    bq[$('#bq-modal-type').val()] = $('#bq-modal-select').val()
    $('#bq-modal').modal('hide')
    bq.launchQuery()
}

bq.safeName = function (str){
    return str.replace(':','-').replace('.','-')
}

// Opens a dialog to get a project ID if that is not set
bq.getX = function(request, cb){
    request.execute(function(response) {
        if (response && !response.error){
            bq.renderModal(cb(response))
        }
        if (response && response.error){
            console.debug(bq.error_template(response))
            response.projectId = bq.safeName(bq.projectID)
            $('#message-area').append(bq.error_template(response))
            $('#bq-error-'+bq.safeName(bq.projectID)).fadeIn()
            $('#bq-loading-'+bq.safeName(bq.projectID)).fadeOut()
            $('#bq-loading-'+bq.safeName(bq.projectID)).remove()
        }
    });
}

bq.getProjectID = function(){
    bq.getX(gapi.client.bigquery.projects.list(), 
            function (response) {
                var data = {}
                data.type = 'project'
                data.ids = []
                if (response.projects == undefined){
                    return null
                }
                for (i = 0; i < response.projects.length; i++){
                    data.ids.push(response.projects[i].id)
                }
                return data
            })
}

bq.getTableID = function(){
    bq.getX(gapi.client.bigquery.datasets.list({projectId:bq.projectID}), 
            function (response) {
                var data = {}
                data.type = 'table'
                data.ids = []
                if (response.datasets == undefined){
                    response.datasets = [{id: 'publicdata:samples.github_timeline'},
                                         {id: 'publicdata:samples.wikipedia'}]
                }
                for (i = 0; i < response.datasets.length; i++){
                    data.ids.push(response.datasets[i].id)
                }
                return data
            })
}

bq.runQuery = function(){
    bq.editor_text = bq.editor.getValue()
    $('#bq-modal').modal('hide')
    console.debug('running query')

    $('#message-area').append(bq.loading_template({projectId: bq.safeName(bq.projectID)}))
    $('#bq-loading-'+bq.safeName(bq.projectID)).fadeIn()
    query = bq.editor.getValue()
    var request = gapi.client.bigquery.jobs.query({
      'projectId': bq.projectID,
      'timeoutMs': '30000',
      'query': query
    });
    request.execute(function(response) {     
        if (response && !response.error){
            bq.queryCallback(response)
        }
        if (response && response.error){
            console.debug(bq.error_template(response))
            response.projectId = bq.safeName(bq.projectID)
            $('#message-area').append(bq.error_template(response))
            $('#bq-error-'+bq.safeName(bq.projectID)).fadeIn()
            $('#bq-loading-'+bq.safeName(bq.projectID)).fadeOut()
            $('#bq-loading-'+bq.safeName(bq.projectID)).remove()
        }
    });
}

bq.renderModal = function(data){
    if (data == null)
        return
    $('#bq-modal').html(bq.modal_template(data)).modal('show')
}

bq.renderQueryEditor = function(){
    $('#bq-modal').html(bq.modal_editor_template)
    queryText = (bq.editor_text == '') ? "SELECT ... FROM [" + bq.tableID + "]..." : bq.editor_text
    console.debug(queryText)
    bq.editor_text = queryText
    bq.editor = CodeMirror($('#bq-editor').get()[0], 
            {value: bq.editor_text,
             mode:  "bigquery",
             theme: "blackboard"});
    $('#bq-modal').modal('show')
    bq.editor.showLine(0)
}

bq.loading_template = Handlebars.compile(
'<div class="alert hide" id="bq-loading-{{projectId}}">\n'+
'  <button type="button" class="close" data-dismiss="alert">×</button>\n'+
'    Querying {{projectId}} ... \n'+
'  <div class="progress progress-warning progress-striped active">\n'+
'    <div class="bar" style="width: 100%;"></div>\n'+
'  </div>\n'+
'</div>')

bq.error_template = Handlebars.compile(
'<div class="alert alert-error hide" id="bq-error-{{projectId}}">\n'+
'  <button type="button" class="close" data-dismiss="alert">×</button>\n'+
'  Error {{code}}: {{message}}\n'+
'</div>')

bq.modal_editor_template = 
'<div class="modal-header">\n'+
'    <button type="button" class="close" data-dismiss="modal">×</button>\n'+
'    <h3>Enter query here</h3>\n'+
'</div>\n'+
'<div id="bq-editor"></div>\n'+
'<div class="modal-footer">\n'+
'    <a onclick="bq.runQuery();" class="btn">Next</a>\n'+
'    <a href="#" class="btn" data-dismiss="modal">Close</a>\n'+
'</div>\n'

bq.modal_template = Handlebars.compile( 
'<div class="modal-header">\n'+
'    <button type="button" class="close" data-dismiss="modal">×</button>\n'+
'    <h3>Select {{type}} ID</h3>\n'+
'</div>\n'+
'<div class="modal-body">\n'+
'    <form class="form-horizontal">\n'+
'            <select id="bq-modal-select" class="bq_option">\n'+
'                {{#ids}}\n'+
'                <option value="{{this}}">{{this}}</option>\n'+
'                {{/ids}}\n'+
'            </select>\n'+
'            <input type="hidden" id="bq-modal-type" value="{{type}}ID" />\n'+
'    </form>\n'+
'</div>\n'+
'<div class="modal-footer">\n'+
'    <a onclick="bq.queryProgress();" class="btn">Next</a>\n'+
'    <a href="#" class="btn" data-dismiss="modal">Close</a>\n'+
'</div>\n')
