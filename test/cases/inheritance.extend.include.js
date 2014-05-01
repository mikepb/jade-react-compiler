module.exports = function() {
  return React.DOM.html(null, React.DOM.head(null, React.DOM.title(null, "My Application"), React.DOM.script({
    src: "jquery.js"
  })), React.DOM.body(null, React.DOM.h2(null, "Page"), React.DOM.p(null, "Some content"), React.DOM.div({
    className: "window"
  }, React.DOM.a({
    href: "#",
    className: "close"
  }, "Close"), React.DOM.h2(null, "Awesome"), React.DOM.p(null, "Now we can extend included blocks!"))));
};