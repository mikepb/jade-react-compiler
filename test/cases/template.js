module.exports = function () {
    return React.DOM.div(React.DOM.script({ 'type': 'text/x-template' }, React.DOM.article(null, React.DOM.h2(null, '{{title}}'), React.DOM.p(null, '{{description}}'))), React.DOM.script({ 'type': 'text/x-template' }, 'article' + '  h2 {{title}}' + '  p {{description}}'));
};