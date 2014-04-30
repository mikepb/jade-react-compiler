module.exports = function () {
    return React.DOM.html(null, React.DOM.head(null, React.DOM.script({ 'type': 'text/javascript' }, 'alert(\'hello world\');'), React.DOM.script({ 'src': '/caustic.js' }), React.DOM.script({ 'src': '/app.js' })));
};