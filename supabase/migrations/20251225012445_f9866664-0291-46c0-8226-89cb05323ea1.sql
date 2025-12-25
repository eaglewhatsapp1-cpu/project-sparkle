-- Add DELETE policy for chat_logs table to allow users to delete their own chat history (GDPR compliance)
CREATE POLICY "Users can delete their own chat logs" 
ON public.chat_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add UPDATE policy for chat_logs table to allow users to update their own chat logs
CREATE POLICY "Users can update their own chat logs" 
ON public.chat_logs 
FOR UPDATE 
USING (auth.uid() = user_id);