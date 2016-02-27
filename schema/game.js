var mongoose = require('../model/db.js'),
	uuid = require('node-uuid'),
	playerSchema = require('./player.js'),
	actionSchema = require('./action.js'),
	voteSchema = require('./vote.js');

var gameSchema = new mongoose.Schema({
	created: Number,
	updated: Number,
	creator: Object,
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
	day: {
		type: Number,
		default: 1
	},
	actions: [actionSchema],
	votes: [voteSchema],
	players: [playerSchema],
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