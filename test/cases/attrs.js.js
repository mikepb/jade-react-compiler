module.exports = function () {
    function answer() {
        return 42;
    }
    var id, bar;
    return React.DOM.div((id = 5, React.DOM.a({
        'href': '/user/' + id,
        className: 'button'
    })), React.DOM.a({
        'href': '/user/' + id,
        className: 'button'
    }), React.DOM.meta({
        'data-key': 'answer',
        'value': answer()
    }), React.DOM.a({
        className: [
            'class1',
            'class2'
        ]
    }), React.DOM.a({
        className: 'tag-class' + [
            'class1',
            'class2'
        ]
    }), React.DOM.a({
        'href': '/user/' + id,
        className: 'button'
    }), React.DOM.a({
        'href': '/user/' + id,
        className: 'button'
    }), React.DOM.meta({
        'data-key': 'answer',
        'value': answer()
    }), React.DOM.a({
        className: [
            'class1',
            'class2'
        ]
    }), React.DOM.a({
        className: 'tag-class' + [
            'class1',
            'class2'
        ]
    }), React.DOM.div(ǃattrs＿({ 'id': id }, { foo: 'bar' })), (bar = null, React.DOM.div(ǃattrs＿({
        'foo': null,
        'bar': bar
    }, { baz: 'baz' }))));
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