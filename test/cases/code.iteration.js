module.exports = function() {
  var items, nums, letters, count, counter;
  return React.DOM.div(null, (items = [ 1, 2, 3 ], React.DOM.ul(null, items.map(function(item) {
    return React.DOM.li(null, item);
  }))), (items = [ 1, 2, 3 ], React.DOM.ul(null, ǃmap＿(items, function(item, i) {
    return React.DOM.li({
      className: "item-" + i
    }, item);
  }))), React.DOM.ul(null, ǃmap＿(items, function(item, i) {
    return React.DOM.li(null, item);
  })), React.DOM.ul(null, ǃmap＿(items, function($item, $index) {
    return React.DOM.li(null, $item);
  })), (nums = [ 1, 2, 3 ], letters = [ "a", "b", "c" ], React.DOM.ul(null, ǃmap＿(letters, function(l, $index) {
    return ǃmap＿(nums, function(n, $index) {
      return React.DOM.li(null, n, ": ", l);
    });
  }))), (count = 1, counter = function() {
    return [ count++, count++, count++ ];;
  }, React.DOM.ul(null, ǃmap＿(counter(), function(n, $index) {
    return React.DOM.li(null, n);
  }))));
};
function ǃmap＿(obj, each, alt) {
  if (typeof obj.length === 'number') return [].map.call(obj, each);
  var result = [], key;
  for (key in obj) result.push(each(obj[key], key));
  return !alt || result.length ? result : alt();
}