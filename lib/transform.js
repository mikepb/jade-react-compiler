'use strict';

var React = require('react');
var UglifyJS = require('uglify-js');
var parseJSExpression = require('character-parser').parseMax;

var compressor = new UglifyJS.Compressor({
  booleans: false,
  hoist_vars: true,
  sequences: false,
  side_effects: false,
  unused: false
});

function parse (val, options, full) {
  var ast = UglifyJS.parse('(' + val + ')', options);
  return full ? ast : ast.body[0].body;
}

function concat (parts, sep, start) {
  var ast = parts.pop();

  parts.reverse().forEach(function (val) {
    if (sep) {
      val = new UglifyJS.AST_Binary({
        start: start,
        left: val,
        operator: '+',
        right: new UglifyJS.AST_String({
          value: sep
        })
      });
    }
    ast = new UglifyJS.AST_Binary({
      start: start,
      left: val,
      operator: '+',
      right: ast
    });
  });

  return ast;
}

function seq (args) {
  if (!args.length) return new UglifyJS.AST_Null();
  if (args.length === 1) return args[0];
  return args.reduce(function (ast, it) {
    new UglifyJS.AST_Seq({
      car: ast,
      cdr: it
    })
  });
}

/**
 * Initialize `Transform` with the given `token` and `options`.
 *
 * @param {Node} node
 * @param {Object} options
 * @api public
 */

var Transform = module.exports = function Transform (node, options) {
  this.options = options = options || {};
  this.node = node;
};

/**
 * Transform prototype.
 */

Transform.prototype = {

  /**
   * Compile parse tree to JavaScript.
   *
   * @api public
   */

  compile: function (options) {
    if (!this.ast) this.transform();
    var opts = {
      beautify: true,
      comments: true,
      indent_level: 2
    };
    var key;
    if (options) for (key in options) opts[key] = options[key];
    this.ast.figure_out_scope();
    return this.ast.transform(compressor).print_to_string(opts);
  },

  transform: function () {
    this.visit = this.visit.bind(this);
    this.depth = -1;
    this.hasEachHelper = false;
    this.ast = new UglifyJS.AST_Toplevel({
      start: new UglifyJS.AST_Token({
        file: this.node.filename,
        line: this.node.line + 1
      }),
      body: []
    });
    this.ast.body = this.ast.body.concat(
      this.visit(this.node).map(function (it) {
        return new UglifyJS.AST_SimpleStatement({
          body: it
        });
      })
    );
  },

  /**
   * Interpolate the given `str`.
   *
   * @param {String} str
   * @api public
   */

  interpolate: function (str, start) {
    var parts = [];
    var match;
    var ast;

    if (str.val) {
      str = str.val;
    }

    while (str && (match = /(\\)?([#!]){((?:.|\n)*)$/.exec(str))) {
      ast = new UglifyJS.AST_String({
        start: start,
        value: str.substr(0, match.index)
      });

      parts.push(ast);
      str = match[3];

      if (match[1]) { // escape
        ast.value += match[2] + '{';
        continue;
      }

      var range = parseJSExpression(str);
      ast = parse(range.src, { filename: str.filename });
      if ('!' === match[2]) ast = this.unescape(ast, start);

      parts.push(ast);
      str = str.substr(range.end + 1);
    }

    if (str) {
      parts.push(
        new UglifyJS.AST_String({
          start: start,
          value: str
        })
      );
    }

    return concat(parts, '', start);
  },

  /**
   * Wrap the given `ast` around a React unsafe HTML object.
   *
   * @param {AST_Node} node
   * @api public
   */

  unescape: function (ast, start) {
    var ast = new UglifyJS.AST_Call({
      start: start,
      expression: new UglifyJS.AST_Dot({
        start: start,
        property: 'text',
        expression: new UglifyJS.AST_Dot({
          start: start,
          property: 'DOM',
          expression: new UglifyJS.AST_SymbolRef({
            name: 'React'
          })
        })
      }),
      args: [
        new UglifyJS.AST_Object({
          start: start,
          properties: [
            new UglifyJS.AST_ObjectKeyVal({
              start: start,
              key: 'dangerouslySetInnerHTML',
              value: new UglifyJS.AST_Object({
                properties: [
                  new UglifyJS.AST_ObjectKeyVal({
                    start: start,
                    key: '__html',
                    value: ast
                  })
                ]
              })
            })
          ]
        })
      ]
    });
    ast.__unescape = true;
    return ast;
  },

  /**
   * Visit `node`.
   *
   * @param {Node} node
   * @api public
   */

  visit: function (node) {
    // this.__indent = (this.__indent || 0) + 1;
    // console.log(new Array(this.__indent).join('  ') + node.type)
    var start = new UglifyJS.AST_Token({
      file: node.filename,
      line: node.line + 1
    });
    var ast = this['visit' + node.type](node, start);
    // this.__indent--;
    return ast;
  },

  /**
   * Visit case `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitCase: function (node, start) {
    return new UglifyJS.AST_Call({
      start: start,
      expression: new UglifyJS.AST_Dot({
        start: start,
        property: 'call',
        expression: new UglifyJS.AST_Function({
          start: start,
          argnames: [],
          body: [
            new UglifyJS.AST_Switch({
              start: start,
              expression: parse(node.expr, start),
              body: this.visit(node.block)
            })
          ]
        })
      }),
      args: [
        new UglifyJS.AST_This()
      ]
    });
  },

  /**
   * Visit when `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitWhen: function (node, start) {
    var body = node.block ? this.visit(node.block) : [];

    if (body.length) {
      body = [
        new UglifyJS.AST_Return({
          start: start,
          value: body.length === 1 ? body[0] : new UglifyJS.AST_Array({
            start: start,
            elements: body
          })
        })
      ];
    }

    return node.expr === 'default' ? new UglifyJS.AST_Default({
      start: start,
      body: body
    }) : new UglifyJS.AST_Case({
      start: start,
      expression: parse(node.expr),
      body: body
    });
  },

  /**
   * Visit literal `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitLiteral: function (node) {
    throw new Error('HTML literals not supported');
  },

  /**
   * Visit all nodes in `block`.
   *
   * @param {Block} block
   * @api public
   */

  visitBlock: function (block, start) {
    var body = [];
    var comments = [];

    block.nodes.forEach(function (node) {
      var ast;

      switch (node.type) {
        case 'Comment':
        case 'BlockComment':
          if (ast = this.visit(node)) comments.push(ast);
          return;
      }

      if (ast = this.visit(node)) {
        ast.start.nlb = !!comments.length;
        ast.start.comments_before = comments;
        body.push(ast);
        comments = [];
      }
    }.bind(this));

    // UglifyJS doesn't support trailing comments
    // if (comments.length) {
    //   body.push(
    //     new UglifyJS.AST_BlockStatement({
    //       start: new UglifyJS.AST_Token({
    //         comments_before: comments
    //       }),
    //       body: []
    //     })
    //   );
    // }

    return body;
  },

  /**
   * Visit a mixin's `block` keyword.
   *
   * @param {MixinBlock} block
   * @api public
   */

  visitMixinBlock: function (block) {
    throw new Error('not implemented');
  },

  /**
   * Visit `doctype`.
   *
   * @param {Doctype} doctype
   * @api public
   */

  visitDoctype: function () {
    throw new Error('not supported');
  },

  /**
   * Visit `mixin`, generating a function that
   * may be called within the template.
   *
   * @param {Mixin} mixin
   * @api public
   */

  visitMixin: function (mixin) {
    throw new Error('not implemented');
  },

  /**
   * Visit `tag`, translate the tag name, generate attributes, and
   * visit the `tag`'s code and block.
   *
   * @param {Tag} tag
   * @api public
   */

  visitTag: function (tag, start) {
    var name = tag.name;
    var expression;
    var args = [];
    var ast;

    if (tag.buffer || name in React.DOM) {
      expression = new UglifyJS.AST_Dot({
        start: start,
        property: tag.buffer
          ? parse(name, { filename: tag.filename })
          : name,
        expression: new UglifyJS.AST_Dot({
          start: start,
          property: 'DOM',
          expression: new UglifyJS.AST_SymbolRef({
            start: start,
            name: 'React'
          })
        })
      });
    } else {
      expression = new UglifyJS.AST_SymbolRef({
        start: start,
        name: name
      });
    }

    args = [this.visitAttributes(tag.attrs, tag.attributeBlocks)];
    if (tag.code) args.push(this.visitCode(tag.code));
    args = args.concat(this.visit(tag.block));

    if (args.length === 2 && !args[0].__unescape && args[1].__unescape) {
      ast = args.pop();
      if (args[0].TYPE === 'Null') {
        args = ast.args;
      } else {
        args.properties.push(ast.args[0].properties[0]);
      }
    } else if (args.length === 1 && args[0].TYPE === 'Null') {
      args = [];
    }

    return new UglifyJS.AST_Call({
      start: start,
      expression: expression,
      args: args
    });
  },

  /**
   * Visit `filter`, throwing when the filter does not exist.
   *
   * @param {Filter} filter
   * @api public
   */

  visitFilter: function (filter) {
    throw new Error('not implemented');
  },

  /**
   * Visit `text` node.
   *
   * @param {Text} text
   * @api public
   */

  visitText: function (text, start) {
    return this.interpolate(text, start);
  },

  /**
   * Visit a `comment`.
   *
   * @param {Comment} comment
   * @api public
   */

  visitComment: function (comment) {
    if (!comment.buffer) return;
    return new UglifyJS.AST_Token({
      type: 'comment1',
      value: comment.val
    });
  },

  /**
   * Visit a `BlockComment`.
   *
   * @param {Comment} comment
   * @api public
   */

  visitBlockComment: function (comment) {
    if (!comment.buffer) return;
    return new UglifyJS.AST_Token({
      type: 'comment2',
      value: '\n' + comment.block.nodes.map(function (it) {
        return it.val;
      }).join('\n') + '\n'
    });
  },

  /**
   * Visit `code`, respecting buffer / escape flags.
   * If the code is followed by a block, wrap it in
   * a self-calling function.
   *
   * @param {Code} code
   * @api public
   */

  visitCode: function (code, start) {
    if (code.buffer) {
      var ast = parse(code.val, { filename: code.filename });
      if (!code.escape) ast = this.unescape(ast, start);
      return ast;
    }

    console.log(code)
    throw new Error('not implemented');
  },

  /**
   * Visit `each` block.
   *
   * @param {Each} each
   * @api public
   */

  visitEach: function (each, start) {
    this.injectEachHelper();

    var argnames = [
      new UglifyJS.AST_SymbolFunarg({
        start: start,
        name: each.val
      }),
      new UglifyJS.AST_SymbolFunarg({
        start: start,
        name: each.key
      })
    ];

    var args = [
      parse(each.obj),
      this.wrapFn(this.visit(each.block), argnames)
    ];

    if (each.alternative) {
      args.push(this.wrapFn(this.visit(each.alternative), argnames));
    }

    return new UglifyJS.AST_Call({
      start: start,
      args: args,
      expression: new UglifyJS.AST_SymbolRef({
        start: start,
        name: '__map$'
      })
    });
  },

  /**
   * Visit `attrs`.
   *
   * @param {Array} attrs
   * @api public
   */

  visitAttributes: function (attrs, attributeBlocks) {
    if (attributeBlocks.length) throw new Error('not implemented');
    if (attrs.length) return this.attrs(attrs);
    return new UglifyJS.AST_Null();
  },

  /**
   * Compile attributes.
   */

  attrs: function (attrs) {
    var properties = [];
    var classes = [];

    var obj = new UglifyJS.AST_Object({
      properties: properties
    });

    attrs.forEach(function (attr) {
      var filename = attr.filename;
      var key = attr.name;
      var val = attr.val;
      var ast;

      switch (key) {
        case 'dangerouslySetInnerHTML':
          obj.__unescape = true;
          break;
        case 'class':
          if (val != null && val !== '' && val !== '""' && val !== "''") {
            ast = parse(val, { filename: filename });
            if (ast.TYPE === 'Array') {
              classes = classes.concat(ast.elements);
            } else {
              classes.push(ast);
            }
          }
          return;
        case 'for':
          key = 'htmlFor';
          break;
        default:
          if (/^(data|aria)-/.test(key)) break;
          key = key.split('-');
          key = key[0] + key.slice(1).map(function (it) {
            return it[0].toUpperCase() + it.substr(1);
          }).join('');
      }

      ast = parse(val, { filename: filename });

      switch (ast.TYPE) {
        case 'Directive': ast = new UglifyJS.AST_String(ast); break;
        case 'SimpleStatement': ast = ast.body; break;
      }

      properties.push(
        new UglifyJS.AST_ObjectKeyVal({
          start: new UglifyJS.AST_Token({
            file: filename,
            line: attr.line + 1
          }),
          key: key,
          value: ast
        })
      );
    });

    if (classes.length) {
      properties.push(
         new UglifyJS.AST_ObjectKeyVal({
          key: "className",
          value: concat(classes, ' ')
        })
      );
    }

    return properties.length ? obj : new UglifyJS.AST_Null();
  },

  /**
   * Inject each helper function into AST.
   */

  injectEachHelper: function () {
    if (this.hasEachHelper) return;
    this.ast.body.push(
      parse(
        "function __map$ (obj, each, alt) {\n" +
        "  if (typeof obj.length === 'number') return [].map.call(obj, each);\n" +
        "  var result = [], key;\n" +
        "  for (key in obj) result.push(each(obj[key], key));\n" +
        "  return !alt || result.length ? result : alt();\n" +
        "}"
      )
    );
    this.hasEachHelper = true;
  },

  wrapFn: function (ast, argnames) {
    var start = ast.start;

    switch (ast.length) {
      case 0:
        ast = new UglifyJS.AST_Null();
        break;
      case 1:
        ast = ast[0];
        break;
      default:
        ast = new UglifyJS.AST_Array({
          elements: ast
        });
    }

    return new UglifyJS.AST_Call({
      start: start,
      args: [
        new UglifyJS.AST_This()
      ],
      expression: new UglifyJS.AST_Dot({
        start: start,
        property: 'bind',
        expression: new UglifyJS.AST_Function({
          start: start,
          body: [
            new UglifyJS.AST_Return({
              start: start,
              value: ast
            })
          ],
          argnames: argnames
        })
      })
    });
  }

};
