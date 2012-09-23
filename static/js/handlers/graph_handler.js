var make_controls = function (uid, labels, callback){
    data = grapher.data_store[uid]
    label_1 = []
    label_2 = []
    fields = []
    for (var i = 0; i < labels.length; i++){
        if (i <= Math.round(labels.length/2) - 1){
            label_1.push(labels[i])
        } else {
            label_2.push(labels[i])
        }
    }
    for (var k in data[0]){
        fields.push(k)
    }
    data = {uid: uid, label_1: label_1, label_2: label_2, fields: fields}
    render_template_from_server('control-template', data, "#control"+uid, callback, 'append')
}

var colors = d3.scale.category10();

var graph_setup = function(uid, name, graphmode, graph_render){
    labels = []
    for (i = 0; i < grapher.graph_fields[graphmode].length; i++){
        labels.push(grapher.field_structs[grapher.graph_fields[graphmode][i]].name)
    }
    make_controls(uid, labels, function(){
        $(".select" + uid).change(function () {
            $('#chart' + uid).html("<svg></svg>")
            nv.addGraph(graph_render)
        })
        $('#chart' + uid).html("<svg></svg>")
        $('#myCarousel').carousel($(".carousel-inner").children().index($('#item'+uid)))
        nv.addGraph(graph_render)
    })
}

var scatter_render_factory = function(uid) {
    return function(){
        var chart = nv.models.scatterChart()

        chart.xAxis.tickFormat(d3.format('.02f'))
        chart.yAxis.tickFormat(d3.format('.02f'))
        
        d3.select('#chart' + uid + ' svg')
            .datum(scatter_dataLoader(uid))
            .transition().duration(300)
            .call(chart);

        nv.utils.windowResize(chart.update);
        return chart;
    }
}

var line_render_factory = function(uid) {
    return function(){
        var chart = nv.models.lineWithFocusChart()

        chart.xAxis.tickFormat(d3.format('.02f'))
        chart.yAxis.tickFormat(d3.format('.02f'))
        
        d3.select('#chart' + uid + ' svg')
            .datum(line_dataLoader(uid))
            .transition().duration(300)
            .call(chart);

        nv.utils.windowResize(chart.update);
        return chart;
    }
}

var dis_bar_render_factory = function(uid) {
    return function(){
            var chart = nv.models.discreteBarChart()
                .x(function(d) { return d.label })
                .y(function(d) { return d.value })
                .staggerLabels(true)
                .tooltips(false)
                .showValues(true)
      
            //chart.xAxis.tickFormat(d3.format('.02f'))
            chart.yAxis.tickFormat(d3.format('.02f'))
            
            d3.select('#chart' + uid + ' svg')
                .datum(dis_bar_dataLoader(uid))
                .transition().duration(300)
                .call(chart);
     
            nv.utils.windowResize(chart.update);
            return chart;
    }
}

var scatter_dataLoader = function (uid) { //# groups,# points per group
    data = grapher.data_store[uid]
    attr = grapher.getAttr(uid, 'scatter')

    if (!data || data[0][attr.x] == undefined || data[0][attr.y] == undefined){
        return []
    }

    plotData = [],
    n = 0;

    var shapes = ['diamond', 'circle', 'triangle-up', 'square', 'cross', 'triangle-down'],
    shape_map = {_lastkey: 0}    
    keySet = {};
    shapeSet = {};

    shapeLegend = [];

    var get_shapes = function(key){
         if (shape_map[key] == undefined) {
             shape_map[key] = (shape_map['_lastkey'] + 1) % shapes.length
             shape_map['_lastkey'] = shape_map[key]
         }
         if (shapeLegend.filter(function(s){return s.key == key}).length == 0){
             shapeLegend.push({key: key, value: shapes[shape_map[key]]})
         }
         return shapes[shape_map[key]]
    }

    for (var i = 0; i < data.length; i ++){
        if (attr.k != ''){
            if (data[i][attr.k] != undefined){
                keySet[data[i][attr.k]] = true
            }
        }
        if (attr.s != ''){
            if (data[i][attr.s] != undefined){
                shapeSet[data[i][attr.k]] = true
            }
        }
    }

    var c = 0;
    if (attr.k != ''){
        for (var key in keySet){
            selectedEntries = data.filter(function(d){return d[attr.k].toString() == key})
            selectedEntries.sort(function(a,b){return a[attr.x]-b[attr.x]});
            pstruct = {key: key, values: [], color: colors(key)}
            for (var i = 0; i < selectedEntries.length; i++){
                entry = selectedEntries[i];
                pstruct.values.push({
                    x: entry[attr.x],
                    y: entry[attr.y],
                    size: (attr.z=='') ? 10 : entry[attr.z],
                    shape: (attr.s == '') ? 'circle' : get_shapes(entry[attr.s])
                })
            }
            plotData.push(pstruct)
            c += 1
        }
    } else {
        console.debug('default key')
        console.debug(data)
        pstruct = {key: key, values: [], color: colors(key)}
        data.sort(function(a,b){return a[attr.x]-b[attr.x]});
        for (var i = 0; i < data.length; i++){
            entry = data[i];
            pstruct.values.push({
                x: entry[attr.x],
                y: entry[attr.y],
                size: (attr.z=='') ? 10 : entry[attr.z],
                shape: (attr.s == '') ? 'circle' : get_shapes(entry[attr.s])
            })
        }
        plotData.push(pstruct)
    }
    if (attr.s == ''){
        shapeLegend = [{key: 'All', value: 'circle'}]
    }
    plotData['shapeLegendData'] = shapeLegend
    console.debug(plotData)
    return plotData;
}

var line_dataLoader = function (uid) {
    data = grapher.data_store[uid]
    attr = grapher.getAttr(uid, 'line')
    
    if (!data || data[0][attr.x] == undefined || data[0][attr.y] == undefined){
        return []
    }

    var plotData = [],
    n = 0;
    keySet = {};

    for (var i = 0; i < data.length; i ++){
        if (data[i][attr.k] != undefined){
            keySet[data[i][attr.k]] = true
        }
    }
    var c = 0;
    if (attr.k != ''){
        for (var key in keySet){
            selectedEntries = data.filter(function(d){return d[attr.k] == key})
            selectedEntries.sort(function(a,b){return a[attr.x]-b[attr.x]});
            pstruct = {key: key, values: [], color: colors(key)}
            for (var i = 0; i < selectedEntries.length; i++){
                entry = selectedEntries[i];
                pstruct.values.push({
                    x: entry[attr.x],
                    y: entry[attr.y],
                })
            }
            plotData.push(pstruct)
            c += 1
        }
    } else {
        data.sort(function(a,b){return a[attr.x]-b[attr.x]});
        pstruct = {key: key, values: [], color: colors(key)}
        for (var i = 0; i < data.length; i++){
            entry = data[i];
            pstruct.values.push({
                x: entry[attr.x],
                y: entry[attr.y],
            })
        }
        plotData.push(pstruct)
        c += 1
    }
    return plotData;
}

var dis_bar_dataLoader = function (uid) { //# groups,# points per group
    data = grapher.data_store[uid]
    attr = grapher.getAttr(uid, 'dis_bar')
    
    if (!data || data[0][attr.y] == undefined || data[0][attr.k] == undefined){
        return []
    }
    
    var plotData = [],
    n = 0;

    for (var i = 0; i < data.length; i ++){
        plotData.push({
            label: data[i][attr.k],
            value: data[i][attr.y]
        })
    }
    plotStruct = [{key: uid, values: plotData}];
    console.debug(plotStruct)
    return plotStruct
}

var graph_handler = function (uid, name, mode){
    if (mode == undefined) mode = grapher.defaults['graphmode']

    switch(mode){
    case "scatter":
        graph_setup(uid, name, mode, scatter_render_factory(uid))
        break;
    case "line":
        graph_setup(uid, name, mode, line_render_factory(uid))
        break;
    case "dis_bar":
        graph_setup(uid, name, mode, dis_bar_render_factory(uid))
        break;
    }
}
