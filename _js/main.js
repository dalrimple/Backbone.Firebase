requirejs.config({
	//By default load any module IDs from the baseURL:
	//This isn't strictly necessary as this url in inferred by the data-main value of the require.js script tag
	baseUrl: '/_js', 

	paths: {
			//Major libraries
			'jQuery': '//cdnjs.cloudflare.com/ajax/libs/jquery/1.9.0/jquery.min',
			'Underscore': '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.3/underscore-min',
			//'Backbone': '//cdnjs.cloudflare.com/ajax/libs/backbone.js/0.9.10/backbone-min',
			'Backbone': 'libs/backbone',

			//Firebase hosted SaaS backend
			'Firebase': 'https://cdn.firebase.com/v0/firebase',

			//Firebase extensions
			'BackboneFirebase': 'backbone/Backbone.Firebase',
			//'syncOverride': 'backbone/sync',

			//Backbone modules
			'LoginModel': 'backbone/models/login',
			'UserModel': 'backbone/models/user',
			'SandboxModel': 'backbone/models/sandbox',
			'SandboxCollection': 'backbone/collections/sandboxes',
			'Router': 'backbone/routers/router',
			'LoginView': 'backbone/views/login',
			'SandboxView': 'backbone/views/sandbox',
			'SandboxesView': 'backbone/views/sandboxes',
			//Miscellaneous
			'config': 'config',
			'utils': 'utils'
	},

	//These libraries don't follow AMD structures so the dependencies and exports value needs to be explicit
	shim: {
		'Backbone': {
			deps: ['jQuery', 'Underscore'],
			exports: 'Backbone'
		},
		'Firebase': {
			exports: 'Firebase'
		}
	}
});

require(['utils',
				 'Firebase',
				 'Backbone',
				 'BackboneFirebase',
				 //'syncOverride',
				 'LoginModel',
				 'UserModel',
				 'SandboxModel',
				 'SandboxCollection',
				 'Router',
				 'LoginView',
				 'SandboxView',
				 'SandboxesView'],
	function(utils,
					 Firebase,
					 Backbone,
					 BackboneFirebase,
					 //syncOverride,
					 LoginModel,
					 UserModel,
					 SandboxModel,
					 SandboxCollection,
					 Router,
					 LoginView,
					 SandboxView,
					 SandboxesView)
	{	
		utils.safeConsole();
		//syncOverride();

		//TODO: Remove dependency on load order by using an event based data routing system
		
		//Router (First. The router can trigger events that are listened to by models and views)
		var router = new Router({});
		
		//Models (Second. They listen for events from the Router)
		var user = new UserModel({});
		var login = new LoginModel({});

		//Collections (Third. They're made up of models)
		
		//Views (Last. They listen to model & router events. They change models and trigger route navigation)
		var loginView = new LoginView({
			model: login,
			router: router
		});

		//Set up some listeners:
		login.listenTo(router, 'receivedAuthData', login.authDataListener);
		
		var sandboxModel = new SandboxModel({}, {
			id:'b'
		});
		var sandboxView = new SandboxView({
			model: sandboxModel,
			el: '#sandbox'
		});

		/*
		var sandboxCollection = new SandboxCollection([], {});
		var sandboxesView = new SandboxesView({
			collection: sandboxCollection
		})
		*/

		sandboxModel.listenTo(router, 'sandbox', sandboxModel.setData);;


		//Start the app
		Backbone.history.start({pushState: true});
	}
);

