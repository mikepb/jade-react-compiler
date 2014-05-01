'use strict';

var React = require('react');
var b = require('./builder');

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
  this.visit = this.visit.bind(this);
  this.visitFunction = this.visitFunction.bind(this);
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
    this.tmpvars = {};
    this.depth = -1;
    this.program = this.visit(this.ast);
    return this.program;
  },

  /**
   * Get a tempory variable for this depth.
   *
   * @api public
   */

  getvar: function () {
    var name = 'ǃtmp' + this.depth + '＿';
    var id = this.tmpvars[name];
    if (!this.tmpvars[name]) {
      this.vars.push({
        type: 'VariableDeclarator',
        id: id = this.tmpvars[name] = {
          type: 'Identifier',
          name: name
        },
      });
    }
    return id;
  },

  /**
   * Define a new scope.
   *
   * @param {Function} callback
   * @api public
   */

  scope: function (callback) {
    var vars = this.scope.vars;
    var consts = this.scope.consts;
    var funs = this.scope.funs;
    this.scope.vars = [];
    this.scope.consts = [];
    this.scope.funs = [];
    var fun = callback.call(this);
    this.scope.vars = vars;
    this.scope.consts = consts;
    this.scope.funs = funs;
    return fun;
  },

  /**
   * Visit node.
   *
   * @param {Node} node
   * @api public
   */

  visit: function (node) {
    // this.depth++;
    // console.log(new Array(this.depth).join('  ') + node.type);
    var visitor = this['visit' + node.type];
    if (visitor) node = visitor.call(this, node);
    else console.warn('WARNING: missing visitor for ' + node.type);
    // this.depth--;
    return node;
  },

  /**
   * Visit program.
   *
   * @param {Program} program
   * @api public
   */

  visitProgram: function (program) {
    return this.scope(function () {
      var body = this.amalgamate(program.body).map(this.visit);

      // create return statement
      body = [b.returnStatement(this.makeSequence(body))];

      // hoist variable declarations
      if (this.scope.vars.length) {
        body.unshift(b.variableDeclaration(this.scope.vars));
      }

      // move function declarations
      if (this.scope.funs.length) {
        body = body.concat(this.scope.funs);
      }

      // wrap in CommonJS module
      program.body = this.commonJS(body);

      // hoist const declarations
      if (this.scope.consts.length) {
        var seen = {};
        program.body.unshift(b.variableDeclaration(
          this.scope.consts.reduce(function (dtors, dtor) {
            var name = dtor.id.name;
            if (!consts[name]) dtors.push(dtor), seen[name] = true;
            return dtors;
          }, [])));
      }

      return program;
    });
  },

  /**
   * Visit function.
   *
   * @param {Function} fun
   * @api public
   */

  visitFunction: function (fun) {
    return this.scope(function () {
      // User functions are untouched.
      // fun.id = fun.id && this.visit(fun.id);
      // fun.params = fun.params.map(this.visit);
      // fun.defaults = fun.defaults.map(this.visit);
      // fun.rest = fun.rest && this.visit(fun.rest);
      // fun.body = this.visit(fun.body);
      return fun;
    });
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
    var body = this.amalgamate(block.body).map(this.visit);
    return this.makeSequence(body);
  },

  /**
   * Visit expression statement.
   *
   * @param {Expression} expr
   * @api public
   */

  visitExpressionStatement: function (expr) {
    return this.visit(expr.expression);
  },

  /**
   * Visit if statement.
   *
   * @param {IfStatement} ifs
   * @api public
   */

  visitIfStatement: function (ifs) {
    return b.conditionalExpression(
      this.visit(ifs.test),
      this.visit(ifs.consequent) || b.literal(null),
      ifs.alternate && this.visit(ifs.alternate) || b.literal(null));
  },

  /**
   * Visit labeled statement.
   *
   * @param {LabeledStatement} labeled
   * @api public
   */

  visitLabeledStatement: function (labeled) {
    throw new Error('not supported');
  },

  /**
   * Visit break statement.
   *
   * @param {BreakStatement} breaks
   * @api public
   */

  visitBreakStatement: function (breaks) {
    throw new Error('not implemented');
    return breaks;
  },

  /**
   * Visit continue statement.
   *
   * @param {ContinueStatement} continues
   * @api public
   */

  visitContinueStatement: function (continues) {
    throw new Error('not implemented');
    return continues;
  },

  /**
   * Visit with statement.
   *
   * @param {WithStatement} withs
   * @api public
   */

  visitWithStatement: function (withs) {
    throw new Error('not implemented');
    return withs;
  },

  /**
   * Visit switch statement.
   *
   * @param {IfStatement} switchs
   * @api public
   */

  visitSwitchStatement: function (switchs) {
    throw new Error('not implemented');
  },

  /**
   * Visit switch case.
   *
   * @param {SwitchCase} switchcase
   * @api public
   */

  visitSwitchCase: function (switchcase) {
    throw new Error('not implemented');
  },

  /**
   * Visit return statement.
   *
   * @param {ReturnStatement} returns
   * @api public
   */

  visitReturnStatement: function (returns) {
    returns.argument = this.visit(returns.argument);
    return returns;
  },

  /**
   * Visit throw statement.
   *
   * @param {ThrowStatement} throwst
   * @api public
   */

  visitThrowStatement: function (throwst) {
    throw new Error('not supported');
  },

  /**
   * Visit try statement.
   *
   * @param {TryStatement} throwst
   * @api public
   */

  visitTryStatement: function (trys) {
    throw new Error('not implemented');
    return trys;
  },

  /**
   * Visit while statement.
   *
   * @param {WhileStatement} whiles
   * @api public
   */

  visitWhileStatement: function (whiles) {
    throw new Error('not implemented');
    return whiles;
  },

  /**
   * Visit do/while statement.
   *
   * @param {DoWhileStatement} dowhile
   * @api public
   */

  visitDoWhileStatement: function (dowhile) {
    throw new Error('not implemented');
    return dowhile;
  },

  /**
   * Visit for statement.
   *
   * @param {ForStatement} fors
   * @api public
   */

  visitForStatement: function (fors) {
    throw new Error('not implemented');
    return fors;
  },

  /**
   * Visit for/in statement.
   *
   * @param {ForInStatement} forin
   * @api public
   */

  visitForInStatement: function (forin) {
    throw new Error('not implemented');
    return forin;
  },

  /**
   * Visit for/of statement.
   *
   * @param {ForInStatement} forin
   * @api public
   */

  visitForOfStatement: function (forof) {
    throw new Error('not implemented');
    return forof;
  },

  /**
   * Visit debugger statement.
   *
   * @param {DebuggerStatement} forin
   * @api public
   */

  visitDebuggerStatement: function (debugs) {
    throw new Error('not supported');
    return debugs;
  },

  /**
   * Visit function declaration.
   *
   * @param {FunctionDeclaration} fun
   * @api public
   */

  visitFunctionDeclaration: function (fun) {
    this.scope.funs.push(this.visitFunction(fun));
  },

  /**
   * Visit variable declaration.
   *
   * @param {VariableDeclaration} declaration
   * @api public
   */

  visitVariableDeclaration: function (declaration) {
    var dtors = declaration.declarations;
    var result;
    switch (declaration.kind) {
      case 'var':
        result = dtors.map(this.visit).filter(notNull);
        result.push(b.literal(null));
        result = this.makeSequence(result);
        dtors.forEach(function (dtor) { dtors.init = null; });
        this.scope.vars = this.scope.vars.concat(dtors);
        return result;
      case 'const':
        this.scope.consts = this.scope.consts.concat(dtors);
        break;
      default:
        throw new Error('unsupported variable declaration: ' +
          JSON.stringify(declaration));
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
    return b.assignmentExpression('=',
      this.visit(declarator.id), this.visit(declarator.init));
  },

  /**
   * Visit this expression.
   *
   * @param {ThisExpression} self
   * @api public
   */

  visitThisExpression: function (self) {
    return self;
  },

  /**
   * Visit array expression.
   *
   * @param {ArrayExpression} array
   * @api public
   */

  visitArrayExpression: function (array) {
    array.elements = array.elements.map(this.visit).filter(notNull);
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
   * Visit function expression.
   *
   * @param {FunctionExpression} fun
   * @api public
   */

  visitFunctionExpression: function (fun) {
    return this.visitFunction(fun);
  },

  /**
   * Visit arrow expression.
   *
   *   let foo = (bar) => { ... }
   *
   * @param {ArrowExpression} fun
   * @api public
   */

  visitArrowExpression: function (fun) {
    throw new Error('not implemented');
    return this.visitFunction(fun);
  },

  /**
   * Visit sequence expression.
   *
   * @param {SequenceExpression} seq
   * @api public
   */

  visitSequenceExpression: function (seq) {
    seq.expressions = seq.expressions.map(this.visit);
    return seq;
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
   * Visit assignment expression.
   *
   * @param {AssignmentExpression} assign
   * @api public
   */

  visitAssignmentExpression: function (assign) {
    assign.left = this.visit(assign.left);
    assign.right = this.visit(assign.right);
    return assign;
  },

  /**
   * Visit update expression.
   *
   * @param {UpdateExpression} update
   * @api public
   */

  visitUpdateExpression: function (update) {
    assign.argument = this.visit(assign.argument);
    return assign;
  },

  /**
   * Visit logical expression.
   *
   * @param {LogicalExpression} logic
   * @api public
   */

  visitLogicalExpression: function (logic) {
    logic.left = this.visit(logic.left);
    logic.right = this.visit(logic.right);
    return logic;
  },

  /**
   * Visit conditional expression.
   *
   *   let foo = bar ? baz : xyzzy
   *
   * @param {ConditionalExpression} cond
   * @api public
   */

  visitConditionalExpression: function (cond) {
    cond.test = this.visit(cond.test);
    cond.alternate = this.visit(cond.alternate);
    cond.consequent = this.visit(cond.consequent);
    return cond;
  },

  /**
   * Visit call expression.
   *
   * @param {CallExpression} call
   * @api public
   */

  visitCallExpression: function (call) {
    var attrs;

    if (b.isIdentifier(call.callee)) {
      switch (call.callee.name) {
        case 'ǃDOM＿':
          call.callee = this.domCall(this.visit(call.arguments.shift()));
          attrs = this.filterAttrs(this.visit(call.arguments.shift()));
          call.arguments = call.arguments.map(this.visit).filter(notEmpty);
          // if there are attributes or there are arguments
          if (notNull(attrs) || call.arguments.length) {
            call.arguments.unshift(attrs);
          }
          break;
        case 'ǃtext＿':
          return this.visit(call.arguments.reduce(function (str, it) {
            str.value += '\n' + it.value;
            return str;
          }));
        case 'ǃunescape＿':
          if (!call.arguments.length) return;
          call.callee = this.domCall('text');
          call.arguments = [this.escape(call.arguments[0])];
          break;
        default:
          call.callee = this.visit(call.callee);
          call.arguments = call.arguments.map(this.visit);
      }
      return call;
    }

    call.callee = this.visit(call.callee);
    call.arguments = call.arguments.map(this.visit);

    return call;
  },

  /**
   * Visit member expression.
   *
   * @param {MemberExpression} member
   * @api public
   */

  visitMemberExpression: function (member) {
    member.object = this.visit(member.object);
    member.property = this.visit(member.property);
    return member;
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
   * Amalgamate statements for sentinels.
   *
   * @param {Statement[]} body
   * @api public
   */

  amalgamate: function (body) {
    for (var i = 0; i < body.length; i++) {
      var node = body[i];
      var next = body[i + 1];
      var call, callee;

      if (!b.isExpressionStatement(node) ||
        !b.isCallExpression(call = node.expression) ||
        !b.isIdentifier(callee = call.callee)) continue;

      // merge children block into arguments
      if (callee.name === 'ǃDOM＿') {
        if (b.isBlockStatement(next)) {
          call.arguments = call.arguments.concat(this.amalgamate(next.body));
          body.splice(i + 1, 1);
        }
        continue;
      }

      var name = 'ǃtext＿';
      if (callee.name !== name && callee.name !== (name = 'ǃunescape＿')) continue;

      // concatenate sequential texts
      var strings = call.arguments;
      while (b.isExpressionStatement(next) &&
        b.isCallExpression(next = next.expression) &&
        b.isIdentifier(callee = next.callee) && callee.name === name)
      {
        strings = strings.concat(next.arguments);
        body.splice(i + 1, 1);
        next = body[i + 1];
      }
      call.arguments = strings;
    }

    return body;
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
        return b.literal(null);
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
   * Filter attribute properties.
   *
   * @param {Node} attrs
   * @api public
   */

  filterAttrs: function (props) {
    if (!b.isObjectExpression(props)) return props;
    props.properties = props.properties.reduce(function (props, it) {
      var key = it.key;
      var name = key.value || key.name;
      var value = it.value;
      if (isEmpty(it)) return props;
      if (name.indexOf('data-') === 0) {
        if (b.isLiteral(value)) {
          value.value = JSON.stringify(value.value);
        } else {
          it.value = b.callExpression(
            b.memberExpression(
              b.identifier('JSON'),
              b.identifier('stringify'), false),
            [value]);
        }
      }
      props.push(it);
      return props;
    }, []);
    return props.properties.length ? props : b.literal(null);
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
      if (!b.isSequenceExpression(node.type)) continue;
      var exprs = node.expressions;
      var last = exprs[exprs.length - 1];
      if (!b.isLiteral(last, 'null')) continue;
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

  commonJS: function (exprs) {
    exprs = exprs.map(function (expr) {
      return /Expression$/.test(expr.type) ? b.expressionStatement(expr) : expr;
    });
    return [
      b.expressionStatement(
        b.assignmentExpression('=',
        b.memberExpression(
          b.identifier('module'),
          b.identifier('exports'), false),
        b.functionExpression(null, [],
          b.blockStatement(exprs))))];
  },

  /**
   * Make React DOM call.
   *
   * @param {Expression} property
   * @api public
   */

  domCall: function (property) {
    if (typeof property === 'string') property = b.identifier(property);
    if (!(property.name in React.DOM)) return property;
    return b.memberExpression(
      b.memberExpression(
        b.identifier('React'),
        b.identifier('DOM'), false),
      property);
  },

  /**
   * Make React HTML escape object.
   *
   * @param {Expression} property
   * @api public
   */

  escape: function (val) {
    return b.objectExpression([
      b.property(
        b.identifier('dangerouslySetInnerHTML'),
        b.objectExpression([
          b.property(b.identifier('__html'),
            this.visit(val))]))]);
  },

  maybeWrapDiv: function (nodes) {
    if (!nodes || !nodes.length) return b.literal(null);
    if (nodes.length === 1) return nodes[0];
    nodes.unshift(b.literal(null));
    return {
      type: 'CallExpression',
      callee: this.domCall('div'),
      arguments: nodes
    };
  },

  makeSequence: function (exprs) {
    if (!exprs) return b.literal(null);
    var last = exprs.pop();
    exprs = exprs.filter(notEmpty);
    exprs.push(last);
    if (!exprs.length) return b.literal(null);
    if (exprs.length === 1) return exprs[0];
    return b.sequenceExpression(exprs);
  }

};

/**
 * Unwrap the expression statement.
 *
 * @param {ExpressionStatement} it
 * @api public
 */

function unwrap (it) {
  return b.isExpressionStatement(it) ? it.expression : it;
}

/**
 * Is the node null?
 *
 * @param {Node} node
 * @api public
 */

function isNull (it) {
  return !it || b.isLiteral(it, 'null');
}

/**
 * Is the node not null?
 *
 * @param {Node} node
 * @api public
 */

function notNull (it) {
  return it && !b.isLiteral(it, 'null');
}

/**
 * Is the node empty?
 *
 * @param {Node} node
 * @api public
 */

function isEmpty (it) {
  return !it || b.isEmptyStatement(it) || b.isLiteral(it, 'null');
}

/**
 * Is the node not empty?
 *
 * @param {Node} node
 * @api public
 */

function notEmpty (it) {
  return it && !b.isEmptyStatement(it) && !b.isLiteral(it, 'null');
}
