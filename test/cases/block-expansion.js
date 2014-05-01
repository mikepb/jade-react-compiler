module.exports = function() {
  return React.DOM.div(null, React.DOM.ul(null, React.DOM.li(null, React.DOM.a({
    href: "#"
  }, "foo")), React.DOM.li(null, React.DOM.a({
    href: "#"
  }, "bar"))), React.DOM.p(null, "baz"));
};