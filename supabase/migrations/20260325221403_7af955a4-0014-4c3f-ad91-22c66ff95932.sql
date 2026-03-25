ALTER TABLE profiles DROP CONSTRAINT IF EXISTS presentation_length_check;
ALTER TABLE profiles ADD CONSTRAINT presentation_length_check CHECK (char_length(presentation) <= 10000);