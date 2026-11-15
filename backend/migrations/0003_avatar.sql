-- Profile photo: a small data URL (the client resizes to 128px JPEG before upload).
-- Nullable; NULL means the account shows the usual initial letter.
ALTER TABLE users ADD COLUMN avatar TEXT;
