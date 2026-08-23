ALTER TABLE app_settings ADD COLUMN allowed_languages TEXT[] NOT NULL
  DEFAULT ARRAY['en', 'bn', 'fr', 'zh', 'es', 'de', 'hi', 'ar', 'ja', 'pt', 'it', 'ko'];
