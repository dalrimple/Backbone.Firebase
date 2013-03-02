define(['Firebase', 'Backbone', 'config'], function(Firebase, Backbone, config) {
	var User = Backbone.Model.extend({
		//idAttribute: 'account',
		initialize: function(options) {
			//console.log('User.initialize();', config.firebaseRoot);
		},
		defaults: {
			name: '',
			role: ''
		},
		authenticate: function(authInfo) {

			//this.data = new Firebase(config.firebaseRoot + '/users/' + json.account);

		}
	});
	return User;
});