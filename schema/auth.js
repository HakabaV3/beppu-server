var mongoose = require('../model/db.js');

var authSchema = new mongoose.Schema({
	created: Number,
	updated: Number,
	expired: Number,
	token: String,
	userId: String
});

authSchema.pre('save', function(next) {
	now = parseInt(Date.now() / 1000);
	this.updated = now;
	this.expired = now + (24 * 60 * 60 * 60);
	if (!this.created) this.created = now;

	next();
});

module.exports = authSchema;