-- Add ai_instructions column to projects table for project-level AI behavior
ALTER TABLE public.projects 
ADD COLUMN ai_instructions TEXT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.ai_instructions IS 'Custom AI instructions specific to this project, overrides user-level settings';