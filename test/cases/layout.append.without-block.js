module.exports = function () {
    return React.DOM.html(null, React.DOM.script({ 'src': 'vendor/jquery.js' }), React.DOM.script({ 'src': 'vendor/caustic.js' }), React.DOM.script({ 'src': 'app.js' }), React.DOM.script({ 'src': 'foo.js' }), React.DOM.script({ 'src': 'bar.js' }), React.DOM.body(null));
};