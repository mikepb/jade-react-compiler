module.exports = function () {
    return React.DOM.div(foo({ 'attr': '<%= bar %>' }), foo({ className: '<%= bar %>' }), foo({ 'attr': '<%= bar %>' }), foo({ className: '<%= bar %>' }), foo({ className: '<%= bar %> lol rofl' }), foo({ className: '<%= bar %> lol rofl <%= lmao %>' }));
};