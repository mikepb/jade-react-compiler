module.exports = function () {
    return React.DOM.div(React.DOM.option({ 'value': '' }, '-- (selected) --'), React.DOM.p(null, 'foo' + 'bar' + 'baz'), React.DOM.p(null, 'foo' + 'bar' + 'baz'), React.DOM.pre(null, 'foo' + '  bar' + '    baz' + '.'), React.DOM.pre(null, 'foo' + '  bar' + '    baz' + '.'));
};