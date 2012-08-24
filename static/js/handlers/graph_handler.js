var make_controls = function (uid, labels, types){
    data = data_store[uid]
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
    var source = $('#control-template').html()
    var template = Handlebars.compile(source)
    data = {uid: uid, label_1: label_1, label_2: label_2, fields: fields}
    $("#control"+uid).append(template(data))
}

var colors = d3.scale.category10();
//var shapes = ['diamond', 'circle', 'triangle-up', 'square', 'cross', 'triangle-down'],
//    shape_map = {_lastkey: 0}


var scatter_dataLoader = function (uid) { //# groups,# points per group
    data = data_store[uid]
    var keyAttr = $('#select' + uid + 'series').val() ,
    xAttr = $('#select' + uid + 'x').val(),
    yAttr = $('#select' + uid + 'y').val(),
    zAttr = $('#select' + uid + 'size').val(),
    shapeAttr = $('#select' + uid + 'shape').val(),
    plotData = [],
    n = 0;

    console.debug(keyAttr + "*")

    keyAttr = (keyAttr == "") ? defaults['k'] : keyAttr
    xAttr = (xAttr == "") ? defaults['x'] : xAttr
    yAttr = (yAttr == "") ? defaults['y'] : yAttr 
    zAttr = (zAttr == "") ? defaults['z'] : zAttr 
    shapeAttr = (shapeAttr == "") ? defaults['s'] : shapeAttr
    //var colors = d3.scale.category10();
    console.debug(data)
    //var shapes = ['diamond', 'circle', 'triangle-up', 'square', 'cross', 'triangle-down'],
    //var shapes = ['diamond', 'triangle-up', 'square', 'cross', 'triangle-down'],
    var shapes = ['circle']
    shape_map = {_lastkey: 0}    
    keySet = {};
    shapeSet = {};

    shapeLegend = [];

    var get_shapes = function(key){
         if (shape_map[key] == undefined) {
             shape_map[key] = (shape_map['_lastkey'] + 1) % shapes.length
             shape_map['_lastkey'] = shape_map[key]
             console.debug(key + ' : ' + shape_map[key])
         }
         if (shapeLegend.filter(function(s){return s.key == key}).length == 0){
         //    shapeLegend.push({key: key, value: shapes[shape_map[key]]})
         }
         return shapes[shape_map[key]]
    }

    for (var i = 0; i < data.length; i ++){
        if (data[i][keyAttr] != undefined){
            keySet[data[i][keyAttr]] = true
        }
        if (data[i][shapeAttr] != undefined){
            shapeSet[data[i][keyAttr]] = true
        }
    }

    //shape_map["no call"] = "circle"
    //shapeLegend.push({key: "no call", value: "circle"})

    var c = 0;
    for (var key in keySet){
        selectedEntries = data.filter(function(d){return d[keyAttr].toString() == key})
        pstruct = {key: key, values: [], color: colors(key)}
        for (var i = 0; i < selectedEntries.length; i++){
            selectedEntries.sort(function(a,b){return a[xAttr]-b[xAttr]});
            entry = selectedEntries[i];
            pstruct.values.push({
                x: entry[xAttr],
                y: entry[yAttr],
                size: entry[zAttr],
                shape: get_shapes(entry[shapeAttr])
            })
        }
        plotData.push(pstruct)
        c += 1
    }
    plotData['shapeLegendData'] = shapeLegend

    return plotData;
}

var scatter_handler = function(uid, name){
    labels = ['x','y','size','shape','series'];
    types = ['r','r','r','c','c']
    make_controls(uid, labels, types) 

    $('#myCarousel').carousel($(".carousel-inner").children().index($('#item'+uid)))

    var nvRender = function() {
        var chart = nv.models.scatterChart()
 
        chart.xAxis.tickFormat(d3.format('.02f'))
        chart.yAxis.tickFormat(d3.format('.02f'))
        
        d3.select('#chart' + uid + ' svg')
            .datum(scatter_dataLoader(uid))
            .transition().duration(300)
            .call(chart);
 
        nv.utils.windowResize(chart.update);
        update_functions.push(chart.update);
        return chart;
    }

    $(".select" + uid).change(function () {
                                    $('#chart' + uid).html("<svg></svg>")
                                    nv.addGraph(nvRender)
                                })
    nv.addGraph(nvRender)

}

var line_handler = function(uid, name){
    labels = ['x','y','series'];
    types = ['r','r','c']
    make_controls(uid, labels, types) 
    $('#myCarousel').carousel($(".carousel-inner").children().index($('#item'+uid)))

    var nvRender = function() {
        var chart = nv.models.lineWithFocusChart()
 
        chart.xAxis.tickFormat(d3.format('.02f'))
        chart.yAxis.tickFormat(d3.format('.02f'))
        
        d3.select('#chart' + uid + ' svg')
            .datum(line_dataLoader(uid))
            .transition().duration(300)
            .call(chart);
 
        nv.utils.windowResize(chart.update);
        update_functions.push(chart.update);
        return chart;
    }

    $(".select" + uid).change(function () {
                                    $('#chart' + uid).html("<svg></svg>")
                                    nv.addGraph(nvRender)
                                })
    nv.addGraph(nvRender)

}

var line_dataLoader = function (uid) { //# groups,# points per group
    data = data_store[uid]
    var keyAttr = $('#select' + uid + 'series').val() ,
    xAttr = $('#select' + uid + 'x').val(),
    yAttr = $('#select' + uid + 'y').val(),
    plotData = [],
    n = 0;


    keyAttr = (keyAttr == "") ? defaults['k'] : keyAttr
    xAttr = (xAttr == "") ? defaults['x'] : xAttr
    yAttr = (yAttr == "") ? defaults['y'] : yAttr 
    //var colors = d3.scale.category10();d

    //var shapes = ['diamond', 'circle', 'triangle-up', 'square', 'cross', 'triangle-down'],
    keySet = {};

    for (var i = 0; i < data.length; i ++){
        if (data[i][keyAttr] != undefined){
            keySet[data[i][keyAttr]] = true
        }
    }
    var c = 0;
    for (var key in keySet){
        selectedEntries = data.filter(function(d){return d[keyAttr] == key})
        pstruct = {key: key, values: [], color: colors(key)}
        for (var i = 0; i < selectedEntries.length; i++){
            selectedEntries.sort(function(a,b){return a[xAttr]-b[xAttr]});
            entry = selectedEntries[i];
            pstruct.values.push({
                x: entry[xAttr],
                y: entry[yAttr],
            })
        }
        //console.debug(plotData)
        //console.debug(shape_map)
        plotData.push(pstruct)
        c += 1
    }
    return plotData;
}

var dis_bar_handler = function(uid, name){
    labels = ['y','series'];
    types = ['r','c']
    make_controls(uid, labels, types) 

    $('#myCarousel').carousel($(".carousel-inner").children().index($('#item'+uid)))

    var nvRender = function() {
        var chart = nv.models.discreteBarChart()
            .x(function(d) { return d.label })
            .y(function(d) { return d.value })
            .staggerLabels(true)
            .tooltips(false)
            .showValues(true)
  
        chart.xAxis.tickFormat(d3.format('.02f'))
        chart.yAxis.tickFormat(d3.format('.02f'))
        
        d3.select('#chart' + uid + ' svg')
            .datum(dis_bar_dataLoader(uid))
            .transition().duration(300)
            .call(chart);
 
        nv.utils.windowResize(chart.update);
        update_functions.push(chart.update);
        return chart;
    }

    $(".select" + uid).change(function () {
                                    $('#chart' + uid).html("<svg></svg>")
                                    nv.addGraph(nvRender)
                                })
    nv.addGraph(nvRender)

}

var dis_bar_dataLoader = function (uid) { //# groups,# points per group
    data = data_store[uid]
    var keyAttr = $('#select' + uid + 'series').val() ,
    yAttr = $('#select' + uid + 'y').val(),
    plotData = [],
    n = 0;

    keyAttr = (keyAttr == "") ? defaults['k'] : keyAttr
    yAttr = (yAttr == "") ? defaults['y'] : yAttr

    console.debug(keyAttr + "*")

    for (var i = 0; i < data.length; i ++){
        plotData.push({
            label: data[i][keyAttr],
            value: data[i][yAttr]
        })
    }
    plotStruct = [{key: uid, values: plotData}];
    console.debug(plotStruct)
    return plotStruct
}

var graph_handler = function (uid, name, mode){
    if (mode == undefined) mode = defaults['graphmode']

    console.debug(mode)
    switch(mode){
    case "scatter":
        scatter_handler(uid, name)
        break;
    case "line":
        line_handler(uid, name)
        break;
    case "dis_bar":
        dis_bar_handler(uid, name)
        break;
    }
}
