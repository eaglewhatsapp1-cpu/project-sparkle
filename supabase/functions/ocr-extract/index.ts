import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

// ==== LOVABLE AI CONFIGURATION ====
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ==== SUPABASE CONFIGURATION ====
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ==== OCR SYSTEM PROMPT ====
const OCR_SYSTEM_PROMPT = `You are an advanced OCR (Optical Character Recognition) system specialized in extracting text from images and documents.

Your capabilities:
- Extract ALL text from images, PDFs, and scanned documents
- Support for both English and Arabic text (RTL and LTR)
- Handle mixed language documents
- Recognize handwritten and printed text
- Preserve document structure when possible (headings, paragraphs, lists, tables)
- Handle low-quality scans and images

IMPORTANT INSTRUCTIONS:
1. Extract ALL visible text from the image/document
2. For Arabic text, maintain correct RTL reading order
3. For mixed Arabic/English, clearly separate and label each section
4. Preserve the original structure as much as possible
5. If text is unclear, indicate with [unclear] but still attempt to read it
6. For tables, format them clearly with proper alignment
7. Do NOT summarize or interpret - just extract the raw text

OUTPUT FORMAT:
- Return the extracted text exactly as it appears
- Use clear section breaks where appropriate
- Indicate the language of each section if mixed
- Format: [ENGLISH] or [ARABIC] or [العربية] before each language section`;

// ==== EXTRACT USER ID ====
async function extractUserId(authHeader: string | null): Promise<{ userId: string | null; error: string | null }> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { userId: null, error: "Authentication required" };
  }

  const token = authHeader.replace("Bearer ", "");
  if (token === SUPABASE_ANON_KEY) {
    return { userId: null, error: "Authentication required" };
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return { userId: null, error: "Invalid or expired token" };
    }
    return { userId: user.id, error: null };
  } catch {
    return { userId: null, error: "Authentication failed" };
  }
}

// ==== CALL LOVABLE AI WITH VISION ====
async function performOCR(imageUrl: string, mimeType?: string): Promise<string> {
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const messages = [
    { role: "system", content: OCR_SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Extract all text from this image/document. Include both English and Arabic text if present. Preserve the structure and formatting."
        },
        {
          type: "image_url",
          image_url: { url: imageUrl }
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
      model: "google/gemini-2.5-flash", // Vision-capable model
      messages
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI Gateway error:", response.status, errorText);
    throw new Error(`OCR processing failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No text extracted from image");

  return content;
}

// ==== MAIN SERVER ====
serve(async (req) => {
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
    // Authenticate user
    const { userId, error: authError } = await extractUserId(req.headers.get("Authorization"));
    if (authError || !userId) {
      return new Response(JSON.stringify({ error: authError || "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { documentId, imageUrl } = await req.json();

    if (!documentId && !imageUrl) {
      return new Response(JSON.stringify({ error: "documentId or imageUrl required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let urlToProcess = imageUrl;
    let docData = null;

    // If documentId provided, get the document and create signed URL
    if (documentId) {
      const { data: document, error: docError } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .eq("user_id", userId)
        .single();

      if (docError || !document) {
        return new Response(JSON.stringify({ error: "Document not found or access denied" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      docData = document;

      // Create signed URL for the document
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("user-documents")
        .createSignedUrl(document.file_path, 3600);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error("Failed to create signed URL:", signedUrlError);
        return new Response(JSON.stringify({ error: "Failed to access document" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      urlToProcess = signedUrlData.signedUrl;
    }

    console.log(`OCR request - User: ${userId}, Document: ${documentId || 'direct URL'}`);

    // Perform OCR
    const extractedText = await performOCR(urlToProcess, docData?.file_type);

    // If documentId provided, update the document content
    if (documentId && docData) {
      const { error: updateError } = await supabase
        .from("documents")
        .update({ content: extractedText })
        .eq("id", documentId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("Failed to update document content:", updateError);
      } else {
        console.log(`Document ${documentId} OCR content updated successfully`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      extractedText,
      documentId: documentId || null,
      message: "Text extracted successfully"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("OCR error:", error);
    return new Response(JSON.stringify({ error: error.message || "OCR processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
