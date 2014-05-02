module.exports = function() {
  var users, user;
  return React.DOM.div(null, (users = [], React.DOM.ul(null, ǃmap＿(users, function(user, $index) {
    return React.DOM.li(null, user.name);
  }, function() {
    return React.DOM.li(null, "no users!");
  }))), (users = [ {
    name: "tobi",
    friends: [ "loki" ]
  }, {
    name: "loki"
  } ], users ? React.DOM.ul(null, ǃmap＿(users, function(user, $index) {
    return React.DOM.li(null, user.name);
  }, function() {
    return React.DOM.li(null, "no users!");
  })) : null), (user = {
    name: "tobi",
    age: 10
  }, React.DOM.ul(null, ǃmap＿(user, function(val, key) {
    return React.DOM.li(null, key, ": ", val);
  }, function() {
    return React.DOM.li(null, "user has no details!");
  }))), (user = {}, React.DOM.ul(null, ǃmap＿(user, function(prop, key) {
    return React.DOM.li(null, key, ": ", val);
  }, function() {
    return React.DOM.li(null, "user has no details!");
  }))), React.DOM.ul(null, ǃmap＿(user, function(prop, key) {
    return React.DOM.li(null, key, ": ", val);
  }, function() {
    return React.DOM.li(null, "user has no details!");
  })), (user = Object.create(null), user.name = "tobi"), React.DOM.ul(null, ǃmap＿(user, function(val, key) {
    return React.DOM.li(null, key, ": ", val);
  }, function() {
    return React.DOM.li(null, "user has no details!");
  })));
};
function ǃmap＿(obj, each, alt) {
  if (typeof obj.length === 'number') return [].map.call(obj, each);
  var result = [], key;
  for (key in obj) result.push(each(obj[key], key));
  return !alt || result.length ? result : alt();
}