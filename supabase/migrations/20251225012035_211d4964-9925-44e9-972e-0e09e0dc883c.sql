-- Add UPDATE policy for documents table to allow users to update their own documents
CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id);