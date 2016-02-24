var express = require('express'),
	router = express.Router(),
	Auth = require('../../model/auth.js'),
	User = require('../../model/user.js'),
	Game = require('../../model/game.js'),
	GameHandler = require('../../model/game_handler.js'),
	Invitation = require('../../model/invitation.js'),
	Error = require('../../model/error.js');

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
		.then(auth => User.pGetOne(userQuery, auth))
		.then(user => Game.pCreate(user))
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
		.then(auth => User.pGetOne(userQuery, auth))
		.then(user => Game.pGetOne(gameQuery))
		.then(game => Game.pPushPlayer(game))
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
		.then(auth => User.pGetOne(userQuery, auth))
		.then(user => Game.pGetOne(gameQuery, user.uuid))
		.then(game => Invitation.pCreate(invitationQuery, game.uuid))
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
			day: req.body.day
		};

	Auth.pGetOne(authQuery)
		.then(auth => GameHandler.pVote(gameQuery, {
			day: req.body.day,
			gameId: req.params.gameId,
			ownerId: auth.userId,
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
		.then(auth => User.pGetOne(userQuery, auth))
		.then(user => GameHandler.pGetPlayer(gameQuery, user.uuid))
		.then(player => GameHandler.pAction(gameQuery, {
			day: req.body.day,
			gameId: req.params.gameId,
			ownerId: player.userId,
			ownerRole: player.role,
			targetId: req.body.userId
		}))
		.then(game => GameHandler.pActionResult(game))
		.then(game => GameHandler.pEnd(game))
		.then(game => Game.pipeSuccessRender(req, res, game))
		.catch(error => Error.pipeErrorRender(req, res, error));
});

module.exports = router;