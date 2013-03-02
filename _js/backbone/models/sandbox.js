define(['config', 'Backbone'], function(config, Backbone) {
	
	var SandboxModel = Backbone.Model.extend({
		//urlRoot: config.firebaseRoot + '/sandbox/',
		//id: '-InX4zQ6FWshbN38YxN8',

		initialize: function(attributes, options) {
			if (this.collection === void 0) this.urlRoot = config.firebaseRoot + '/sandbox/';
			this.id = options.id; // Required as there is not an id value in the passed attributes 
			//console.log('SandboxModel.initialize()', this.attributes, this.id);

			//this.on('all', this.showAttr);
			this.on('error', this.errorListener);
			//this.on('change', this.changeListener);

			//this.on('value child_added child_changed child_removed child_moved', this.firebaseListener);

			/*
			this.firebase = new Backbone.Firebase(this, {
				initialize: function() {
					console.log('SandboxModel.firebase.initialize()');
				}
			});
			*/

			//TODO: Add a way to pass in a Firebase reference rather than looking for the url
			this.firebase = new Backbone.Firebase(this, {
				initialize: function() {
					//console.log('SandboxModel.firebase.initialize()');
				}
			});
			/*
			*/

			/*
			*/
			var valueListener = function(snapShot) {
				console.log('SandboxModel.on(value)', snapShot.val());
			};
			this.firebase.on('value', valueListener, this);
			//this.firebase.on('value', listener, window);

			//this.fetch();
			this.on('sync', this.syncListener);
		},

		setData: function(data) {
			//var data = {bbb: {b2: 'b', c2: 'c', d2: {e2: 'e', f2:'f'}}, bbb2:'bbb2'};
			this.routerData = data;
			console.log('SandboxModel.setData()', this.routerData);
		},

		firebaseListener: function() {
			console.log('SandboxModel.firebaseListener()');
		},

		saveData: function() {
			this.set(this.routerData);
			var options = {};
			//if (this.isNew()) options.url = config.firebaseRoot + '/sandbox/';
			this.save(this.attributes, options);
		},
		fetchData: function() {
			console.log('SandboxModel.fetchData()', this.attributes);
			this.fireBaseRef = this.fetch({url: config.firebaseRoot + '/sandbox/'});
		},
		updateData: function() {
			this.set(this.routerData);
			var options = {deep: true};
			this.save(this.attributes, options);
		},
		pushData: function() {
			this.set(this.routerData);
			var options = {push:true};
			if (this.isNew()) options.url = config.firebaseRoot + '/sandbox/';
			this.save(this.attributes, options);
		},
		removeData: function() {
			this.destroy(this.attributes);
		},
		setPriority: function(value) {
			this.firebase.setPriority(Number(value), function() {
				console.log('SandboxModel.setPriority.callback()', arguments);
			});
		},

		changeListener: function(model, syncOptions) {
			console.log('SandboxModel.changeListener()', this.id, this.firebase, model.attributes);
		},

		errorListener: function(fireBaseRef) {
			console.log('SandboxModel.errorListener()', fireBaseRef);
		},

		syncListener: function() {
			console.log('SandboxModel.syncListener()', this.attributes);
			//console.log('SandboxModel.showAttr()', eventName);
		},

		showAttr: function(eventName) {
			console.log('SandboxModel.showAttr()', eventName, this.attributes);
			//console.log('SandboxModel.showAttr()', eventName);
		}
	
	});

	return SandboxModel;
});