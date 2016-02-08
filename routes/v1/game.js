var express = require('express'),
	router = express.Router(),
	Auth = require('../../model/auth.js'),
	User = require('../../model/user.js'),
	Game = require('../../model/game.js'),
	Error = require('../../model/error.js');

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

module.exports = router;