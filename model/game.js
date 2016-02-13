var mongoose = require('./db.js'),
	schema = require('../schema/game.js'),
	AuthHelper = require('../helper/auth.js'),
	Qrcode = require('qrcode'),
	Error = require('./error.js');

var _ = {},
	GameModel = mongoose.model('Game', schema);

_.pGetOne = function(query, userId) {
	console.log('Game.pGetOne\n');
	if (userId) {
		Object.assign(query, {
			'players.userId': userId
		});
	}
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

_.pPushPlayer = function(gameObj) {
	console.log('Game.pPushPlayer\n');
	var gameQuery = {
		uuid: gameObj.uuid,
		$nor: [{
			'players.userId': AuthHelper.currentUser.uuid
		}]
	};
	return new Promise(function(resolve, reject) {
		GameModel.findOneAndUpdate(gameQuery, {
			$push: {
				players: {
					userId: AuthHelper.currentUser.uuid,
					name: AuthHelper.currentUser.name,
					alive: 1,
					role: 0
				}
			}
		}, {
			safe: true,
			new: true
		}, function(err, updatedGame) {
			if (err) return reject(Error.mongoose(500, err));
			if (!updatedGame) return reject(Error.invalidParameter);

			resolve(updatedGame);
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

_.pQrcodeRender = function(req, res, game) {
	Qrcode.toDataURL(game.uuid, function(err, url) {
		res.ok(200, {
			data: url
		})
	});
};

_.pStart = function(query, settings) {
	console.log('Game.pStart');
	return new Promise(function(resolve, reject) {
		GameModel.findOne(query, function(err, game) {
			if (err) return reject(Error.mongoose(500, err));
			if (!game) return reject(Error.invalidParameter);

			_randomRoles(game.players, settings, function(err, roles) {
				if (err) return reject(Error.invalidParameter);

				game.players.map(function(player, i) {
					player.role = roles[i];
				});
				game.scene = 1;
				game.save(function(err, updatedGame) {
					if (err) return reject(Error.mongoose(500, err));
					resolve(updatedGame);
				});
			});
		});
	});
};

function _randomRoles(players, settings, callback) {
	var roles = [],
		numOfCitizen = players.length - settings.reduce(function(pre, current) {
			return pre + current;
		});

	if (numOfCitizen < 0) return callback('invalidParameter', null);

	settings.unshift(numOfCitizen);
	settings.map(function(num, i) {
		_pushRole(roles, num, i);
	});
	_shuffle(roles);
	return callback(null, roles);
}

function _pushRole(array, num, role) {
	while (num) {
		array.push(role);
		num--;
	}
}

function _shuffle(array) {
	var m = array.length,
		t, i;
	while (m) {
		i = Math.floor(Math.random() * m--);
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}
}
module.exports = _;