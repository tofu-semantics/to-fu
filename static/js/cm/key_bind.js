CodeMirror.keyMap.vim['ctrl'] = function(cm){
            expr = cm.getValue()
            async_server_op('simplify', expr, function(response){
                async_server_op('latex', response, preview_callback)
            })
}

CodeMirror.keyMap.vim['tab'] = function(cm){
            CodeMirror.simpleHint(cm, function(cm){
                return {['foo','bar'], 0,2}
            }
}

CodeMirror.keyMap.vim['shift'] = function(cm){
            expr = cm.getValue()
            console.debug(expr)
            async_server_op('evalf', expr, function(response){
                async_server_op('latex', response, preview_callback)
            })
}

CodeMirror.keyMap.vim['enter'] = function(cm){
            expr = cm.getValue()
}
