var express = require('express'),
	router = express.Router(),
	Auth = require('../../model/auth.js'),
	User = require('../../model/user.js'),
	Game = require('../../model/game.js'),
	Invitation = require('../../model/invitation.js'),
	Error = require('../../model/error.js');

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

module.exports = router;