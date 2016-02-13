var mongoose = require('../model/db.js');

var playerSchema = new mongoose.Schema({
	created: Number,
	updated: Number,
	userId: String,
	gameId: String,
	name: String,
	alive: {
		type: Boolean,
		default: 1
	},
	role: Number
});

playerSchema.pre('save', function(next) {
	now = parseInt(Date.now() / 1000);
	this.updated = now;
	if (!this.created) this.created = now;

	next();
});

module.exports = playerSchema;