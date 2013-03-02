define(['Backbone', 'Firebase'], function(Backbone, Firebase) {
	/*
	 * Backbone extension to integrate Firebase as the persistance layer
	 * The idea is to create instances of Backbone.Firebase within a model
	 * or collection that allows that model to save data to Firebase and
	 * listen to events on Firebase endpoints and be updated with new data.
	 */

	var MSGS = {
		noModel: 'A Model or Collection must be passed as the first parameter.',
		noUrl: 'The Model or Collection has no url property',
	};
	var FB_EVENTS = ['value', 'child_added', 'child_changed', 'child_removed', 'child_moved'];

	//Reference helper functions
	var createByPush = function(ref, model, options) {
		//firebaseRef.push() is the only action to return a reference.
		var pushRef = ref.push(model.attributes, function(error) {
			if (error) {
				options.error(error);
			} else {
				ref = pushRef; //If successful, update the firebase reference to the new firebase reference.
				options.success();
			}
		});
	};
	var createBySet = function(ref, model, options) {
		ref.setWithPriority(model.attributes, options.priority, function(error) {
			if (error) options.error(error);
			else options.success();
		});
	};
	var createByPrioritySet = function(ref, model, options) {
		ref.set(model.attributes, function(error) {
			if (error) options.error(error);
			else options.success();
		});			
	};
	var deepUpdate = function(ref, model, options) {
		//console.log('Backbone.Firebase.deepUpdate()', model, options);
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
				//console.log('Backbone.Firebase.recursiveUpdater()', ref, updateObj);
				ref.update(updateObj, recursionCompleter);
			}
		};
		//Call success() or error() only when all recursive updates are complete
		var recursionCompleter = function(error) {
			//console.log('Backbone.Firebase.recursionCompleter()', totalUpdates, error);
			latestError = error ? error : false; //Ensure an error object is available to pass if one exists
			updatesSuccessfull = updatesSuccessfull && !error;
			if (--totalUpdates === 0) {
				!updatesSuccessfull ? options.error(latestError) : options.success();
			}
		};
		recursiveUpdater(ref, model.attributes);
	};
	var update = function(ref, model, options) {
		//console.log('Backbone.Firebase.update()');
		ref.update(model.attributes, function(error) {
			error ? options.error(error) : options.success();
		});
	};
	var destroy = function(ref, model, options) {
		//console.log('Backbone.Firebase.destory()');
		ref.remove(function(error) {
			error ? options.error(error) : options.success();
		});
	};
	var read = function(ref, model, options) {
		//console.log('Backbone.Firebase.read()', ref, model, options);
		ref.once('value', function(snapshot) {
			options.success(snapshot);
		});
	};

	//Create 'limit', 'startAt' & 'endEnd' firebase queries and return a copy of the Backbone.Firebase instance with the query included. The 'on' function looks for the _query value to act on.
	var queryMaker = function(term) {
		var r, q;
    if (_.has(this, '_query')) {
			//console.log('Backbone.Firebase.queryMaker()', true);
			r = this;
			q = this._query;
		} else {
			//console.log('Backbone.Firebase.queryMaker()', false);
			r = {};
			q = this._ref;
		}
		r._query = q[term].apply(q, _.rest(arguments));
		return _.defaults(r, this);
	};

	Backbone.Firebase = function(model, options) {
		//Make sure there is a Backbone Model or Collection to work with
		if (!model || !(model instanceof Backbone.Model || model instanceof Backbone.Collection)) throw (MSGS.noModel);
		this.model = model;

		//Validate that options are passed in correctly
		this.options = _.isObject(options) ? options : {};

		//Store the Firebase reference
		var ref = this._ref = new Firebase(this.url());

		//Add a parsing function to the model designed for handling Firebase responses
		_.extend(this.model, {parse: function(resp, options) {
				//console.log('Backbone.Firebase.model.parse()', resp, this);
				//Allow the model author to overide this with their own parse function
				if (_.isFunction(options.parse)) return options.parse.apply(this, [resp, options]);
				if (!resp) return;
				if (this instanceof Backbone.Model) {
					//console.log('sync.model.parse():model', this);
					return resp.val();
				} else if (this instanceof Backbone.Collection) {
					var array = [];
					var that = this;
					resp.forEach(function(childSnapShot) {
						//console.log('sync.model.parse():collection', that);
						var newModel = new that.model(childSnapShot.val());
						newModel.id = childSnapShot.name();
						newModel.firebase = new Backbone.Firebase(newModel);
						array.push(newModel);
					});
					return array;
				}
				return resp;
			}
		});

		//Overwrite the sync method of the model
		this.model.sync = function(method, model, options) {
			options || (options = {});
		
			var successFn = options.success;
			options.success = function(resp) {
				//console.log('sync success', resp, model);
				if (successFn) successFn(model, resp, options);
				model.trigger('sync', model, resp, options);
			};

			var errorFn = options.error;
			options.error = function(ref) {
				//console.log('sync error', ref, model);
				if (errorFn) errorFn(model, ref, options);
				model.trigger('error', model, ref, options);
			};

			
			switch (method) {
				//If a model doesn't have an 'id' value, this will be used.
				case 'create':
					//Check to see if model is part of a collection or has explicit push instructions 
					//var push = _.has(options, 'push') ? options.push : !!model.collection;
					var push = model instanceof Backbone.Collection;
					if (push) {
						createByPush(ref, model, options);
					} else {
						//If not being pushed, just set the values.
						if (_.has(options, 'priority')) {
							createByPrioritySet();
						} else {
							createBySet(ref, model, options);
						}
					}
					break;

				//If a model does have an 'id', update is used.
				case 'update':
					if (options.deep) {
						// Any key not in model.attributes will not be overwritten, regardless of depth in Firebase
						deepUpdate(ref, model, options);
					} else {
						// Normal firebase update behavior
						update(ref, model, options);
					}
					break;

				//Remove the Firebase location
				case 'delete':
					destroy(ref, model, options);
					break;

				//Read the Firebase location
				case 'read':
					//returnAs options are 'snapshot', 'export', 'val' (default)
					read(ref, model, options);
					break;	
			}
		};

		//Create a map of callbacks that can be passed to this.on and callbacks that are passed to the Firebase ref. 
		this._firebaseCallbacks = [];
		
	};

	_.extend(Backbone.Firebase.prototype, Backbone.Events, {
		on: function(name, callback, context) {
			//Validate params for Firebase
			if (_.indexOf(FB_EVENTS, name) === -1) return this;
			if (!_.isFunction(callback)) return this;
			if (!context) {
				arguments = _.toArray(arguments);
				context = arguments[2] = this.model;
			}
			
			//Trigger the default Backbone.Events.on behavior
			//A unique id is required to prefent Firebase triggering every <name> callback for every <name> event 
			var eventId = _.uniqueId();
			Backbone.Events.on.apply(this, [name + ':' + eventId].concat(_.rest(arguments)));

			//Route the Firebase.on events to the callbacks set on an instance of this
			var refQuery = this._ref;
			if (_.has(this, '_query')) refQuery = this._query;
			
			// Setup the Firebase on() function and call it in the context of this Backbone.Firebase instance
			var firebaseCallback = function() {
				//console.log('Backbone.Firebase.on.firebaseCallback()', this);
				Backbone.Events.trigger.apply(this, [name + ':' + eventId].concat(_.toArray(arguments)));
			};
			refQuery.on(name, firebaseCallback, firebaseCallback, this);
			
			//Track the callbacks associated to the Firebase ref.
			this._firebaseCallbacks.push({
				name: name,
				id: eventId,
				query: refQuery,
				firebaseCallback: firebaseCallback,
				firebaseContext: this,
				callback: callback,
				context: context,
			});
			return this;
		},

    once: function(name, callback, context) {
			//Validate params for Firebase
			if (_.indexOf(FB_EVENTS, name) === -1) return this;
			if (!_.isFunction(callback)) return this;
			if (!context) {
				arguments = _.toArray(arguments);
				context = arguments[2] = this.model;
			}

			//Basically using on and putting off in the callback but using the convenience of Firebase.once.
			var eventId = _.uniqueId();
			Backbone.Events.on.apply(this, [name + ':' + eventId].concat(_.rest(arguments)));
			var onceArguments = arguments;
			var refQuery = this._ref;
			if (_.has(this, '_query')) refQuery = this._query;

			// Setup the Firebase on() function and call it in the context of this Backbone.Firebase instance
			var firebaseCallback = function(snapshot) {
				Backbone.Events.trigger.apply(this, [name + ':' + eventId].concat(_.toArray(arguments)));
				Backbone.Events.off.apply(this, [name + ':' + eventId].concat(_.rest(onceArguments)));
			};
			refQuery.once(name, firebaseCallback, firebaseCallback, this);
		},

		off: function(name, callback, context) {
			//Create an object to pass to _.where
			var searchProps = {};
			!name || (searchProps.name = name);
			!callback || (searchProps.callback = callback);
			!context || (searchProps.context = context);
			var removals = _.where(this._firebaseCallbacks, searchProps);

			console.log('Backbone.Firebase.off()', this, searchProps, removals);

			//Loop over the results of the search and remove event handlers from Firebase and this._events.
			for(var i = 0, l = removals.length; i < l; i++) {
				var ev = removals[i];
				ev.query.off(ev.name, ev.firebaseCallback, ev.firebaseContext);
				Backbone.Events.off.apply(this, [ev.name + ':' + ev.id, ev.callback, ev.context]);
			}

			return this;
		},

		limit: function(count) {
			return queryMaker.apply(this, ['limit', count]);
		},
		startAt: function(priority, id) {
			return queryMaker.apply(this, ['startAt', priority, id]);
		},
		endAt: function(priority, id) {
			return queryMaker.apply(this, ['endAt', priority, id]);
		},

		setPriority: function(priority) {
			this._ref.setPriority.apply(this._ref, arguments);
		},

		onDisconnect: function() {
			//TODO: Implement this native Firebase function.
			return this;
		},
		listenTo: function(other, event, callback) {
			//TODO: Implement this so that a Firebase function (probably save) can be triggered by an event
			Backbone.Events.listenTo.apply(this, arguments);
		},
		stopListening: function(other, event, callback) {
			//TODO: Implement this with the listenTo() function
			Backbone.Events.stopListening.apply(this, arguments);
		},

		//Get the url from the model or collection
		url: function() {
			try {
				return _.result(this.model, 'url');
			} catch (error) {
				throw (MSGS.noUrl);
			}
		}
	});

});