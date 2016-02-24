var mongoose = require('./db.js'),
	schema = require('../schema/game.js'),
	Error = require('./error.js');

var _ = {},
	GameModel = mongoose.model('Game', schema);

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

_.pVote = function(gameQuery, voteQuery) {
	console.log('Game.pVote');
	Object.assign(gameQuery, {
		'$and': [{
			'votes.$.ownerId': {
				'$ne': voteQuery.ownerId
			},
			'votes.$.day': {
				'$ne': voteQuery.day
			}
		}],
		'players.userId': voteQuery.ownerId
	});

	console.log(gameQuery);
	GameModel.findOne(gameQuery, {}, function(err, game) {
		console.log(game);
	});

	return new Promise(function(resolve, reject) {
		GameModel.findOneAndUpdate(gameQuery, {
			$push: {
				votes: voteQuery
			}
		}, {
			safe: true,
			new: true
		}, function(err, updatedGame) {
			if (err) return reject(Error.mongoose(500, err));
			if (!updatedGame) return reject(Error.invalidParameter);

			return resolve(updatedGame);
		});
	});
};

_.pVoteResult = function(game) {
	console.log('Game.pVoteResult');
	return new Promise(function(resolve, reject) {
		if (!_shouldBeNextScene(game, 'vote')) {
			return resolve(game);
		}

		var filteredVotes = game.votes.filter(function(vote) {
				if (vote.day == game.day) return true;
				return false;
			}),
			killedId = _killedPlayerId(filteredVotes),
			killedPlayerName = '';

		game.players.forEach(function(player) {
			if (player.userId == killedId) {
				player.alive = 0;
				killedPlayerName = player.name;
			}
		});

		game.scene = 2;
		game.lastAction = killedPlayerName + 'が処刑されました'
		game.save(function(err, updatedGame) {
			if (err) return reject(Error.mongoose(500, err));
			return resolve(updatedGame);
		});
	});
};

_.pAction = function(gameQuery, actionQuery) {
	console.log('GameHandler.pAction');
	Object.assign(gameQuery, {
		'$and': [{
			'actions.$.ownerId': {
				'$ne': actionQuery.ownerId
			},
			'actions.$.day': {
				'$ne': actionQuery.day
			}
		}],
		'players.userId': actionQuery.ownerId
	});
	return new Promise(function(resolve, reject) {
		GameModel.findOneAndUpdate(gameQuery, {
			$push: {
				actions: actionQuery
			}
		}, {
			safe: true,
			new: true
		}, function(err, updatedGame) {
			if (err) return reject(Error.mongoose(500, err));
			if (!updatedGame) return reject(Error.invalidParameter);

			return resolve(updatedGame);
		});
	});
};

_.pActionResult = function(game) {
	console.log('GameHandler.pActionResult');
	return new Promise(function(resolve, reject) {
		if (!_shouldBeNextScene(game, 'action')) {
			return resolve(game);
		}

		var savedId, killedPlayerName,
			killedId = _killedPlayerId(game.actions.filter(function(action) {
				if (action.ownerRole == 1) return true;
				if (action.ownerRole == 3) savedId = action.targetId;

				return false;
			}));

		game.players.forEach(function(player) {
			if (player.userId == killedId && player.userId != savedId) {
				player.alive = 0;
				killedPlayerName = player.name;
			}
		});

		game.scene = 1;
		game.day++;
		game.lastAction = killedPlayerName ? killedPlayerName + 'が人狼に殺されました' : '昨夜の被害者はいませんでした'
		game.save(function(err, updatedGame) {
			if (err) return reject(Error.mongoose(500, err));
			return resolve(updatedGame);
		});
	});
}

_.pEnd = function(game) {
	console.log('GameHandler.pEnd');
	return new Promise(function(resolve, reject) {
		var surviving = {
			werewolf: 0,
			citizen: 0
		};
		game.players.forEach(function(player) {
			if (!player.alive) return;
			if (player.role == 1) {
				surviving.werewolf++;
				return;
			}
			surviving.citizen++;
		});

		if (surviving.werewolf != 0 && surviving.werewolf < surviving.citizen) {
			return resolve(game);
		}

		var wonTeam = surviving.werewolf == 0 ? '市民側' : '人狼側';
		game.scene = 3;
		game.lastAction = wonTeam + 'が勝利しました'
		game.save(function(err, updatedGame) {
			if (err) return reject(Error.mongoose(500, err));
			return resolve(updatedGame);
		})
	})
}

_.pGetPlayer = function(gameQuery, userId) {
	Object.assign(gameQuery, {
		'players.userId': userId
	});
	return new Promise(function(resolve, reject) {
		GameModel.findOne(gameQuery, {}, function(err, game) {
			if (err) return reject(Error.mongoose(500, err));
			if (!game) return reject(Error.invalidParameter);

			game.players.forEach(function(player) {
				if (player.userId == userId) return resolve(player);
			})
			return reject(Error.invalidParameter);
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
	settings.forEach(function(num, i) {
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

function _killedPlayerId(votes) {
	var result = {},
		max = [0];
	votes.forEach(function(vote) {
		var targetId = vote.targetId;
		if (!result.hasOwnProperty(targetId)) {
			result[targetId] = 0;
		}
		result[targetId]++;
	});
	for (var key in result) {
		var value = result[key];
		if (value > max[0]) {
			max = [key];
			continue;
		}
		if (value == max[0]) max.push(key);
	}
	return max[Math.floor(Math.random() * max.length)];
}

function _shouldBeNextScene(game, type) {
	var objects, numOfActionsInDay = 0,
		numOfAlivePlayer = 0;
	if (type == 'vote') {
		objects = game.votes;
	} else {
		objects = game.actions;
	}

	objects.forEach(function(obj) {
		if (game.day == obj.day) numOfActionsInDay++;
	});
	game.players.forEach(function(player) {
		if (player.alive) numOfAlivePlayer++;
	});
	return numOfActionsInDay >= numOfAlivePlayer ? true : false;
}

module.exports = _;