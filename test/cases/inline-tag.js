module.exports = function() {
  return React.DOM.div(null, React.DOM.p(null, "bing ", React.DOM.strong(null, "foo"), " bong"), React.DOM.p(null, "bing", React.DOM.strong(null, "foo"), "bong"), React.DOM.p(null, "bing", React.DOM.strong(null, "foo"), "bong"), React.DOM.p(null, "#[strong escaped]\n#[", React.DOM.strong(null, "escaped")));
};