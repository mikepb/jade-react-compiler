module.exports = function () {
    var id;
    return React.DOM.div((id = 5, React.DOM.a({ 'href': '/user/' + id + '' })), foo({ 'bar': 'stuff #{here} yup' }));
};