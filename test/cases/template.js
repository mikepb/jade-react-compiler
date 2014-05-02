module.exports = function() {
  return React.DOM.div(null, React.DOM.script({
    type: "text/x-template"
  }, React.DOM.article(null, React.DOM.h2(null, "{{title}}"), React.DOM.p(null, "{{description}}"))), React.DOM.script({
    type: "text/x-template"
  }, "article\n  h2 {{title}}\n  p {{description}}"));
};