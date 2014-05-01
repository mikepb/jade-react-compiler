module.exports = function() {
  var items = [ 1, 2, 3 ], items = [ 1, 2, 3 ], nums = [ 1, 2, 3 ], letters = [ "a", "b", "c" ], count = 1, counter = function() {
    return [ count++, count++, count++ ];
  };
  return React.DOM.div(null, (items = [ 1, 2, 3 ], null), React.DOM.ul(null, items.forEach(function(item) {
    ǃDOM＿(li, null);
    ǃtext＿(item);
  })), (items = [ 1, 2, 3 ], null), React.DOM.ul(null, ǃmap＿(items, function(item, i) {
    ǃDOM＿(li, {
      className: "item-" + i
    });
    ǃtext＿(item);
  })), React.DOM.ul(null, ǃmap＿(items, function(item, i) {
    ǃDOM＿(li, null);
    ǃtext＿(item);
  })), React.DOM.ul(null, ǃmap＿(items, function($item, $index) {
    ǃDOM＿(li, null);
    ǃtext＿($item);
  })), (nums = [ 1, 2, 3 ], null), (letters = [ "a", "b", "c" ], null), React.DOM.ul(null, ǃmap＿(letters, function(l, $index) {
    ǃmap＿(nums, function(n, $index) {
      ǃDOM＿(li, null);
      ǃtext＿("n: l");
    });
  })), (count = 1, null), (counter = function() {
    return [ count++, count++, count++ ];
  }, null), React.DOM.ul(null, ǃmap＿(counter(), function(n, $index) {
    ǃDOM＿(li, null);
    ǃtext＿("n");
  })));
};
function ǃmap＿(obj, each, alt) {
  if (typeof obj.length === 'number') return [].map.call(obj, each);
  var result = [], key;
  for (key in obj) result.push(each(obj[key], key));
  return !alt || result.length ? result : alt();
}