const config = {
	ENV: process.env.ENV || 'development-local',
	SERVER_PROTOCOL: 'http',
};

switch (config.ENV) {
	case 'development-local':
		Object.assign(config, {
			DB_HOST: 'localhost',
			DB_PORT: 27017,
			DB_NAME: 'beppu-server-dev',
			EXPRESS_PORT: 3000,
		});
		break;

	case 'development-sakura':
		Object.assign(config, {
			DB_HOST: 'localhost',
			DB_PORT: 28017,
			DB_NAME: 'beppu-server-dev',
			EXPRESS_PORT: 4000,
		});
		break;

	case 'staging':
		Object.assign(config, {
			DB_HOST: 'localhost',
			DB_PORT: 28018,
			DB_NAME: 'beppu-server-staging',
			EXPRESS_PORT: 4001,
		});
		break;

	case 'production':
	default:
		console.error("Unknown ENV");
		process.exit();
}

console.log(`Welcome to beppu-server! Environment is ${config.ENV} now!!`);

module.exports = config;