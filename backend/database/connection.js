const mysql = require('mysql2/promise');
const { db } = require('../config/configdb');

let pool;

// Return a shared MySQL connection pool
function getPool() {
	if (!pool) {
		pool = mysql.createPool(db);
		console.log('[db] Connection pool created');
		try {
			console.log('[db][info] host=%s port=%s user=%s db=%s', db.host, db.port, db.user, db.database);
			// Immediate ping test
			pool.query('SELECT 1 AS ping').then(([rows]) => {
				console.log('[db][ping] result:', rows);
				return pool.query('SELECT VERSION() AS version');
			}).then(([rows]) => {
				console.log('[db][version] server:', rows && rows[0] ? rows[0].version : 'unknown');
			}).catch((e) => {
				console.error('[db][ping] failed:', e.code || '', e.message || e);
			});
		} catch (e) {
			console.error('[db][init] debug failed:', e?.message || e);
		}
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
