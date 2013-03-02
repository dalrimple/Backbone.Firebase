define(['utils', 'Backbone'], function(utils, Backbone) {
	var Router = Backbone.Router.extend({

		routes: {
			'auth': 'auth',
			'(:par1)(/)(:par2)(/)(:par3)(/)*rest': 'main'
		},

		initialize: function(options) {
			//console.log('Router.initialize()');

			//Testing
			var that = this;
			$('#profile').click(function(e) {
				e.preventDefault();
				that.getProfile();
			});

		},
		
		auth: function() {
			console.log('Router.auth():', Backbone.history.location.hash);
			var authInfo = utils.deparam(Backbone.history.location.hash);
			this.trigger('receivedAuthData', authInfo);

			//console.log('Router.auth()', authInfo);

			return; //TESTING
			window.me = new Firebase('https://zabinskas-bss.firebaseio.com/users/' + authInfo.account);
			window.me.once('value', function(o) {console.log(o.val())});
		},

		//Testing
		getProfile: function() {
			//Log me in
			//TODO: Replace with correct functionality
			window.me.auth(window.authResponse.firebase, function(success) {
				if(success) {
					console.log("Login Successful!");
					window.me.once('value', function(o) {
						var profile = o.val();
						console.log('getProfile()', profile);
						if (profile) {
							console.log('getProfile() has profile');
						} else {
							console.log('getProfile() has no profile');
							$('#profileSave').click(function(e) {
								e.preventDefault();
								console.log('getProfile() saving');
								window.me.update({name:$('#profileName').val(), role:$('#profileRole').val()});
							})
						}
					});
				} else {
					console.log("Login Failed!");

				}
			});
			/*
			*/
		},

		main: function(par1, par2, par3, rest) {
			//console.log('Router.main():', par1, par2, par3, rest);
			var data = {};
			if (par1) {
				data[par1] = {};
				if (par2) {
					data[par1][par2] = {};
					if (par3) {
						data[par1][par2][par3] = rest ? rest : Math.random();
					} else {
						data[par1][par2] = Math.random();
					}
				} else {
					data[par1] = Math.random();
				}
			} else {
				data.default = Math.random();
			}
			this.trigger('sandbox', data);
		}

	});

	return Router;
});