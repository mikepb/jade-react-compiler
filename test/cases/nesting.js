module.exports = function() {
  return React.DOM.ul(null, React.DOM.li(null, "a"), React.DOM.li(null, "b"), React.DOM.li(null, React.DOM.ul(null, React.DOM.li(null, "c"), React.DOM.li(null, "d"))), React.DOM.li(null, "e"));
};