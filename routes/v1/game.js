var express = require('express'),
	router = express.Router(),
	Auth = require('../../model/auth.js'),
	User = require('../../model/user.js'),
	Game = require('../../model/game.js'),
	Log = require('../../model/log.js'),
	GameHandler = require('../../model/game_handler.js'),
	Invitation = require('../../model/invitation.js'),
	Error = require('../../model/error.js');


router.get('/:gameId/logs', function(req, res) {
	var authQuery = {
			token: req.headers['x-session-token']
		},
		logQuery = {
			gameId: req.params.gameId
		},
		gameQuery = {
			uuid: req.params.gameId
		};
	if (req.query.from) {
		logQuery.created = {
			$gt: req.query.from
		}
	}

	Auth.pGetOne(authQuery)
		.then(auth => Game.pGetOne(gameQuery, auth.userId))
		.then(game => Log.pGet(logQuery))
		.then(log => Log.pipeSuccessRender(req, res, log))
		.catch(error => Error.pipeErrorRender(req, res, error))
});

/******************************
 * O/R mapper
 ******************************/

router.get('/:gameId', function(req, res) {
	var authQuery = {
			token: req.headers['x-session-token']
		},
		gameQuery = {
			uuid: req.params.gameId
		};
	Auth.pGetOne(authQuery)
		.then(auth => Game.pGetOne(gameQuery, auth.userId))
		.then(game => Game.pipeSuccessRender(req, res, game))
		.catch(error => Error.pipeErrorRender(req, res, error))
})

router.post('/', function(req, res) {
	var authQuery = {
			token: req.headers['x-session-token']
		},
		userQuery = {
			deleted: false
		};

	Auth.pGetOne(authQuery)
		.then(auth => User.pGetOne(userQuery, auth, req))
		.then(user => Game.pCreate(user))
		.then(game => Log.pCreate(game, Log.generateQuery(game, Log.TYPE.CREATE, req.beppuSession.currentUser)))
		.then(game => Log.pCreate(game, Log.generateQuery(game, Log.TYPE.JOIN, req.beppuSession.currentUser)))
		.then(game => Game.pipeSuccessRender(req, res, game))
		.catch(error => Error.pipeErrorRender(req, res, error))
})

router.post('/:gameId/join', function(req, res) {
	var authQuery = {
			token: req.headers['x-session-token']
		},
		userQuery = {
			deleted: false
		},
		gameQuery = {
			uuid: req.params.gameId
		};
	Auth.pGetOne(authQuery)
		.then(auth => User.pGetOne(userQuery, auth, req))
		.then(user => Game.pGetOne(gameQuery))
		.then(game => Game.pPushPlayer(game, req.beppuSession.currentUser))
		.then(game => Log.pCreate(game, Log.generateQuery(game, Log.TYPE.JOIN, req.beppuSession.currentUser)))
		.then(game => Game.pipeSuccessRender(req, res, game))
		.catch(error => Error.pipeErrorRender(req, res, error))
});

router.post('/:gameId/invitation', function(req, res) {
	var authQuery = {
			token: req.headers['x-session-token']
		},
		userQuery = {
			deleted: false
		},
		gameQuery = {
			uuid: req.params.gameId
		},
		invitationQuery = {
			targetId: req.body.userId
		};
	Auth.pGetOne(authQuery)
		.then(auth => User.pGetOne(userQuery, auth, req))
		.then(user => Game.pGetOne(gameQuery, user.uuid))
		.then(game => Invitation.pCreate({
			targetId: req.body.userId,
			gameId: game.uuid,
			creator: {
				id: req.beppuSession.currentUser.uuid,
				name: req.beppuSession.currentUser.name
			}
		}))
		.then(invitation => Invitation.pipeSuccessRender(req, res, invitation))
		.catch(error => Error.pipeErrorRender(req, res, error))
});

router.get('/:gameId/qrcode', function(req, res) {
	var authQuery = {
			token: req.headers['x-session-token']
		},
		gameQuery = {
			uuid: req.params.gameId
		};
	Auth.pGetOne(authQuery)
		.then(auth => Game.pGetOne(gameQuery, auth.userId))
		.then(game => Game.pQrcodeRender(req, res, game))
		.catch(error => Error.pipeErrorRender(req, res, error));
});


/******************************
 * Handling game condition
 ******************************/


router.post('/:gameId/start', function(req, res) {
	var authQuery = {
			token: req.headers['x-session-token']
		},
		settings = [
			req.body.werewolf || 1, req.body.fortune || 0, req.body.knight || 0
		];
	Auth.pGetOne(authQuery)
		.then(auth => GameHandler.pStart({
			uuid: req.params.gameId,
			creatorId: auth.userId,
			scene: 0
		}, settings))
		.then(game => Log.pCreate(game, {
			created: game.updated,
			gameId: game.uuid,
			type: Log.TYPE.START,
			parameters: {
				roles: {
					id: req.beppuSession.currentUser.uuid,
					name: req.beppuSession.currentUser.name
				}
			}
		}))
		.then(game => Game.pipeSuccessRender(req, res, game))
		.catch(error => Error.pipeErrorRender(req, res, error));
})

router.post('/:gameId/vote', function(req, res) {
	var authQuery = {
			token: req.headers['x-session-token']
		},
		gameQuery = {
			uuid: req.params.gameId,
			scene: 1,
		};

	Auth.pGetOne(authQuery)
		.then(auth => Game.pGetOne(gameQuery, auth.userId))
		.then(game => GameHandler.pVote(game, {
			day: game.day,
			gameId: req.params.gameId,
			targetId: req.body.userId
		}))
		.then(game => GameHandler.pVoteResult(game))
		.then(game => GameHandler.pEnd(game))
		.then(game => Game.pipeSuccessRender(req, res, game))
		.catch(error => Error.pipeErrorRender(req, res, error));
});

router.post('/:gameId/action', function(req, res) {
	var authQuery = {
			token: req.headers['x-session-token']
		},
		userQuery = {
			deleted: false
		},
		gameQuery = {
			uuid: req.params.gameId,
			scene: 2,
			day: req.body.day
		};
	Auth.pGetOne(authQuery)
		.then(auth => Game.pGetOne(gameQuery, auth.userId))
		.then(game => GameHandler.pAction(game, {
			day: req.body.day,
			gameId: req.params.gameId,
			ownerId: game.currentPlayer.userId,
			ownerRole: game.currentPlayer.role,
			targetId: req.body.userId
		}))
		.then(game => GameHandler.pActionResult(game))
		.then(game => GameHandler.pEnd(game))
		.then(game => Game.pipeSuccessRender(req, res, game))
		.catch(error => Error.pipeErrorRender(req, res, error));
});

module.exports = router;