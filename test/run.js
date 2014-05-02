
/**
 * Module dependencies.
 */

var fs = require('fs');
var assert = require('assert');
var jact = require('../');

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

var mixinsUnusedTestRan = false;

before(function (done) {
  fs.mkdir(__dirname + '/output', function (err) {
    if (err && err.code === 'EEXIST') err = null;
    done(err);
  });
});

// test cases
fs.readdirSync('test/cases').reduce(function (files, file) {
  if (~file.indexOf('.jade')) {
    files.push(file.replace('.jade', ''));
  }
  return files;
}, []).forEach(function (test) {
  var path = 'test/cases/' + test + '.jade';
  var html = 'test/cases/' + test + '.html';

  var _describe = /^(case|custom|escaping|filters|include filter|mixins?|tag.interpolation|while)\b|^html$/.test(test)
    ? xdescribe : describe;

  _describe(test.replace(/[-.]/g, ' '), function () {

    before(function (done) {
      fs.readFile(path, 'utf8', function (err, str) {
        this.source = str;
        done(err);
      }.bind(this));
    });

    before(function (done) {
      fs.readFile(html, 'utf8', function (err, str) {
        this.expect = str.trim().replace(/\r/g, '');
        done(err);
      }.bind(this));
    });

    it('should render', function () {
      this.fn = jact.compile(this.source,
        { filename: path, basedir: 'test/cases' });

      this.actual = render(this.fn);

      if (/filter/.test(test)) {
        this.actual = this.actual.replace(/\n| /g, '');
        this.expect = this.expect.replace(/\n| /g, '');
      }

      if (/mixins-unused/.test(test)) {
        mixinsUnusedTestRan = true;
        assert(/never-called/.test(this.source),
          'never-called is in the jade file for mixins-unused');
      }

      assert.equal(this.actual.trim(), this.expect);
    });

    it('should compile for client', function () {
      this.clientCode = jact.compileClient(this.source, {
        filename: path,
        pretty: true,
        basedir: 'test/cases'
      });

      if (/mixins-unused/.test(test)) {
        mixinsUnusedTestRan = true;
        assert(!/never-called/.test(this.clientCode),
          'never-called should be removed from the code');
      }

      this.actual = render(eval(this.clientCode));
      if (/filter/.test(test)) {
        this.actual = this.actual.replace(/\n| /g, '');
      }
      assert.equal(this.actual.trim(), this.expect);
    });

    after(function (done) {
      fs.writeFile(__dirname + '/output/' + test + '.js',
        this.clientCode, done);
    });

    after(function (done) {
      fs.writeFile(__dirname + '/output/' + test + '.html',
        this.actual, done);
    });

  });

});

after(function () {
  assert(mixinsUnusedTestRan, 'mixins-unused test should run');
});

function render (fn, options) {
  var s = React.renderComponentToStaticMarkup(fn.call({ title: 'Jade' }));
  return beautify(s, {
    indent_scripts: 'keep',
    indent_size: 2,
    preserve_newlines: true
  });
}
