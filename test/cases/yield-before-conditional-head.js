module.exports = function () {
    return React.DOM.head(null, React.DOM.script({ 'src': '/jquery.js' }), false ? React.DOM.script({ 'src': '/jquery.ui.js' }) : null);
};