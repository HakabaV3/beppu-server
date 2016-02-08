var mongoose = require('../model/db.js'),
	uuid = require('node-uuid');

var gameSchema = new mongoose.Schema({
	created: Number,
	updated: Number,
	creator: String,
	scene: {
		type: Number,
		default: 0
	},
	lastAction: {
		type: String,
		default: ''
	},
	endTime: {
		type: Number,
	},
	players: Array,
	uuid: String
});

gameSchema.pre('save', function(next) {
	now = parseInt(Date.now() / 1000);
	this.updated = now;
	if (!this.created) this.created = now;
	if (!this.endTime) this.endTime = now;
	if (!this.uuid) this.uuid = uuid.v4();

	next();
});

module.exports = gameSchema;