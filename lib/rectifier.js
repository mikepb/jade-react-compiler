'use strict';

var React = require('react');

/**
 * Initialize `Rectifier` with the given `program` and `options`.
 *
 * @param {Program} program
 * @param {Object} [options]
 * @api public
 */

var Rectifier = module.exports = function Rectifier (program, options) {
  this.ast = program;
  this.options = options || {};
  for (var method in this) {
    if (typeof this[method] === 'function') {
      this[method] = this[method].bind(this);
    }
  }
}

/**
 * Rectifier prototype.
 */

Rectifier.prototype = {

  /**
   * Rectify intermediate JavaScript.
   *
   * @api public
   */

  rectify: function () {
    this.vars = [];
    this.consts = [];
    this.funs = [];
    this.domAt = null;
    this.domCount = 0;
    this.domDepth = 0;
    this.depth = -1;
    this.program = this.visit(this.ast);
    return this.program;
  },

  /**
   * Visit node.
   *
   * @param {Node} node
   * @api public
   */

  visit: function (node) {
    this.depth++;
    var visitor = this['visit' + node.type];
    if (visitor) node = visitor(node);
    else console.warn('missing visitor for ' + node.type);
    this.depth--;
    return node;
  },

  /**
   * Visit program.
   *
   * @param {Program} program
   * @api public
   */

  visitProgram: function (program) {
    var exprs = this.collapseStatements(program.body);

    // wrap in div if there are more than one root DOM
    if (this.domCount > 1) {
      exprs = [this.maybeWrapDiv(this.nullWithNext(exprs))];
    }

    // create return statement
    var statements = [
      {
        type: 'ReturnStatement',
        argument: this.makeSequence(exprs)
      }
    ];

    // hoist variable declarations
    if (this.vars.length) {
      statements.unshift({
        type: 'VariableDeclaration',
        declarations: this.vars,
        kind: 'var'
      });
    }

    // move function declarations
    if (this.funs.length) {
      [].push.apply(statements, this.funs);
    }

    // wrap in CommonJS module
    program.body = this.wrapCommonJS(statements);

    // hoist const declarations
    if (this.consts.length) {
      var consts = {};
      program.body.unshift({
        type: 'VariableDeclaration',
        declarations: this.consts.reduce(function (decls, decl) {
          var name = decl.id.name;
          if (!consts[name]) decls.push(decl), consts[name] = true;
          return decls;
        }, []),
        kind: 'var'
      });
    }

    return program;
  },

  /**
   * Visit empty statement.
   *
   * @api public
   */

  visitEmptyStatement: function () {
    return null;
  },

  /**
   * Visit block statement.
   *
   * @param {BlockStatement} block
   * @api public
   */

  visitBlockStatement: function (block) {
    return this.makeSequence(this.collapseStatements(block.body));
  },

  /**
   * Visit expression statement.
   *
   * @param {Expression} expr
   * @api public
   */

  visitExpressionStatement: function (expr) {
    return expr.expression;
  },

  /**
   * Visit switch statement.
   *
   * @param {IfStatement} ifs
   * @api public
   */

  visitSwitchStatement: function (switchs) {
    throw new Error('not supported');
  },

  /**
   * Visit if statement.
   *
   * @param {IfStatement} ifs
   * @api public
   */

  visitIfStatement: function (ifs) {
    var body = this.maybeWrapDiv(
      this.collapseStatements(ifs.consequent.body));
    var alt = ifs.alternate;
    alt = this.maybeWrapDiv(alt && this.collapseStatements(alt.body));
    return {
      type: 'ConditionalExpression',
      test: this.visit(ifs.test),
      consequent: body,
      alternate: alt
    };
  },

  /**
   * Visit function declaration.
   *
   * @param {FunctionDeclaration} fn
   * @api public
   */

  visitFunctionDeclaration: function (fn) {
    this.funs.push(fn);
  },

  /**
   * Visit variable declaration.
   *
   * @param {VariableDeclaration} declaration
   * @api public
   */

  visitVariableDeclaration: function (declaration) {
    var declarations = declaration.declarations;
    var result;
    switch (declaration.kind) {
      case 'var':
        result = this.makeSequence(
          declarations.map(this.visit).concat(this.nullLiteral));
        declarations.forEach(function (declarator) {
          declarator.init = null;
        });
        this.vars = this.vars.concat(declarations);
        return result;
      case 'const':
        this.consts = this.consts.concat(declarations);
        break;
      default:
        throw new Error('unsupported variable declaration: ' +
          JSON.stringify(declarator));
    }
  },

  /**
   * Visit variable declarator.
   *
   * @param {VariableDeclarator} declarator
   * @api public
   */

  visitVariableDeclarator: function (declarator) {
    if (!declarator.init) return;
    return {
      type: 'AssignmentExpression',
      operator: '=',
      left: declarator.id,
      right: declarator.init
    };
  },

  /**
   * Visit array expression.
   *
   * @param {ArrayExpression} array
   * @api public
   */

  visitArrayExpression: function (array) {
    array.elements = array.elements.map(function (it) {
      return it && this.visit(it);
    }.bind(this));
    return array;
  },

  /**
   * Visit object expression.
   *
   * @param {ObjectExpression} object
   * @api public
   */

  visitObjectExpression: function (object) {
    object.properties = object.properties.map(this.visit).filter(notEmpty);
    return object;
  },

  /**
   * Visit binary expression.
   *
   * @param {BinaryExpression} binary
   * @api public
   */

  visitBinaryExpression: function (binary) {
    binary.left = this.visit(binary.left);
    binary.right = this.visit(binary.right);
    return binary;
  },

  /**
   * Visit unary expression.
   *
   * @param {BinaryExpression} binary
   * @api public
   */

  visitUnaryExpression: function (unary) {
    unary.argument = this.visit(unary.argument);
    return unary;
  },

  /**
   * Visit property.
   *
   * @param {Property} prop
   * @api public
   */

  visitProperty: function (prop) {
    prop.key = this.visit(prop.key);
    prop.value = this.visit(prop.value);
    return prop;
  },

  /**
   * Visit call expression.
   *
   * @param {CallExpression} call
   * @api public
   */

  visitCallExpression: function (call) {
    var attrs;
    // replace JSON.stringify
    if (call.callee.type === 'Identifier') {
      switch (call.callee.name) {
        case 'ǃDOM＿':
          call.callee = this.makeDOMCall(this.visit(call.arguments.shift()));
          attrs = this.visit(this.filterProperties(call.arguments.shift()));
          call.arguments = [attrs].concat(call.arguments.map(this.visit));
          break;
        case 'ǃtext＿':
          call.callee = this.makeDOMCall('text');
          call.arguments = call.arguments.map(this.visit);
          break;
        case 'ǃunescape＿':
          call.callee = this.makeDOMCall('text');
          call.arguments = [
            {
              type: 'ObjectExpression',
              properties: [
                {
                  key: {
                    type: 'Identifier',
                    name: 'dangerouslySetInnerHTML'
                  },
                  value: {
                    type: 'ObjectExpression',
                    properties: [
                      {
                        key: {
                          type: 'Identifier',
                          name: '__html'
                        },
                        value: this.visit(call.arguments[0]),
                        kind: 'init'
                      }
                    ]
                  },
                  kind: 'init'
                }
              ]
            }
          ];
          break;
        default:
          call.callee = this.visit(call.callee);
          call.arguments = call.arguments.map(this.visit);
      }
    }

    return call;
  },

  /**
   * Visit identifier.
   *
   * @param {Identifier} id
   * @api public
   */

  visitIdentifier: function (id) {
    return id;
  },

  /**
   * Visit literal.
   *
   * @param {Literal} literal
   * @api public
   */

  visitLiteral: function (literal) {
    return literal;
  },

  /**
   * Is statement with call?
   *
   * @param {Node} node
   * @param {String...} identifiers
   * @api public
   */

  isCall: function (node) {
    var callees = [].slice.call(arguments, 1);
    return node.type === 'ExpressionStatement' &&
      node.expression.type === 'CallExpression' &&
      node.expression.callee.type === 'Identifier' &&
      ~callees.indexOf(node.expression.callee.name);
  },

  /**
   * Concatenate expressions using '+' operator.
   *
   * @param {Node[]} nodes
   * @api public
   */

  concat: function (nodes) {
    switch (nodes.length) {
      case 0:
        return this.nullLiteral;
      case 1:
        return nodes[0];
      default:
        return nodes.reduce(function (left, right) {
          return {
            type: 'BinaryExpression',
            operator: '+',
            left: left,
            right: right
          };
        });
    }
  },

  /**
   * Collapse statements.
   *
   * @param {Statement[]} body
   * @api public
   */

  collapseStatements: function (body) {
    for (var i = 0; i < body.length; i++) {
      var node = body[i];
      var next = body[i + 1];

      // merge children block into arguments
      if (this.isCall(node, 'ǃDOM＿') &&
        next && next.type === 'BlockStatement')
      {
        if (this.domAt == null) this.domAt = this.domDepth;
        if (this.domAt === this.domDepth) this.domCount++;
        this.domDepth++;

        var args = this.collapseStatements(next.body);
        args = this.nullWithNext(args);

        node = node.expression;
        node.arguments = node.arguments.concat(args);
        node = this.visit(node);
        body.splice(i + 1, 1);

        this.domDepth--;
      }

      // concatenate sequential texts
      else if (this.isCall(node, 'ǃtext＿')) {
        var strings = node.expression.arguments;
        while (next && this.isCall(next, 'ǃtext＿')) {
          strings = strings.concat(next.expression.arguments);
          body.splice(i + 1, 1);
          next = body[i + 1];
        }
        if (this.domAt == null || this.domAt === this.domDepth) {
          node = this.visit(node.expression);
          this.domAt = this.domDepth;
          this.domCount++;
        } else {
          node = this.concat(strings);
        }
      }

      // concatenate consequential unescapes
      else if (this.isCall(node, 'ǃunescape＿')) {
        if (this.domAt == null) this.domAt = this.domDepth;
        if (this.domAt === this.domDepth) this.domCount++;
        this.domDepth++;

        var strings = node.expression.arguments;
        while (next && this.isCall(next, 'ǃunescape＿')) {
          strings = strings.concat(next.expression.arguments);
          body.splice(i + 1, 1);
          next = body[i + 1];
        }
        node = this.visit(node.expression);

        this.domDepth--;
      }

      // visit children
      else {
        node = this.visit(node);
      }

      body[i] = node;
    }

    return body.filter(function (node) {
      return node && node.type !== 'EmptyStatement' && (
        node.type !== 'Literal' || node.value !== null ||
        node.value !== '');
    });
  },

  /**
   * Filter properties.
   *
   * @param {Node} attrs
   * @api public
   */

  filterProperties: function (props) {
    if (props.type === 'ObjectExpression') {
      props.properties = props.properties.reduce(function (props, it) {
        var key = it.key, name = key.value || key.name, value = it.value;
        // console.log('-->', require('escodegen').generate(it))
        // console.log('==>', name, value)
        if (/^(aria|data)-/.test(name)) {
          if (value.type === 'Literal') {
            if (value.value == null) return props;
            value.value = JSON.stringify(value.value);
          } else {
            it.value = {
              type: 'CallExpression',
              callee: {
                type: 'MemberExpression',
                computed: false,
                object: {
                  type: 'Identifier',
                  name: 'JSON'
                },
                property: {
                  type: 'Identifier',
                  name: 'stringify'
                }
              },
              arguments: [value]
            };
          }
        }
        props.push(it);
        return props;
      }, []);
    }
    return props;
  },

  /**
   * Merge sequences ending with null with next.
   *
   * @param {Statement[]} body
   * @api public
   */

  nullWithNext: function (body) {
    for (var j = 0; j < body.length - 1; j++) {
      var node = body[j];
      if (node.type !== 'SequenceExpression') continue;
      var exprs = node.expressions;
      var last = exprs[exprs.length - 1];
      if (last.type !== 'Literal' || last.value !== null) continue;
      exprs[exprs.length - 1] = body[j + 1];
      body.splice(j + 1, 1);
    }
    return body;
  },

  /**
   * Wrap in CommonJS module.
   *
   * @param {Expression[]} exprs
   * @api public
   */

  wrapCommonJS: function (exprs) {
    exprs = exprs.map(function (expr) {
      return /Expression$/.test(expr.type) ? {
        type: 'ExpressionStatement',
        expression: expr
      } : expr;
    });
    return [
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'AssignmentExpression',
          operator: '=',
          left: {
            type: 'MemberExpression',
            computed: false,
            object: {
              type: 'Identifier',
              name: 'module'
            },
            property: {
              type: 'Identifier',
              name: 'exports'
            }
          },
          right: {
            type: 'FunctionExpression',
            id: null,
            params: [],
            defaults: [],
            body: {
              type: 'BlockStatement',
              body: exprs
            },
            rest: null,
            generator: false,
            expression: false
          }
        }
      }
    ];
  },

  /**
   * Make React DOM call.
   *
   * @param {Expression} property
   * @api public
   */

  makeDOMCall: function (property) {
    if (typeof property === 'string') {
      property = {
        type: 'Identifier',
        name: property
      };
    }
    if (!(property.name in React.DOM)) return property;
    return {
      type: 'MemberExpression',
      computed: property.type !== 'Identifier',
      object: {
        type: 'MemberExpression',
        computed: false,
        object: {
          type: 'Identifier',
          name: 'React'
        },
        property: {
          type: 'Identifier',
          name: 'DOM'
        }
      },
      property: property
    };
  },

  maybeWrapDiv: function (nodes) {
    if (!nodes || !nodes.length) return this.nullLiteral;
    if (nodes.length === 1) return nodes[0];
    nodes.unshift(this.nullLiteral);
    return {
      type: 'CallExpression',
      callee: this.makeDOMCall('div'),
      arguments: nodes
    };
  },

  makeSequence: function (nodes) {
    if (!nodes) return this.nullLiteral;
    nodes = nodes.filter(notEmpty);
    if (!nodes.length) return this.nullLiteral;
    if (nodes.length === 1) return nodes[0];
    return {
      type: 'SequenceExpression',
      expressions: nodes
    };
  },

  makeArray: function (nodes) {
    if (!nodes) return this.nullLiteral;
    nodes = nodes.filter(notEmpty);
    if (!nodes.length) return this.nullLiteral;
    if (nodes.length === 1) return nodes[0];
    return {
      type: 'ArrayExpression',
      elements: nodes
    };
  },

  nullLiteral: {
    type: 'Literal',
    value: null
  }

};

function notEmpty (it) {
  return it != null;
}
