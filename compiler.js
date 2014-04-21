'use strict';

// Based on Jade compiler:
// https://github.com/visionmedia/jade/blob/master/lib/compiler.js

var React = require('react');

var nodes = require('jade/lib/nodes');
var parseJSExpression = require('character-parser').parseMax;
var constantinople = require('constantinople');

function isConstant (src) {
  return constantinople(src);
}
function toConstant (src) {
  return constantinople.toConstant(src);
}

/**
 * Initialize `Compiler` with the given `node`.
 *
 * @param {Node} node
 * @param {Object} options
 * @api public
 */

var Compiler = module.exports = function Compiler (node, options) {
  this.options = options = options || {};
  this.node = node;
  this.hasCompiledTag = false;
  this.indents = 0;
  this.parentIndents = 0;
  this.mixins = {};
  this.dynamicMixins = false;
};

/**
 * Compiler prototype.
 */

Compiler.prototype = {

  /**
   * Compile parse tree to JavaScript.
   *
   * @api public
   */

  compile: function () {
    this.buf = [];
    this.line = '';
    this.hasRoot = false;
    this.conditional = false;
    this.visit(this.node);
    // if (!this.dynamicMixins) {
    //   // if there are no dynamic mixins we can remove any un-used mixins
    //   var mixinNames = Object.keys(this.mixins);
    //   for (var i = 0; i < mixinNames.length; i++) {
    //     var mixin = this.mixins[mixinNames[i]];
    //     if (!mixin.used) {
    //       for (var x = 0; x < mixin.instances.length; x++) {
    //         for (var y = mixin.instances[x].start; y < mixin.instances[x].end; y++) {
    //           this.buf[y] = '';
    //         }
    //       }
    //     }
    //   }
    // }
    if (this.line) {
      this.buf.push(this.line);
      this.line = '';
    }
    return this.buf.join('\n');
  },

  /**
   * Buffer the given `str`
   *
   * @param {String} str
   * @param {Boolean} newline
   * @api public
   */

  buffer: function (str, newline) {
    if (newline != null && newline !== false) {
      this.buf.push(this.line + str);
      this.line = this.prettyIndent(+newline);
    } else {
      this.line += str;
    }
  },

  /**
   * Buffer the given `src` so it is evaluated at run time
   *
   * @param {String} src
   * @param {Boolean} escape
   * @api public
   */

  bufferExpression: function (src, escape, buffer) {
    if (src === 'undefined') return;
    if (isConstant(src)) {
      src = toConstant(src);
      if (src == null) return;
      src = JSON.stringify(src);
    } else if (src === 'undefined') {
      return;
    }
    if (src && escape === false) {
      src = 'React.DOM.text({ "dangerouslySetInnerHTML": { "__html": ' +
        src + ' } })';
    }
    if (buffer !== false) {
      this.buffer(src);
    }
    return src;
  },

  /**
   * Buffer the given `str` with interpolation
   *
   * @param {String} str
   * @api public
   */

  interpolate: function (str) {
    var buf = [];
    var line = ''
    var match;

    while (str.length && (match = /(\\)?([#!]){((?:.|\n)*)$/.exec(str))) {
      line += str.substr(0, match.index);
      var range = parseJSExpression(str = match[3]);
      var src = range.src;
      str = str.substr(range.end + 1);
      if (match[1]) { // escape
        line += match[2] + '{' + src + '}';
        continue;
      }
      if ((src = this.bufferExpression(src, match[2] !== '!', false)) == null) {
        continue;
      }
      if (line) {
        buf.push(JSON.stringify(line));
        line = '';
      }
      buf.push(src);
    }

    if (line) buf.push(JSON.stringify(line));
    if (str) buf.push(JSON.stringify(str));
    if (buf.length) {
      this.buffer(buf.shift());
      buf.forEach(function (it) {
        this.buffer(',', 1);
        this.buffer(it);
      }.bind(this));
    }
  },

  /**
   * Make an indent based on the current `indent`
   * property and an additional `offset`.
   *
   * @param {Number} offset
   * @api public
   */

  prettyIndent: function (offset) {
    return Array(this.indents + (offset || 0)).join('  ');
  },

  /**
   * Visit `node`.
   *
   * @param {Node} node
   * @api public
   */

  visit: function (node) {
    // this.__indent = (this.__indent || 0) + 1;
    // console.log(new Array(this.__indent).join('  ') + node.type, this.buf)
    this.visitNode(node);
    // this.__indent--;
  },

  /**
   * Visit `node`.
   *
   * @param {Node} node
   * @api public
   */

  visitNode: function (node) {
    return this['visit' + node.type](node);
  },

  /**
   * Visit case `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitCase: function (node) {
    throw new Error('not implemented');
    // var _ = this.withinCase;
    // this.withinCase = true;
    // this.buf.push('switch (' + node.expr + '){');
    // this.visit(node.block);
    // this.buf.push('}');
    // this.withinCase = _;
  },

  /**
   * Visit when `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitWhen: function (node) {
    throw new Error('not implemented');
    // if ('default' == node.expr) {
    //   this.buf.push('default:');
    // } else {
    //   this.buf.push('case ' + node.expr + ':');
    // }
    // if (node.block) {
    //   this.visit(node.block);
    //   this.buf.push('  break;');
    // }
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

  visitBlock: function (block) {
    var len = block.nodes.length;
    var node, text, isCodeBlock, wasCodeBlock;

    if (!this.nRootTags) {
      this.nRootTags = block.nodes.reduce(function (memo, it) {
        switch (it.type) {
          case 'Tag':
            return memo + 1;
          case 'Comment':
          case 'BlockComment':
          default:
            return memo;
        }
      }, 0);
      if (this.nRootTags !== 1) {
        throw new Error('Must have exactly one root node');
      }
    }

    for (var i = 0; i < len; i++) {
      node = block.nodes[i];
      isCodeBlock = node.type === 'Code' && !!node.block;
      if (!isCodeBlock && wasCodeBlock) this.closeCodeBlock();
      wasCodeBlock = isCodeBlock;
      if (node.type == 'Text') {
        // concatenate text blocks
        text = node.val;
        for (; (node = block.nodes[i + 1]) && node.type === 'Text'; i++) {
          text += '\n' + node.val;
        }
        node = new nodes.Text(text);
      }
      if (!this.hasCompiledTag && node.type === 'Tag') {
        this.buffer('return ');
      }
      this.visit(node);
    }

    if (wasCodeBlock) {
      this.closeCodeBlock(/^\s*else\s*$/.test(node.val));
    }
  },

  /**
   * Visit a mixin's `block` keyword.
   *
   * @param {MixinBlock} block
   * @api public
   */

  visitMixinBlock: function (block) {
    throw new Error('not implemented');
    // this.buf.push("jade_indent.push('" + Array(this.indents + 1).join('  ') + "');");
    // this.buf.push('block && block();');
    // this.buf.push("jade_indent.pop();");
  },

  /**
   * Visit `doctype`. Prints a warning that doctypes are not supported.
   *
   * @param {Doctype} doctype
   * @api public
   */

  visitDoctype: function () {
    throw new Error('Doctype not supported');
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
    // var name = 'jade_mixins[';
    // var args = mixin.args || '';
    // var block = mixin.block;
    // var attrs = mixin.attrs;
    // var attrsBlocks = mixin.attributeBlocks;
    // var dynamic = mixin.name[0]==='#';
    // var key = mixin.name;
    // if (dynamic) this.dynamicMixins = true;
    // name += (dynamic ? mixin.name.substr(2,mixin.name.length-3):'"'+mixin.name+'"')+']';

    // this.mixins[key] = this.mixins[key] || {used: false, instances: []};
    // if (mixin.call) {
    //   this.mixins[key].used = true;
    //   this.buf.push("jade_indent.push('" + Array(this.indents + 1).join('  ') + "');")
    //   if (block || attrs.length || attrsBlocks.length) {

    //     this.buf.push(name + '.call({');

    //     if (block) {
    //       this.buf.push('block: function () {');

    //       // Render block with no indents, dynamically added when rendered
    //       this.parentIndents++;
    //       var _indents = this.indents;
    //       this.indents = 0;
    //       this.visit(mixin.block);
    //       this.indents = _indents;
    //       this.parentIndents--;

    //       if (attrs.length || attrsBlocks.length) {
    //         this.buf.push('},');
    //       } else {
    //         this.buf.push('}');
    //       }
    //     }

    //     if (attrsBlocks.length) {
    //       if (attrs.length) {
    //         var val = this.attrs(attrs);
    //         attrsBlocks.unshift(val);
    //       }
    //       this.buf.push('attributes: jade.merge([' + attrsBlocks.join(',') + '])');
    //     } else if (attrs.length) {
    //       var val = this.attrs(attrs);
    //       this.buf.push('attributes: ' + val);
    //     }

    //     if (args) {
    //       this.buf.push('}, ' + args + ');');
    //     } else {
    //       this.buf.push('});');
    //     }

    //   } else {
    //     this.buf.push(name + '(' + args + ');');
    //   }
    //   this.buf.push("jade_indent.pop();")
    // } else {
    //   var mixin_start = this.buf.length;
    //   this.buf.push(name + ' = function (' + args + ') {');
    //   this.buf.push('var block = (this && this.block), attributes = (this && this.attributes) || {};');
    //   this.parentIndents++;
    //   this.visit(block);
    //   this.parentIndents--;
    //   this.buf.push('};');
    //   var mixin_end = this.buf.length;
    //   this.mixins[key].instances.push({start: mixin_start, end: mixin_end});
    // }
  },

  /**
   * Visit `tag` buffering tag markup, generating
   * attributes, visiting the `tag`'s code and block.
   *
   * @param {Tag} tag
   * @api public
   */

  visitTag: function (tag) {
    this.sep();
    this.indents++;

    var inTag = this.inTag; this.inTag = {};

    var name = tag.name;
    if (name in React.DOM) name = 'React.DOM.' + name;
    if ('pre' == tag.name) this.escape = true;
    if (!this.hasCompiledTag) this.hasCompiledTag = true;

    // Optimize attributes buffering
    if (tag.buffer) {
      this.bufferExpression(name);
    } else {
      this.buffer(name);
    }

    this.buffer('(');
    this.inTag.hasAttr = this.inTag.entry =
      this.visitAttributes(tag.attrs, tag.attributeBlocks);
    if (tag.code) this.visitCode(tag.code);
    this.visit(tag.block);

    if ('pre' == tag.name) this.escape = false;

    this.indents--;
    if (this.inTag.count > 0) this.buffer('', 1);
    this.buffer(')');

    this.inTag = inTag;
  },

  sep: function (entry) {
    var inTag = this.inTag;
    if (inTag) {
      if (!inTag.hasAttr) {
        this.buffer('null,', 1);
        inTag.entry = inTag.hasAttr = true;
      } else {
        if (inTag.entry) this.buffer(',', 1);
        inTag.entry = entry !== false;
      }
      inTag.count = (inTag.count || 0) + 1;
    }
  },

  /**
   * Visit `filter`, throwing when the filter does not exist.
   *
   * @param {Filter} filter
   * @api public
   */

  visitFilter: function (filter) {
    throw new Error('not implemented');
    // var text = filter.block.nodes.map(
    //   function (node) { return node.val; }
    // ).join('\n');
    // filter.attrs.filename = this.options.filename;
    // try {
    //   this.buffer(filters(filter.name, text, filter.attrs), true);
    // } catch (err) {
    //   throw errorAtNode(filter, err);
    // }
  },

  /**
   * Visit `text` node.
   *
   * @param {Text} text
   * @api public
   */

  visitText: function (text) {
    this.sep();
    this.interpolate(text.val);
  },

  /**
   * Visit a `comment`, only buffering when the buffer flag is set.
   *
   * @param {Comment} comment
   * @api public
   */

  visitComment: function (comment) {
    if (!comment.buffer) return;
    this.sep(false);
    this.buffer('//' + comment.val, 1);
  },

  /**
   * Visit a `BlockComment`.
   *
   * @param {Comment} comment
   * @api public
   */

  visitBlockComment: function (comment) {
    if (!comment.buffer) return;
    this.sep(false);
    this.buffer('/*' + comment.val);
    this.visit(comment.block);
    this.buffer('*/', 1);
    this.buffer('', 1);
  },

  /**
   * Visit `code`, respecting buffer / escape flags.
   * If the code is followed by a block, wrap it in
   * a self-calling function.
   *
   * @param {Code} code
   * @api public
   */

  visitCode: function (code) {
    var inTag;

    // Wrap code blocks with {}.
    // we only wrap unbuffered code blocks ATM
    // since they are usually flow control

    if (code.buffer) { // Buffer code
      var buf = this.bufferExpression(code.val.trim(), code.escape, false);
      if (buf) {
        this.sep();
        this.buffer(buf);
      }
      if (code.block) this.visit(code.block);
    } else if (code.block) { // Block support
      var match = /^\s*([a-z]+)(?:\s+([a-z]+))?\s*(.*)$/.exec(code.val);
      if (!match) throw new Error('not implemented');
      switch (match[1]) {
        case 'if':
          this.sep();
          this.buffer(match[3] + ' ? [', 2);
          break;
        case 'unless':
          this.sep();
          this.buffer('(!' + match[3] + ') ? [', 1);
          break;
        case 'else':
          this.buffer('] : ');
          switch (match[2]) {
            case 'if':      this.buffer(match[3] + ' ? [', 2); break;
            default:        this.buffer('[', 2);
          }
      }
      this.indents++;
        inTag = this.inTag, this.inTag = { hasAttr: true };
        this.visit(code.block);
        this.inTag = inTag;
      this.indents--;
      this.buffer('', 1);
    } else {
      this.buffer(code.val, 1);
    }
  },

  closeCodeBlock: function (isElse) {
    this.buffer(isElse ? ']' : '] : ""');
  },

  /**
   * Visit `each` block.
   *
   * @param {Each} each
   * @api public
   */

  visitEach: function (each) {
    var inTag;
    this.sep();

    this.indents++;
    this.buffer('(function (__obj$) {', 1);
      this.indents++;
      this.buffer(each.alternative ? 'var __ret$ =' : 'return');
      this.buffer(' _(__obj$).each(function(');
      this.buffer(each.val + ', ' + each.key + ') {', 1);
        this.indents++;
        this.buffer('return [', 1);
          inTag = this.inTag, this.inTag = { hasAttr: true };
          this.visit(each.block);
          this.inTag = inTag;
        this.indents--;
        this.buffer('', 1);
        this.buffer('];');
        this.buffer('', 0);
      this.indents--;
      this.buffer('}, this).flatten().compact().value();');

      if (each.alternative) {
        this.buffer('', 1);
        this.indents++;
        this.buffer('if (!__ret$.length) {', 1);
          this.indents++;
          this.buffer('return _([', 1);
            inTag = this.inTag, this.inTag = { hasAttr: true };
            this.visit(each.alternative);
            this.inTag = inTag;
          this.indents--;
          this.buffer('', 1);
          this.buffer(']).flatten().compact().value()', 0);
        this.indents--;
        this.buffer('}', 1);
        this.buffer('return __ret$;');
      }

    this.indents--;
    this.buffer('', 1);
    this.buffer('}).call(this, ' + each.obj + ')');
  },

  /**
   * Visit `attrs`.
   *
   * @param {Array} attrs
   * @api public
   */

  visitAttributes: function (attrs, attributeBlocks) {
    if (attributeBlocks.length) {
      throw new Error('not implemented');
      // if (attrs.length) {
      //   var val = this.attrs(attrs);
      //   attributeBlocks.unshift(val);
      // }
      // this.bufferExpression('jade.attrs(jade.merge([' + attributeBlocks.join(',') + ']), ' + JSON.stringify(this.terse) + ')');
    } else if (attrs.length) {
      this.indents++;
      this.buffer('{ ');
      this.attrs(attrs, true);
      this.buffer(' }');
      this.indents--;
      return true;
    }
  },

  /**
   * Compile attributes.
   */

  attrs: function (attrs, buffer) {
    var buf = [];
    var classes = [];
    var visited = {};

    attrs.forEach(function (attr) {
      var key = attr.name;
      switch (key) {
        case 'class': return classes.push(attr.val);
        case 'for': key = 'htmlFor'; break;
        default:
          if (/^(data|aria)-/.test(key)) break;
          key = key.split('-');
          key = key[0] + key.slice(1).map(function (it) {
            return it[0].toUpperCase() + it.substr(1);
          });
      }
      if (visited[key]) {
        throw new Error('Duplicate attribute `' + key + "'");
      }
      visited[key] = true;
      if (isConstant(attr.val)) {
        buf.push(JSON.stringify(key) + ': ' +
          JSON.stringify(toConstant(attr.val)));
      } else {
        buf.push(JSON.stringify(key) + ': ' + attr.val);
      }
    });

    if (!classes.length) {
      // no-op
    } else if (classes.every(isConstant)) {
      buf.push('"className": ' + JSON.stringify(
        [].concat.apply([], classes.filter(function (it) {
          return it != null && it !== '';
        }).map(toConstant)).join(' ')
      ));
    } else {
      buf.push('"className": (' + classes.filter(function (it) {
        return it != null && it !== '';
      }).join(") + ' ' + (") + ')');
    }

    buf = buf.length ? buf.join(', ') : '';
    if (buf && buffer) this.buffer(buf);
    return buf;
  }
};
