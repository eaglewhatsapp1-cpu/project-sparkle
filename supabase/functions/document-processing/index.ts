import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Create authenticated client to get user
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const { documentId } = await req.json();

    if (!documentId) {
      return new Response(JSON.stringify({ error: "documentId missing" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Use service role for operations but verify ownership first
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify document ownership - only allow access to user's own documents
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !docData) {
      console.error("Document not found or access denied for user:", user.id);
      return new Response(JSON.stringify({ error: "Document not found or access denied" }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const filePath = docData.file_path;

    const { data: fileData, error: storageError } = await supabase.storage
      .from("user-documents")
      .download(filePath);

    if (storageError || !fileData) {
      console.error("Storage error:", storageError?.message);
      return new Response(JSON.stringify({ error: storageError?.message || "File not found" }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    let content = "";
    const fileType = docData.file_type || fileData.type;

    // Extract text based on file type
    if (fileType === "text/plain" || fileType === "text/markdown") {
      content = await fileData.text();
    } else {
      // For unsupported types, store raw text if available
      try {
        content = await fileData.text();
      } catch {
        content = "[Content extraction not supported for this file type]";
      }
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update({ content })
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Update error:", updateError.message);
      return new Response(JSON.stringify({ error: updateError.message }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`Document ${documentId} content extracted successfully for user ${user.id}`);

    return new Response(JSON.stringify({ message: "Text extracted successfully", content }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    console.error("Error extracting document:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
