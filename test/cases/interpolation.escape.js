module.exports = function() {
  var id = 42;
  return id = 42, null, foo(null, "some\n#{text}\nhere\nMy ID ", "is {" + id + "}");
};