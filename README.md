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

If there are more than one root nodes, only the last statement is returned. Same for block statements.

Using `forEach` in code instead of the `each` block will output nothing (`forEach` returns nothing).

Filters, mixins, cases and other things not yet implemented.

Inteded to be used as part of a compilation toolchain and not optimized for production use. Compile the files to JavaScript first, then `require()` them as usual.

## Differences from Jade

React considers values of `false` to be empty, so they won't be rendered.

## License

MIT
