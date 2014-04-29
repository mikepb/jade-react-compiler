'use strict';

var esprima = require('esprima');
var escodegen = require('escodegen');
var parseJSExpression = require('character-parser').parseMax;
var Rectifier = require('./rectifier');

/**
 * Initialize `Transform` with the given `token` and `options`.
 *
 * @param {Node} node
 * @param {Object} [options]
 * @api public
 */

var Transform = module.exports = function Transform (node, options) {
  this.visit = this.visit.bind(this)
  this.options = options = options || {};
  this.node = node;
};

/**
 * Transform prototype.
 */

Transform.prototype = {

  /**
   * Rectifier class.
   *
   * @api public
   */

  rectifier: Rectifier,

  /**
   * Compile parse tree to JavaScript.
   *
   * @api public
   */

  compile: function (options) {
    if (!this.buf) this.generate();
    if (!this.ast) this.transform();
    var js = escodegen.generate(this.ast);
    return [js].concat(this.helpers).join('\n');
  },

  /**
   * Generate intermediate JavaScript.
   *
   * @api public
   */

  generate: function () {
    this.helpers = [];
    this.buf = '';
    this.visit(this.node);
  },

  /**
   * Transform intermediate JavaScript.
   *
   * @api public
   */

  transform: function () {
    this.ast = esprima.parse(this.buf);
    var rectifier = new this.rectifier(this.ast);
    this.ast = rectifier.rectify();
  },

  /**
   * Interpolate the given `str`.
   *
   * @param {String} str
   * @api public
   */

  interpolate: function (str) {
    var match;
    var range;
    var src;
    var buf = '';

    if (str.val != null) str = str.val;

    while (str && (match = /(\\)?([#!]){((?:.|\n)*)$$/.exec(str))) {
      src = str.substr(0, match.index);
      str = match[3];

      if (match[1]) { // escape
        buf += JSON.stringify(src + match[2] + '{');
        continue;
      }

      buf += JSON.stringify(src) + '\n';

      range = parseJSExpression(str);
      src = range.src;
      buf += ('!' === match[2] ? this.unescape(src) : src);

      str = str.substr(range.end + 1);
    }

    if (str) buf += JSON.stringify(str);

    return buf;
  },

  /**
   * Wrap the given `str` around a React unsafe HTML object.
   *
   * @param {AST_Node} node
   * @api public
   */

  unescape: function (str) {
    return 'ǃunescape＿(' + str + ')';
  },

  /**
   * Visit `node`.
   *
   * @param {Node} node
   * @api public
   */

  visit: function (node) {
    this['visit' + node.type](node);
  },

  /**
   * Visit case `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitCase: function (node) {
    this.buf += '(function(){switch(' + node.expr + '){\n';
    this.visit();
    this.buf += '}}).call(this)\n';
  },

  /**
   * Visit when `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitWhen: function (node, start) {
    if (node.expr === 'default') {
      this.buf += 'default:\n';
    } else {
      this.buf += 'case ' + node.expr + ':\n';
    }
    if (node.block) {
      this.visit(node.block);
      this.buf += 'break;\n';
    }
  },

  /**
   * Visit literal `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitLiteral: function (node) {
    if (node.str) {
      console.warn('LITERAL', node);
      // throw new Error('not supported');
    }
  },

  /**
   * Visit all nodes in `block`.
   *
   * @param {Block} block
   * @api public
   */

  visitBlock: function (block, start) {
    block.nodes.forEach(this.visit);
  },

  /**
   * Visit a mixin's `block` keyword.
   *
   * @param {MixinBlock} block
   * @api public
   */

  visitMixinBlock: function (block) {
    this.buf += 'block ? block() : null;\n';
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

  visitTag: function (tag) {
    var name = tag.name;

    this.buf += 'ǃDOM＿(' + name + ',';
    this.visitAttributes(tag.attrs, tag.attributeBlocks);
    this.buf += ');\n{\n';

    if (tag.code) this.visitCode(tag.code);
    this.visit(tag.block);
    this.buf += '}\n';
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

  visitText: function (text) {
    var str = this.interpolate(text);
    if (str) this.buf += 'ǃtext＿(' + str + ');\n';
  },

  /**
   * Visit a `comment`.
   *
   * @param {Comment} comment
   * @api public
   */

  visitComment: function (comment) {
    if (comment.buffer) this.buf += '//' + comment.val + '\n';
  },

  /**
   * Visit a `BlockComment`.
   *
   * @param {Comment} comment
   * @api public
   */

  visitBlockComment: function (comment) {
    if (!comment.buffer) return;
    this.buf += '/*' + comment.val + '\n';
    this.visit(comment.block);
    this.buf += '*/\n';
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
    // Wrap code blocks with {}.
    // we only wrap unbuffered code blocks ATM
    // since they are usually flow control

    // Buffer code
    if (code.buffer) {
      if (code.escape) {
        this.buf += 'ǃtext＿(' + code.val + ');\n';
      } else {
        this.buf += this.unescape(code.val) + ';\n';
      }
    } else {
      this.buf += code.val + '\n';
    }

    // Block support
    if (code.block) {
      if (!code.buffer) this.buf += '{\n';
      this.visit(code.block);
      if (!code.buffer) this.buf += '}\n';
    }
  },

  /**
   * Visit `each` block.
   *
   * @param {Each} each
   * @api public
   */

  visitEach: function (each, start) {
    if (!this.hasEachHelper) {
      this.helpers.push(ǃmap＿.toString());
      this.hasEachHelper = true;
    }

    var src = 'ǃmap＿(function(' + each.obj + ',' +
      each.val + ',' + each.key + '){' +
      '}';

    if (each.alternative) {
      src += ',function(' + each.obj + ',' +
        each.val + ',' + each.key + '){' +
        this.visit(each.alternative) + '}';
    }

    src += ');';

    return src;
  },

  /**
   * Visit `attrs`.
   *
   * @param {Array} attrs
   * @api public
   */

  visitAttributes: function (attrs, attributeBlocks) {
    if (attributeBlocks.length) {
      if (attrs.length) {
        var val = this.attrs(attrs);
        attributeBlocks.unshift(val);
      }
      if (!this.hasAttrsHelper) {
        this.helpers.push(ǃattrs＿.toString());
        this.hasAttrsHelper = true;
      }
      this.buf += 'ǃattrs＿(' + attributeBlocks.join(',') + ')';
    } else if (attrs.length) {
      this.attrs(attrs, true);
    } else {
      this.buf += 'null'
    }
  },

  /**
   * Compile attributes.
   */

  attrs: function (attrs, buffer) {
    var classes = [];
    var buf = [];

    attrs.forEach(function (attr) {
      var key = attr.name;
      var val = attr.val;

      switch (key) {
        case 'class':
          classes.push(val);
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

      buf.push(JSON.stringify(key) + ':' + val);
    });

    if (classes.length) buf.push('className:' + classes.join('+'));

    buf = '{' + buf.join(',') + '}';
    if (buffer) this.buf += buf;
    return buf;
  }

};

function ǃattrs＿ () {
  var classes = [];
  var attrs = {};
  [].slice.call(arguments).forEach(function (it) {
    for (var key in it) {
      switch (key) {
        case 'class':
        case 'className':
          classes.push(it[key]);
          return;
        case 'for':
          key = 'htmlFor';
          break;
        default:
          if (/^(data|aria)-/.test(key)) break;
          key = key.split('-');
          key = key[0] + key.slice(1).map(function (it) {
            return it.charAt(0).toUpperCase() + it.substr(1);
          }).join('');
      }
      attrs[key] = it[key];
    }
  });
  if (classes.length) attrs.className = classes.join(' ');
  return attrs;
}

function ǃmap＿ (obj, each, alt) {
  if (typeof obj.length === 'number') return [].map.call(obj, each);
  var result = [], key;
  for (key in obj) result.push(each(obj[key], key));
  return !alt || result.length ? result : alt();
}
