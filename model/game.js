var mongoose = require('./db.js'),
	schema = require('../schema/game.js'),
	PlayerSchema = require('../schema/player.js'),
	AuthHelper = require('../helper/auth.js'),
	Qrcode = require('qrcode'),
	Log = require('./log.js'),
	Error = require('./error.js');

var _ = {},
	GameModel = mongoose.model('Game', schema),
	PlayerModel = mongoose.model('Player', PlayerSchema);

_.pGetOne = function(query, userId) {
	console.log('Game.pGetOne');
	if (userId) {
		Object.assign(query, {
			'players.userId': userId
		});
	}

	return new Promise(function(resolve, reject) {
		GameModel.findOne(query, function(err, game) {
			if (err) return reject(Error.mongoose(500, err));
			if (!game) return reject(Error.invalidParameter);

			if (userId) {
				game.players.forEach(function(player) {
					if (player.userId == userId) game.currentPlayer = player;
				})
			}
			resolve(game);
		});
	});
};

_.pCreate = function(user) {
	console.log('Game.pCreate\n');
	var gameQuery = {
		creator: {
			id: user.uuid,
			name: user.name
		},
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

_.pPushPlayer = function(gameObj, currentUser) {
	console.log('Game.pPushPlayer');
	var playerQuery = {
		gameId: gameObj.uuid,
		userId: currentUser.uuid,
		name: currentUser.name,
		alive: 1,
		role: 0
	};
	for (var player of gameObj.players) {
		if (player.userId == currentUser.uuid) return Promise.resolve(gameObj);
	}
	gameObj.players.push(new PlayerModel(playerQuery));
	return gameObj.save()
		.then(updatedGame => Log.pCreate(gameObj, Log.generateQuery(gameObj, Log.TYPE.JOIN, currentUser)))
		.catch(err => Promise.rejct(err));
};

_.pipeSuccessRender = function(req, res, game) {
	console.log('Game.pipeSuccessRender');
	var gameObj = {
		id: game.uuid,
		creatorId: game.creator.id,
		players: game.players.map(function(player) {
			return {
				id: player.userId,
				name: player.name,
				alive: player.alive,
				role: player.role
			};
		}),
		scene: {
			day: game.day,
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

_.pQrcodeRender = function(req, res, game) {
	Qrcode.toDataURL(game.uuid, function(err, url) {
		res.ok(200, {
			data: url
		})
	});
};

module.exports = _;