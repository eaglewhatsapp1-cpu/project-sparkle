import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

// ==== CONFIGURATION ====
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ==== FILE TYPE DETECTION ====
const TEXT_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "text/xml",
  "application/json",
  "application/xml",
];

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
];

const PDF_MIME_TYPES = [
  "application/pdf",
];

function isTextFile(mimeType: string): boolean {
  return TEXT_MIME_TYPES.some(t => mimeType.startsWith(t));
}

function isImageFile(mimeType: string): boolean {
  return IMAGE_MIME_TYPES.some(t => mimeType === t);
}

function isPdfFile(mimeType: string): boolean {
  return PDF_MIME_TYPES.includes(mimeType);
}

// ==== AI TEXT EXTRACTION (for PDFs and Images) ====
const EXTRACTION_SYSTEM_PROMPT = `You are an advanced document text extraction system. Your job is to extract ALL text content from documents and images.

CAPABILITIES:
- Extract text from PDFs, scanned documents, and images
- Support English and Arabic text (RTL and LTR)
- Handle mixed language documents
- Recognize printed and handwritten text
- Preserve document structure (headings, paragraphs, lists, tables)

INSTRUCTIONS:
1. Extract ALL visible text from the document
2. Preserve the original structure and formatting
3. For tables, format them clearly
4. For unclear text, indicate with [unclear] but attempt to read
5. Do NOT summarize or interpret - extract raw text only
6. If the document appears empty or unreadable, respond with "[No text content detected]"

OUTPUT: Return the extracted text exactly as it appears in the document.`;

async function extractTextWithAI(signedUrl: string, mimeType: string): Promise<string> {
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured for AI extraction");
  }

  console.log(`[AI Extraction] Starting extraction for ${mimeType}`);

  const messages = [
    { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Extract all text content from this document. Preserve structure and include both English and Arabic text if present."
        },
        {
          type: "image_url",
          image_url: { url: signedUrl }
        }
      ]
    }
  ];

  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash", // Vision-capable model for document analysis
      messages
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[AI Extraction] API error: ${response.status}`, errorText);
    throw new Error(`AI extraction failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    console.error("[AI Extraction] No content in response:", JSON.stringify(data));
    throw new Error("AI extraction returned empty content");
  }

  console.log(`[AI Extraction] Successfully extracted ${content.length} characters`);
  return content;
}

// ==== MAIN SERVER ====
serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] Document processing request received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    // ==== AUTHENTICATION ====
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error(`[${requestId}] Missing or invalid Authorization header`);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error(`[${requestId}] Authentication failed:`, authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`[${requestId}] User authenticated: ${user.id}`);

    // ==== PARSE REQUEST ====
    let body: { documentId?: string };
    try {
      body = await req.json();
    } catch {
      console.error(`[${requestId}] Invalid JSON body`);
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const { documentId } = body;

    if (!documentId) {
      console.error(`[${requestId}] Missing documentId`);
      return new Response(JSON.stringify({ error: "documentId is required" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`[${requestId}] Processing document: ${documentId}`);

    // ==== GET DOCUMENT ====
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: docData, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !docData) {
      console.error(`[${requestId}] Document not found:`, docError?.message);
      return new Response(JSON.stringify({ error: "Document not found or access denied" }), { 
        status: 404, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const filePath = docData.file_path;
    const fileType = docData.file_type || "application/octet-stream";
    console.log(`[${requestId}] Document found - Path: ${filePath}, Type: ${fileType}`);

    let extractedContent = "";

    // ==== EXTRACTION STRATEGY ====
    if (isTextFile(fileType)) {
      // STRATEGY 1: Direct text extraction for plain text files
      console.log(`[${requestId}] Using direct text extraction for ${fileType}`);
      
      const { data: fileData, error: storageError } = await supabase.storage
        .from("user-documents")
        .download(filePath);

      if (storageError || !fileData) {
        console.error(`[${requestId}] Storage download error:`, storageError?.message);
        return new Response(JSON.stringify({ error: storageError?.message || "File not found" }), { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      extractedContent = await fileData.text();
      console.log(`[${requestId}] Direct text extraction: ${extractedContent.length} characters`);

    } else if (isPdfFile(fileType) || isImageFile(fileType)) {
      // STRATEGY 2: AI Vision extraction for PDFs and images
      console.log(`[${requestId}] Using AI vision extraction for ${fileType}`);
      
      // Create signed URL for AI to access the file
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("user-documents")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error(`[${requestId}] Failed to create signed URL:`, signedUrlError?.message);
        return new Response(JSON.stringify({ error: "Failed to access document for processing" }), { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      console.log(`[${requestId}] Signed URL created, calling AI extraction...`);
      extractedContent = await extractTextWithAI(signedUrlData.signedUrl, fileType);

    } else {
      // STRATEGY 3: Unsupported file type - try text extraction as fallback
      console.log(`[${requestId}] Unsupported file type ${fileType}, attempting text fallback`);
      
      const { data: fileData, error: storageError } = await supabase.storage
        .from("user-documents")
        .download(filePath);

      if (storageError || !fileData) {
        console.error(`[${requestId}] Storage download error:`, storageError?.message);
        return new Response(JSON.stringify({ error: storageError?.message || "File not found" }), { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      try {
        extractedContent = await fileData.text();
        console.log(`[${requestId}] Fallback text extraction: ${extractedContent.length} characters`);
      } catch {
        extractedContent = `[Content extraction not supported for file type: ${fileType}]`;
        console.log(`[${requestId}] Text extraction failed, using placeholder`);
      }
    }

    // ==== VALIDATE EXTRACTION ====
    if (!extractedContent || extractedContent.trim().length === 0) {
      extractedContent = "[No text content could be extracted from this document]";
      console.log(`[${requestId}] Empty extraction result, using placeholder`);
    }

    // ==== PERSIST CONTENT ====
    const { error: updateError } = await supabase
      .from("documents")
      .update({ content: extractedContent })
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error(`[${requestId}] Failed to update document content:`, updateError.message);
      return new Response(JSON.stringify({ error: "Failed to save extracted content" }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`[${requestId}] SUCCESS - Document ${documentId} updated with ${extractedContent.length} characters`);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Text extracted successfully", 
      contentLength: extractedContent.length,
      extractionMethod: isTextFile(fileType) ? "direct" : isPdfFile(fileType) || isImageFile(fileType) ? "ai-vision" : "fallback"
    }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    console.error(`[${requestId}] Unhandled error:`, error.message, error.stack);
    return new Response(JSON.stringify({ 
      error: error.message || "Document processing failed",
      requestId 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
