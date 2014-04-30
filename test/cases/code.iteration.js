module.exports = function () {
    var items, items, nums, letters, count, counter;
    return React.DOM.div((items = [
        1,
        2,
        3
    ], React.DOM.ul(null, items.forEach(function (item) {
        {
            ǃDOM＿(li, null);
            {
                ǃtext＿(item);
            }
        }
    }))), (items = [
        1,
        2,
        3
    ], React.DOM.ul(null)), React.DOM.ul(null), React.DOM.ul(null), (nums = [
        1,
        2,
        3
    ], (letters = [
        'a',
        'b',
        'c'
    ], null)), React.DOM.ul(null), (count = 1, (counter = function () {
        return [
            count++,
            count++,
            count++
        ];
    }, null)), React.DOM.ul(null));
};
function ǃmap＿(obj, each, alt) {
  if (typeof obj.length === 'number') return [].map.call(obj, each);
  var result = [], key;
  for (key in obj) result.push(each(obj[key], key));
  return !alt || result.length ? result : alt();
}