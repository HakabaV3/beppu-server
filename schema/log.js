var mongoose = require('../model/db.js'),
	uuid = require('node-uuid');

var LogSchema = new mongoose.Schema({
	created: Number,
	updated: Number,
	gameId: String,
	type: Number,
	parameters: Object
});

LogSchema.pre('save', function(next) {
	now = parseInt(Date.now() / 1000);
	this.updated = now;
	if (!this.created) this.created = now;
	if (!this.uuid) this.uuid = uuid.v4();

	next();
});

module.exports = LogSchema;