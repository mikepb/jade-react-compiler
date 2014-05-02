module.exports = function() {
  var users = [], users = [ {
    name: "tobi",
    friends: [ "loki" ]
  }, {
    name: "loki"
  } ], user = {
    name: "tobi",
    age: 10
  }, user = {}, user = Object.create(null);
  return React.DOM.div(null, (users = [], null), React.DOM.ul(null, ǃmap＿(users, function(user, $index) {
    ǃDOM＿(li, null);
    ǃtext＿(user.name);
  }, function() {
    ǃDOM＿(li, null);
    ǃtext＿("no users!");
  })), (users = [ {
    name: "tobi",
    friends: [ "loki" ]
  }, {
    name: "loki"
  } ], null), users ? React.DOM.ul(null, ǃmap＿(users, function(user, $index) {
    ǃDOM＿(li, null);
    ǃtext＿(user.name);
  }, function() {
    ǃDOM＿(li, null);
    ǃtext＿("no users!");
  })) : null, (user = {
    name: "tobi",
    age: 10
  }, null), React.DOM.ul(null, ǃmap＿(user, function(val, key) {
    ǃDOM＿(li, null);
    key;
    ǃtext＿(": ");
    val;
  }, function() {
    ǃDOM＿(li, null);
    ǃtext＿("user has no details!");
  })), (user = {}, null), React.DOM.ul(null, ǃmap＿(user, function(prop, key) {
    ǃDOM＿(li, null);
    key;
    ǃtext＿(": ");
    val;
  }, function() {
    ǃDOM＿(li, null);
    ǃtext＿("user has no details!");
  })), React.DOM.ul(null, ǃmap＿(user, function(prop, key) {
    ǃDOM＿(li, null);
    key;
    ǃtext＿(": ");
    val;
  }, function() {
    ǃDOM＿(li, null);
    ǃtext＿("user has no details!");
  })), (user = Object.create(null), null), user.name = "tobi", React.DOM.ul(null, ǃmap＿(user, function(val, key) {
    ǃDOM＿(li, null);
    key;
    ǃtext＿(": ");
    val;
  }, function() {
    ǃDOM＿(li, null);
    ǃtext＿("user has no details!");
  })));
};
function ǃmap＿(obj, each, alt) {
  if (typeof obj.length === 'number') return [].map.call(obj, each);
  var result = [], key;
  for (key in obj) result.push(each(obj[key], key));
  return !alt || result.length ? result : alt();
}