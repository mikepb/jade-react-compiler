module.exports = function() {
  return React.DOM.script({
    id: "pet-template",
    type: "text/x-template"
  }, React.DOM.div({
    className: "pet"
  }, React.DOM.h1(null, "{{name}}"), React.DOM.p(null, "{{name}} is a {{species}} that is {{age}} old")));
};