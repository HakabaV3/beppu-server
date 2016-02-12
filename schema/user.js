var mongoose = require('../model/db.js'),
	uuid = require('node-uuid');

var UserSchema = new mongoose.Schema({
	deleted: {
		type: Boolean,
		default: false
	},
	name: {
		type: String,
		required: true,
		index: {
			unique: true
		}
	},
	password: {
		type: String,
		required: true
	},
	uuid: String,
	created: Number,
	updated: Number
});

UserSchema.pre('save', function(next) {
	console.log('User.presave\n');
	now = parseInt(Date.now() / 1000);
	this.updated = now;
	if (!this.created) this.created = now;
	if (!this.uuid) this.uuid = uuid.v4();

	next();
});

module.exports = UserSchema;