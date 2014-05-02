module.exports = function() {
  return React.DOM.div(null, React.DOM.pre(null, "foo\nbar\nbaz\n"), React.DOM.pre(null, React.DOM.code(null, "foo\nbar\nbaz")));
};