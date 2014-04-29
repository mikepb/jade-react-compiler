
var React = require('react');
var UglifyJS = require('uglify-js');

module.exports = new UglifyJS.TreeTransformer(transformer);

function transformer (node, descend) {
  this.__indent = (this.__indent || 0) + 1;
  console.log(new Array(this.__indent).join('  '), node.TYPE);

  var transformer = exports.transforms[node.TYPE];
  if (transformer) {
    node = transformer.call(this, node, descend) || node;
  } else {
    descend(node, this);
  }

  this.__indent--;

  return node;
}

exports.transforms = {

  Toplevel: function (node, descend) {
    this.__vars = [];
    this.__consts = [];

    var head = [], body = [], tail = [], count = 0;

    // head gets everything before first node
    // body gets first and last nodes, and everything in between
    // tail gets everything else
    for (var i = 0; i < node.body.length; i++) {
      var it = node.body[i];
      if (
        it instanceof UglifyJS.AST_SimpleStatement &&
        it.body instanceof UglifyJS.AST_Call &&
        (expression = it.body.expression) &&
        expression instanceof UglifyJS.AST_SymbolRef &&
        (
          expression.name === '__DOM$$' ||
          expression.name === '__text$$' ||
          expression.name === '__unescape$$'
        )
      ) {
        count++;
        if (body.length) {
          body = body.concat(tail, it);
          tail = [];
        } else {
          body.push(it);
        }
        if (expression.name === '__DOM$$') {
          body.push(node.body[++i]);
        }
      } else if (body.length) {
        tail.push(it);
      } else {
        head.push(it);
      }
    }

    var value = new UglifyJS.AST_BlockStatement({
      body: []
    });

    // wrap multiple nodes in div
    if (count !== 1) {
      if (!body.length) {
        body = head, head = [];
      }
      body.unshift(new UglifyJS.AST_Null());
      value.body = [
        new UglifyJS.AST_SimpleStatement({
          body: new UglifyJS.AST_Call({
            expression: new UglifyJS.AST_SymbolRef({
              name: '__DOM$$'
            }),
            args: [
              new UglifyJS.AST_SymbolRef({
                name: 'div'
              })
            ]
          })
        }),
        new UglifyJS.AST_BlockStatement({
          body: body
        })
      ];
    } else {
      value.body = body;
    }

    value = exports.collapse(value);
    descend(value, this);

    // hoist consts to top
    tail = tail.reduce(function (tail, node) {
      if (node instanceof UglifyJS.AST_Const) {
        this.__consts.push.apply(this.__consts, node.definitions);
      } else {
        tail.push(node);
      }
      return tail;
    }.bind(this), []);

    // add return statement
    if (tail.length) {
      node.body = head.concat([
        new UglifyJS.AST_Var({
          definitions: [
            new UglifyJS.AST_VarDef({
              name: new UglifyJS.AST_SymbolVar({
                name: '__return$$'
              }),
              value: value
            })
          ]
        })
      ], tail, [
        new UglifyJS.AST_Return({
          value: new UglifyJS.AST_SymbolRef({
            name: '__return$$'
          })
        })
      ]);
    } else {
      node.body = head.concat([
        new UglifyJS.AST_Return({
          value: value
        })
      ], tail);
    }

    // hoist var definitions to top
    if (this.__vars.length) {
      node.body.unshift(
        new UglifyJS.AST_Var({
          definitions: this.__vars
        })
      );
    }

    // wrap in CommonJS export
    node.body = [
      new UglifyJS.AST_SimpleStatement({
        body: new UglifyJS.AST_Assign({
          left: new UglifyJS.AST_Dot({
            expression: new UglifyJS.AST_SymbolRef({
              name: 'module'
            }),
            property: 'exports'
          }),
          operator: '=',
          right: new UglifyJS.AST_Function({
            argnames: [],
            body: node.body
          })
        })
      })
    ];

    // hoist consts to top
    if (this.__consts.length) {
      node.body.unshift(
        new UglifyJS.AST_Var({
          definitions: this.__consts
        })
      );
    }

    return node;
  },

  BlockStatement: function (node, descend) {
    node = exports.collapse(node);
    descend(node, this);
    return exports.sequentize(node.body);
  },

  SimpleStatement: function (node, descend) {
    descend(node, this);
    return node.body;
  },

  If: function (node, descend) {
    // descend(node.condition, this);
    // var body = exports.collapse(node.body);
    // var alt = node.alternative;
    // if (alt instanceof UglifyJS.AST_BlockStatement) {
    //   alt = exports.collapse(alt);
    //   descend(alt, this);
    // }
    node = new UglifyJS.AST_Conditional({
      condition: node.condition,
      // consequent: exports.arraytize(body && body.body),
      // alternative: exports.arraytize(alt && alt.body)
      // consequent: new UglifyJS.AST_Null(),
      // alternative: new UglifyJS.AST_Null()
      consequent: node.body,
      alternative: node.alternative || new UglifyJS.AST_Null()
      // consequent: exports.arraytize(body && body.body),
      // alternative: exports.arraytize(alt && alt.body)
    });
    descend(node, this);
    return node;
  },

  Const: function (node, descend) {
    descend(node, this);
    this.__consts.push.apply(this.__consts, node.definitions);
    return new UglifyJS.AST_EmptyStatement();
  },

  Var: function (node, descend) {
    descend(node, this);
    var body = exports.hoist(node, this.__vars);
    body.push(new UglifyJS.AST_Null());
    return exports.sequentize(body);
  },

  Call: function (node, descend) {
    var args = node.args;
    var expression = node.expression;
    var property, props, escape, curr, next;

    if (!(expression instanceof UglifyJS.AST_SymbolRef)) {
      descend(node, this);
      return;
    }

    if (expression.name === '__DOM$$') {
      exports.transformDOMCall.call(this, node, descend);
      return;
    }

    descend(node, this);

    switch (expression.name) {
      case '__unescape$$':
        node.args = [
          new UglifyJS.AST_Object({
            properties: [exports.escapeKeyVal(node.args[0])]
          })
        ];
        node.expression = new UglifyJS.AST_Dot({
          expression: new UglifyJS.AST_Dot({
            expression: new UglifyJS.AST_SymbolRef({
              name: 'React'
            }),
            property: 'DOM'
          }),
          property: 'Text'
        });
        break;
      case '__text$$':
        return node.args[0];
    }
  }

};

exports.collapse = function (node) {
  var nodes = node.body;
  var curr, next, body, expression, args;
  var assign;

  for (var i = 0; i < nodes.length; i++) {
    curr = nodes[i];
    next = nodes[i + 1];
    body = curr.body;

    if (!(
      curr instanceof UglifyJS.AST_SimpleStatement &&
      body instanceof UglifyJS.AST_Call &&
      (expression = body.expression) &&
      expression instanceof UglifyJS.AST_SymbolRef
    )) continue;

    var vars = this.__vars, consts = this.__consts;

    // collapse blocks into DOM call
    if (expression.name === '__DOM$$') {
      if (!(next instanceof UglifyJS.AST_BlockStatement)) continue;
      args = [];
      exports.collapse(next).body.reverse().forEach(function (it) {
        switch (true) {
          case it instanceof UglifyJS.AST_BlockStatement:
            args.unshift(exports.collapse(it));
            break;
          default:
            args.unshift(it);
        }
        return args;
      });
      body.args = body.args.concat(args);
      nodes.splice(i + 1, 1);
    }

    // concatenate sequential texts
    else if (
      expression.name === '__text$$' ||
      expression.name === '__unescape$$'
    ) {
      while (
        next instanceof UglifyJS.AST_SimpleStatement &&
        next.body instanceof UglifyJS.AST_Call &&
        (expression = next.body.expression) &&
        expression instanceof UglifyJS.AST_SymbolRef &&
        (
          expression.name === '__text$$' ||
          expression.name === '__unescape$$'
        )
      ) {
        var it = next.body.args[0];
        body.args[0] = new UglifyJS.AST_Binary({
          left: body.args[0],
          operator: '+',
          right: next.body.args[0]
        });
        nodes.splice(i + 1, 1);
        next = nodes[i + 1];
      }
    }
  }

  return node;
};

exports.hoist = function (node, definitions) {
  var body = [];

  node.definitions.forEach(function (vardef) {
    if (vardef.value) {
      body.push(
        new UglifyJS.AST_SimpleStatement({
          body: new UglifyJS.AST_Assign({
            left: new UglifyJS.AST_SymbolRef({
              name: vardef.name.name
            }),
            operator: '=',
            right: vardef.value
          })
        })
      );
    }
    definitions.push(
      new UglifyJS.AST_VarDef({
        name: vardef.name
      })
    );
  });

  return body;
};

exports.transformDOMCall = function (node, descend) {
  var args = node.args;
  var expression = args.shift();

  // rename function ref to React.DOM.* if necessary
  var property;
  if (expression instanceof UglifyJS.AST_SymbolRef) {
    if (expression.name in React.DOM) {
      property = new UglifyJS.AST_String({
        value: expression.name
      });
      expression = new UglifyJS.AST_SymbolRef({
        name: 'React'
      });
    } else {
      node.expression = expression;
      expression = null;
    }
  }
  if (expression) {
    node.expression = new UglifyJS.AST_Sub({
      expression: new UglifyJS.AST_Dot({
        expression: expression,
        property: 'DOM'
      }),
      property: property
    });
  }

  // process properties
  var props = args[0];
  if (args.length === 2) {
    var unescape = args[1];
    if (unescape instanceof UglifyJS.AST_Call &&
      (expression = unescape.expression) &&
      expression instanceof UglifyJS.AST_SymbolRef &&
      expression.name === '__unescape$$' &&
      (
        !(props instanceof UglifyJS.AST_Object) ||
        !props.properties.some(function (property) {
          return property.key === 'dangerouslySetInnerHTML';
        })
      )
    ) {
      unescape = args.pop().args[0];
      if (
        !(unescape instanceof UglifyJS.AST_String) ||
        unescape.value
      ) {
        if (!(props instanceof UglifyJS.AST_Object)) {
          props = args[0] = new UglifyJS.AST_Object({
            properties: []
          });
        }
        props.properties.push(
          exports.escapeKeyVal(unescape)
        );
      }
    }
  }

  // remove single null argument
  if (
    args.length === 1 &&
    (
      props instanceof UglifyJS.AST_Null ||
      props instanceof UglifyJS.AST_Object && !props.properties.length
    )
  ) {
    node.args = [];
  }

  descend(node, this);

  args = node.args;

  // combine sequences ending with null with next
  for (var i = 1; i < args.length; i++) {
    var curr = args[i];
    var next = args[i + 1];
    if (!(curr instanceof UglifyJS.AST_Seq && next)) continue;
    var cdr = curr;
    do {
      while (curr.cdr instanceof UglifyJS.AST_Seq) cdr = curr.cdr;
      if (!(cdr.cdr instanceof UglifyJS.AST_Null)) break;
      cdr.cdr = next;
      args.splice(i + 1, 1);
      next = args[i + 1];
    } while (next && next instanceof UglifyJS.AST_Seq);
  }

  // remove empty statements
  node.args = args.slice(0, 1).concat(
    args.slice(1).filter(function (it) {
      return !(
        it instanceof UglifyJS.AST_Null ||
        it instanceof UglifyJS.AST_EmptyStatement ||
        it instanceof UglifyJS.AST_String && !it.value ||
        it instanceof UglifyJS.AST_Object && !it.properties.length
      );
    })
  );
};

exports.escapeKeyVal = function (value) {
  return new UglifyJS.AST_ObjectKeyVal({
    key: 'dangerouslySetInnerHTML',
    value: new UglifyJS.AST_Object({
      properties: [
        new UglifyJS.AST_ObjectKeyVal({
          key: '__html',
          value: value
        })
      ]
    })
  });
};

exports.sequentize = function (args, sep) {
  if (!args) {
    return new UglifyJS.AST_Null();
  }
  switch (args.length) {
    case 1:
      if (args[0] instanceof UglifyJS.AST_SimpleStatement) {
        return args[0].body;
      } else {
        return args[0];
      }
    case 0:
      return new UglifyJS.AST_Null()
  }
  if (args[0] instanceof UglifyJS.AST_SimpleStatement) {
    args[0] = args[0].body;
  }
  return args.reduce(function (left, right) {
    if (right instanceof UglifyJS.AST_SimpleStatement) {
      right = right.body;
    }
    if (sep) {
      return new UglifyJS.AST_Binary({
        left: left,
        operator: '+',
        right: right
      });
    } else {
      return new UglifyJS.AST_Seq({
        car: left,
        cdr: right
      });
    }
  });
};

exports.arraytize = function (elements) {
  // console.log(elements)
  if (!elements) return new UglifyJS.AST_Null();
  elements = elements.map(function (it) {
    switch (true) {
      case it instanceof UglifyJS.AST_SimpleStatement:
        return it.body;
      default:
        return it;
    }
  });
  switch (elements.length) {
    case 0:
      return new UglifyJS.AST_Null();
    case 1:
      return elements[0];
    default:
      return new UglifyJS.AST_Array({
        elements: elements
      });
  }
};
