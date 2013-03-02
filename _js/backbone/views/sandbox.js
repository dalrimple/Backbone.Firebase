define(['Backbone'], function(Backbone) {
	var SandboxView = Backbone.View.extend({
		events: {
			'click [data-fn=fetch]': 'fetchData',
			'click [data-fn=save]': 'saveData',
			'click [data-fn=update]': 'updateData',
			'click [data-fn=push]': 'pushData',
			'click [data-fn=delete]': 'removeData',
			'click [data-fn=priority]': 'setPriority'
		},

		initialize: function() {
			console.log('SandboxView.initialize()');
		},

		fetchData: function() {
			this.model.fetchData();
		},
		saveData: function() {
			this.model.saveData();
		},
		updateData: function() {
			this.model.updateData();
		},
		pushData: function() {
			this.model.pushData();
		},
		removeData: function() {
			this.model.removeData();
		},
		setPriority: function() {
			if (this.$priorityInput === void 0) this.$priorityInput = this.$el.find('[data-value=priority]');
			this.model.setPriority(this.$priorityInput.val());
		}

	});

	return SandboxView;
});