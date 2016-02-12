var mongoose = require('./db.js'),
	schema = require('../schema/invitation.js'),
	Error = require('./error.js');

var _ = {},
	InvitationModel = mongoose.model('Invitation', schema),
	AuthHelper = require('../helper/auth.js');

_.pGetOne = function(query) {
	console.log('Game.pGetOne\n');
	return new Promise(function(resolve, reject) {});
};

_.pCreate = function(query, gameId) {
	console.log('Invitation.pCreate\n');
	Object.assign(query, {
		gameId: gameId,
		creator: {
			id: AuthHelper.currentUser.uuid,
			name: AuthHelper.currentUser.name
		}
	});
	return new Promise(function(resolve, reject) {
		new InvitationModel(query)
			.save(function(err, createdInvitation) {
				if (err) return reject(Error.mongoose(500, err));
				if (!createdInvitation) return reject(Error.invalidParameter);

				return resolve(createdInvitation);
			});
	});
};

_.pipeSuccessRender = function(req, res, invitaiton) {
	console.log('Game.pipeSuccessRender\n');
	var invitationObj = {
		id: invitaiton.uuid,
		creator: invitaiton.creator,
		targetId: invitaiton.targetId,
		gameId: invitaiton.gameId,
		created: invitaiton.created,
		updated: invitaiton.updated
	};
	return res.ok(200, {
		invitation: invitationObj
	});
};

module.exports = _;