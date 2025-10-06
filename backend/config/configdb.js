require('dotenv').config();

const required = ['DB_HOST','DB_USER','DB_PASSWORD','DB_NAME','JWT_SECRET'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
	console.warn('[configdb] Missing environment variables:', missing.join(', '));
}

module.exports = {
	db: {
		host: process.env.DB_HOST || 'localhost',
		user: process.env.DB_USER || 'root',
		password: process.env.DB_PASSWORD || '',
		database: process.env.DB_NAME || 'queueme',
		port: parseInt(process.env.DB_PORT || '3306', 10),
		waitForConnections: true,
		connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '10', 10),
		queueLimit: 0,
		enableKeepAlive: true,
		keepAliveInitialDelay: 0
	},
	jwt: {
		secret: process.env.JWT_SECRET || 'dev_secret_change_me',
		expiresIn: process.env.JWT_EXPIRES_IN || '7d'
	}
};
