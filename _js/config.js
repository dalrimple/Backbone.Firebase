define(['Backbone'], function(Backbone) {
	var config = {
		firebaseRoot: 'https://zabinskas-bss.firebaseio.com',
		errorMsgs: {
			invalidAuthPayload: 'The authentication payload did not contain \'%s\'.'
		}
	};
	return config;
})