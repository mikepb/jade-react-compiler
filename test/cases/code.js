module.exports = function () {
    return React.DOM.div(React.DOM.p(null, null), React.DOM.p(null, undefined), React.DOM.p(null, ''), React.DOM.p(null, 0), React.DOM.p(null, false), React.DOM.p({ 'foo': null }), React.DOM.p({ 'foo': undefined }), React.DOM.p({ 'foo': '' }), React.DOM.p({ 'foo': 0 }), React.DOM.p({ 'foo': false }));
};