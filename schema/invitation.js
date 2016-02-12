var mongoose = require('../model/db.js'),
	uuid = require('node-uuid');

var invitationSchema = new mongoose.Schema({
	created: Number,
	updated: Number,
	creator: Object,
	gameId: String,
	targetId: String,
	uuid: String
});

invitationSchema.pre('save', function(next) {
	now = parseInt(Date.now() / 1000);
	this.updated = now;
	if (!this.created) this.created = now;
	if (!this.uuid) this.uuid = uuid.v4();

	next();
});

module.exports = invitationSchema;