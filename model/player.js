const Player = {};

Player.ROLETYPE = {
	CITIZEN: 0,
	WEREWOLF: 1,
	FORTUNE: 2,
	KNIGHT: 3
};

Player.typeToString = function(type) {
	switch (type) {
		case Player.ROLETYPE.CITIZEN:
			return 'citizen';
			break;
		case Player.ROLETYPE.WEREWOLF:
			return 'werewolf';
			break;
		case Player.ROLETYPE.FORTUNE:
			return 'fortune';
			break;
		case Player.ROLETYPE.KNIGHT:
			return 'knight';
			break;
		default:
	}
}

module.exports = Player;