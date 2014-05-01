module.exports = function() {
  return React.DOM.div(null, React.DOM.p(null, "foo"), React.DOM.p(null, "foo"), React.DOM.div(null, React.DOM.p(null, "foo"), React.DOM.p(null, "bar"), React.DOM.p(null, "baz")), React.DOM.p(null, "bar"), React.DOM.p(null, "yay"), React.DOM.div({
    className: "bar"
  }), React.DOM.div({
    className: "bar"
  }), React.DOM.div({
    className: "bing"
  }));
};