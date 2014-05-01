module.exports = function() {
  return React.DOM.html(null, React.DOM.head(null, React.DOM.title()), React.DOM.body(null, React.DOM.h1(null, "Page"), React.DOM.div({
    id: "content"
  }, React.DOM.div({
    id: "content-wrapper"
  }, React.DOM.p(null, "some content"), React.DOM.p(null, "and some more"))), React.DOM.div({
    id: "footer"
  }, stuff())));
};