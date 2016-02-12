var mongoose = require('./db.js'),
	schema = require('../schema/game.js'),
	Error = require('./error.js');

var _ = {},
	GameModel = mongoose.model('Game', schema);

_.pGetOne = function(query, userId) {
	console.log('Game.pGetOne\n');
	Object.assign(query, {
		'players.userId': userId
	});
	console.log(query);
	return new Promise(function(resolve, reject) {
		GameModel.findOne(query, function(err, game) {
			if (err) return reject(Error.mongoose(500, err));
			if (!game) return reject(Error.invalidParameter);

			resolve(game);
		});
	});
};

_.pCreate = function(user) {
	console.log('Game.pCreate\n');
	var gameQuery = {
		creatorId: user.uuid,
		players: [{
			userId: user.uuid,
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
		creatorId: game.creatorId,
		players: game.players.map(function(player) {
			return {
				id: player.userId,
				name: player.name,
				alive: player.alive,
				role: player.role
			};
		}),
		scene: {
			type: game.scene,
			endTime: game.endTime,
			lastAction: game.lastAction
		},
		created: game.created,
		updated: game.updated
	};
	return res.ok(200, {
		game: gameObj
	});

};

module.exports = _;