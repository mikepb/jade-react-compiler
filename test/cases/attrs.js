module.exports = function () {
    var attrs;
    return React.DOM.div(React.DOM.a({ 'href': '/contact' }, 'contact'), React.DOM.a({
        'href': '/save',
        className: 'button'
    }, 'save'), React.DOM.a({
        'data-foo': true,
        'data-bar': true,
        'baz': true
    }), React.DOM.a({
        'data-foo': 'foo, bar, baz',
        'data-bar': 1
    }), React.DOM.a({
        'data-foo': '((foo))',
        'data-bar': 1 ? 1 : 0
    }), React.DOM.select({ 'value': 'foo' }, React.DOM.option({ 'value': 'foo' }, 'Foo'), React.DOM.option({ 'value': 'bar' }, 'Bar')), React.DOM.select({ 'value': 'bar' }, React.DOM.option({ 'value': 'foo' }, 'Foo'), React.DOM.option({ 'value': 'bar' }, 'Bar')), React.DOM.a({ 'data-foo': 'class:' }), React.DOM.input({ 'pattern': '\\S+' }), React.DOM.a({ 'href': '/contact' }, 'contact'), React.DOM.a({
        'href': '/save',
        className: 'button'
    }, 'save'), React.DOM.a({
        'data-foo': true,
        'data-bar': true,
        'data-baz': true
    }), React.DOM.a({
        'data-foo': 'foo, bar, baz',
        'data-bar': 1
    }), React.DOM.a({
        'data-foo': '((foo))',
        'data-bar': 1 ? 1 : 0
    }), React.DOM.select({ 'value': 'foo' }, React.DOM.option({ 'value': 'foo' }, 'Foo'), React.DOM.option({ 'value': 'bar' }, 'Bar')), React.DOM.select({ 'value': 'bar' }, React.DOM.option({ 'value': 'foo' }, 'Foo'), React.DOM.option({ 'value': 'bar' }, 'Bar')), React.DOM.a({ 'data-foo': 'class:' }), React.DOM.input({ 'pattern': '\\S+' }), foo({ 'terse': 'true' }), (attrs = {
        'data-foo': 'bar',
        'data-bar': '<baz>'
    }, React.DOM.div(ǃattrs＿(attrs))));
};
function ǃattrs＿() {
  var classes = [];
  var attrs = {};
  [].slice.call(arguments).forEach(function (it) {
    for (var key in it) {
      switch (key) {
        case 'class':
        case 'className':
          classes.push(it[key]);
          return;
        case 'for':
          key = 'htmlFor';
          break;
        default:
          if (/^(data|aria)-/.test(key)) break;
          key = key.split('-');
          key = key[0] + key.slice(1).map(function (it) {
            return it.charAt(0).toUpperCase() + it.substr(1);
          }).join('');
      }
      attrs[key] = it[key];
    }
  });
  if (classes.length) attrs.className = classes.join(' ');
  return attrs;
}