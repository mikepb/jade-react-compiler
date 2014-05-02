module.exports = function() {
  var id;
  return React.DOM.div(null, (id = 5, React.DOM.a({
    href: "/user/" + id
  })), React.DOM.p({
    "data-bar": '"stuff #{here} yup"'
  }));
};