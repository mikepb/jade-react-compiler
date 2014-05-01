module.exports = function() {
  return React.DOM.head(null, React.DOM.script({
    type: "text/javascript"
  }, "alert('hello world');"));
};