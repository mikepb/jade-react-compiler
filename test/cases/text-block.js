module.exports = function() {
  return React.DOM.div(null, React.DOM.label(null, "Username:", React.DOM.input({
    type: "text",
    name: "user[name]"
  })), React.DOM.label(null, "Password:", React.DOM.input({
    type: "text",
    name: "user[pass]"
  })));
};