module.exports = function() {
  var txt = '<param name="flashvars" value="a=&quot;value_a&quot;&b=&quot;value_b&quot;&c=3"/>';
  return React.DOM.html(null, React.DOM.head(null, React.DOM.title(null, "escape-test")), React.DOM.body(null, React.DOM.textarea(null, (txt = '<param name="flashvars" value="a=&quot;value_a&quot;&b=&quot;value_b&quot;&c=3"/>', 
  txt))));
};