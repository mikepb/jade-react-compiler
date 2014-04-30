module.exports = function () {
    return React.DOM.div(React.DOM.script(null, 'if (foo) {' + '  bar();' + '}'), React.DOM.script(null, React.DOM.text({ dangerouslySetInnerHTML: { __html: 'foo()' } })), React.DOM.script(null, 'foo()'), React.DOM.script(null), React.DOM.div(null));
};