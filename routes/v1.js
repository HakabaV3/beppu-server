var express = require('express'),
	router = express.Router(),
	authRouter = require('./v1/auth.js'),
	userRouter = require('./v1/user.js'),
	gameRouter = require('./v1/game.js');

express.response.ok = function(code, result) {
	return this.json({
		status: code,
		result: result || {}
	});
};

express.response.ng = function(code, result) {
	return this.json({
		status: code,
		result: result || {}
	});
};

router.use(function(req, res, next) {
	req.session = {};
	res.set({
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'X-Session-Token,X-Platform,Content-Type',
		'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE'
	});
	next();
});

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/game', gameRouter);

module.exports = router;