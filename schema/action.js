var mongoose = require('../model/db.js'),
	uuid = require('node-uuid');

var ActionSchema = new mongoose.Schema({
	deleted: {
		type: Boolean,
		default: false
	},
	day: Number,
	ownerId: String,
	targetId: String,
	gameId: String,
	uuid: String,
	ownerRole: Number,
	created: Number,
	updated: Number
});

ActionSchema.pre('save', function(next) {
	now = parseInt(Date.now() / 1000);
	this.updated = now;
	if (!this.created) this.created = now;
	if (!this.uuid) this.uuid = uuid.v4();

	next();
});

module.exports = ActionSchema;