var img_handler = function(data, uid, name, ext){
    // data is a data URL
    preview = new Image();
    
    newdiv = createNewCarouselItem(uid);
 
    newimg = document.createElement("img");
    newimg.setAttribute("id", "img" + uid);
    newimg.setAttribute("height", 500);
  
    newcaption = createNewCaptionBar(uid, name, "Image-") 

    console.debug("Adding elements")

    document.getElementById("item"+uid).appendChild(newimg)
    document.getElementById("item"+uid).appendChild(newcaption)

    document.getElementById("img" + uid).src = data
    $('#myCarousel').carousel(gindex)

    gindex = gindex + 1
};
