module.exports = function () {
    return React.DOM.html(null, React.DOM.body(null, React.DOM.head(null, React.DOM.title(null, 'My Title'), React.DOM.script({ 'src': '/jquery.js' }), React.DOM.script({ 'src': '/jquery.ui.js' }))));
};