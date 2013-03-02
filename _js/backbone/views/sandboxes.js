define(['Backbone', 'SandboxView'], function(Backbone, SandboxView) {
	var SandboxesView = Backbone.View.extend({
		el: '#sandboxes',
		events: {
			'click [data-fn=fetch]': 'fetchData',
		},

		initialize: function() {
			//console.log('SandboxesView.initialize()', this.collection);
			
			this.$list = this.$el.find('ul');

			this.listenTo(this.collection, 'add', this.addChild);
		},

		render: function() {
		},
		addChild: function(model, collection, options) {
			//console.log('SandboxesView.addChild()', model);
			this.$list.append('<li>' + model.id + '</li>');
		},

		fetchData: function() {
			this.collection.fetchData();
		}

	});

	return SandboxesView;
});