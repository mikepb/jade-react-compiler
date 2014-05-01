module.exports = function() {
  return React.DOM.head(null, React.DOM.title(), React.DOM.script({
    src: "/jquery.js"
  }), React.DOM.script({
    src: "/jquery.ui.js"
  }));
};