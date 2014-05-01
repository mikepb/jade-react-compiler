module.exports = function() {
  return React.DOM.body(null, foo(), foo({
    bar: "baz"
  }), foo(), foo({
    bar: "baz"
  }), foo(null, "/"), foo({
    bar: "baz"
  }, "/"), React.DOM.img(), React.DOM.img(null, "   "));
};