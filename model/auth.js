var mongoose = require('./db.js'),
	schema = require('../schema/auth.js'),
	Error = require('./error.js');

var _ = {},
	AuthHelper = require('../helper/auth.js'),
	AuthModel = mongoose.model('Auth', schema),
	UserModel = mongoose.model('User', require('../schema/user.js'));

_.pSignIn = function(query) {
	console.log('Auth.pSignIn\n');
	return new Promise(function(resolve, reject) {
		UserModel.findOne(query, {}, function(err, user) {
			if (err) return reject(Error.mongoose(500, err));
			if (!user) return reject(Error.unauthorized);

			return resolve(user);
		});
	});
};

_.pGetOne = function(query) {
	console.log('Auth.pGetOne\n');
	return new Promise(function(resolve, reject) {
		AuthModel.findOne(query, {}, function(err, auth) {
			if (err) return reject(Error.mongoose(500, err));
			if (!auth) return reject(Error.unauthorized);

			return resolve(auth);
		});
	});
};

_.pCreate = function(user) {
	console.log('Auth.pCreate\n');
	var query = {
		userId: user.uuid,
		token: AuthHelper.createToken()
	};

	return new Promise(function(resolve, reject) {
		new AuthModel(query)
			.save(function(err, createdAuth) {
				if (err) return reject(Error.mongoose(500, err));
				if (!createdAuth) return reject(Error.invalidParameter);
				if (!user) resolve(createdAuth);

				user.token = createdAuth.token;
				return resolve(user);
			});
	});
};


module.exports = _;