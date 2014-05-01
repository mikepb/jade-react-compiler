module.exports = function() {
  return React.DOM.ul(null, React.DOM.li({
    className: "list-item"
  }, React.DOM.div({
    className: "foo"
  }, React.DOM.div({
    id: "bar"
  }, "baz"))));
};