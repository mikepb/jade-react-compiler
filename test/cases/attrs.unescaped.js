module.exports = function() {
  return React.DOM.script({
    type: "text/x-template"
  }, React.DOM.div({
    id: "user-<%= user.id %>"
  }, React.DOM.h1(null, "<%= user.title %>")));
};