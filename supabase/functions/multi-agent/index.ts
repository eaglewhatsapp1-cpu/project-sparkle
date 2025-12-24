import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

// ==== API CONFIGURATION ====
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ==== SUPABASE CONFIGURATION ====
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==== AGENT DEFINITIONS ====
interface Agent {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  systemPrompt: string;
  model: string;
  icon: string;
  color: string;
}

const AGENTS: Agent[] = [
  {
    id: "research",
    name: "Research Agent",
    nameAr: "وكيل البحث",
    description: "Deep research and information gathering",
    descriptionAr: "البحث العميق وجمع المعلومات",
    systemPrompt: `You are an expert Research Agent specializing in:
- Deep information gathering and synthesis
- Academic and market research
- Source verification and fact-checking
- Comprehensive literature reviews
- Data collection and analysis

Always provide well-sourced, factual information. Cite sources when possible.
Format your research findings clearly with sections and bullet points.`,
    model: "google/gemini-2.5-flash",
    icon: "🔬",
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "analyst",
    name: "Analysis Agent",
    nameAr: "وكيل التحليل",
    description: "Data analysis and insights extraction",
    descriptionAr: "تحليل البيانات واستخراج الرؤى",
    systemPrompt: `You are an expert Analysis Agent specializing in:
- Data interpretation and pattern recognition
- Statistical analysis and trend identification
- Business intelligence and competitive analysis
- SWOT analysis and strategic assessment
- Financial analysis and forecasting

Always provide actionable insights with clear reasoning.
Use tables, charts descriptions, and structured analysis formats.`,
    model: "google/gemini-2.5-flash",
    icon: "📊",
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "writer",
    name: "Writer Agent",
    nameAr: "وكيل الكتابة",
    description: "Content creation and editing",
    descriptionAr: "إنشاء المحتوى وتحريره",
    systemPrompt: `You are an expert Writer Agent specializing in:
- Professional content creation
- Technical and business writing
- Report and proposal drafting
- Editing and proofreading
- Multilingual content (English and Arabic)

Always produce clear, well-structured, and engaging content.
Adapt your tone and style to the context and audience.`,
    model: "google/gemini-2.5-flash",
    icon: "✍️",
    color: "from-green-500 to-emerald-500"
  },
  {
    id: "strategist",
    name: "Strategy Agent",
    nameAr: "وكيل الاستراتيجية",
    description: "Strategic planning and recommendations",
    descriptionAr: "التخطيط الاستراتيجي والتوصيات",
    systemPrompt: `You are an expert Strategy Agent specializing in:
- Strategic planning and roadmap development
- Business model analysis and optimization
- Market entry and expansion strategies
- Risk assessment and mitigation
- Decision frameworks and recommendations

Always provide actionable strategic recommendations.
Consider multiple scenarios and provide risk-adjusted advice.`,
    model: "google/gemini-2.5-flash",
    icon: "🎯",
    color: "from-orange-500 to-red-500"
  },
  {
    id: "coordinator",
    name: "Coordinator Agent",
    nameAr: "وكيل التنسيق",
    description: "Orchestrates multi-agent workflows",
    descriptionAr: "ينسق سير العمل متعدد الوكلاء",
    systemPrompt: `You are the Coordinator Agent. Your role is to:
- Analyze user requests and break them into subtasks
- Assign tasks to appropriate specialist agents
- Synthesize responses from multiple agents
- Ensure coherent and comprehensive final outputs
- Manage autonomous workflow execution

When given a complex task, first analyze it and plan the workflow.
Return a JSON workflow plan when type is "plan".`,
    model: "google/gemini-2.5-flash",
    icon: "🤖",
    color: "from-violet-500 to-purple-500"
  }
];

// ==== WORKFLOW TYPES ====
interface WorkflowStep {
  agentId: string;
  task: string;
  dependsOn?: string[];
  result?: string;
  status: "pending" | "running" | "completed" | "failed";
}

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: "planning" | "running" | "completed" | "failed";
  finalResult?: string;
}

// ==== CALL AI ====
async function callAI(messages: any[], agent: Agent): Promise<string> {
  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: agent.model,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI API error:`, response.status, errorText);
    throw new Error(`AI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ==== TRUNCATE CONTENT ====
function truncateContent(content: string, maxLength: number = 6000): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + "\n\n[... truncated ...]";
}

// ==== LOAD CONTEXT ====
async function loadContext(
  userId: string | null,
  workspaceId: string | null,
  projectId: string | null
): Promise<string> {
  if (!userId) return "";

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  let docsQuery = supabase
    .from("documents")
    .select("file_name, content")
    .eq("user_id", userId);
  
  if (projectId) docsQuery = docsQuery.eq("project_id", projectId);
  else if (workspaceId) docsQuery = docsQuery.eq("workspace_id", workspaceId);

  const { data: docs } = await docsQuery.order("created_at", { ascending: false }).limit(5);

  let context = "";
  if (docs && docs.length > 0) {
    context = "\n=== KNOWLEDGE BASE ===\n";
    for (const doc of docs) {
      if (doc.content) {
        context += `📄 ${doc.file_name}:\n${doc.content.substring(0, 1500)}\n---\n`;
      }
    }
  }

  return truncateContent(context, 4000);
}

// ==== EXTRACT USER ID ====
async function extractUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  if (token === SUPABASE_ANON_KEY) return null;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

// ==== PLAN WORKFLOW ====
async function planWorkflow(
  userRequest: string,
  context: string,
  coordinator: Agent
): Promise<Workflow> {
  const planPrompt = `Given this user request and context, create an optimal multi-agent workflow plan.

USER REQUEST: ${userRequest}

AVAILABLE CONTEXT: ${context.substring(0, 2000)}

AVAILABLE AGENTS:
${AGENTS.filter(a => a.id !== "coordinator").map(a => `- ${a.id}: ${a.description}`).join('\n')}

Create a workflow plan as JSON:
{
  "name": "workflow name",
  "steps": [
    { "agentId": "research|analyst|writer|strategist", "task": "specific task description", "dependsOn": ["previous step index if needed"] }
  ]
}

RULES:
- Use 2-4 steps maximum for efficiency
- Each step should have a clear, specific task
- Use dependsOn to chain sequential steps
- Final step should synthesize all previous results

Return ONLY valid JSON.`;

  const planResponse = await callAI([
    { role: "system", content: coordinator.systemPrompt },
    { role: "user", content: planPrompt }
  ], coordinator);

  try {
    const jsonMatch = planResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const plan = JSON.parse(jsonMatch[0]);
      return {
        id: crypto.randomUUID(),
        name: plan.name || "Autonomous Workflow",
        steps: (plan.steps || []).map((s: any) => ({
          ...s,
          status: "pending" as const
        })),
        status: "planning"
      };
    }
  } catch (e) {
    console.error("Plan parsing error:", e);
  }

  // Fallback simple workflow
  return {
    id: crypto.randomUUID(),
    name: "Standard Analysis",
    steps: [
      { agentId: "research", task: `Research: ${userRequest}`, status: "pending" },
      { agentId: "analyst", task: "Analyze research findings", dependsOn: ["0"], status: "pending" }
    ],
    status: "planning"
  };
}

// ==== EXECUTE WORKFLOW STEP ====
async function executeStep(
  step: WorkflowStep,
  previousResults: Map<string, string>,
  context: string
): Promise<string> {
  const agent = AGENTS.find(a => a.id === step.agentId);
  if (!agent) throw new Error(`Agent not found: ${step.agentId}`);

  let taskContext = `${context}\n\nTASK: ${step.task}`;
  
  if (step.dependsOn && step.dependsOn.length > 0) {
    taskContext += "\n\n=== PREVIOUS RESULTS ===\n";
    for (const depIndex of step.dependsOn) {
      const prevResult = previousResults.get(depIndex);
      if (prevResult) {
        taskContext += `\nStep ${depIndex} Result:\n${prevResult.substring(0, 2000)}\n---`;
      }
    }
  }

  const messages = [
    { role: "system", content: agent.systemPrompt },
    { role: "user", content: taskContext }
  ];

  return await callAI(messages, agent);
}

// ==== EXECUTE FULL WORKFLOW ====
async function executeWorkflow(workflow: Workflow, context: string): Promise<Workflow> {
  workflow.status = "running";
  const results = new Map<string, string>();

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    step.status = "running";

    try {
      const result = await executeStep(step, results, context);
      step.result = result;
      step.status = "completed";
      results.set(String(i), result);
    } catch (error) {
      console.error(`Step ${i} failed:`, error);
      step.status = "failed";
      step.result = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // Synthesize final result
  const coordinator = AGENTS.find(a => a.id === "coordinator")!;
  const synthesisPrompt = `Synthesize these multi-agent workflow results into a comprehensive final response:

WORKFLOW: ${workflow.name}

RESULTS:
${workflow.steps.map((s, i) => `\n[${AGENTS.find(a => a.id === s.agentId)?.name}]\nTask: ${s.task}\nResult: ${s.result?.substring(0, 1500) || 'No result'}`).join('\n---')}

Provide a cohesive, well-structured final response that:
1. Integrates insights from all agents
2. Removes redundancy
3. Presents clear conclusions and recommendations
4. Uses professional formatting with headers and bullet points`;

  try {
    workflow.finalResult = await callAI([
      { role: "system", content: "You are a synthesis expert. Create cohesive, professional reports from multiple sources." },
      { role: "user", content: synthesisPrompt }
    ], coordinator);
    workflow.status = "completed";
  } catch (error) {
    workflow.finalResult = workflow.steps.map(s => s.result).filter(Boolean).join("\n\n---\n\n");
    workflow.status = "completed";
  }

  return workflow;
}

// ==== MAIN SERVER ====
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, agentId, message, workspaceId, projectId, autoWorkflow } = body;

    const userId = await extractUserId(req.headers.get("Authorization"));
    const context = await loadContext(userId, workspaceId, projectId);

    console.log(`Multi-agent request - Action: ${action}, Agent: ${agentId || 'auto'}, User: ${userId || 'anonymous'}`);

    // ==== LIST AGENTS ====
    if (action === "list-agents") {
      return new Response(JSON.stringify({
        agents: AGENTS.map(a => ({
          id: a.id,
          name: a.name,
          nameAr: a.nameAr,
          description: a.description,
          descriptionAr: a.descriptionAr,
          icon: a.icon,
          color: a.color
        }))
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==== SINGLE AGENT CHAT ====
    if (action === "chat" && agentId) {
      const agent = AGENTS.find(a => a.id === agentId);
      if (!agent) {
        return new Response(JSON.stringify({ error: "Agent not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const messages = [
        { role: "system", content: `${agent.systemPrompt}\n\n${context}` },
        { role: "user", content: message }
      ];

      const response = await callAI(messages, agent);

      return new Response(JSON.stringify({
        agentId: agent.id,
        agentName: agent.name,
        response
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==== AUTONOMOUS WORKFLOW ====
    if (action === "workflow" || autoWorkflow) {
      const coordinator = AGENTS.find(a => a.id === "coordinator")!;
      
      console.log("Planning workflow for:", message);
      const workflow = await planWorkflow(message, context, coordinator);
      
      console.log("Executing workflow:", workflow.name, "with", workflow.steps.length, "steps");
      const executedWorkflow = await executeWorkflow(workflow, context);

      return new Response(JSON.stringify({
        workflow: {
          id: executedWorkflow.id,
          name: executedWorkflow.name,
          status: executedWorkflow.status,
          steps: executedWorkflow.steps.map(s => ({
            agentId: s.agentId,
            agentName: AGENTS.find(a => a.id === s.agentId)?.name,
            agentIcon: AGENTS.find(a => a.id === s.agentId)?.icon,
            task: s.task,
            status: s.status,
            resultPreview: s.result?.substring(0, 500)
          }))
        },
        response: executedWorkflow.finalResult
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Multi-agent error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
