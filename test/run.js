
/**
 * Module dependencies.
 */

var fs = require('fs');
var assert = require('assert');
var jact = require('../');
var uglify = require('uglify-js');

var beautify = require('js-beautify').html;
// ensure beautify doesn't touch scripts
require('js-beautify/js/lib/beautify').js_beautify = function (it) {
  return it;
};

var React = global.React = require('react');

jact.filters['custom-filter'] = function (str, options) {
  assert(str === 'foo bar');
  assert(options.foo === 'bar');
  return 'bar baz';
};

// test cases

var cases = fs.readdirSync('test/cases').filter(function(file){
  return ~file.indexOf('.jade');
}).map(function(file){
  return file.replace('.jade', '');
});
try {
  fs.mkdirSync(__dirname + '/output');
} catch (ex) {
  if (ex.code !== 'EEXIST') {
    throw ex;
  }
}

var mixinsUnusedTestRan = false;
cases.forEach(function(test){
  var name = test.replace(/[-.]/g, ' ');
  it(name, function(){
    var path = 'test/cases/' + test + '.jade';
    var str = fs.readFileSync(path, 'utf8');
    var html = fs.readFileSync('test/cases/' + test + '.html', 'utf8').trim().replace(/\r/g, '');
    var source = jact.compile(str, { filename: path, basedir: 'test/cases' });
    var actual = React.renderComponentToStaticMarkup(new(eval(source))({ title: 'Jade' }));
    actual = beautify(actual, { indent_size: 2 });

    fs.writeFileSync(__dirname + '/output/' + test + '.html', actual);
    var clientCode = uglify.minify(jact.compileClient(str, {
      filename: path,
      pretty: true,
      compileDebug: false,
      basedir: 'test/cases'
    }), {output: {beautify: true}, mangle: false, compress: false, fromString: true}).code;
    fs.writeFileSync(__dirname + '/output/' + test + '.js', uglify.minify(jact.compileClient(str, {
      filename: path,
      pretty: false,
      compileDebug: false,
      basedir: 'test/cases'
    }), {output: {beautify: true}, mangle: false, compress: false, fromString: true}).code);
    if (/filter/.test(test)) {
      actual = actual.replace(/\n| /g, '');
      html = html.replace(/\n| /g, '');
    }
    if (/mixins-unused/.test(test)) {
      mixinsUnusedTestRan = true;
      assert(/never-called/.test(str), 'never-called is in the jade file for mixins-unused');
      assert(!/never-called/.test(clientCode), 'never-called should be removed from the code');
    }
    assert.equal(actual.trim(), html);
    // actual = Function('jade', clientCode + '\nreturn template;')(jact.runtime)({ title: 'Jade' });
    // if (/filter/.test(test)) {
    //   actual = actual.replace(/\n| /g, '');
    // }
    // assert.equal(JSON.stringify(actual.trim()), JSON.stringify(html));
  })
});
after(function () {
  assert(mixinsUnusedTestRan, 'mixins-unused test should run');
})
