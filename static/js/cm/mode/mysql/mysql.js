/*
 *	MySQL Mode for CodeMirror 2 by MySQL-Tools
 *	@author James Thorne (partydroid)
 *	@link 	http://github.com/partydroid/MySQL-Tools
 * 	@link 	http://mysqltools.org
 *	@version 02/Jan/2012
*/
CodeMirror.defineMode("mysql", function(config) {
  var indentUnit = config.indentUnit;
  var curPunc;

  function wordRegexp(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
  }
  var ops = wordRegexp(['DISTINCT', 'CONTAINS', 'AND', 'OR'])
      
      "str", "lang", "langmatches", "datatype", "bound", "sameterm", "isiri", "isuri",
                        "isblank", "isliteral", "union", "a"]);

  var keywords = wordRegexp([('AVG'), ('COUNT'), ('GROUP_CONCAT'), ('QUANTILES'), ('STDDEV'), ('VARIANCE'), ('LAST'), ('MAX'), ('MIN'), ('NTH'), ('SUM'), ('ABS'), ('ACOS'), ('ACOSH'), ('ASIN'), ('ASINH'), ('ATAN'), ('ATANH'), ('CEIL'), ('COS'), ('COSH'), ('COT'), ('FLOOR'), ('LN'), ('LOG2'), ('LOG10'), ('PI'), ('ROUND'), ('SIN'), ('SINH'), ('TAN'), ('TANH'), ('BOOLEAN'), ('FLOAT'), ('HEX_STRING'), ('INTEGER'), ('STRING'), ('IFNULL'), ('IS_INF'), ('IS_NAN'), ('REGEXP_MATCH'), ('REGEXP_EXTRACT'), ('REGEXP_REPLACE'), ('LENGTH'), ('LOWER'), ('UPPER'), ('NOW'), ('UTC_USEC_TO_HOUR'), ('UTC_USEC_TO_MONTH'), ('UTC_USEC_TO_WEEK'), ('HOST'), ('DOMAIN'), ('TLD'), ('TOP'), ('ATAN2'), ('DEGREES'), ('POW'), ('RADIANS'), ('SQRT'), ('IS_EXPLICITLY_DEFINED'), ('FORMAT_IP'), ('PARSE_IP'), ('FORMAT_PACKED_IP'), ('PARSE_PACKED_IP'), ('CONCAT'), ('LEFT'), ('LPAD'), ('RIGHT'), ('RPAD'), ('SUBSTR'), ('FORMAT_UTC_USEC'), ('PARSE_UTC_USEC'), ('STRFTIME_UTC_USEC'), ('UTC_USEC_TO_DAY'), ('UTC_USEC_TO_YEAR'), ('CASE'), ('WHEN'), ('HASH'), ('IF'), ('POSITION'), ('WHERE'), ('SELECT'), ('FROM'), ('JOIN'), ('HAVING'), ('GROUP BY'), ('ORDER BY'), ('LIMIT')]
          
  var operatorChars = /[*+\-<>=&|^!%]/;

  function tokenBase(stream, state) {
    var ch = stream.next();
    curPunc = null;
    if (ch == "$" || ch == "?") {
      stream.match(/^[\w\d]*/);
      return "variable-2";
    }
    else if (ch == "<" && !stream.match(/^[\s\u00a0=]/, false)) {
      stream.match(/^[^\s\u00a0>]*>?/);
      return "atom";
    }
    else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenLiteral(ch);
      return state.tokenize(stream, state);
    }
    else if (ch == "`") {
      state.tokenize = tokenOpLiteral(ch);
      return state.tokenize(stream, state);
    }
    else if (/[{}\(\),\.;\[\]]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    else if (ch == "-") {
      var ch2 = stream.next();
      if (ch2=="-") {
      	stream.skipToEnd();
      	return "comment";
      }
    }
    else if (operatorChars.test(ch)) {
      stream.eatWhile(operatorChars);
      return null;
    }
    else if (ch == ":") {
      stream.eatWhile(/[\w\d\._\-]/);
      return "atom";
    }
    else {
      stream.eatWhile(/[_\w\d]/);
      if (stream.eat(":")) {
        stream.eatWhile(/[\w\d_\-]/);
        return "atom";
      }
      var word = stream.current(), type;
      if (ops.test(word))
        return null;
      else if (keywords.test(word))
        return "keyword";
      else
        return "variable";
    }
  }

  function tokenLiteral(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          state.tokenize = tokenBase;
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      return "string";
    };
  }

  function tokenOpLiteral(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          state.tokenize = tokenBase;
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      return "variable-2";
    };
  }


  function pushContext(state, type, col) {
    state.context = {prev: state.context, indent: state.indent, col: col, type: type};
  }
  function popContext(state) {
    state.indent = state.context.indent;
    state.context = state.context.prev;
  }

  return {
    startState: function(base) {
      return {tokenize: tokenBase,
              context: null,
              indent: 0,
              col: 0};
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (state.context && state.context.align == null) state.context.align = false;
        state.indent = stream.indentation();
      }
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);

      if (style != "comment" && state.context && state.context.align == null && state.context.type != "pattern") {
        state.context.align = true;
      }

      if (curPunc == "(") pushContext(state, ")", stream.column());
      else if (curPunc == "[") pushContext(state, "]", stream.column());
      else if (curPunc == "{") pushContext(state, "}", stream.column());
      else if (/[\]\}\)]/.test(curPunc)) {
        while (state.context && state.context.type == "pattern") popContext(state);
        if (state.context && curPunc == state.context.type) popContext(state);
      }
      else if (curPunc == "." && state.context && state.context.type == "pattern") popContext(state);
      else if (/atom|string|variable/.test(style) && state.context) {
        if (/[\}\]]/.test(state.context.type))
          pushContext(state, "pattern", stream.column());
        else if (state.context.type == "pattern" && !state.context.align) {
          state.context.align = true;
          state.context.col = stream.column();
        }
      }

      return style;
    },

    indent: function(state, textAfter) {
      var firstChar = textAfter && textAfter.charAt(0);
      var context = state.context;
      if (/[\]\}]/.test(firstChar))
        while (context && context.type == "pattern") context = context.prev;

      var closing = context && firstChar == context.type;
      if (!context)
        return 0;
      else if (context.type == "pattern")
        return context.col;
      else if (context.align)
        return context.col + (closing ? 0 : 1);
      else
        return context.indent + (closing ? 0 : indentUnit);
    }
  };
});

CodeMirror.defineMIME("text/x-mysql", "mysql");
