const mysql = require('mysql2/promise');
const { db } = require('../config/configdb');

let pool;

// Return a shared MySQL connection pool
function getPool() {
	if (!pool) {
		pool = mysql.createPool(db);
		console.log('[db] Connection pool created');
	}
	return pool;
}

async function query(sql, params) {
	const start = Date.now();
	const [rows] = await getPool().execute(sql, params);
	const ms = Date.now() - start;
	if (ms > 500) {
		console.warn(`[db][slow ${ms}ms] ${sql}`);
	}
	return rows;
}

//dedicated connection from the pool
async function getConnection() {
	return getPool().getConnection();
}

module.exports = { getPool, query, getConnection };
