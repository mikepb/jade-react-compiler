'use strict';

var jade = require('jade');
var ReactCompiler = require('./compiler');

module.exports = function compile(str, options){
  if (!options) options = {};
  str = str.toString('utf8')

  // Parse
  var parser = new (jade.Parser)(str, options.filename, options);
  var tokens = parser.parse();

  // Compile
  var compiler = new ReactCompiler(tokens, options);
  var js = compiler.compile();

  return '(function () {\n' + js + '\n})';
};
