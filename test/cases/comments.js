module.exports = function() {
  return React.DOM.div(null, React.DOM.ul(null, React.DOM.li(null, "one"), React.DOM.li(null, "two")), React.DOM.p(null, "five"), React.DOM.div({
    className: "foo"
  }, "// not a comment"));
};