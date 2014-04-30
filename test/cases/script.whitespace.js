module.exports = function () {
    return React.DOM.script(null, 'if (foo) {' + '  bar();' + '  ' + '}');
};