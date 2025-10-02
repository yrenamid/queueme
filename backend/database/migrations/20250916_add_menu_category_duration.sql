
ALTER TABLE menu_items
  ADD COLUMN category VARCHAR(100) NULL AFTER description,
  ADD COLUMN duration_minutes INT NULL AFTER category;

