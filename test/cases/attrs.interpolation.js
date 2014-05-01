module.exports = function() {
  var id = 5;
  return React.DOM.div(null, (id = 5, null), React.DOM.a({
    href: "/user/" + id
  }), React.DOM.p({
    "data-bar": '"stuff #{here} yup"'
  }));
};