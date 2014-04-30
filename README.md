# Jade React Compiler

```js
var React = require('react');
var jact = require('jade-react-compiler');

// Compile to code

var js = jact.compileClient('p foobar');
/*
module.exports = function () {
    return React.DOM.p(null, 'foobar');
};
*/

// Compile to function

var fn = jact.compile('p foobar');
var Component = React.createClass({ render: fn });
var markup = React.renderComponentToStaticMarkup(new Component());
console.log(markup)
/*
<p>foobar</p>
*/
```

Use it in your favourite packaging tool.

## Usage notes

To use loops in the browser, lodash or underscore is required.

A single root element is required. Code blocks must come before the root element.

Filters, mixins, and other things not yet implemented.

## License

MIT
