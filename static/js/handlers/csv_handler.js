var csv_handler = function (data, uid, name, ext) {

    newdiv = createNewCarouselItem(uid);

    newchart = document.createElement("div");
    newchart.setAttribute("id", "chart" + uid);
    newchart.setAttribute("style", "height:450px");

    newcontroldiv = document.createElement("div");
    newcontroldiv.setAttribute("id", "control"+uid);
    newcontroldiv.setAttribute("class", "row");

    newcaption = createNewCaptionBar(uid, name, "JSON-")

    // Can't use createElement then appendChild because of strange capitalization bug
    newchart = newdiv.appendChild(newchart).innerHTML = '<svg></svg>'
    newcontrol = newdiv.appendChild(newcontroldiv)
    newcaption = newdiv.appendChild(newcaption)

    data_store[uid] = $.csv2Dictionary(data)

    // Handler for plotting scatter-plots found in graph_handler.js
    graph_handler(uid, name)
}
