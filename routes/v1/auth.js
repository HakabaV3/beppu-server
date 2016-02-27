var express = require('express'),
	router = express.Router(),
	Auth = require('../../model/auth.js'),
	User = require('../../model/user.js'),
	Error = require('../../model/error.js'),
	AuthHelper = require('../../helper/auth.js');

router.get('/me', function(req, res) {
	console.log(`[${req.method}] ${req.url}`);
	if (!req.headers['x-session-token']) return Error.pipeErrorRender(req, res, Error.unauthorized);

	var authQuery = {
			token: req.headers['x-session-token']
		},
		userQuery = {
			deleted: false
		};

	Auth.pGetOne(authQuery)
		.then(auth => User.pGetOne(userQuery, auth, req))
		.then(user => User.pipeSuccessRender(req, res, user))
		.catch(error => Error.pipeErrorRender(req, res, error));
});

router.post('/', function(req, res) {
	console.log(`[${req.method}] ${req.url}`);

	var userQeury = {
		name: req.body.name,
		password: AuthHelper.toHashedPassword(req.body.password)
	};

	Auth.pSignIn(userQeury, req)
		.then(user => Auth.pCreate(user, req))
		.then(user => User.pipeSuccessRender(req, res, user))
		.catch(error => Error.pipeErrorRender(req, res, error));
});

module.exports = router;