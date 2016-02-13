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
		$nor: [{
			'votes.ownerId': voteQuery.ownerId,
			'votes.day': voteQuery.day
		}],
		'players.userId': voteQuery.ownerId
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
	return new Promise(function(resolve, reject) {
		if (game.players.length > game.votes.length) {
			return resolve(game);
		}

		var killedId = _killedPlayerId(game.votes),
			killedPlayerName = '';
		game.players.map(function(player) {
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

_.pEnd = function(game) {
	return new Promise(function(resolve, reject) {
		var surviving = {
			werewolf: 0,
			citizen: 0
		};
		game.players.map(function(player) {
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

function _killedPlayerId(votes) {
	var result = {},
		max = [];
	votes.map(function(vote) {
		var targetId = vote.targetId;
		if (!result.hasOwnProperty(targetId)) {
			result[targetId] = 0;
		}
		result[targetId]++;
	});
	for (var key in result) {
		var value = result[key];
		if (value > max) {
			max = [key];
			continue;
		}
		if (value == max) max.push(key);
	}
	return max[Math.floor(Math.random() * max.length)];
}

module.exports = _;