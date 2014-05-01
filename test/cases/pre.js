module.exports = function() {
  return React.DOM.pre(null, "foo\nbar\nbaz"), React.DOM.pre(null, React.DOM.code(null, "foo\nbar\nbaz"));
};