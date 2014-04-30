module.exports = function () {
    return React.DOM.body(null, foo(null), foo({ 'bar': 'baz' }), foo(null), foo({ 'bar': 'baz' }), foo(null, '/'), foo({ 'bar': 'baz' }, '/'), React.DOM.img(null), React.DOM.img(null, '   '));
};