
-- Fix signed avatar URLs across all tables: convert /object/sign/... to /object/public/... and strip ?token=...

-- profile_guestbook.author_avatar
UPDATE public.profile_guestbook
SET author_avatar = regexp_replace(
  regexp_replace(author_avatar, '/object/sign/', '/object/public/'),
  '\?token=.*$', ''
)
WHERE author_avatar LIKE '%/object/sign/%';

-- klotter.author_avatar
UPDATE public.klotter
SET author_avatar = regexp_replace(
  regexp_replace(author_avatar, '/object/sign/', '/object/public/'),
  '\?token=.*$', ''
)
WHERE author_avatar LIKE '%/object/sign/%';

-- lajv_messages.avatar_url
UPDATE public.lajv_messages
SET avatar_url = regexp_replace(
  regexp_replace(avatar_url, '/object/sign/', '/object/public/'),
  '\?token=.*$', ''
)
WHERE avatar_url LIKE '%/object/sign/%';

-- news_comments.author_avatar
UPDATE public.news_comments
SET author_avatar = regexp_replace(
  regexp_replace(author_avatar, '/object/sign/', '/object/public/'),
  '\?token=.*$', ''
)
WHERE author_avatar LIKE '%/object/sign/%';

-- snake_highscores.avatar_url
UPDATE public.snake_highscores
SET avatar_url = regexp_replace(
  regexp_replace(avatar_url, '/object/sign/', '/object/public/'),
  '\?token=.*$', ''
)
WHERE avatar_url LIKE '%/object/sign/%';

-- memory_highscores.avatar_url (precautionary)
UPDATE public.memory_highscores
SET avatar_url = regexp_replace(
  regexp_replace(avatar_url, '/object/sign/', '/object/public/'),
  '\?token=.*$', ''
)
WHERE avatar_url LIKE '%/object/sign/%';

-- guestbook_entries.author_avatar
UPDATE public.guestbook_entries
SET author_avatar = regexp_replace(
  regexp_replace(author_avatar, '/object/sign/', '/object/public/'),
  '\?token=.*$', ''
)
WHERE author_avatar LIKE '%/object/sign/%';

-- profiles.avatar_url (precautionary)
UPDATE public.profiles
SET avatar_url = regexp_replace(
  regexp_replace(avatar_url, '/object/sign/', '/object/public/'),
  '\?token=.*$', ''
)
WHERE avatar_url LIKE '%/object/sign/%';

-- avatar_uploads.image_url (precautionary)
UPDATE public.avatar_uploads
SET image_url = regexp_replace(
  regexp_replace(image_url, '/object/sign/', '/object/public/'),
  '\?token=.*$', ''
)
WHERE image_url LIKE '%/object/sign/%';

-- scribble_players.avatar_url (precautionary)
UPDATE public.scribble_players
SET avatar_url = regexp_replace(
  regexp_replace(avatar_url, '/object/sign/', '/object/public/'),
  '\?token=.*$', ''
)
WHERE avatar_url LIKE '%/object/sign/%';

-- bot_settings.avatar_url (precautionary)
UPDATE public.bot_settings
SET avatar_url = regexp_replace(
  regexp_replace(avatar_url, '/object/sign/', '/object/public/'),
  '\?token=.*$', ''
)
WHERE avatar_url LIKE '%/object/sign/%';
