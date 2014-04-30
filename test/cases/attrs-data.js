module.exports = function () {
    var user;
    return React.DOM.div((user = { name: 'tobi' }, React.DOM.p({ 'data-user': user })), React.DOM.p({
        'data-items': [
            1,
            2,
            3
        ]
    }), React.DOM.p({ 'data-username': 'tobi' }), React.DOM.p({ 'data-escaped': { message: 'Let\'s rock!' } }));
};
