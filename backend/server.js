require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { getPool } = require('./database/connection');
const http = require('http');
const realtime = require('./utils/realtime');
const { ensureSettingsColumns, ensureQueueReadyColumns, ensureQueueWaitingColumn, ensureQueuePartySizeColumn, ensureQueueStatusEnum, ensureMenuColumns, ensureServicesColumns, ensureNotificationSettingsColumns, ensureFeedbackTable, ensureUsersPhoneColumn, ensureQueueInitialEWTColumn } = require('./database/ensureSchema');
const path = require('path');
const fs = require('fs');
const app = express();
app.set('etag', false);
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));

app.use((req, res, next) => {
	if (req.method === 'OPTIONS') {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		return res.sendStatus(204);
	}
	next();
});

app.use((req, res, next) => {
	if (req.originalUrl.startsWith('/api/')) {
		res.set('Cache-Control', 'no-store');
		res.set('Pragma', 'no-cache');
		res.set('Expires', '0');
	}
	return next();
});

app.use((req,res,next) => {
	console.log(`[req] ${req.method} ${req.originalUrl}`);
	next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, 'public')));

const clientDist = path.join(__dirname, '..', 'client-side', 'dist');
const hasClientBuild = fs.existsSync(clientDist) && fs.existsSync(path.join(clientDist, 'index.html'));
if (hasClientBuild) {
	app.use(express.static(clientDist));
}

// Mounts API route modules
app.use('/api/business', require('./routes/businessRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/queue', require('./routes/queueRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/public', require('./routes/public'));
app.use('/api/qr', require('./routes/qr'));
app.use('/api/health', require('./routes/healthRoutes'));


app.get('/customer/:slug', (req, res) => {
	const slug = req.params.slug;
	if (hasClientBuild) {
		return res.sendFile(path.join(clientDist, 'index.html'));
	}
	const front = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
	if (front) return res.redirect(302, `${front}/customer/${encodeURIComponent(slug)}`);
	res.status(200).send(`<!doctype html><meta http-equiv="refresh" content="0;url=/customer/${encodeURIComponent(slug)}"><p>Redirecting…</p>`);
});


if (hasClientBuild) {
  app.get(/^\/(?!api\/).*/, (req, res) => {
    return res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
	app.get('/favicon.ico', (req, res) => res.status(204).end());
	app.get('/', (req, res) => {
		res.status(200).send('<!doctype html><title>QueueMe API</title><meta name="robots" content="noindex"><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:2rem;line-height:1.5}</style><h1>QueueMe backend is running</h1><p>No frontend build found at <code>client-side/dist</code>.</p><p>API health: <a href="/api/health/healthz">/api/health/healthz</a> | <a href="/api/health/ping">/api/health/ping</a></p>');
	});
}

app.use((req,res)=>{ res.status(404).json({ success:false, message:'Not Found'}); });

app.use((err, req, res, next) => { console.error(err); res.status(500).json({ success:false, message:'Server error' }); });


const PORT = process.env.PORT || 5000;
if (PORT != 5000) {
	console.log(`[info] Running on non-default port ${PORT}. Update frontend proxy if needed.`);
}

// Initializes DB pool and ensures schema
getPool();

ensureSettingsColumns();
ensureQueueReadyColumns();
ensureQueueWaitingColumn();
ensureQueuePartySizeColumn();
ensureQueueStatusEnum();
ensureUsersPhoneColumn();
ensureMenuColumns();
ensureServicesColumns();
ensureNotificationSettingsColumns();
ensureFeedbackTable();
ensureQueueInitialEWTColumn();

const server = http.createServer(app);
realtime.init(server);
server.listen(PORT, '0.0.0.0', () => console.log(`QueueMe backend listening on port ${PORT}`));
