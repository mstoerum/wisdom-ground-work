import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Demo survey ID - fixed for consistent demo experience
const DEMO_SURVEY_ID = "99e58381-8736-4641-a2d3-632c809dd29b";

// Demo company context
const demoCompany = {
  name: "Nexus Technologies",
  employeeCount: 320,
  surveyName: "Post-Product Launch Pulse",
  surveyPeriod: "February 2025",
};

// Theme definitions
const demoThemes = [
  { id: "a1b2c3d4-0001-4000-8000-000000000001", name: "Work-Life Balance", description: "Expectations around working hours and boundaries", survey_type: "employee_satisfaction" },
  { id: "a1b2c3d4-0002-4000-8000-000000000002", name: "Post-Launch Culture", description: "How organizational culture shifted after Q4 product launch", survey_type: "employee_satisfaction" },
  { id: "a1b2c3d4-0003-4000-8000-000000000003", name: "Leadership & Communication", description: "Manager support and organizational transparency", survey_type: "employee_satisfaction" },
  { id: "a1b2c3d4-0004-4000-8000-000000000004", name: "Career Growth", description: "Development opportunities and progression", survey_type: "employee_satisfaction" },
  { id: "a1b2c3d4-0005-4000-8000-000000000005", name: "Team Collaboration", description: "Team dynamics and working relationships", survey_type: "employee_satisfaction" },
];

const departments = ["Engineering", "Product", "Design", "Sales", "Marketing"];

// =============================================================================
// CONVERSATION TEMPLATES - Rich semantic patterns for the analytics engine
// =============================================================================

interface Exchange {
  user: string;
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  theme: string; // theme id
}

interface ConversationTemplate {
  mood: { initial: number; final: number };
  department: string;
  pattern: string;
  exchanges: Exchange[];
}

// Pattern 1: "I love my work, but..." - Hidden burnout masked by pride
const hiddenBurnoutConversations: ConversationTemplate[] = [
  {
    mood: { initial: 7, final: 4 },
    department: "Engineering",
    pattern: "hidden-burnout",
    exchanges: [
      { user: "I genuinely love what we're building here. The product is something I'm really proud of.", sentiment: "positive", score: 78, theme: "a1b2c3d4-0002-4000-8000-000000000002" },
      { user: "But I haven't had a real weekend in about two months now. My partner is starting to notice.", sentiment: "negative", score: 32, theme: "a1b2c3d4-0001-4000-8000-000000000001" },
      { user: "It's hard because I don't want to seem uncommitted. Everyone else seems fine with it.", sentiment: "negative", score: 41, theme: "a1b2c3d4-0002-4000-8000-000000000002" }
    ]
  },
  {
    mood: { initial: 8, final: 5 },
    department: "Engineering",
    pattern: "hidden-burnout",
    exchanges: [
      { user: "The launch was incredible - seeing our work go live felt amazing.", sentiment: "positive", score: 85, theme: "a1b2c3d4-0002-4000-8000-000000000002" },
      { user: "I just wish I could have celebrated it instead of immediately jumping to the next sprint.", sentiment: "neutral", score: 45, theme: "a1b2c3d4-0001-4000-8000-000000000001" },
      { user: "My therapist says I'm showing signs of burnout. But how do you say that when you're proud of what you built?", sentiment: "negative", score: 28, theme: "a1b2c3d4-0001-4000-8000-000000000001" }
    ]
  },
  {
    mood: { initial: 7, final: 4 },
    department: "Product",
    pattern: "hidden-burnout",
    exchanges: [
      { user: "Being part of this launch is a career highlight. I tell everyone about what we shipped.", sentiment: "positive", score: 82, theme: "a1b2c3d4-0004-4000-8000-000000000004" },
      { user: "But I missed my daughter's first steps because I was in a 'critical' meeting. That haunts me.", sentiment: "negative", score: 18, theme: "a1b2c3d4-0001-4000-8000-000000000001" }
    ]
  },
  {
    mood: { initial: 6, final: 4 },
    department: "Engineering",
    pattern: "hidden-burnout",
    exchanges: [
      { user: "I'm passionate about the technology. The architecture we've built is genuinely innovative.", sentiment: "positive", score: 75, theme: "a1b2c3d4-0004-4000-8000-000000000004" },
      { user: "I've gained 15 pounds since October. I don't exercise anymore. I just code and sleep.", sentiment: "negative", score: 22, theme: "a1b2c3d4-0001-4000-8000-000000000001" },
      { user: "It feels impossible to raise this because the product is successful. Success hides the cost.", sentiment: "negative", score: 35, theme: "a1b2c3d4-0002-4000-8000-000000000002" }
    ]
  },
  {
    mood: { initial: 8, final: 5 },
    department: "Design",
    pattern: "hidden-burnout",
    exchanges: [
      { user: "The design system we created is beautiful. I put my heart into every component.", sentiment: "positive", score: 88, theme: "a1b2c3d4-0004-4000-8000-000000000004" },
      { user: "But I haven't seen my friends in months. They've stopped inviting me to things.", sentiment: "negative", score: 30, theme: "a1b2c3d4-0001-4000-8000-000000000001" }
    ]
  },
  {
    mood: { initial: 7, final: 3 },
    department: "Engineering",
    pattern: "hidden-burnout",
    exchanges: [
      { user: "I love solving hard problems. The technical challenges here are exactly what I wanted in my career.", sentiment: "positive", score: 80, theme: "a1b2c3d4-0004-4000-8000-000000000004" },
      { user: "But I'm exhausted. Not just tired - exhausted in a way that sleep doesn't fix.", sentiment: "negative", score: 25, theme: "a1b2c3d4-0001-4000-8000-000000000001" },
      { user: "I had a panic attack last month. First one ever. Haven't told anyone at work.", sentiment: "negative", score: 15, theme: "a1b2c3d4-0001-4000-8000-000000000001" }
    ]
  },
  {
    mood: { initial: 8, final: 4 },
    department: "Engineering",
    pattern: "hidden-burnout",
    exchanges: [
      { user: "The impact we're having is real. Users love the product and that's incredibly motivating.", sentiment: "positive", score: 85, theme: "a1b2c3d4-0002-4000-8000-000000000002" },
      { user: "I just... I can't remember the last time I read a book or had a hobby.", sentiment: "negative", score: 38, theme: "a1b2c3d4-0001-4000-8000-000000000001" }
    ]
  },
  {
    mood: { initial: 6, final: 4 },
    department: "Product",
    pattern: "hidden-burnout",
    exchanges: [
      { user: "I believe in this company's mission. That's why I push myself so hard.", sentiment: "positive", score: 72, theme: "a1b2c3d4-0002-4000-8000-000000000002" },
      { user: "But my doctor says my blood pressure is concerning for someone my age.", sentiment: "negative", score: 28, theme: "a1b2c3d4-0001-4000-8000-000000000001" }
    ]
  },
  {
    mood: { initial: 7, final: 4 },
    department: "Engineering",
    pattern: "hidden-burnout",
    exchanges: [
      { user: "We shipped something really special. Customers are genuinely delighted.", sentiment: "positive", score: 82, theme: "a1b2c3d4-0002-4000-8000-000000000002" },
      { user: "My relationship is suffering though. We barely talk anymore because I'm always working.", sentiment: "negative", score: 25, theme: "a1b2c3d4-0001-4000-8000-000000000001" }
    ]
  },
  {
    mood: { initial: 8, final: 5 },
    department: "Engineering",
    pattern: "hidden-burnout",
    exchanges: [
      { user: "The engineering culture here is fantastic. Smart people who care about craft.", sentiment: "positive", score: 85, theme: "a1b2c3d4-0005-4000-8000-000000000005" },
      { user: "I just wish 'caring about craft' didn't mean working 60-hour weeks consistently.", sentiment: "negative", score: 35, theme: "a1b2c3d4-0001-4000-8000-000000000001" }
    ]
  },
];

// Pattern 2: "10pm Slack expectation" - Implicit after-hours pressure
const afterHoursConversations: ConversationTemplate[] = [
  {
    mood: { initial: 5, final: 4 },
    department: "Engineering",
    pattern: "after-hours",
    exchanges: [
      { user: "Nobody explicitly says you have to reply at night. But when your manager messages at 10pm, you feel the pressure to respond.", sentiment: "negative", score: 28, theme: "a1b2c3d4-0001-4000-8000-000000000001" },
      { user: "It started during the launch crunch and just... never stopped.", sentiment: "negative", score: 35, theme: "a1b2c3d4-0002-4000-8000-000000000002" }
    ]
  },
  {
    mood: { initial: 5, final: 4 },
    department: "Product",
    pattern: "after-hours",
    exchanges: [
      { user: "I get Slack notifications at 11pm regularly. The unspoken rule is to respond within an hour.", sentiment: "negative", score: 32, theme: "a1b2c3d4-0001-4000-8000-000000000001" },
      { user: "My partner asked me to turn off notifications but I'm afraid I'll miss something important.", sentiment: "negative", score: 38, theme: "a1b2c3d4-0001-4000-8000-000000000001" }
    ]
  },
  {
    mood: { initial: 6, final: 3 },
    department: "Engineering",
    pattern: "after-hours",
    exchanges: [
      { user: "The VP sent an email at 2am last week asking for a status update. By 8am everyone had replied.", sentiment: "negative", score: 25, theme: "a1b2c3d4-0003-4000-8000-000000000003" },
      { user: "That tells you everything about what's expected here.", sentiment: "negative", score: 30, theme: "a1b2c3d4-0002-4000-8000-000000000002" }
    ]
  },
  {
    mood: { initial: 5, final: 4 },
    department: "Design",
    pattern: "after-hours",
    exchanges: [
      { user: "I've started keeping my laptop next to my bed. Just in case something comes in.", sentiment: "negative", score: 28, theme: "a1b2c3d4-0001-4000-8000-000000000001" },
      { user: "It's not healthy, I know. But I saw someone get 'feedback' for a slow response once.", sentiment: "negative", score: 32, theme: "a1b2c3d4-0003-4000-8000-000000000003" }
    ]
  },
  {
    mood: { initial: 6, final: 4 },
    department: "Engineering",
    pattern: "after-hours",
    exchanges: [
      { user: "Weekend work is just expected now. Nobody asks, everyone just knows.", sentiment: "negative", score: 35, theme: "a1b2c3d4-0001-4000-8000-000000000001" },
      { user: "The irony is we're supposed to be building work-life balance tools for our users.", sentiment: "neutral", score: 42, theme: "a1b2c3d4-0002-4000-8000-000000000002" }
    ]
  },
  {
    mood: { initial: 5, final: 3 },
    department: "Engineering",
    pattern: "after-hours",
    exchanges: [
      { user: "Last Sunday I was at my kid's birthday party and had to step out for a 'quick call' that lasted 2 hours.", sentiment: "negative", score: 22, theme: "a1b2c3d4-0001-4000-8000-000000000001" },
      { user: "The look on my kid's face... I don't want to be that parent.", sentiment: "negative", score: 18, theme: "a1b2c3d4-0001-4000-8000-000000000001" }
    ]
  },
  {
    mood: { initial: 5, final: 4 },
    department: "Sales",
    pattern: "after-hours",
    exchanges: [
      { user: "Clients know they can reach us anytime. That became a selling point somewhere along the way.", sentiment: "negative", score: 35, theme: "a1b2c3d4-0002-4000-8000-000000000002" },
      { user: "Now we're expected to live up to that promise. But it's not sustainable.", sentiment: "negative", score: 30, theme: "a1b2c3d4-0001-4000-8000-000000000001" }
    ]
  },
  {
    mood: { initial: 6, final: 4 },
    department: "Engineering",
    pattern: "after-hours",
    exchanges: [
      { user: "There's this implicit 'always on' culture that nobody talks about but everyone feels.", sentiment: "negative", score: 32, theme: "a1b2c3d4-0002-4000-8000-000000000002" },
      { user: "Even vacations don't feel like vacations anymore. I'm always checking my phone.", sentiment: "negative", score: 28, theme: "a1b2c3d4-0001-4000-8000-000000000001" }
    ]
  },
];

// Pattern 3: Career Growth - POSITIVE pattern to show contrast
const careerGrowthConversations: ConversationTemplate[] = [
  {
    mood: { initial: 7, final: 8 },
    department: "Engineering",
    pattern: "career-growth",
    exchanges: [
      { user: "The mentorship program has been incredible. Sarah has really helped me navigate the technical landscape.", sentiment: "positive", score: 88, theme: "a1b2c3d4-0004-4000-8000-000000000004" },
      { user: "I feel like I've grown more in 6 months here than 2 years at my last job.", sentiment: "positive", score: 85, theme: "a1b2c3d4-0004-4000-8000-000000000004" }
    ]
  },
  {
    mood: { initial: 7, final: 9 },
    department: "Product",
    pattern: "career-growth",
    exchanges: [
      { user: "Leadership genuinely invests in our development. The learning budget is real and easy to use.", sentiment: "positive", score: 90, theme: "a1b2c3d4-0004-4000-8000-000000000004" },
      { user: "I took a design thinking course last month that directly improved my work.", sentiment: "positive", score: 82, theme: "a1b2c3d4-0004-4000-8000-000000000004" }
    ]
  },
  {
    mood: { initial: 6, final: 8 },
    department: "Design",
    pattern: "career-growth",
    exchanges: [
      { user: "The exposure to different parts of the product has been amazing for my portfolio.", sentiment: "positive", score: 85, theme: "a1b2c3d4-0004-4000-8000-000000000004" },
      { user: "My manager creates a development plan with me every quarter. It's not just lip service.", sentiment: "positive", score: 88, theme: "a1b2c3d4-0003-4000-8000-000000000003" }
    ]
  },
  {
    mood: { initial: 7, final: 8 },
    department: "Engineering",
    pattern: "career-growth",
    exchanges: [
      { user: "The tech stack here is modern and we're encouraged to experiment with new tools.", sentiment: "positive", score: 82, theme: "a1b2c3d4-0004-4000-8000-000000000004" },
      { user: "Conference attendance is supported, and they actually want us to share what we learn.", sentiment: "positive", score: 85, theme: "a1b2c3d4-0004-4000-8000-000000000004" }
    ]
  },
  {
    mood: { initial: 6, final: 8 },
    department: "Marketing",
    pattern: "career-growth",
    exchanges: [
      { user: "The cross-functional projects have given me visibility I wouldn't get elsewhere.", sentiment: "positive", score: 80, theme: "a1b2c3d4-0004-4000-8000-000000000004" },
      { user: "My career path here feels genuinely exciting.", sentiment: "positive", score: 85, theme: "a1b2c3d4-0004-4000-8000-000000000004" }
    ]
  },
  {
    mood: { initial: 7, final: 9 },
    department: "Engineering",
    pattern: "career-growth",
    exchanges: [
      { user: "The code review culture here is excellent - I learn something from every PR.", sentiment: "positive", score: 85, theme: "a1b2c3d4-0004-4000-8000-000000000004" },
      { user: "Senior engineers are genuinely invested in helping juniors grow.", sentiment: "positive", score: 88, theme: "a1b2c3d4-0004-4000-8000-000000000004" }
    ]
  },
];

// Pattern 4: Team Collaboration - Mixed signals
const teamCollaborationConversations: ConversationTemplate[] = [
  {
    mood: { initial: 6, final: 7 },
    department: "Engineering",
    pattern: "team-collaboration",
    exchanges: [
      { user: "The engineering team has great camaraderie. We help each other debug at 2am.", sentiment: "positive", score: 72, theme: "a1b2c3d4-0005-4000-8000-000000000005" },
      { user: "Though I wish we didn't need to be debugging at 2am in the first place.", sentiment: "neutral", score: 50, theme: "a1b2c3d4-0001-4000-8000-000000000001" }
    ]
  },
  {
    mood: { initial: 7, final: 7 },
    department: "Product",
    pattern: "team-collaboration",
    exchanges: [
      { user: "Cross-team collaboration has improved since the launch. We learned to work together under pressure.", sentiment: "positive", score: 75, theme: "a1b2c3d4-0005-4000-8000-000000000005" }
    ]
  },
  {
    mood: { initial: 5, final: 5 },
    department: "Design",
    pattern: "team-collaboration",
    exchanges: [
      { user: "Engineering and design have some friction around handoffs, but we're working on it.", sentiment: "neutral", score: 52, theme: "a1b2c3d4-0005-4000-8000-000000000005" },
      { user: "The tension usually comes when deadlines are tight. Which is always now.", sentiment: "negative", score: 42, theme: "a1b2c3d4-0002-4000-8000-000000000002" }
    ]
  },
  {
    mood: { initial: 7, final: 6 },
    department: "Engineering",
    pattern: "team-collaboration",
    exchanges: [
      { user: "Our team bonding is actually strong because we've been through so much together.", sentiment: "positive", score: 78, theme: "a1b2c3d4-0005-4000-8000-000000000005" },
      { user: "Trauma bonding, someone joked. It was a little too accurate.", sentiment: "neutral", score: 48, theme: "a1b2c3d4-0002-4000-8000-000000000002" }
    ]
  },
];

// Pattern 5: Leadership - Trust direct manager, concern about upper
const leadershipConversations: ConversationTemplate[] = [
  {
    mood: { initial: 6, final: 5 },
    department: "Engineering",
    pattern: "leadership",
    exchanges: [
      { user: "I trust my direct manager. She advocates for us and pushes back on unrealistic timelines.", sentiment: "positive", score: 78, theme: "a1b2c3d4-0003-4000-8000-000000000003" },
      { user: "But somewhere above her, someone keeps saying yes to things we can't deliver.", sentiment: "negative", score: 38, theme: "a1b2c3d4-0003-4000-8000-000000000003" }
    ]
  },
  {
    mood: { initial: 5, final: 4 },
    department: "Product",
    pattern: "leadership",
    exchanges: [
      { user: "Executive communication has been sparse since the launch. We don't know what's next.", sentiment: "negative", score: 40, theme: "a1b2c3d4-0003-4000-8000-000000000003" },
      { user: "The silence makes people anxious. Are we pivoting? Are there layoffs coming?", sentiment: "negative", score: 32, theme: "a1b2c3d4-0002-4000-8000-000000000002" }
    ]
  },
  {
    mood: { initial: 6, final: 5 },
    department: "Sales",
    pattern: "leadership",
    exchanges: [
      { user: "The CEO did a town hall after the launch. It was all celebration, no acknowledgment of the cost.", sentiment: "neutral", score: 45, theme: "a1b2c3d4-0003-4000-8000-000000000003" },
      { user: "Recognition is nice, but I'd rather have sustainable expectations.", sentiment: "negative", score: 38, theme: "a1b2c3d4-0002-4000-8000-000000000002" }
    ]
  },
  {
    mood: { initial: 7, final: 6 },
    department: "Engineering",
    pattern: "leadership",
    exchanges: [
      { user: "Our skip-level is actually really transparent about challenges. I appreciate that honesty.", sentiment: "positive", score: 75, theme: "a1b2c3d4-0003-4000-8000-000000000003" },
      { user: "I just wish that honesty included admitting we're stretched too thin.", sentiment: "neutral", score: 48, theme: "a1b2c3d4-0002-4000-8000-000000000002" }
    ]
  },
  {
    mood: { initial: 6, final: 5 },
    department: "Design",
    pattern: "leadership",
    exchanges: [
      { user: "Design leadership is supportive but they're also under pressure from above.", sentiment: "neutral", score: 55, theme: "a1b2c3d4-0003-4000-8000-000000000003" },
      { user: "Everyone's doing their best, but the system is broken somewhere.", sentiment: "negative", score: 42, theme: "a1b2c3d4-0002-4000-8000-000000000002" }
    ]
  },
];

// =============================================================================
// MAIN FUNCTION
// =============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("[seed-demo-data] Starting demo data generation...");

    // Step 1: Clean up existing demo data
    console.log("[seed-demo-data] Cleaning up existing demo data...");
    
    // Delete in correct order to respect foreign keys
    await supabase.from("theme_analytics").delete().eq("survey_id", DEMO_SURVEY_ID);
    await supabase.from("session_insights").delete().in("session_id", 
      (await supabase.from("conversation_sessions").select("id").eq("survey_id", DEMO_SURVEY_ID)).data?.map(s => s.id) || []
    );
    await supabase.from("responses").delete().eq("survey_id", DEMO_SURVEY_ID);
    await supabase.from("conversation_sessions").delete().eq("survey_id", DEMO_SURVEY_ID);
    await supabase.from("narrative_reports").delete().eq("survey_id", DEMO_SURVEY_ID);
    await supabase.from("survey_analytics").delete().eq("survey_id", DEMO_SURVEY_ID);

    // Step 2: Ensure themes exist
    console.log("[seed-demo-data] Upserting themes...");
    for (const theme of demoThemes) {
      const { error } = await supabase
        .from("survey_themes")
        .upsert(theme, { onConflict: "id" });
      if (error) console.error(`[seed-demo-data] Theme upsert error:`, error);
    }

    // Step 3: Upsert survey
    console.log("[seed-demo-data] Upserting demo survey...");
    const { error: surveyError } = await supabase
      .from("surveys")
      .upsert({
        id: DEMO_SURVEY_ID,
        title: demoCompany.surveyName,
        description: `${demoCompany.name} - ${demoCompany.surveyPeriod}`,
        survey_type: "employee_satisfaction",
        status: "active",
        created_by: "00000000-0000-0000-0000-000000000000",
        themes: demoThemes.map(t => t.id),
        consent_config: { anonymization_level: "full", data_retention_days: 365 },
        schedule: { type: "immediate" },
        first_message: `Hi! I'd love to hear about your experience since the product launch. How are things going?`
      }, { onConflict: "id" });

    if (surveyError) {
      console.error("[seed-demo-data] Survey upsert error:", surveyError);
    }

    // Step 4: Generate all conversation templates
    const allConversations = [
      ...hiddenBurnoutConversations,
      ...hiddenBurnoutConversations.map(c => ({ ...c })), // Duplicate for volume
      ...hiddenBurnoutConversations.slice(0, 5).map(c => ({ ...c })),
      ...afterHoursConversations,
      ...afterHoursConversations.map(c => ({ ...c })),
      ...careerGrowthConversations,
      ...careerGrowthConversations.map(c => ({ ...c })),
      ...teamCollaborationConversations,
      ...leadershipConversations,
      ...leadershipConversations.map(c => ({ ...c })),
    ];

    console.log(`[seed-demo-data] Generating ${allConversations.length} conversation sessions...`);

    const sessionIds: string[] = [];
    let responseCount = 0;

    // Step 5: Create sessions and responses
    for (let i = 0; i < allConversations.length; i++) {
      const conv = allConversations[i];
      const sessionId = crypto.randomUUID();
      sessionIds.push(sessionId);

      // Create session
      const sessionStartTime = new Date();
      sessionStartTime.setDate(sessionStartTime.getDate() - Math.floor(Math.random() * 14)); // Within last 2 weeks
      const sessionDuration = 5 + Math.floor(Math.random() * 15); // 5-20 minutes

      const { error: sessionError } = await supabase
        .from("conversation_sessions")
        .insert({
          id: sessionId,
          survey_id: DEMO_SURVEY_ID,
          status: "completed",
          initial_mood: conv.mood.initial,
          final_mood: conv.mood.final,
          started_at: sessionStartTime.toISOString(),
          ended_at: new Date(sessionStartTime.getTime() + sessionDuration * 60000).toISOString(),
          consent_given: true,
          consent_timestamp: sessionStartTime.toISOString(),
          anonymization_level: "full"
        });

      if (sessionError) {
        console.error(`[seed-demo-data] Session ${i} error:`, sessionError);
        continue;
      }

      // Create responses for this session
      for (const exchange of conv.exchanges) {
        const { error: responseError } = await supabase
          .from("responses")
          .insert({
            survey_id: DEMO_SURVEY_ID,
            conversation_session_id: sessionId,
            theme_id: exchange.theme,
            content: exchange.user,
            sentiment: exchange.sentiment,
            sentiment_score: exchange.score,
            urgency_score: exchange.score < 30 ? 4 : (exchange.score < 50 ? 3 : 1),
            ai_response: generateAIResponse(exchange),
            is_paraphrased: false,
            ai_analysis: {
              keywords: extractKeywords(exchange.user),
              themes: [exchange.theme],
              pattern: conv.pattern
            }
          });

        if (responseError) {
          console.error(`[seed-demo-data] Response error:`, responseError);
        } else {
          responseCount++;
        }
      }
    }

    console.log(`[seed-demo-data] Created ${sessionIds.length} sessions with ${responseCount} responses`);

    // Step 6: Trigger real analytics pipeline
    console.log("[seed-demo-data] Triggering analytics pipeline...");

    // Trigger theme analysis
    const themeAnalysisResponse = await fetch(`${SUPABASE_URL}/functions/v1/analyze-theme`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ survey_id: DEMO_SURVEY_ID })
    });

    if (!themeAnalysisResponse.ok) {
      const errorText = await themeAnalysisResponse.text();
      console.error("[seed-demo-data] Theme analysis failed:", errorText);
    } else {
      console.log("[seed-demo-data] Theme analysis triggered successfully");
    }

    // Trigger deep analytics
    const deepAnalyticsResponse = await fetch(`${SUPABASE_URL}/functions/v1/deep-analytics`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ survey_id: DEMO_SURVEY_ID })
    });

    if (!deepAnalyticsResponse.ok) {
      const errorText = await deepAnalyticsResponse.text();
      console.error("[seed-demo-data] Deep analytics failed:", errorText);
    } else {
      console.log("[seed-demo-data] Deep analytics triggered successfully");
    }

    // Trigger narrative report generation
    const narrativeResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-narrative-report`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ survey_id: DEMO_SURVEY_ID, audience: "executive" })
    });

    if (!narrativeResponse.ok) {
      const errorText = await narrativeResponse.text();
      console.error("[seed-demo-data] Narrative report failed:", errorText);
    } else {
      console.log("[seed-demo-data] Narrative report triggered successfully");
    }

    console.log("[seed-demo-data] ✅ Demo data seeding complete!");

    return new Response(
      JSON.stringify({
        success: true,
        survey_id: DEMO_SURVEY_ID,
        sessions_created: sessionIds.length,
        responses_created: responseCount,
        message: "Demo data seeded and analytics pipeline triggered"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[seed-demo-data] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper functions
function generateAIResponse(exchange: Exchange): string {
  if (exchange.sentiment === "negative") {
    return "Thank you for sharing that. It sounds like this has been weighing on you. Can you tell me more about how this affects your day-to-day?";
  } else if (exchange.sentiment === "positive") {
    return "That's wonderful to hear! It's great that you're finding value in this. What do you think makes it work so well?";
  }
  return "I appreciate you sharing that perspective. Can you elaborate a bit more on what you mean?";
}

function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("weekend") || lowerText.includes("evening") || lowerText.includes("night")) {
    keywords.push("after-hours");
  }
  if (lowerText.includes("exhausted") || lowerText.includes("tired") || lowerText.includes("burnout")) {
    keywords.push("burnout");
  }
  if (lowerText.includes("love") || lowerText.includes("proud") || lowerText.includes("amazing")) {
    keywords.push("positive-framing");
  }
  if (lowerText.includes("but") || lowerText.includes("however") || lowerText.includes("though")) {
    keywords.push("contrast-pattern");
  }
  if (lowerText.includes("slack") || lowerText.includes("email") || lowerText.includes("message")) {
    keywords.push("communication");
  }
  if (lowerText.includes("manager") || lowerText.includes("leadership") || lowerText.includes("ceo")) {
    keywords.push("leadership");
  }
  
  return keywords;
}
