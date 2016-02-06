var _ = {
		currentUser: null
	},
	crypto = require('crypto');

_.toHashedPassword = function(password) {
	var salt = 'kahun shouga tsurai';
	return crypto.createHash('sha512').update(salt + password).digest('hex');
}

_.createToken = function() {
	return crypto.createHash('sha512').update(crypto.randomBytes(256).toString()).digest('hex');
}

module.exports = _;