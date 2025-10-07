const { query } = require('./connection');


async function ensureSettingsColumns() {
  try {
    const rows = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['settings', 'available_kitchen_staff']
    );
    const exists = Number(rows?.[0]?.cnt || 0) > 0;
    if (!exists) {
      await query('ALTER TABLE settings ADD COLUMN available_kitchen_staff INT DEFAULT 1', []);
      console.log('[schema] Added settings.available_kitchen_staff');
    }

    const rowsReserve = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['settings', 'reserve_slots']
    );
    const hasReserve = Number(rowsReserve?.[0]?.cnt || 0) > 0;
    if (!hasReserve) {
      await query('ALTER TABLE settings ADD COLUMN reserve_slots INT DEFAULT 0', []);
      console.log('[schema] Added settings.reserve_slots');
    }

    const rowsOpen = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['settings', 'opening_time']
    );
    const hasOpening = Number(rowsOpen?.[0]?.cnt || 0) > 0;
    if (!hasOpening) {
      await query('ALTER TABLE settings ADD COLUMN opening_time TIME NULL AFTER reserve_slots', []);
      console.log('[schema] Added settings.opening_time');
    }
    const rowsClose = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['settings', 'closing_time']
    );
    const hasClosing = Number(rowsClose?.[0]?.cnt || 0) > 0;
    if (!hasClosing) {
      await query('ALTER TABLE settings ADD COLUMN closing_time TIME NULL AFTER opening_time', []);
      console.log('[schema] Added settings.closing_time');
    }

    const rowsAllowDelay = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['settings', 'allow_delay']
    );
    const hasAllowDelay = Number(rowsAllowDelay?.[0]?.cnt || 0) > 0;
    if (!hasAllowDelay) {
      await query('ALTER TABLE settings ADD COLUMN allow_delay TINYINT(1) NOT NULL DEFAULT 1 AFTER closing_time', []);
      console.log('[schema] Added settings.allow_delay');
    }

    // toggle to enable online payments
    const rowsAllowOnline = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['settings', 'allow_online_payment']
    );
    const hasAllowOnline = Number(rowsAllowOnline?.[0]?.cnt || 0) > 0;
    if (!hasAllowOnline) {
      await query('ALTER TABLE settings ADD COLUMN allow_online_payment TINYINT(1) NOT NULL DEFAULT 0 AFTER allow_delay', []);
      console.log('[schema] Added settings.allow_online_payment');
    }
  } catch (e) {
    console.warn('[schema] ensureSettingsColumns failed (non-fatal):', e?.message || e);
  }
}

// Ensure queues.ready_start_time / ready_end_time exist
async function ensureQueueReadyColumns() {
  try {
    const rowsStart = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['queues', 'ready_start_time']
    );
    const hasStart = Number(rowsStart?.[0]?.cnt || 0) > 0;
    if (!hasStart) {
      await query('ALTER TABLE queues ADD COLUMN ready_start_time DATETIME NULL AFTER estimated_wait_time', []);
      console.log('[schema] Added queues.ready_start_time');
    }

    const rowsEnd = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['queues', 'ready_end_time']
    );
    const hasEnd = Number(rowsEnd?.[0]?.cnt || 0) > 0;
    if (!hasEnd) {
      await query('ALTER TABLE queues ADD COLUMN ready_end_time DATETIME NULL AFTER ready_start_time', []);
      console.log('[schema] Added queues.ready_end_time');
    }
  } catch (e) {
    console.warn('[schema] ensureQueueReadyColumns failed (non-fatal):', e?.message || e);
  }
}

// Ensure queues.waiting_at 
async function ensureQueueWaitingColumn() {
  try {
    const rows = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['queues', 'waiting_at']
    );
    const hasWaiting = Number(rows?.[0]?.cnt || 0) > 0;
    if (!hasWaiting) {
      await query('ALTER TABLE queues ADD COLUMN waiting_at DATETIME NULL AFTER updated_at', []);
      console.log('[schema] Added queues.waiting_at');
    }
  } catch (e) {
    console.warn('[schema] ensureQueueWaitingColumn failed (non-fatal):', e?.message || e);
  }
}

// Ensure queues.party_size exists
async function ensureQueuePartySizeColumn() {
  try {
    const rows = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['queues', 'party_size']
    );
    const hasCol = Number(rows?.[0]?.cnt || 0) > 0;
    if (!hasCol) {
      await query('ALTER TABLE queues ADD COLUMN party_size INT NULL AFTER customer_phone', []);
      console.log('[schema] Added queues.party_size');
    }
  } catch (e) {
    console.warn('[schema] ensureQueuePartySizeColumn failed (non-fatal):', e?.message || e);
  }
}

// Ensure menu_items additive columns 
async function ensureMenuColumns() {
  try {
    const rCat = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['menu_items', 'category']
    );
    if (!(Number(rCat?.[0]?.cnt || 0) > 0)) {
      await query('ALTER TABLE menu_items ADD COLUMN category VARCHAR(100) NULL AFTER description');
      console.log('[schema] Added menu_items.category');
    }
    const rDur = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['menu_items', 'duration_minutes']
    );
    if (!(Number(rDur?.[0]?.cnt || 0) > 0)) {
      await query('ALTER TABLE menu_items ADD COLUMN duration_minutes INT NULL AFTER category');
      console.log('[schema] Added menu_items.duration_minutes');
    }
    const rAvail = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['menu_items', 'is_available']
    );
    if (!(Number(rAvail?.[0]?.cnt || 0) > 0)) {
      await query('ALTER TABLE menu_items ADD COLUMN is_available TINYINT(1) NOT NULL DEFAULT 1 AFTER duration_minutes');
      console.log('[schema] Added menu_items.is_available');
    }
  } catch (e) {
    console.warn('[schema] ensureMenuColumns failed (non-fatal):', e?.message || e);
  }
}

// Add initial_estimated_wait_time to preserve original EWT 
async function ensureQueueInitialEWTColumn() {
  try {
    const rows = await query('SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', ['queues', 'initial_estimated_wait_time']);
    const has = Number(rows?.[0]?.cnt || 0) > 0;
    if (!has) {
      await query('ALTER TABLE queues ADD COLUMN initial_estimated_wait_time INT NULL AFTER estimated_wait_time');
      await query('UPDATE queues SET initial_estimated_wait_time = estimated_wait_time WHERE initial_estimated_wait_time IS NULL');
      console.log('[schema] Added queues.initial_estimated_wait_time and backfilled');
    }
  } catch (e) {
    console.warn('[schema] ensureQueueInitialEWTColumn failed (non-fatal):', e?.message || e);
  }
}

// Ensure services table exists and additive columns 
async function ensureServicesColumns() {
  try {
    const t = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
      ['services']
    );
    const hasTable = Number(t?.[0]?.cnt || 0) > 0;
    if (!hasTable) {
      await query(`
        CREATE TABLE services (
          id INT AUTO_INCREMENT PRIMARY KEY,
          business_id INT NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          duration_minutes INT NULL,
          is_available TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
          INDEX idx_business (business_id),
          INDEX idx_available (is_available)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log('[schema] Created services table');

    }
    const rDur = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['services', 'duration_minutes']
    );
    if (!(Number(rDur?.[0]?.cnt || 0) > 0)) {
      await query('ALTER TABLE services ADD COLUMN duration_minutes INT NULL AFTER price');
      console.log('[schema] Added services.duration_minutes');
    }
    const rAvail = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['services', 'is_available']
    );
    if (!(Number(rAvail?.[0]?.cnt || 0) > 0)) {
      await query('ALTER TABLE services ADD COLUMN is_available TINYINT(1) NOT NULL DEFAULT 1 AFTER duration_minutes');
      console.log('[schema] Added services.is_available');
    }
  } catch (e) {
    console.warn('[schema] ensureServicesColumns failed (non-fatal):', e?.message || e);
  }
}

module.exports = { ensureSettingsColumns, ensureQueueReadyColumns, ensureQueueWaitingColumn, ensureQueuePartySizeColumn, ensureMenuColumns, ensureServicesColumns, ensureQueueInitialEWTColumn };


async function ensureQueueStatusEnum() {
  try {
    const rows = await query(
      'SELECT COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['queues', 'status']
    );
    const info = rows && rows[0] ? rows[0] : {};
    const colType = String(info.COLUMN_TYPE || '').toLowerCase();
    const isNullable = String(info.IS_NULLABLE || '').toUpperCase() === 'YES';
    const def = (info.COLUMN_DEFAULT == null ? null : String(info.COLUMN_DEFAULT).toLowerCase());
    const desired = `enum('pending','waiting','called','pending_payment','served','cancelled','delayed')`;
    const needsAlter = (!colType.includes("'delayed'")) || (!colType.includes("'pending_payment'")) || isNullable || def !== 'pending' || !colType.startsWith('enum(');

    try {
      await query("UPDATE queues SET status='pending' WHERE status IS NULL OR TRIM(status)='' OR status NOT IN ('pending','waiting','called','pending_payment','served','cancelled','delayed')");
    } catch (e) {
      console.warn('[schema] queues.status cleanup failed:', e?.message || e);
    }

    if (needsAlter) {
      await query(`ALTER TABLE queues MODIFY COLUMN status ${desired} NOT NULL DEFAULT 'pending'`);
    }
  } catch (e) {
    console.warn('[schema] ensureQueueStatusEnum failed (non-fatal):', e?.message || e);
  }
}

module.exports.ensureQueueStatusEnum = ensureQueueStatusEnum;


async function ensureUsersPhoneColumn() {
  try {
    const rows = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      ['users', 'phone']
    );
    const has = Number(rows?.[0]?.cnt || 0) > 0;
    if (!has) {
      await query('ALTER TABLE users ADD COLUMN phone VARCHAR(32) NULL AFTER email', []);
      await query('CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone)', []).catch(() => {});
    }
  } catch (e) {
    console.warn('[schema] ensureUsersPhoneColumn failed (non-fatal):', e?.message || e);
  }
}

module.exports.ensureUsersPhoneColumn = ensureUsersPhoneColumn;

// Ensure notification toggles/templates exist 
async function ensureNotificationSettingsColumns() {
  try {
    const toggles = [
      ['notify_via_email', 'TINYINT(1) NOT NULL DEFAULT 0'],
      ['notify_via_sms', 'TINYINT(1) NOT NULL DEFAULT 0'],
      ['sms_notifications_enabled', 'TINYINT(1) NOT NULL DEFAULT 0']
    ];
    for (const [col, type] of toggles) {
      const rows = await query('SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', ['settings', col]);
      const has = Number(rows?.[0]?.cnt || 0) > 0;
      if (!has) {
        await query(`ALTER TABLE settings ADD COLUMN ${col} ${type} AFTER allow_delay`);
      }
    }
    const templates = [
      ['notify_template_email', 'TEXT NULL'],
      ['notify_template_sms', 'TEXT NULL'],
      ['sms_message_template', 'TEXT NULL']
    ];
    for (const [col, type] of templates) {
      const rows = await query('SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', ['settings', col]);
      const has = Number(rows?.[0]?.cnt || 0) > 0;
      if (!has) {
        await query(`ALTER TABLE settings ADD COLUMN ${col} ${type} AFTER notify_via_sms`);
      }
    }
    
  } catch (e) {
    console.warn('[schema] ensureNotificationSettingsColumns failed (non-fatal):', e?.message || e);
  }
}

module.exports.ensureNotificationSettingsColumns = ensureNotificationSettingsColumns;

// Ensure feedback table exists
async function ensureFeedbackTable() {
  try {
    const t = await query(
      'SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
      ['feedback']
    );
    const hasTable = Number(t?.[0]?.cnt || 0) > 0;
    if (!hasTable) {
      await query(`
        CREATE TABLE feedback (
          id INT AUTO_INCREMENT PRIMARY KEY,
          business_id INT NOT NULL,
          queue_id INT NOT NULL,
          rating TINYINT NOT NULL,
          comment TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_feedback_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
          CONSTRAINT fk_feedback_queue FOREIGN KEY (queue_id) REFERENCES queues(id) ON DELETE CASCADE,
          INDEX idx_business_created (business_id, created_at DESC),
          UNIQUE KEY uniq_queue_feedback (queue_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log('[schema] Created feedback table');
    }
  } catch (e) {
    console.warn('[schema] ensureFeedbackTable failed (non-fatal):', e?.message || e);
  }
}

module.exports.ensureFeedbackTable = ensureFeedbackTable;
