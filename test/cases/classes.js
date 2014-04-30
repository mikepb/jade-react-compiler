module.exports = function () {
    return React.DOM.div(React.DOM.a({
        className: [
            'foo',
            'bar',
            'baz'
        ]
    }), React.DOM.a({ className: 'foo' + 'bar' + 'baz' }), React.DOM.a({ className: 'foo-bar_baz' }));
};