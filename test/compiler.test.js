'use strict';

// Based on Jade tests:
// https://github.com/visionmedia/jade/blob/master/test/jade.test.js

var jade = require('jade');
var assert = require('assert');
var fs = require('fs');

var compile = require('../index')

function wrap () {
  return '(function () {\n' + [].slice.call(arguments).join('\n') + '\n})';
};

describe('jade', function(){

  describe('.compile()', function(){
  it('should not support doctypes', function(){
    try {
      compile('doctype xml');
      assert.fail();
    } catch (e) { assert(e); }
    try {
      compile('doctype html');
      assert.fail();
    } catch (e) { assert(e); }
    try {
      compile('doctype foo bar baz');
      assert.fail();
    } catch (e) { assert(e); }
    try {
      compile('doctype html');
      assert.fail();
    } catch (e) { assert(e); }
    try {
      compile('doctype', { doctype:'html' });
      assert.fail();
    } catch (e) { assert(e); }
    try {
      compile('doctype html', { doctype:'xml' });
      assert.fail();
    } catch (e) { assert(e); }
    try {
      compile('doctype html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN');
      assert.fail();
    } catch (e) { assert(e); }
  });

  it('should not more than one root', function(){
    try {
      compile('div\np');
      assert.fail();
    } catch (e) { assert(e); }
    try {
      compile('div\np', { doctype:'html' });
      assert.fail();
    } catch (e) { assert(e); }
    try {
      compile('div\n| hello');
      assert.fail();
    } catch (e) { assert(e); }
  });

  it('should support Buffers', function(){
    assert.equal(compile(new Buffer('p foo')),
      wrap('return React.DOM.p(null,\n  "foo"\n)'));
  });

  it('should support line endings', function(){
    var src = [
      'div',
      '  p',
      '  div',
      '  img'
    ];

    var html = wrap(
      'return React.DOM.div(null,',
      '  React.DOM.p(),',
      '  React.DOM.div(),',
      '  React.DOM.img()',
      ')'
    );

    assert.equal(compile(src.join('\n')), html);
    assert.equal(compile(src.join('\r')), html);
    assert.equal(compile(src.join('\r\n')), html);
    assert.equal(compile(src.join('\n'), { doctype:'html' }), html);
    assert.equal(compile(src.join('\r'), { doctype:'html' }), html);
    assert.equal(compile(src.join('\r\n'), { doctype:'html' }), html);
  });

  it('should support single quotes', function(){
    assert.equal(compile("p 'foo'"),
      wrap("return React.DOM.p(null,\n  \"'foo'\"\n)"));
    assert.equal(compile("p\n  | 'foo'"),
      wrap("return React.DOM.p(null,\n  \"'foo'\"\n)"));
  });

  it('should support single quotes in code', function(){
    assert.equal(compile("- var path = 'foo'\na(href='/' + path)"),
      wrap(
        "var path = 'foo'",
        "return React.DOM.a({ \"href\": '/' + path })"
    ));
  });

  it('should support block-expansion', function(){
    assert.equal(compile([
      'div',
      '  li: a foo',
      '  li: a bar',
      '  li: a baz'
    ].join('\n')), wrap(
      'return React.DOM.div(null,',
      '  React.DOM.li(null,',
      '    React.DOM.a(null,',
      '      "foo"',
      '    )',
      '  ),',
      '  React.DOM.li(null,',
      '    React.DOM.a(null,',
      '      "bar"',
      '    )',
      '  ),',
      '  React.DOM.li(null,',
      '    React.DOM.a(null,',
      '      "baz"',
      '    )',
      '  )',
      ')'
    ));
    assert.equal(compile([
      'div',
      '  li.first: a foo',
      '  li: a bar',
      '  li: a baz'
    ].join('\n')), wrap(
      'return React.DOM.div(null,',
      '  React.DOM.li({ "className": "first" },',
      '    React.DOM.a(null,',
      '      "foo"',
      '    )',
      '  ),',
      '  React.DOM.li(null,',
      '    React.DOM.a(null,',
      '      "bar"',
      '    )',
      '  ),',
      '  React.DOM.li(null,',
      '    React.DOM.a(null,',
      '      "baz"',
      '    )',
      '  )',
      ')'
    ));
    assert.equal(compile(".foo: .bar baz"), wrap(
      'return React.DOM.div({ "className": "foo" },',
      '  React.DOM.div({ "className": "bar" },',
      '    "baz"',
      '  )',
      ')'
    ));
  });

  it('should support tags', function(){
    assert.equal(compile([
      'div',
      '  p',
      '  div',
      '  img'
    ].join('\n')), wrap(
      'return React.DOM.div(null,',
      '  React.DOM.p(),',
      '  React.DOM.div(),',
      '  React.DOM.img()',
      ')'
    ), 'Test basic tags');

    assert.equal(compile('div.something'),
      wrap('return React.DOM.div({ "className": "something" })'),
      'Test classes');

    assert.equal(compile('div#something'),
      wrap('return React.DOM.div({ "id": "something" })'), 'Test ids');

    assert.equal(compile('.something'),
      wrap('return React.DOM.div({ "className": "something" })'),
      'Test stand-alone classes');

    assert.equal(compile('#something'),
      wrap('return React.DOM.div({ "id": "something" })'),
      'Test stand-alone ids');

    assert.equal(compile('#foo.bar'),
      wrap('return React.DOM.div({ "id": "foo", "className": "bar" })'));

    assert.equal(compile('.bar#foo'),
      wrap('return React.DOM.div({ "id": "foo", "className": "bar" })'));

    assert.equal(compile('div#foo(class="bar")'),
      wrap('return React.DOM.div({ "id": "foo", "className": "bar" })'));

    assert.equal(compile('div(class="bar")#foo'),
      wrap('return React.DOM.div({ "id": "foo", "className": "bar" })'));

    assert.equal(compile('div(id="bar").foo'),
      wrap('return React.DOM.div({ "id": "bar", "className": "foo" })'));

    assert.equal(compile('div.foo.bar.baz'),
      wrap('return React.DOM.div({ "className": "foo bar baz" })'));

    assert.equal(compile('div(class="foo").bar.baz'),
      wrap('return React.DOM.div({ "className": "foo bar baz" })'));

    assert.equal(compile('div.foo(class="bar").baz'),
      wrap('return React.DOM.div({ "className": "foo bar baz" })'));

    assert.equal(compile('div.foo.bar(class="baz")'),
      wrap('return React.DOM.div({ "className": "foo bar baz" })'));

    assert.equal(compile('div.a-b2'),
      wrap('return React.DOM.div({ "className": "a-b2" })'));

    assert.equal(compile('div(class="a-b2")'),
      wrap('return React.DOM.div({ "className": "a-b2" })'));

    assert.equal(compile('colgroup\n  col.test'), wrap(
      'return React.DOM.colgroup(null,',
      '  React.DOM.col({ "className": "test" })',
      ')'
    ));
  });

  it('should support nested tags', function(){
    assert.equal(compile([
      'ul',
      '  li a',
      '  li b',
      '  li',
      '  ul',
      '    li c',
      '    li d',
      '  li e',
    ].join('\n')), wrap(
      'return React.DOM.ul(null,',
      '  React.DOM.li(null,',
      '    "a"',
      '  ),',
      '  React.DOM.li(null,',
      '    "b"',
      '  ),',
      '  React.DOM.li(),',
      '  React.DOM.ul(null,',
      '    React.DOM.li(null,',
      '      "c"',
      '    ),',
      '    React.DOM.li(null,',
      '      "d"',
      '    )',
      '  ),',
      '  React.DOM.li(null,',
      '    "e"',
      '  )',
      ')'
    ));

    assert.equal(compile([
      'a(href="#")',
      '  | foo ',
      '  | bar ',
      '  | baz'
    ].join('\n')), wrap(
      'return React.DOM.a({ "href": "#" },',
      '  "foo \\nbar \\nbaz"',
      ')'
    ));

    assert.equal(compile([
      'ul',
      '  li one',
      '  ul',
      '    | two',
      '    li three'
    ].join('\n')), wrap(
      'return React.DOM.ul(null,',
      '  React.DOM.li(null,',
      '    "one"',
      '  ),',
      '  React.DOM.ul(null,',
      '    "two",',
      '    React.DOM.li(null,',
      '      "three"',
      '    )',
      '  )',
      ')'
    ));
  });

  it('should support variable length newlines', function(){
    assert.equal(compile([
      'ul',
      '  li a',
      '  ',
      '  li b',
      ' ',
      '     ',
      '  li',
      '  ul',
      '    li c',
      '',
      '    li d',
      '  li e',
    ].join('\n')), wrap(
      'return React.DOM.ul(null,',
      '  React.DOM.li(null,',
      '    "a"',
      '  ),',
      '  React.DOM.li(null,',
      '    "b"',
      '  ),',
      '  React.DOM.li(),',
      '  React.DOM.ul(null,',
      '    React.DOM.li(null,',
      '      "c"',
      '    ),',
      '    React.DOM.li(null,',
      '      "d"',
      '    )',
      '  ),',
      '  React.DOM.li(null,',
      '    "e"',
      '  )',
      ')'
    ));
  });

  it('should support tab conversion', function(){
    assert.equal(compile([
      'ul',
      '\tli a',
      '\t',
      '\tli b',
      '\t\t',
      '\t\t\t\t\t\t',
      '\tli',
      '\t\tul',
      '\t\t\tli c',
      '',
      '\t\t\tli d',
      '\tli e',
    ].join('\n')), wrap(
      'return React.DOM.ul(null,',
      '  React.DOM.li(null,',
      '    "a"',
      '  ),',
      '  React.DOM.li(null,',
      '    "b"',
      '  ),',
      '  React.DOM.li(null,',
      '    React.DOM.ul(null,',
      '      React.DOM.li(null,',
      '        "c"',
      '      ),',
      '      React.DOM.li(null,',
      '        "d"',
      '      )',
      '    )',
      '  ),',
      '  React.DOM.li(null,',
      '    "e"',
      '  )',
      ')'
    ));
  });

  it('should support newlines', function(){
    assert.equal(compile([
      'ul',
      '  li a',
      '  ',
      '  ',
      '',
      ' ',
      '  li b',
      '  li',
      '  ',
      '    ',
      ' ',
      '  ul',
      '    ',
      '    li c',
      '    li d',
      '  li e',
    ].join('\n')), wrap(
      'return React.DOM.ul(null,',
      '  React.DOM.li(null,',
      '    "a"',
      '  ),',
      '  React.DOM.li(null,',
      '    "b"',
      '  ),',
      '  React.DOM.li(),',
      '  React.DOM.ul(null,',
      '    React.DOM.li(null,',
      '      "c"',
      '    ),',
      '    React.DOM.li(null,',
      '      "d"',
      '    )',
      '  ),',
      '  React.DOM.li(null,',
      '    "e"',
      '  )',
      ')'
    ));
  });

  it('should support text', function(){
    assert.equal(compile('div\n  | foo\n  | bar\n  | baz'),
      wrap('return React.DOM.div(null,\n  "foo\\nbar\\nbaz"\n)'));
    assert.equal(compile('div\n  | foo \n  | bar \n  | baz'),
      wrap('return React.DOM.div(null,\n  "foo \\nbar \\nbaz"\n)'));
    assert.equal(compile('div\n  | (hey)'),
      wrap('return React.DOM.div(null,\n  "(hey)"\n)'));
    assert.equal(compile('div\n  | some random text'),
      wrap('return React.DOM.div(null,\n  "some random text"\n)'));
    assert.equal(compile('div\n  |   foo'),
      wrap('return React.DOM.div(null,\n  "  foo"\n)'));
    assert.equal(compile('div\n  |   foo  '),
      wrap('return React.DOM.div(null,\n  "  foo  "\n)'));
    assert.equal(compile('div\n  |   foo  \n  |  bar  '),
      wrap('return React.DOM.div(null,\n  "  foo  \\n bar  "\n)'));
  });

  it('should support pipe-less text', function(){
    assert.equal(compile('pre\n  code\n  a\n\n  b'),
      wrap(
        'return React.DOM.pre(null,',
        '  React.DOM.code(),',
        '  React.DOM.a(),',
        '  React.DOM.b()',
        ')'
    ));
    assert.equal(compile('p.\n  foo\n\n  bar'),
      wrap(
        'return React.DOM.p(null,',
        '  "foo\\n\\nbar"',
        ')'
    ));
    assert.equal(compile('p.\n  foo\n\n\n\n  bar'),
      wrap(
        'return React.DOM.p(null,',
        '  "foo\\n\\n\\n\\nbar"',
        ')'
    ));
    assert.equal(compile('p.\n  foo\n  bar\n  foo'),
      wrap(
        'return React.DOM.p(null,',
        '  "foo\\nbar\\nfoo"',
        ')'
    ));
    assert.equal(compile('script.\n  s.parentNode.insertBefore(g,s)'),
      wrap(
        'return React.DOM.script(null,',
        '  "s.parentNode.insertBefore(g,s)"',
        ')'
    ));
    assert.equal(compile('script.\n  s.parentNode.insertBefore(g,s)'),
      wrap(
        'return React.DOM.script(null,',
        '  "s.parentNode.insertBefore(g,s)"',
        ')'
    ));
  });

  it('should support tag text', function(){
    assert.equal(compile('Module some random text'),
      wrap(
        'return Module(null,',
        '  "some random text"',
        ')'
    ));
    assert.equal(compile('p some random text'),
      wrap(
        'return React.DOM.p(null,',
        '  "some random text"',
        ')'
    ));
    assert.equal(compile('p\n  | click\n  a Google\n  | .'),
      wrap(
        'return React.DOM.p(null,',
        '  "click",',
        '  React.DOM.a(null,',
        '    "Google"',
        '  ),',
        '  "."',
        ')'
    ));
    assert.equal(compile('p (parens)'),
      wrap(
        'return React.DOM.p(null,',
        '  "(parens)"',
        ')'
    ));
    assert.equal(compile('p(foo="bar") (parens)'),
      wrap(
        'return React.DOM.p({ "foo": "bar" },',
        '  "(parens)"',
        ')'
    ));
    assert.equal(compile('option(value="") -- (optional) foo --'),
      wrap(
        'return React.DOM.option({ "value": "" },',
        '  "-- (optional) foo --"',
        ')'
    ));
  });

  it('should support tag text block', function(){
    assert.equal(compile('p\n  | foo \n  | bar \n  | baz'), wrap(
      'return React.DOM.p(null,',
      '  "foo \\nbar \\nbaz"',
      ')'
    ));
    assert.equal(compile('label\n  | Password:\n  input'),
      wrap('return React.DOM.label(null,\n  "Password:",\n  React.DOM.input()\n)'));
    assert.equal(compile('label Password:\n  input'),
      wrap('return React.DOM.label(null,\n  "Password:",\n  React.DOM.input()\n)'));
  });

  it('should support tag text interpolation', function(){
    assert.equal(compile('div yo, #{name} is cool\n'),
      wrap('return React.DOM.div(null,\n  "yo, ",\n  name,\n  " is cool"\n)'));
    assert.equal(compile('p yo, #{name} is cool\n'),
      wrap('return React.DOM.p(null,\n  "yo, ",\n  name,\n  " is cool"\n)'));
    assert.equal(compile('div yo, #{name || "jade"} is cool\n'),
      wrap('return React.DOM.div(null,\n  "yo, ",\n  name || "jade",\n  " is cool"\n)'));

    assert.equal(compile('div yo, #{name || "\'jade\'"} is cool\n'),
      wrap('return React.DOM.div(null,\n  "yo, ",\n  name || "\'jade\'",\n  " is cool"\n)'));
    assert.equal(compile('div foo #{code} bar\n'),
      wrap('return React.DOM.div(null,\n  "foo ",\n  code,\n  " bar"\n)'));
    assert.equal(compile('div foo !{code} bar\n'),
      wrap(
        'return React.DOM.div(null,',
        '  "foo ",',
        '  React.DOM.text({ "dangerouslySetInnerHTML": { "__html": code } }),',
        '  " bar"',
        ')'
      ));
  });

  it('should support flexible indentation', function(){
    assert.equal(compile('div\n  div\n   h1 Wahoo\n   p test'),
      wrap(
        'return React.DOM.div(null,',
        '  React.DOM.div(null,',
        '    React.DOM.h1(null,',
        '      "Wahoo"',
        '    ),',
        '    React.DOM.p(null,',
        '      "test"',
        '    )',
        '  )',
        ')'
    ));
  });

  it('should support interpolation values', function(){
    assert.equal(compile('p Users: #{15}'),
      wrap('return React.DOM.p(null,\n  "Users: ",\n  15\n)'));
    assert.equal(compile('p Users: #{null}'),
      wrap('return React.DOM.p(null,\n  "Users: "\n)'));
    assert.equal(compile('p Users: #{undefined}'),
      wrap('return React.DOM.p(null,\n  "Users: "\n)'));
    assert.equal(compile('p Users: #{undefined || "none"}'),
      wrap('return React.DOM.p(null,\n  "Users: ",\n  undefined || "none"\n)'));
    assert.equal(compile('p Users: #{0}'),
      wrap('return React.DOM.p(null,\n  "Users: ",\n  0\n)'));
    assert.equal(compile('p Users: #{false}'),
      wrap('return React.DOM.p(null,\n  "Users: ",\n  false\n)'));
  });

  it('should support multi-line attrs', function(){
    assert.equal(compile('a(foo="bar"\n  bar="baz"\n  checked) foo'),
      wrap('return React.DOM.a({ "foo": "bar", "bar": "baz", "checked": true },\n  "foo"\n)'));
    assert.equal(compile('a(foo="bar"\nbar="baz"\nchecked) foo'),
      wrap('return React.DOM.a({ "foo": "bar", "bar": "baz", "checked": true },\n  "foo"\n)'));
    assert.equal(compile('a(foo="bar"\n,bar="baz"\n,checked) foo'),
      wrap('return React.DOM.a({ "foo": "bar", "bar": "baz", "checked": true },\n  "foo"\n)'));
    assert.equal(compile('a(foo="bar",\nbar="baz",\nchecked) foo'),
      wrap('return React.DOM.a({ "foo": "bar", "bar": "baz", "checked": true },\n  "foo"\n)'));
  });

  it('should support attrs', function(){
    assert.equal(compile('img(src="<script>")'),
      wrap('return React.DOM.img({ "src": "<script>" })'),
      'Test attr escaping');

    assert.equal(compile('a(data-attr="bar")'),
      wrap('return React.DOM.a({ "data-attr": "bar" })'));
    assert.equal(compile('a(data-attr="bar", data-attr-2="baz")'),
      wrap('return React.DOM.a({ "data-attr": "bar", "data-attr-2": "baz" })'));

    assert.equal(compile('a(title= "foo,bar")'),
      wrap('return React.DOM.a({ "title": "foo,bar" })'));

    assert.equal(compile('a(title= "foo,bar")'),
      wrap('return React.DOM.a({ "title": "foo,bar" })'));

    assert.equal(compile('a(title= "foo,bar", "href"="#")'),
      wrap('return React.DOM.a({ "title": "foo,bar", "href": "#" })'));

    assert.equal(compile("p(class='foo')"),
      wrap('return React.DOM.p({ "className": "foo" })'),
      'Test single quoted attrs');
    assert.equal(compile('input( type="checkbox", checked )'),
      wrap('return React.DOM.input({ "type": "checkbox", "checked": true })'));
    assert.equal(compile('input( type="checkbox", checked = true )'),
      wrap('return React.DOM.input({ "type": "checkbox", "checked": true })'));
    assert.equal(compile('input( type="checkbox", checked = false )'),
      wrap('return React.DOM.input({ "type": "checkbox", "checked": false })'));
    assert.equal(compile('input( type="checkbox", checked = null )'),
      wrap('return React.DOM.input({ "type": "checkbox", "checked": null })'));
    assert.equal(compile('input( type="checkbox", checked = undefined )'),
      wrap('return React.DOM.input({ "type": "checkbox", "checked": undefined })'));

    assert.equal(compile('img(src="/foo.png")'),
      wrap('return React.DOM.img({ "src": "/foo.png" })'),
      'Test attr =');
    assert.equal(compile('img(src  =  "/foo.png")'),
      wrap('return React.DOM.img({ "src": "/foo.png" })'),
      'Test attr = whitespace');

    assert.equal(compile('img(src="/foo.png", alt="just some foo")'),
      wrap('return React.DOM.img({ "src": "/foo.png", "alt": "just some foo" })'));
    assert.equal(compile('img(src = "/foo.png", alt = "just some foo")'),
      wrap('return React.DOM.img({ "src": "/foo.png", "alt": "just some foo" })'));

    assert.equal(compile('p(class="foo,bar,baz")'),
      wrap('return React.DOM.p({ "className": "foo,bar,baz" })'));
    assert.equal(compile('a(href= "http://google.com", title= "Some : weird = title")'),
      wrap('return React.DOM.a({ "href": "http://google.com", "title": "Some : weird = title" })'));

    assert.equal(compile('label(for="name")'),
      wrap('return React.DOM.label({ "htmlFor": "name" })'));
    assert.equal(compile("meta(name= 'viewport', content='width=device-width')"),
      wrap('return React.DOM.meta({ "name": "viewport", "content": "width=device-width" })'),
      'Test attrs that contain attr separators');
    assert.equal(compile("div(style='color= white')"),
      wrap('return React.DOM.div({ "style": "color= white" })'));
    assert.equal(compile("div(style='color: white')"),
      wrap('return React.DOM.div({ "style": "color: white" })'));
    assert.equal(compile("p('class'='foo')"),
      wrap('return React.DOM.p({ "className": "foo" })'),
      'Test keys with single quotes');
    assert.equal(compile("p(\"class\"= 'foo')"),
      wrap('return React.DOM.p({ "className": "foo" })'),
      'Test keys with double quotes');

    assert.equal(compile('p(data-lang = "en")'),
      wrap('return React.DOM.p({ "data-lang": "en" })'));
    assert.equal(compile('p("data-dynamic"= "true")'),
      wrap('return React.DOM.p({ "data-dynamic": "true" })'));
    assert.equal(compile('p("class"= "name", "data-dynamic"= "true")'),
      wrap('return React.DOM.p({ "data-dynamic": "true", "className": "name" })'));
    assert.equal(compile('p(\'data-dynamic\'= "true")'),
      wrap('return React.DOM.p({ "data-dynamic": "true" })'));
    assert.equal(compile('p(\'class\'= "name", \'data-dynamic\'= "true")'),
      wrap('return React.DOM.p({ "data-dynamic": "true", "className": "name" })'));
    assert.equal(compile('p(\'class\'= "name", \'data-dynamic\'= "true", yay)'),
      wrap('return React.DOM.p({ "data-dynamic": "true", "yay": true, "className": "name" })'));

    assert.equal(compile('input(checked, type="checkbox")'),
      wrap('return React.DOM.input({ "checked": true, "type": "checkbox" })'));

    assert.equal(compile('a(data-foo  = "{ foo: \'bar\', bar= \'baz\' }")'),
      wrap('return React.DOM.a({ "data-foo": "{ foo: \'bar\', bar= \'baz\' }" })'));

    assert.equal(compile('meta(http-equiv="X-UA-Compatible", content="IE=edge,chrome=1")'),
      wrap('return React.DOM.meta({ "httpEquiv": "X-UA-Compatible", "content": "IE=edge,chrome=1" })'));

    assert.equal(compile("div(style= 'background: url(/images/test.png)') Foo"),
      wrap('return React.DOM.div({ "style": "background: url(/images/test.png)" },\n  "Foo"\n)'));
    assert.equal(compile("div(style= ['foo', 'bar'][0]) Foo"),
      wrap('return React.DOM.div({ "style": "foo" },\n  "Foo"\n)'));
    assert.equal(compile("div(style= { foo: 'bar', baz: 'raz' }['foo']) Foo"),
      wrap('return React.DOM.div({ "style": "bar" },\n  "Foo"\n)'));
    assert.equal(compile("a(href='abcdefg'.substr(3,3)) Foo"),
      wrap('return React.DOM.a({ "href": "def" },\n  "Foo"\n)'));
    assert.equal(compile("a(href={test: 'abcdefg'}.test.substr(3,3)) Foo"),
      wrap('return React.DOM.a({ "href": "def" },\n  "Foo"\n)'));
    assert.equal(compile("a(href={test: 'abcdefg'}.test.substr(3,[0,3][1])) Foo"),
      wrap('return React.DOM.a({ "href": "def" },\n  "Foo"\n)'));

    assert.equal(compile("a(data-obj= \"{ foo: 'bar' }\")"),
      wrap('return React.DOM.a({ "data-obj": "{ foo: \'bar\' }" })'));

    assert.equal(compile('meta(content="what\'s up? \'weee\'")'),
      wrap('return React.DOM.meta({ "content": "what\'s up? \'weee\'" })'));
  });

  it('should support class attr array', function(){
    assert.equal(compile('div(class=["foo", "bar", "baz"])'),
      wrap('return React.DOM.div({ "className": "foo bar baz" })'));
  });

  it('should support attr interpolation', function(){
    // Test single quote interpolation
    assert.equal(compile("a(href='/user/#{id}')"),
      wrap(
        'return React.DOM.a({ "href": \'/user/\' + (id) + \'\' })'
    ));
    assert.equal(compile("a(href='/user/#{id}') #{name}"),
      wrap(
        'return React.DOM.a({ "href": \'/user/\' + (id) + \'\' },',
        '  name',
        ')'
    ));
    assert.equal(compile("a(href='/user/#{id}-#{name}') #{name}"),
      wrap(
        "return React.DOM.a({ \"href\": '/user/' + (id) + '-' + (name) + '' },",
        '  name',
        ')'
    ));

    // Test double quote interpolation
    assert.equal(compile('a(href="/user/#{id}") #{name}'),
      wrap(
        'return React.DOM.a({ "href": "/user/" + (id) + "" },',
        '  name',
        ')'
    ));
    assert.equal(compile('a(href="/user/#{id}-#{name}") #{name}'),
      wrap(
        'return React.DOM.a({ "href": "/user/" + (id) + "-" + (name) + "" },',
        '  name',
        ')'
    ));

    // Test escaping the interpolation
    assert.equal(compile('a(href="/user/\\#{id}") \\#{name}'),
      wrap(
        'return React.DOM.a({ "href": "/user/#{id}" },',
        '  "#{name}"',
        ')'
    ));
  });

  it('should support attr parens', function(){
    assert.equal(compile('p(foo=((("bar"))))= ((("baz")))'),
      wrap('return React.DOM.p({ "foo": "bar" },\n  "baz"\n)'));
  });

  it('should support code attrs', function(){
    assert.equal(compile('p(id= name)'),
      wrap('return React.DOM.p({ "id": name })'));
    assert.equal(compile('p(id= name || "default")'),
      wrap('return React.DOM.p({ "id": name || "default" })'));
    assert.equal(compile("p(id= 'something')"),
      wrap('return React.DOM.p({ "id": "something" })'));
    assert.equal(compile("p(id = 'something')"),
      wrap('return React.DOM.p({ "id": "something" })'));
    assert.equal(compile("p(id= (true ? 'foo' : 'bar'))"),
      wrap('return React.DOM.p({ "id": "foo" })'));
    assert.equal(compile("option(value='') Foo"),
      wrap('return React.DOM.option({ "value": "" },\n  "Foo"\n)'));
  });

  it('should support code attrs class', function(){
    assert.equal(compile('p(class= name)'),
      wrap('return React.DOM.p({ "className": (name) })'));
    assert.equal(compile('p(class= name || "default").foo'),
      wrap("return React.DOM.p({ \"className\": (name || \"default\") + ' ' + ('foo') })"));
    assert.equal(compile('p(id = name || "default")'),
      wrap('return React.DOM.p({ "id": name || "default" })'));
    assert.equal(compile('p(id = "user-" + 1)'),
      wrap('return React.DOM.p({ "id": "user-1" })'));
    assert.equal(compile('p(class = "user-" + 1)'),
      wrap('return React.DOM.p({ "className": "user-1" })'));
  });

  it('should support code buffering', function(){
    assert.equal(compile('p= null'),
      wrap('return React.DOM.p()'));
    assert.equal(compile('p= undefined'),
      wrap('return React.DOM.p()'));
    assert.equal(compile('p= 0'),
      wrap('return React.DOM.p(null,\n  0\n)'));
    assert.equal(compile('p= false'),
      wrap('return React.DOM.p(null,\n  false\n)'));
  });

  it('should support script text', function(){
    assert.equal(compile([
      'div',
      '  script.',
      '    p foo',
      '',
      '  script(type="text/template")',
      '    p foo',
      '',
      '  script(type="text/template").',
      '    p foo'
    ].join('\n')), wrap(
      'return React.DOM.div(null,',
      '  React.DOM.script(null,',
      '    "p foo\\n"',
      '  ),',
      '  React.DOM.script({ "type": "text/template" },',
      '    React.DOM.p(null,',
      '      "foo"',
      '    )',
      '  ),',
      '  React.DOM.script({ "type": "text/template" },',
      '    "p foo"',
      '  )',
      ')'
    ));
  });

  it('should support comments', function(){
    // Regular
    assert.equal(compile([
      '//foo',
      'p bar'
    ].join('\n')), wrap(
      '//foo',
      'return React.DOM.p(null,',
      '  "bar"',
      ')'
    ));

    // Between tags
    assert.equal(compile([
      'div',
      '  p foo',
      '  // bar ',
      '  p baz'
    ].join('\n')), wrap(
      'return React.DOM.div(null,',
      '  React.DOM.p(null,',
      '    "foo"',
      '  ),',
      '  // bar ',
      '  React.DOM.p(null,',
      '    "baz"',
      '  )',
      ')'
    ));

    // Quotes
    assert.equal(compile([
      "// script(src: '/js/validate.js') ",
      'div'
    ].join('\n')), wrap(
      "// script(src: '/js/validate.js') ",
      'return React.DOM.div()'
    ));
  });

  it('should support unbuffered comments', function(){
    assert.equal(compile('//- foo\np bar'),
      wrap('return React.DOM.p(null,\n  "bar"\n)'));
    assert.equal(compile('div\n  p foo\n  //- bar\n  p baz'),
      wrap(
        'return React.DOM.div(null,',
        '  React.DOM.p(null,',
        '    "foo"',
        '  ),',
        '  React.DOM.p(null,',
        '    "baz"',
        '  )',
        ')'
    ));
  });

  it('should not support literal html', function(){
    try { compile('<!--[if IE lt 9]>weeee<![endif]-->'); assert.fail(); }
    catch (e) { assert(e) }
  });

  it('should support simple code', function(){
    assert.equal(compile('p!= "test"'),
      wrap(
        'return React.DOM.p(null,',
        '  React.DOM.text({ "dangerouslySetInnerHTML": { "__html": "test" } })',
        ')'
      ));
    assert.equal(compile('p= "test"'),
      wrap(
        'return React.DOM.p(null,',
        '  "test"',
        ')'
      ));
    assert.equal(compile('- var foo = "test"\np=foo'), wrap(
      'var foo = "test"',
      'return React.DOM.p(null,',
      '  foo',
      ')'
    ));
    assert.equal(compile('- var foo = "test"\np\n  | foo\n  em= foo\n  | bar'),
      wrap(
        'var foo = "test"',
        'return React.DOM.p(null,',
        '  "foo",',
        '  React.DOM.em(null,',
        '    foo',
        '  ),',
        '  "bar"',
        ')'
      ));
    assert.equal(compile('div\n  != "test"\n  h2 something'),
      wrap(
        'return React.DOM.div(null,',
        '  React.DOM.text({ "dangerouslySetInnerHTML": { "__html": "test" } }),',
        '  React.DOM.h2(null,',
        '    "something"',
        '  )',
        ')'
      ));

    assert.equal(compile([
      '- var foo = "<script>";',
      'div',
      '  = foo',
      '  != foo'
    ].join('\n')), wrap(
      'var foo = "<script>";',
      'return React.DOM.div(null,',
      '  foo,',
      '  React.DOM.text({ "dangerouslySetInnerHTML": { "__html": foo } })',
      ')'
    ));


    assert.equal(compile([
      'p foo',
      '  = "bar"',
    ].join('\n')), wrap(
      'return React.DOM.p(null,',
      '  "foo",',
      '  "bar"',
      ')'
    ));

    assert.equal(compile([
      'div',
      '  a= "bar"',
      '  span= "baz"'
    ].join('\n')), wrap(
      'return React.DOM.div(null,',
      '  React.DOM.a(null,',
      '    "bar"',
      '  ),',
      '  React.DOM.span(null,',
      '    "baz"',
      '  )',
      ')'
    ));
  });

  it('should support complex code', function(){
    var html = [
      '<p>&lt;script&gt;</p>'
    ].join('');

    assert.equal(compile([
      '- var foo = "<script>";',
      'div',
      '  - if (foo)',
      '      p= foo'
    ].join('\n')), wrap(
      'var foo = "<script>";',
      'return React.DOM.div(null,',
      '  (foo) ? [',
      '    React.DOM.p(null,',
      '      foo',
      '    )',
      '  ] : ""',
      ')'
    ));

    assert.equal(compile([
      '- var foo = "<script>";',
      'div',
      '  - if (foo)',
      '      p!= foo'
    ].join('\n')), wrap(
      'var foo = "<script>";',
      'return React.DOM.div(null,',
      '  (foo) ? [',
      '    React.DOM.p(null,',
      '      React.DOM.text({ "dangerouslySetInnerHTML": { "__html": foo } })',
      '    )',
      '  ] : ""',
      ')'
    ));

    assert.equal(compile([
      '- var foo;',
      'div',
      '  - if (foo)',
      '    p.hasFoo= foo',
      '  - else',
      '    p.noFoo no foo'
    ].join('\n')), wrap(
      'var foo;',
      'return React.DOM.div(null,',
      '  (foo) ? [',
      '    React.DOM.p({ "className": "hasFoo" },',
      '      foo',
      '    )',
      '  ] : [',
      '    React.DOM.p({ "className": "noFoo" },',
      '      "no foo"',
      '    )',
      '  ]',
      ')'
    ));

    assert.equal(compile([
      '- var foo;',
      'div',
      '  - if (foo)',
      '    p.hasFoo= foo',
      '  - else if (true)',
      '    p kinda foo',
      '  - else',
      '    p.noFoo no foo'
    ].join('\n')), wrap(
      'var foo;',
      'return React.DOM.div(null,',
      '  (foo) ? [',
      '    React.DOM.p({ "className": "hasFoo" },',
      '      foo',
      '    )',
      '  ] : (true) ? [',
      '    React.DOM.p(null,',
      '      "kinda foo"',
      '    )',
      '  ] : [',
      '    React.DOM.p({ "className": "noFoo" },',
      '      "no foo"',
      '    )',
      '  ]',
      ')'
    ));

    var str = [
      'title foo',
      '- if (true)',
      '  p something',
    ].join('\n');

    assert.equal(compile([
      'div foo',
      '  if (true)',
      '    p something',
    ].join('\n')), wrap(
      'return React.DOM.div(null,',
      '  "foo",',
      '  ( (true)) ? [',
      '    React.DOM.p(null,',
      '      "something"',
      '    )',
      '  ] : ""',
      ')'
    ));
  });

  it('should support each', function(){
    // Array
    assert.equal(compile([
      '- var items = ["one", "two", "three"];',
      'ul',
      '  each item in items',
      '    li= item'
    ].join('\n')), wrap(
      'var items = ["one", "two", "three"];',
      'return React.DOM.ul(null,',
      '  (function (__obj$) {',
      '    return _(__obj$).each(function(item, $index) {',
      '      return [',
      '        React.DOM.li(null,',
      '          item',
      '        )',
      '      ];',
      '    }, this).flatten().compact().value();',
      '  }).call(this, items)',
      ')'
    ));

    // Any enumerable (length property)
    assert.equal(compile([
      '- var jQuery = { length: 3, 0: 1, 1: 2, 2: 3 };',
      'ul',
      '  each item in jQuery',
      '    li= item'
    ].join('\n')), wrap(
      'var jQuery = { length: 3, 0: 1, 1: 2, 2: 3 };',
      'return React.DOM.ul(null,',
      '  (function (__obj$) {',
      '    return _(__obj$).each(function(item, $index) {',
      '      return [',
      '        React.DOM.li(null,',
      '          item',
      '        )',
      '      ];',
      '    }, this).flatten().compact().value();',
      '  }).call(this, jQuery)',
      ')'
    ));

    // Empty array
    assert.equal(compile([
      '- var items = [];',
      'dl',
      '  - each item in items',
      '    dt foo',
      '    dd= item'
    ].join('\n')), wrap(
      'var items = [];',
      'return React.DOM.dl(null,',
      '  (function (__obj$) {',
      '    return _(__obj$).each(function(item, $index) {',
      '      return [',
      '        React.DOM.dt(null,',
      '          "foo"',
      '        ),',
      '        React.DOM.dd(null,',
      '          item',
      '        )',
      '      ];',
      '    }, this).flatten().compact().value();',
      '  }).call(this, items)',
      ')'
    ));

    // Object
    assert.equal(compile([
      '- var obj = { foo: "bar", baz: "raz" };',
      'ul',
      '  each val in obj',
      '    li= val'
    ].join('\n')), wrap(
      'var obj = { foo: "bar", baz: "raz" };',
      'return React.DOM.ul(null,',
      '  (function (__obj$) {',
      '    return _(__obj$).each(function(val, $index) {',
      '      return [',
      '        React.DOM.li(null,',
      '          val',
      '        )',
      '      ];',
      '    }, this).flatten().compact().value();',
      '  }).call(this, obj)',
      ')'
    ));

    // Complex
    assert.equal(compile([
      '- var obj = { foo: "bar", baz: "raz" };',
      'ul: each key in Object.keys(obj)',
      '  li= key'
    ].join('\n')), wrap(
      'var obj = { foo: "bar", baz: "raz" };',
      'return React.DOM.ul(null,',
      '  (function (__obj$) {',
      '    return _(__obj$).each(function(key, $index) {',
      '      return [',
      '        React.DOM.li(null,',
      '          key',
      '        )',
      '      ];',
      '    }, this).flatten().compact().value();',
      '  }).call(this, Object.keys(obj))',
      ')'
    ));

    // Keys
    assert.equal(compile([
      '- var obj = { foo: "bar", baz: "raz" };',
      'ul: each val, key in obj',
      '  li #{key}: #{val}'
    ].join('\n')), wrap(
      'var obj = { foo: "bar", baz: "raz" };',
      'return React.DOM.ul(null,',
      '  (function (__obj$) {',
      '    return _(__obj$).each(function(val, key) {',
      '      return [',
      '        React.DOM.li(null,',
      '          key,',
      '          ": ",',
      '          val',
      '        )',
      '      ];',
      '    }, this).flatten().compact().value();',
      '  }).call(this, obj)',
      ')'
    ));

    // Nested
    assert.equal(compile([
      '- var users = [{ name: "tj" }]',
      'ul: each user in users',
      '  - each val, key in user',
      '    li #{key} #{val}'
    ].join('\n')), wrap(
      'var users = [{ name: "tj" }]',
      'return React.DOM.ul(null,',
      '  (function (__obj$) {',
      '    return _(__obj$).each(function(user, $index) {',
      '      return [',
      '        (function (__obj$) {',
      '          return _(__obj$).each(function(val, key) {',
      '            return [',
      '              React.DOM.li(null,',
      '                key,',
      '                " ",',
      '                val',
      '              )',
      '            ];',
      '          }, this).flatten().compact().value();',
      '        }).call(this, user)',
      '      ];',
      '    }, this).flatten().compact().value();',
      '  }).call(this, users)',
      ')'
    ));
    assert.equal(compile([
      '- var users = ["tobi", "loki", "jane"]',
      'ul: each user in users',
      '  li= user'
    ].join('\n')), wrap(
      'var users = ["tobi", "loki", "jane"]',
      'return React.DOM.ul(null,',
      '  (function (__obj$) {',
      '    return _(__obj$).each(function(user, $index) {',
      '      return [',
      '        React.DOM.li(null,',
      '          user',
      '        )',
      '      ];',
      '    }, this).flatten().compact().value();',
      '  }).call(this, users)',
      ')'
    ));

    assert.equal(compile([
      '- var users = ["tobi", "loki", "jane"]',
      'ul: for user in users',
      '  li= user'
    ].join('\n')), wrap(
      'var users = ["tobi", "loki", "jane"]',
      'return React.DOM.ul(null,',
      '  (function (__obj$) {',
      '    return _(__obj$).each(function(user, $index) {',
      '      return [',
      '        React.DOM.li(null,',
      '          user',
      '        )',
      '      ];',
      '    }, this).flatten().compact().value();',
      '  }).call(this, users)',
      ')'
    ));

    assert.equal(compile([
      '- var users = ["tobi", "loki", "jane"]',
      'ul',
      '  for user in users',
      '    li= user',
      '  else',
      '    li catz',
      '    li not found'
    ].join('\n')), wrap(
      'var users = ["tobi", "loki", "jane"]',
      'return React.DOM.ul(null,',
      '  (function (__obj$) {',
      '    var __ret$ = _(__obj$).each(function(user, $index) {',
      '      return [',
      '        React.DOM.li(null,',
      '          user',
      '        )',
      '      ];',
      '    }, this).flatten().compact().value();',
      '    if (!__ret$.length) {',
      '      return _([',
      '        React.DOM.li(null,',
      '          "catz"',
      '        ),',
      '        React.DOM.li(null,',
      '          "not found"',
      '        )',
      '      ]).flatten().compact().value()',
      '    }',
      '    return __ret$;',
      '  }).call(this, users)',
      ')'
    ));
  });

  it('should support if', function(){
    assert.equal(compile([
      '- var users = ["tobi", "loki", "jane"]',
      'div',
      '  if users.length',
      '    p users: #{users.length}'
    ].join('\n')), wrap(
      'var users = ["tobi", "loki", "jane"]',
      'return React.DOM.div(null,',
      '  ( users.length) ? [',
      '    React.DOM.p(null,',
      '      "users: ",',
      '      users.length',
      '    )',
      '  ] : ""',
      ')'
    ));

    assert.equal(compile('iframe(foo="bar")'), wrap(
      'return React.DOM.iframe({ "foo": "bar" })'
    ));
  });

  it('should support unless', function(){
    assert.equal(compile([
      '- var users = ["tobi", "loki", "jane"]',
      'div',
      '  unless users.length',
      '    p users: #{users.length}',
      '    p tobi: #{users[0]}',
    ].join('\n')), wrap(
      'var users = ["tobi", "loki", "jane"]',
      'return React.DOM.div(null,',
      '  (!( users.length)) ? [',
      '    React.DOM.p(null,',
      '      "users: ",',
      '      users.length',
      '    ),',
      '    React.DOM.p(null,',
      '      "tobi: ",',
      '      users[0]',
      '    )',
      '  ] : ""',
      ')'
    ));
  });

  it('should support else', function(){
    assert.equal(compile([
      '- var users = ["tobi", "loki", "jane"]',
      'div',
      '  if users.length',
      '    p users: #{users.length}',
      '    p tobi: #{users[0]}',
      '  else',
      '    p no users'
    ].join('\n')), wrap(
      'var users = ["tobi", "loki", "jane"]',
      'return React.DOM.div(null,',
      '  ( users.length) ? [',
      '    React.DOM.p(null,',
      '      "users: ",',
      '      users.length',
      '    ),',
      '    React.DOM.p(null,',
      '      "tobi: ",',
      '      users[0]',
      '    )',
      '  ] : [',
      '    React.DOM.p(null,',
      '      "no users"',
      '    )',
      '  ]',
      ')'
    ));
  });

  it('should else if', function(){
    assert.equal(compile([
      '- var users = ["tobi", "loki", "jane"]',
      'div',
      '  unless users.length',
      '    p users: #{users.length}',
      '    p tobi: #{users[0]}',
      '    if true',
      '      p',
      '    else',
      '      Module',
      '  else if false',
      '    p no users'
    ].join('\n')), wrap(
      'var users = ["tobi", "loki", "jane"]',
      'return React.DOM.div(null,',
      '  (!( users.length)) ? [',
      '    React.DOM.p(null,',
      '      "users: ",',
      '      users.length',
      '    ),',
      '    React.DOM.p(null,',
      '      "tobi: ",',
      '      users[0]',
      '    ),',
      '    ( true) ? [',
      '      React.DOM.p()',
      '    ] : [',
      '      Module()',
      '    ]',
      '  ] : ( false) ? [',
      '    React.DOM.p(null,',
      '      "no users"',
      '    )',
      '  ] : ""',
      ')'
    ));
  });

  it('should include block', function(){
    assert.equal(compile([
      'div',
      '  include compiler.test.jade',
      '    Module(src="/app.js")',
    ].join('\n'), { filename: __dirname + '/compiler.test.js' }), wrap(
      'return React.DOM.div(null,',
      '  React.DOM.p(null,',
      '    "foo",',
      '    Module({ "src": "/app.js" })',
      '  )',
      ')'
    ));
  });
  });
});
