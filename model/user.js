var mongoose = require('./db.js'),
	schema = require('../schema/user.js'),
	Error = require('./error.js');

var _ = {},
	AuthHelper = require('../helper/auth.js'),
	UserModel = mongoose.model('User', schema);

_.pGetOne = function(query, auth) {
	console.log('User.pGetOne\n');
	if (auth && !query.uuid) query.uuid = auth.userId;

	return new Promise(function(resolve, reject) {
		UserModel.findOne(query, function(err, user) {
			if (err) return reject(Error.mongoose(500, err));
			if (!user) return reject(Error.unauthorized);

			if (auth) {
				AuthHelper.currentUser = user;
				user.token = auth.token;
			}
			resolve(user);
		});
	});
};

_.pCreate = function(query) {
	console.log("User.pCreate\n");
	return new Promise(function(resolve, reject) {
		new UserModel(query)
			.save(function(err, createdUser) {
				if (err) return reject(Error.mongoose(500, err));
				if (!createdUser) return reject(Error.invalidParameter);

				return resolve(createdUser);
			});
	});
};

_.pipeSuccessRender = function(req, res, user) {
	console.log('User.pipeSuccessRender\n');
	var userObj = {
		id: user.uuid,
		name: user.name,
		token: user.token,
		created: user.created,
		updated: user.updated
	};
	return res.ok(200, {
		user: userObj
	});
}

module.exports = _;