import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ==== LOVABLE AI CONFIGURATION ====
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ==== SUPABASE CONFIGURATION ====
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ==== CORS HEADERS ====
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ==== INPUT VALIDATION SCHEMA ====
const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(30),
  type: z.enum(["chat", "questions", "summary", "enhance"]).optional().default("chat"),
  country: z.string().max(100).optional(),
  workspaceId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
});

// ==== CONTENT TRUNCATION HELPER ====
const MAX_CONTENT_LENGTH = 7500;

function truncateContent(content: string, maxLength: number = MAX_CONTENT_LENGTH): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "\n\n[... content truncated ...]";
}

function truncateMessages(messages: any[]): any[] {
  return messages.map(msg => ({
    ...msg,
    content: typeof msg.content === 'string' ? truncateContent(msg.content) : msg.content
  }));
}

// ==== RATE LIMITING ====
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_REQUESTS) return false;
  record.count++;
  return true;
}

// ==== LOAD USER KNOWLEDGE BASE ====
async function loadUserKnowledgeBase(
  userId: string | null, 
  workspaceId: string | null | undefined, 
  projectId: string | null | undefined
): Promise<{ documents: string; customPrompt: string | null; companyName: string | null; imageUrls: string[] }> {
  if (!userId) return { documents: "", customPrompt: null, companyName: null, imageUrls: [] };

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  let docsQuery = supabase
    .from("documents")
    .select("file_name, content, file_type, file_path, created_at")
    .eq("user_id", userId);
  
  if (projectId) docsQuery = docsQuery.eq("project_id", projectId);
  else if (workspaceId) docsQuery = docsQuery.eq("workspace_id", workspaceId);

  const { data: docs, error: docsError } = await docsQuery.order("created_at", { ascending: false });
  if (docsError) console.error("Error fetching documents:", docsError);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("system_prompt, company_name, display_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) console.error("Error fetching profile:", profileError);

  let documentsContent = "";
  const imageUrls: string[] = [];
  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (docs && docs.length > 0) {
    documentsContent = "\n\n=== USER'S KNOWLEDGE BASE ===\n";
    documentsContent += `Total files: ${docs.length}\n\n`;
    
    const MAX_DOC_LENGTH = 2000;
    const MAX_TOTAL_DOCS = 4000;
    
    for (const [index, doc] of docs.entries()) {
      if (documentsContent.length >= MAX_TOTAL_DOCS) {
        documentsContent += `\n[... ${docs.length - index} more files available ...]`;
        break;
      }
      
      if (doc.file_type && IMAGE_TYPES.includes(doc.file_type)) {
        documentsContent += `🖼️ IMAGE ${index + 1}: ${doc.file_name}\n`;
        documentsContent += `   [Image available for visual analysis]\n\n`;
        
        if (doc.file_path && imageUrls.length < 3) {
          const { data: signedUrlData } = await supabase.storage
            .from('user-documents')
            .createSignedUrl(doc.file_path, 3600);
          
          if (signedUrlData?.signedUrl) {
            imageUrls.push(signedUrlData.signedUrl);
          }
        }
      } else if (doc.content) {
        const contentPreview = doc.content.length > MAX_DOC_LENGTH 
          ? doc.content.substring(0, MAX_DOC_LENGTH) + "\n... [truncated]" 
          : doc.content;
        documentsContent += `📄 DOCUMENT ${index + 1}: ${doc.file_name}\n`;
        documentsContent += `---\n${contentPreview}\n---\n\n`;
      }
    }
  }

  return {
    documents: documentsContent,
    customPrompt: profile?.system_prompt || null,
    companyName: profile?.company_name || null,
    imageUrls,
  };
}

// ==== FETCH USER COUNTRIES ====
async function fetchUserCountries(userId: string | null): Promise<string> {
  if (!userId) return "";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: countries, error } = await supabase
    .from("countries")
    .select("*")
    .eq("user_id", userId);

  if (error || !countries || countries.length === 0) return "";

  let countriesContext = "\n\n=== USER'S MARKET DATA ===\n\n";
  countries.forEach((country) => {
    countriesContext += `🌍 ${country.name_en} (${country.code})\n`;
    countriesContext += `   KPI: ${country.kpi || 'N/A'}\n`;
    countriesContext += `   Volume: ${country.volume_en || 'N/A'}\n`;
    countriesContext += `   Strategy: ${country.strategy_en || 'N/A'}\n`;
    if (country.opportunities_en?.length) countriesContext += `   Opportunities: ${country.opportunities_en.join(', ')}\n`;
    countriesContext += "\n";
  });

  return countriesContext;
}

// ==== CALL LOVABLE AI ====
async function callLovableAI(
  messages: any[], 
  model: string = "google/gemini-2.5-flash",
  imageUrls: string[] = []
): Promise<string> {
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  let processedMessages = [...messages];
  
  if (imageUrls.length > 0 && processedMessages.length > 0) {
    const lastUserMsgIndex = processedMessages.map(m => m.role).lastIndexOf("user");
    if (lastUserMsgIndex >= 0) {
      const lastUserMsg = processedMessages[lastUserMsgIndex];
      const imageContent = imageUrls.slice(0, 5).map(url => ({
        type: "image_url",
        image_url: { url }
      }));
      
      processedMessages[lastUserMsgIndex] = {
        role: "user",
        content: [
          { type: "text", text: lastUserMsg.content },
          ...imageContent
        ]
      };
    }
  }

  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages: processedMessages }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI Gateway error:", response.status, errorText);
    if (response.status === 429) {
      return JSON.stringify({ error: "Rate limit exceeded. Please try again later." });
    }
    if (response.status === 402) {
      return JSON.stringify({ error: "Payment required. Please add credits." });
    }
    throw new Error(`AI error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from AI");

  return content;
}

// ==== EXTRACT USER ID FROM AUTH HEADER ====
async function extractUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  if (token === SUPABASE_ANON_KEY) return null;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

// ==== BUILD SYSTEM PROMPT ====
function buildSystemPrompt(
  type: string,
  documents: string,
  countriesContext: string,
  customPrompt: string | null,
  companyName: string | null,
  country?: string
): string {
  const companyContext = companyName ? `You are assisting ${companyName}. ` : "";

  const basePrompt = `${companyContext}You are an expert AI research assistant with capabilities in:
- Market analysis and business intelligence
- Document analysis and summarization
- Image analysis and visual data extraction
- Data interpretation and insights generation
- Academic and scientific research support
- Competitive analysis and strategic planning

You can analyze text documents, images, charts, and data files uploaded by the user.

=== CONTEXT ===
${documents}
${countriesContext}
${customPrompt ? `\n=== USER'S CUSTOM INSTRUCTIONS ===\n${customPrompt}` : ""}`;

  let typePrompt = "";
  if (type === "questions") typePrompt = "\nGenerate exactly 5 analytical questions in JSON array format.";
  if (type === "summary") typePrompt = "\nGenerate an executive summary based on the context.";
  if (type === "enhance") typePrompt = "\nEnhance the user's prompt to be more specific and comprehensive. Return ONLY the enhanced prompt.";

  const countryFocus = country ? `\n🎯 FOCUS MARKET: ${country}` : "";

  return basePrompt + typePrompt + countryFocus;
}

// ==== MAIN SERVER ====
serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { 
        status: 429, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    let body: any = {};
    try { 
      body = JSON.parse(await req.text() || "{}"); 
    } catch { 
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }); 
    }

    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Validation error", details: validation.error.errors }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const { messages, type, country, workspaceId, projectId } = validation.data;
    const userId = await extractUserId(req.headers.get("Authorization"));

    console.log(`AI Chat request - Type: ${type}, User: ${userId || 'anonymous'}`);

    const { documents, customPrompt, companyName, imageUrls } = await loadUserKnowledgeBase(userId, workspaceId, projectId);
    const countriesContext = await fetchUserCountries(userId);

    const systemPrompt = buildSystemPrompt(type, documents, countriesContext, customPrompt, companyName, country);
    const truncatedSystemPrompt = truncateContent(systemPrompt);
    const truncatedUserMessages = truncateMessages(messages);
    const aiMessages = [{ role: "system", content: truncatedSystemPrompt }, ...truncatedUserMessages];

    const modelToUse = imageUrls.length > 0 ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash";
    
    let content: string;
    try { 
      content = await callLovableAI(aiMessages, modelToUse, imageUrls); 
    } catch (err: any) {
      console.error("AI call error:", err);
      return new Response(JSON.stringify({ error: err.message || "AI service error" }), { 
        status: 502, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Parse questions if type is questions
    let questions: string[] = [];
    if (type === "questions") {
      try {
        const jsonMatch = content.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          questions = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // If parsing fails, extract numbered questions
        const lines = content.split('\n');
        questions = lines
          .filter((line: string) => /^\d+[\.\)]\s/.test(line.trim()) || /^[-*]\s/.test(line.trim()))
          .map((line: string) => line.replace(/^[\d\.\)\-*\s]+/, '').trim())
          .filter((q: string) => q.length > 10)
          .slice(0, 5);
      }
    }

    console.log(`AI Chat response - Type: ${type}, Content length: ${content.length}`);

    return new Response(JSON.stringify({ 
      response: content,
      questions: questions.length > 0 ? questions : undefined
    }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    console.error("AI Chat error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
