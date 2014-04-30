module.exports = function () {
    return React.DOM.html(null, React.DOM.head(null, React.DOM.script({ 'src': 'jquery.js' }), React.DOM.script({ 'src': 'keymaster.js' }), React.DOM.script({ 'src': 'caustic.js' })));
};