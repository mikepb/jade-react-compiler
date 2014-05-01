module.exports = function() {
  return React.DOM.div(null, React.DOM.p(null, "<script/>"), React.DOM.p(null, React.DOM.text({
    dangerouslySetInnerHTML: {
      __html: "<script/>"
    }
  })));
};