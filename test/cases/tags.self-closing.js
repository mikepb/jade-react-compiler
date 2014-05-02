module.exports = function() {
  return React.DOM.body(null, React.DOM.p(), React.DOM.p({
    "data-bar": '"baz"'
  }), React.DOM.br(), React.DOM.p({
    "data-bar": '"baz"'
  }), React.DOM.br(null, "/"), React.DOM.p({
    "data-bar": '"baz"'
  }, "/"), React.DOM.img(), React.DOM.img(null, "   "));
};