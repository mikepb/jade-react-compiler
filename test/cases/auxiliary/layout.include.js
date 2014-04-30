module.exports = function () {
    return React.DOM.html(null, React.DOM.head(null, React.DOM.title(null, 'My Application')), React.DOM.body(null, React.DOM.div({ className: 'window' }, React.DOM.a({
        'href': '#',
        className: 'close'
    }, 'Close'))));
};