module.exports = function() {
  return React.DOM.div(null, React.DOM.script(null, "if (foo) {\n  bar();\n}"), React.DOM.script({
    dangerouslySetInnerHTML: {
      __html: "foo()"
    }
  }), React.DOM.script(null, "foo()"), React.DOM.script(), React.DOM.div());
};