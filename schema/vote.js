var mongoose = require('../model/db.js'),
	uuid = require('node-uuid');

var VoteSchema = new mongoose.Schema({
	deleted: {
		type: Boolean,
		default: false
	},
	day: Number,
	ownerId: String,
	targetId: String,
	gameId: String,
	uuid: String,
	created: Number,
	updated: Number
});

VoteSchema.pre('save', function(next) {
	now = parseInt(Date.now() / 1000);
	this.updated = now;
	if (!this.created) this.created = now;
	if (!this.uuid) this.uuid = uuid.v4();

	next();
});

module.exports = VoteSchema;