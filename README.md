# Jade React Compiler

```js
var compile = require('jade-react-compiler');
var fn = compile('p foobar');

// compiles to
(function () {
return React.DOM.p(null,
  "foobar"
)
})
```

Use it in your favourite packaging tool.

## Usage notes

To use loops in the browser, lodash or underscore is required.

A single root element is required. Code blocks must come before the root element.

Filters, mixins, and other things not yet implemented.

## License

Apache 2.0
