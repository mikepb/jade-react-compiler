module.exports = function() {
  function answer() {
    return 42;
  }
  var id = 5, bar = null;
  return React.DOM.div(null, (id = 5, React.DOM.a({
    href: "/user/" + id,
    className: "button"
  })), React.DOM.a({
    href: "/user/" + id,
    className: "button"
  }), React.DOM.meta({
    "data-key": '"answer"',
    value: answer()
  }), React.DOM.a({
    className: "class1 class2"
  }), React.DOM.a({
    className: "tag-class class1 class2"
  }), React.DOM.a({
    href: "/user/" + id,
    className: "button"
  }), React.DOM.a({
    href: "/user/" + id,
    className: "button"
  }), React.DOM.meta({
    "data-key": '"answer"',
    value: answer()
  }), React.DOM.a({
    className: "class1 class2"
  }), React.DOM.a({
    className: "tag-class class1 class2"
  }), React.DOM.div(ǃattrs＿({
    id: id
  }, {
    "data-foo": "bar"
  })), (bar = null, React.DOM.div(ǃattrs＿({
    "data-bar": bar
  }, {
    "data-baz": "baz"
  }))));
};
function ǃattrs＿() {
  var classes = [];
  var attrs = {};
  [].slice.call(arguments).forEach(function (it) {
    for (var key in it) {
      var val = it[key];
      switch (key) {
        case 'class':
        case 'className':
          classes.push(val);
          return;
        case 'for':
          key = 'htmlFor';
          break;
        default:
          if (key.indexOf('data-') === 0) {
            if (val == null) return;
            val = JSON.stringify(val);
            break;
          }
          if (key.indexOf('aria-') === 0) break;
          key = key.split('-');
          key = key[0] + key.slice(1).map(function (it) {
            return it.charAt(0).toUpperCase() + it.substr(1);
          }).join('');
      }
      attrs[key] = val;
    }
  });
  if (classes.length) attrs.className = ǃclass＿.apply(null, classes);
  return attrs;
}