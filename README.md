# Jade React Compiler

Use it in your favourite packaging tool.

```js
var React = require('react');
var jact = require('jade-react-compiler');

// Compile to code

var js = jact.compileClient('p foobar');

/* Output:
module.exports = function () {
  return React.DOM.p(null, 'foobar');
};
*/

// Compile to function

var fn = jact.compile('p foobar');
var Component = React.createClass({ render: fn });
var markup = React.renderComponentToStaticMarkup(new Component());

/* Output:
<p>foobar</p>
*/
```


## Usage notes

If there are more than one root nodes, only the last statement is
returned. Same for block statements.

Using `forEach` in code instead of the `each` block will output
nothing (`forEach` returns nothing).

Filters, mixins, cases and other things not yet implemented.

Inteded to be used as part of a compilation toolchain and not
optimized for production use. Compile the files to JavaScript first,
then `require()` them as usual.


### Special case for using `require`

There is a special case for using `require` that will hoist the
declaration to the top of the generated CommonJS module:

Jade:
```jade
- const MyComponent = require('components/my-component')
div
  if MyComponent
    MyComponent This is a custom component.
  else
    | No component!
```

Generated JavaScript:
```js
var MyComponent = require("components/my-component");

module.exports = function() {
  return React.DOM.div(null, MyComponent ? MyComponent(null, "This is a custom component.") : "No component!");
};
```

Example using the command line tool:

```bash
$ ./bin/jade-react-compiler.js -cP <<EOL
> - const MyComponent = require('components/my-component')
> div
>   if MyComponent
>     MyComponent This is a custom component.
>   else
>     | No component!
> EOL
var MyComponent = require("components/my-component");

module.exports = function() {
  return React.DOM.div(null, MyComponent ? MyComponent(null, "This is a custom component.") : "No component!");
};
```


## Differences from Jade

React considers values of `false` to be empty, so they won't be rendered.

If you render a naked text node without a parent node, it will be wrapped in
a `<span>`.


## Implementation details

1.  Use Jade to parse the input to Jade AST.
2.  Compile the AST to an intermediate JavaScript format.
3.  Parse the intermediate JavaScript to
    [SpiderMonkey AST][spidermonkey_ast] using [Esprima][esprima].
4.  Rectify the SpiderMonkey AST to produce a JavaScript `render()`
    function for use with React.
5.  Use [UglifyJS][uglifyjs] to clean up the AST and produce sensible
    JavaScript.


## License

MIT

[esprima]: http://esprima.org
[spidermonkey_ast]: https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
[uglifyjs]: http://lisperator.net/uglifyjs
