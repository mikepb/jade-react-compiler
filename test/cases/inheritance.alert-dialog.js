module.exports = function () {
    return React.DOM.div({ className: 'window' }, React.DOM.a({
        'href': '#',
        className: 'close'
    }, 'Close'), React.DOM.div({ className: 'dialog' }, React.DOM.h1(null, 'Alert!'), React.DOM.p(null, 'I\'m an alert!')));
};