var CR2_handler = function(data, uid, name, ext){
    // Data is binary string
    function bytes_to_int (bytes){
          offset = 1
          res = 0
          for (var i = 0; i < 4; i ++){
              res += bytes.charCodeAt(i) << (8*i)
          }
          return res
    }

    var a = bytes_to_int(data.slice(98,98+4))
    var b = bytes_to_int(data.slice(122,122+4))
    console.debug(a + ": " + b)
    
    img_handler("data:image/jpg;base64," + btoa(data.slice(a,a+b)), uid, name)
};
