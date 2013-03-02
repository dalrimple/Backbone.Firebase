define(['Backbone', 'Firebase'], function(Backbone, Firebase) {

	/*
	 * Overwrite of the Backbone.sync method to use Firebase
	 * 
	 * Adds a 'firebaseRef' value to the options object returned to success and
	 * error callbacks.
	 *
	 * 'update' method options:
	 * 'deep' if true, none of the values in the Firebase location will be
	 * overwritten regardless of how deeply they're nested. Normal Firebase update
	 * behavior is to only preserve siblings of the item being updated. Be careful
	 * with this option as it uses multiple Firebase calls and if some succeed and
	 * others fail, you'll be left with partial updates.
	 * 
	 * 'create' method options:
	 * 'push' if set, will either force Firebase to create a new object with a
	 * unique id at the url or force a set without creating a unique id. If not
	 * set, Firebase's push() will be used if the model is part of a collection.
	 * 'priority' if set, Firebase's setwithPriority() will be used instead of set().
	 *
	 * 'read' method options:
	 * 'returnAs' takes a the following values:
	 * returnAs: 'snapshot' will return the raw Firebase dataSnapshot.
	 * returnAs: 'export' the data will come back with the Firebase '.priority' values
	 * see https://www.firebase.com/docs/javascript/datasnapshot/exportval.html
	 * returnAs: 'val' (default) the data as a standard js object
	 */

	var replaceSync = function() {
		Backbone.sync = function(method, model, options) {
			options || (options = {});
			//Unless a url is set in the options, try using model.url(), then model.url or throw an error.
			var url = options.url ? options.url : _.result(model, 'url') || urlError();
			var ref = new Firebase(url);
			//console.log('sync', method, model, options, url);

			var successFn = options.success;
	    options.success = function(resp) {
	    	//'resp' will only have a Firebase 'snapshot' value for 'read' methods, and null for others.
	    	//Grab the urlRoot and id from the Firebase reference path and set them on the model on success
	    	model.urlRoot = ref.parent().toString();
	    	model.id = ref.name();
	    	options.firebaseRef = ref; //This is the preferred method for accessed the firebase reference.
	      if (successFn) successFn(model, resp, options);
	      model.trigger('sync', model, resp, options);
	    	//console.log('sync success', resp, model);
	    };

	    var errorFn = options.error;
	    options.error = function(ref) {
	    	options.firebaseRef = ref;
	      if (errorFn) errorFn(model, ref, options);
	      model.trigger('error', model, ref, options);
	    	console.log('sync error', ref, model);
	    };

	    
			switch (method) {
				//If a model doesn't have an 'id' value, this will be used.
				case 'create':
					//Check to see if model is part of a collection or has explicit push instructions 
					var push = _.has(options, 'push') ? options.push : !!model.collection;
					if (push) {
						createByPush();
					} else {
						//If not being pushed, just set the values.
						if (_.has(options, 'priority')) {
							createByPrioritySet();
						} else {
							createBySet();
						}
					}
					break;

				//If a model does have an 'id', update is used.
				case 'update':
					if (options.deep) {
						// Any key not in model.attributes will not be overwritten, regardless of depth in Firebase
						deepUpdate();
					} else {
						// Normal firebase update behavior
						update();
					}
					break;

				//Remove the Firebase location
				case 'delete':
					destroy();
					break;

				//Read the Firebase location
				case 'read':
					//returnAs options are 'snapshot', 'export', 'val' (default)
					read();
					break;	
			}

			model.trigger('request', model, ref, options);
			return ref;

			function createByPush() {
				//firebaseRef.push() is the only action to return a reference.
				var pushRef = ref.push(model.attributes, function(error) {
					if (error) {
						options.error(error);
					} else {
						ref = pushRef; //If successful, update the firebase reference to the new firebase reference.
						options.success();
					}
				});
			}

			function createBySet() {
				ref.setWithPriority(model.attributes, options.priority, function(error) {
					if (error) options.error(error);
					else options.success();
				});
			}
			function createByPrioritySet() {
				ref.set(model.attributes, function(error) {
					if (error) options.error(error);
					else options.success();
				});			
			}

			function deepUpdate() {
				//console.log('sync.deepUpdate()', model, options);
				//Any key not in model.attributes will not be overwritten, regardless of depth in Firebase
				var totalUpdates = 0,
						updatesSuccessfull = true,
						latestError = false;
				var recursiveUpdater = function(ref, attr) {
					var updateObj = {},
							hasProperties = false;
					for (var i in attr) {
						if (typeof(attr[i]) === 'object') {
							recursiveUpdater(ref.child(i), attr[i]);
						} else {
							updateObj[i] = attr[i];
							hasProperties = true;
						}
					}
					if (hasProperties) {
						totalUpdates++;
						//console.log('sync.recursiveUpdater()', ref, updateObj);
						ref.update(updateObj, recursionCompleter);
					}
				};
				//Call success() or error() only when all recursive updates are complete
				var recursionCompleter = function(error) {
					//console.log('sync.recursionCompleter()', totalUpdates, error);
					latestError = error ? error : false; //Ensure an error object is available to pass if one exists
					updatesSuccessfull = updatesSuccessfull && !error;
					if (--totalUpdates === 0) {
						!updatesSuccessfull ? options.error(latestError) : options.success();
					}
				}
				recursiveUpdater(ref, model.attributes);
			}

			function update() {
				//console.log('sync.update()');
				ref.update(model.attributes, function(error) {
					error ? options.error(error) : options.success();
				});
			}

			function destroy() {
				//console.log('sync.destory()');
				ref.remove(function(error) {
					error ? options.error(error) : options.success();
				});
			}

			function read() {
				//console.log('sync.read()', ref, model, options);
				ref.once('value', function(snapshot) {
					options.success(snapshot);
				});
				//ref.on('')
			}

		};
		
		_.extend(Backbone.Model.prototype, {
			parse: function(resp, options) {
				this.firebase = this.firebase || resp.ref();
				//console.log('sync.Model.parse()', this, this.firebase);
				return options.exportVal ? resp.exportVal() : resp.val();
			}
		});

		_.extend(Backbone.Collection.prototype, {
			parse: function(resp, options) {
				//console.log('sync.Collection.parse()', new this.model());
				this.firebase = this.firebase || resp.ref();
				var collection = this;
				var array = [];
				resp.forEach(function(childSnapShot) {
					array.push(new collection.model({firebase:childSnapShot.ref(), attributes:childSnapShot.val()}));
				});
				return array;
			}
		});

	}

	return replaceSync;
});