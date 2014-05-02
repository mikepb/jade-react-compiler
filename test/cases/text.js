module.exports = function() {
  return React.DOM.div(null, React.DOM.option({
    value: ""
  }, "-- (selected) --"), React.DOM.p(null, "foo\nbar\nbaz"), React.DOM.p(null, "foo\n\n\nbar\nbaz\n"), React.DOM.pre(null, "foo\n  bar\n    baz\n."), React.DOM.pre(null, "foo\n  bar\n    baz\n."));
};