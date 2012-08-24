var code_handler = function(data, uid, name, ext){
    newdiv = createNewCarouselItem(uid);
 
    newpre = document.createElement("pre");
    newpre.setAttribute("id", "pre" + uid);
    newcode = document.createElement("code");
    newcode.setAttribute("id", "code" + uid);
    newcode.setAttribute("class", "code");
    newcode.setAttribute("max-height", 500);
  
    newcaption = createNewCaptionBar(uid, name + "." + ext, "Code-") 

    document.getElementById("item"+uid).appendChild(newpre)
    document.getElementById("pre"+uid).appendChild(newcode)
    document.getElementById("item"+uid).appendChild(newcaption)

    $("#code" + uid).html(data)
    $('#myCarousel').carousel(gindex)
    $('pre code').each(function(i, e) {hljs.highlightBlock(e)});
    gindex = gindex + 1
};
