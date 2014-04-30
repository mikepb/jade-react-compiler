module.exports = function () {
    return React.DOM.head(null, React.DOM.title(null), React.DOM.script({ 'src': '/jquery.js' }), React.DOM.script({ 'src': '/jquery.ui.js' }));
};