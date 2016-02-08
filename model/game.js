var mongoose = require('./db.js'),
	schema = require('../schema/game.js'),
	Error = require('./error.js');

var _ = {},
	GameModel = mongoose.model('Game', schema);

_.pCreate = function(user) {
	console.log('Game.pCreate\n');
	var gameQuery = {
		creator: user.uuid,
		players: [{
			id: user.uuid,
			name: user.name,
			alive: 1,
			role: 0,
		}]
	}
	return new Promise(function(resolve, reject) {
		new GameModel(gameQuery)
			.save(function(err, createdGame) {
				if (err) return reject(Error.mongoose(500, err));
				if (!createdGame) return reject(Error.invalidParameter);

				return resolve(createdGame);
			});
	});
};

_.pipeSuccessRender = function(req, res, game) {
	console.log('Game.pipeSuccessRender\n');
	var gameObj = {
		id: game.uuid,
		creator: game.creator,
		players: game.players,
		scene: game.scene,
		endTime: game.endTime,
		lastAction: game.lastAction,
		created: game.created,
		updated: game.updated
	};
	return res.ok(200, {
		game: gameObj
	});

};

module.exports = _;