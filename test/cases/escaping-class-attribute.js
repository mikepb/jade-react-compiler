module.exports = function() {
  return React.DOM.div(null, React.DOM.p({
    attr: "<%= bar %>"
  }), React.DOM.p({
    className: "<%= bar %>"
  }), React.DOM.p({
    attr: "<%= bar %>"
  }), React.DOM.p({
    className: "<%= bar %>"
  }), React.DOM.p({
    className: "<%= bar %> lol rofl"
  }), React.DOM.p({
    className: "<%= bar %> lol rofl <%= lmao %>"
  }));
};