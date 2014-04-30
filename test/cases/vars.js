module.exports = function () {
    var foo, list;
    return (foo = 'bar', null), (list = [
        1,
        2,
        3
    ], null), React.DOM.a({
        'id': foo,
        className: list
    });
};