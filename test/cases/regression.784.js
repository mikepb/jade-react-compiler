module.exports = function() {
  var url;
  return url = "http://www.google.com", null, React.DOM.div({
    className: "url"
  }, url.replace("http://", "").replace(/^www\./, ""));
};