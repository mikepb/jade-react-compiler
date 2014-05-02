module.exports = function() {
  return React.DOM.div(null, React.DOM.p({
    className: "first prepend"
  }, "Last prepend must appear at top"), React.DOM.p({
    className: "first prepend"
  }, "Something prepended to content"), React.DOM.div({
    className: "content"
  }, "Defined content"), React.DOM.p({
    className: "first append"
  }, "Something appended to content"), React.DOM.p({
    className: "last append"
  }, "Last append must be most last"), React.DOM.script({
    src: "foo.js"
  }), React.DOM.script({
    src: "/app.js"
  }), React.DOM.script({
    src: "jquery.js"
  }));
};