module.exports = function() {
  return React.DOM.div(null, React.DOM.a({
    className: "foo bar baz"
  }), React.DOM.a({
    className: "foo bar baz"
  }), React.DOM.a({
    className: "foo-bar_baz"
  }));
};