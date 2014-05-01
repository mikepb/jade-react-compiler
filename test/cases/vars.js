module.exports = function() {
  var foo = "bar", list = [ 1, 2, 3 ];
  return foo = "bar", null, list = [ 1, 2, 3 ], null, React.DOM.a({
    id: foo,
    className: list
  });
};