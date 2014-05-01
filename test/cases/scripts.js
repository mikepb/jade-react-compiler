module.exports = function() {
  return React.DOM.script(null, "if (foo) {\n  bar();\n}"), React.DOM.script(null, React.DOM.text({
    dangerouslySetInnerHTML: {
      __html: "foo()"
    }
  })), React.DOM.script(null, "foo()"), React.DOM.script(), React.DOM.div();
};