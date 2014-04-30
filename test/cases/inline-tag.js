module.exports = function () {
    return React.DOM.div(React.DOM.p(null, 'bing ', React.DOM.strong(null, 'foo'), ' bong'), React.DOM.p(null, 'bing', React.DOM.strong(null, 'foo'), 'bong'), React.DOM.p(null, 'bing', React.DOM.strong(null, 'foo'), 'bong'), React.DOM.p(null, '#[strong escaped]' + '#[', React.DOM.strong(null, 'escaped')));
};