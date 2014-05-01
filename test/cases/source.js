module.exports = function() {
  return React.DOM.html(null, React.DOM.audio({
    preload: "auto",
    autobuffer: true,
    controls: true
  }, React.DOM.source({
    src: "foo"
  }), React.DOM.source({
    src: "bar"
  })));
};