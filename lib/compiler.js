'use strict';

var UglifyJS = require('uglify-js');
var parseJSExpression = require('character-parser').parseMax;
var transformer = require('./transformer');

/**
 * Initialize `Transform` with the given `token` and `options`.
 *
 * @param {Node} node
 * @param {Object} options
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
   * Compile parse tree to JavaScript.
   *
   * @api public
   */

  compile: function (options) {
    var key;
    var opts = {
      beautify: true,
      comments: true,
      indent_level: 2
    };

    if (options) for (key in options) opts[key] = options[key];

    this.generate();
    this.transform();

    var js = this.ast.print_to_string(opts) + '\n';
    return [js].concat(this.helpers).join('\n');
  },

  generate: function () {
    this.helpers = [];
    this.buf = '';
    this.visit(this.node);
  },

  transform: function () {
    this.variables = {};
    this.ast = UglifyJS.parse(this.buf);
    this.ast.figure_out_scope();
    this.ast = this.ast.transform(this.transformer);
    this.ast.figure_out_scope();
    this.ast = this.ast.transform(this.compressor);
  },

  transformer: transformer,

  compressor: new UglifyJS.Compressor({
    booleans: false,
    dead_code: false,
    hoist_vars: true,
    sequences: false,
    side_effects: false,
    unused: false,
    warnings: false
  }),

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
    return '__unescape$$(' + str + ')';
  },

  /**
   * Visit `node`.
   *
   * @param {Node} node
   * @api public
   */

  visit: function (node) {
    this.depth++;
    // console.log(new Array(this.depth).join('  ') + node.type)
    this['visit' + node.type](node);
    this.depth--;
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
    throw new Error('not supported');
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

    this.buf += '__DOM$$(' + name + ',';
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
    if (str) this.buf += '__text$$(' + str + ');\n';
  },

  /**
   * Visit a `comment`.
   *
   * @param {Comment} comment
   * @api public
   */

  visitComment: function (comment) {
    if (comment.buffer) this.buf += '/*' + comment + '*/\n';
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
    this.buf + '\n*/\n';
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
        this.buf += '__text$$(' + code.val + ');\n';
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
      this.helpers.push(
        "function __map$$ (obj, each, alt) {\n" +
        "  if (typeof obj.length === 'number') return [].map.call(obj, each);\n" +
        "  var result = [], key;\n" +
        "  for (key in obj) result.push(each(obj[key], key));\n" +
        "  return !alt || result.length ? result : alt();\n" +
        "}\n"
      );
      this.hasEachHelper = true;
    }

    var src = '__map$$(function(' + each.obj + ',' +
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
        this.helpers.push(
          "function __mergeAttrs$$ () {\n" +
          "  var attrs = {};\n" +
          "  [].slice.call(arguments).forEach(function (it) {\n" +
          "    for (var key in it) {\n" +
          "      if (key === 'class' || key === 'className') {\n" +
          "        attrs.className =\n" +
          "          (attrs.className || '') + ' ' + it[key];\n" +
          "      } else {\n" +
          "        attrs[key] = it[key];\n" +
          "      }\n" +
          "    }\n" +
          "  });\n" +
          "  return attrs;\n" +
          "}\n"
        );
        this.hasAttrsHelper = true;
      }
      this.buf += '__mergeAttrs$$(' + attributeBlocks.join(',') + ')';
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
      var filename = attr.filename;
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
