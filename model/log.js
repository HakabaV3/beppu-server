var mongoose = require('./db.js'),
	LogSchema = require('../schema/log.js'),
	Player = require('./player.js'),
	Error = require('./error.js');

var _ = {},
	LogModel = mongoose.model('Log', LogSchema);

_.TYPE = {
	CREATE: 0,
	JOIN: 1,
	START: 2,
	CHANGETIME: 3,
	ENDVOTE: 4,
	ENDNIGHTACTION: 5,
	FINISH: 6
};

_.pGet = function(query) {
	console.log('Log.pGet');
	var option = {
		sort: {
			created: 'asc'
		}
	};
	return new Promise(function(resolve, reject) {
		LogModel.find(query, {}, option, function(err, logs) {
			if (err) return reject(Error.mongoose(500, err));

			resolve(logs);
		});
	});
};

_.pCreate = function(game, query) {
	console.log('Log.pCreate');
	return new Promise(function(resolve, reject) {
		new LogModel(query)
			.save(function(err, createdLog) {
				if (err) return reject(Error.mongoose(500, err));
				if (!createdLog) return reject(Error.invalidParameter);

				resolve(game);
			});
	});
};

_.pipeSuccessRender = function(req, res, logs) {
	return res.ok(200, {
		logs: logs.map(function(log) {
			return {
				created: log.created,
				type: _typeToString(log.type),
				parameters: log.parameters
			}
		})
	});
};

_.generateQuery = function(game, type, currentUser, targetId) {
	var query = {
		created: game.updated,
		gameId: game.uuid,
		type: type
	};

	switch (type) {
		case _.TYPE.CREATE:
			Object.assign(query, {
				created: game.updated - 1,
				parameters: {
					owner: game.creator
				}
			});
			break;
		case _.TYPE.JOIN:
			Object.assign(query, {
				parameters: {
					user: {
						id: currentUser.uuid,
						name: currentUser.name
					}
				}
			});
			break;
		case _.TYPE.START:
			var roles = {};
			var settings = {};
			game.players.forEach(function(player) {
				var key = Player.typeToString(player.role);
				if (!settings.hasOwnProperty(key)) {
					settings[key] = 0;
				}
				settings[key]++;
				roles[player.userId] = Player.typeToString(player.role);
			});
			Object.assign(query, {
				parameters: {
					roles: roles,
					settings: settings
				}
			});
			break;
		case _.TYPE.CHANGETIME:
			Object.assign(query, {
				parameters: {
					created: game.updated - 1,
					day: game.day,
					time: game.scene == 1 ? "morning" : "night"
				}
			});
			break;
		case _.TYPE.ENDVOTE:
			Object.assign(query, {
				parameters: {
					decided: targetId == null ? false : true,
					targetId: targetId,
					candidates: null
				}
			});
			break;
		case _.TYPE.ENDNIGHTACTION:
			Object.assign(query, {
				parameters: {
					result: targetId == null ? "defend" : "kill",
					targetId: targetId,
				}
			});
			break;
		case _.TYPE.FINISH:
			Object.assign(query, {
				parameters: {
					winner: game.lastAction,
					reason: game.lastAction + "が勝ったからだYO☆"
				}
			});
			break;
		default:
	};

	return query;
}

function _typeToString(type) {
	switch (type) {
		case _.TYPE.CREATE:
			return 'create';
			break;
		case _.TYPE.JOIN:
			return 'join';
			break;
		case _.TYPE.START:
			return 'start';
			break;
		case _.TYPE.CHANGETIME:
			return 'changeTime';
			break;
		case _.TYPE.ENDVOTE:
			return 'endVote';
			break;
		case _.TYPE.ENDNIGHTACTION:
			return 'endNightAction';
			break;
		case _.TYPE.FINISH:
			return 'finish';
			break;
		default:
	};
};

module.exports = _;