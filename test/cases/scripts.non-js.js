module.exports = function() {
  return React.DOM.div(null, React.DOM.script({
    id: "user-template",
    type: "text/template"
  }, React.DOM.div({
    id: "user"
  }, React.DOM.h1(null, "<%= user.name %>"), React.DOM.p(null, "<%= user.description %>"))), React.DOM.script({
    id: "user-template",
    type: "text/template"
  }, "if (foo) {\n  bar();\n}"));
};