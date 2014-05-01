module.exports = function() {
  return React.DOM.div(null, React.DOM.p(), React.DOM.p(null, void 0), React.DOM.p(null, ""), React.DOM.p(null, 0), React.DOM.p(null, false), React.DOM.p(), React.DOM.p({
    "data-foo": JSON.stringify(void 0)
  }), React.DOM.p({
    "data-foo": '""'
  }), React.DOM.p({
    "data-foo": "0"
  }), React.DOM.p({
    "data-foo": "false"
  }));
};