var _ = require('lodash');
var Exchange = require('../exchange');
var response = require('../response.js');
var exchanges = {};

module.exports = function(){
	var options = response.createOptions.apply(null, _.toArray(arguments));
	var responseHandler = response(options);

	var methodName = options.methodName;
	var staleExchange = exchanges[methodName] || new Exchange({
		type: 'x-lvc',
		name: methodName+'__stale__'
	});

	var returnVal = function(cb){
		responseHandler(function(err, req, sendResponse){
			if (err) return cb(err);
			var resourceKey = req._resourceKey;
			if (req && req._listenOnly) return cb(err, resourceKey, sendResponse);

			cb(err, resourceKey, function(err2, res){
				if (err2) sendResponse(err2);
				if (!res) sendResponse(err2, res);

				sendResponse(err2, res);
				staleExchange.publish(res, {key:resourceKey});
			});
		});
	};

	returnVal.ready = responseHandler.ready;
	returnVal.enable =responseHandler.enable;
	returnVal.disable = responseHandler.disable;
	return returnVal;
};
