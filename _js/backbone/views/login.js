define(['Backbone', 'LoginModel'], function(Backbone, LoginModel) {
	var LoginView = Backbone.View.extend({
		el: '#login',
		events: {
			'click .twitter': 'login'
		},
		initialize: function() {
			//console.log('LoginView.initialize()', this);
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'invalid', this.invalidListener);
		},
		login: function() {

		},
		render: function() {
			console.log('LoginView.render()', this.model);
		},

		invalidListener: function(model, error) {
			console.log('LoginView.invalidListener()', error);
			this.$el.find('.errors').html(error);
		}
	});
	return LoginView;
});