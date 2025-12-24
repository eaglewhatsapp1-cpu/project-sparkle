-- Update handle_new_user function to sanitize display_name input
-- This prevents injection of malicious data through signup metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sanitized_display_name TEXT;
BEGIN
  -- Extract and sanitize display_name:
  -- 1. Limit to 255 characters max
  -- 2. Trim whitespace
  -- 3. Return NULL if empty after sanitization
  sanitized_display_name := NULLIF(
    TRIM(
      SUBSTRING(
        COALESCE(new.raw_user_meta_data ->> 'display_name', ''), 
        1, 
        255
      )
    ), 
    ''
  );
  
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, sanitized_display_name);
  
  RETURN new;
END;
$function$;