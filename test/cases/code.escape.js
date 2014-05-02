module.exports = function() {
  return React.DOM.div(null, React.DOM.p(null, "<script/>"), React.DOM.p({
    dangerouslySetInnerHTML: {
      __html: "<script/>"
    }
  }));
};