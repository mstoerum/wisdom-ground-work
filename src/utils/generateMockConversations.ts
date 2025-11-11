/**
 * Mock Conversation Data Generator
 * 
 * Generates realistic conversation data for 45 employee conversations
 * to test HR analytics with substantial text data.
 */

import { supabase } from "@/integrations/supabase/client";

export interface MockConversationSession {
  id: string;
  survey_id: string;
  employee_id: string | null;
  initial_mood: number;
  final_mood: number;
  started_at: string;
  ended_at: string;
  anonymization_level: 'anonymous' | 'partial' | 'identified';
  status: 'active' | 'completed' | 'abandoned';
  consent_given: boolean;
  consent_timestamp: string;
}

export interface MockResponse {
  id: string;
  survey_id: string;
  conversation_session_id: string;
  content: string;
  ai_response: string | null;
  ai_analysis: any;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  sentiment_score: number | null;
  theme_id: string | null;
  created_at: string;
  is_paraphrased: boolean;
  urgency_escalated: boolean;
}

// Rich, detailed response templates with realistic employee narratives
const responseTemplates: Record<string, {
  positive: string[];
  neutral: string[];
  negative: string[];
}> = {
  'Work-Life Balance': {
    positive: [
      "I'm really grateful for the flexibility we have here. Last month when my kid was sick, I could work from home without any hassle. My manager actually encouraged me to take the time I needed.",
      "The work-life balance here is honestly the best I've experienced in my career. I can attend my daughter's soccer games without feeling guilty, and nobody expects me to check emails after 6 PM.",
      "I appreciate that leadership recognizes burnout is real. They actively encourage us to use our vacation days and even check in if we haven't taken time off.",
      "The flexibility to manage my schedule has been life-changing. I can hit the gym in the morning and make up the time later without anyone micromanaging me.",
      "Being able to work remotely has saved me hours of commuting every week. I'm more productive at home, less stressed, and I have more energy for my actual work.",
      "I recently had a family emergency, and my team rallied around me without question. I was able to take the time I needed, and when I came back, nobody made me feel bad about it.",
    ],
    neutral: [
      "Work-life balance is okay, but it really depends on your team. Some departments seem to have reasonable hours, while others are constantly in fire-drill mode.",
      "I have mixed feelings about the balance here. On paper, the policies are great - flexible hours, remote work options. But in practice, there's an unspoken expectation to be available pretty much all the time.",
      "The flexibility is there if you ask for it, but I feel like you have to really advocate for yourself. Some managers are better than others about respecting boundaries.",
      "Remote work has been both a blessing and a curse. I love not commuting, but I find it harder to disconnect when my office is in my home.",
      "Balance here is decent, though I feel like I'm always playing catch-up. Email volume is overwhelming, and even with flexible hours, I struggle to keep my head above water.",
    ],
    negative: [
      "Honestly, I'm feeling pretty burnt out lately. I find myself checking Slack at 10 PM most nights because I'm worried I'll miss something important. Last week I had to cancel dinner with my family twice because of urgent requests that could have waited.",
      "The work-life balance here is practically non-existent. I regularly work 60-hour weeks, and it's taking a toll on my health and relationships. My partner is frustrated because I'm constantly distracted by work.",
      "I'm exhausted. There's this unwritten rule that if you want to be taken seriously or considered for promotion, you need to be available 24/7. I have young kids, and I'm missing so much of their lives.",
      "The workload is crushing me. I'm handling what used to be three people's jobs after layoffs, and there's no relief in sight. I work through lunch, stay late, and still can't keep up.",
      "I haven't taken a real vacation in over a year. Every time I try to plan something, there's a critical project that needs me. Even when I do take time off, I end up working remotely.",
      "The boundary between work and personal life has completely dissolved. I take calls during dinner, respond to emails from bed, and work most Sundays to prepare for the week.",
    ]
  },
  'Career Development': {
    positive: [
      "I'm really excited about the growth opportunities here. My manager and I have quarterly development conversations where we map out skills I want to build, and the company actually invests in training.",
      "The mentorship program here is fantastic. I was paired with a senior leader who's been incredibly generous with their time and advice. Having that guidance has accelerated my learning.",
      "I love that there's a clear career path laid out. I can see what skills and experiences I need to move to the next level, and my manager actively helps me get there.",
      "The company culture encourages taking on stretch assignments. Last quarter, I volunteered to lead a cross-functional project that was way outside my comfort zone.",
      "I've been promoted twice in three years, which feels like a fair reflection of my contributions. The process is transparent, and feedback is constructive.",
      "The tuition reimbursement program has been game-changing for me. I'm currently pursuing a master's degree, and the company is covering most of the cost.",
    ],
    neutral: [
      "Career development is hit or miss depending on your manager. Some people get great support and opportunities, while others feel stuck.",
      "There are resources available for development, but you really have to advocate for yourself. I've learned that if you don't explicitly ask for training, you'll just keep doing the same thing.",
      "I see some people moving up quickly, and I'm not entirely sure what they're doing differently. The advancement criteria feel somewhat subjective.",
      "Promotions happen, but they seem to take a long time. I've been in the same role for two years and am starting to wonder what the timeline typically looks like.",
      "I appreciate the learning resources available, but finding time to actually use them is challenging given the workload. Development often takes a backseat to urgent priorities.",
    ],
    negative: [
      "I feel completely stuck in my career here. I've been in the same role for four years with no promotion in sight, despite consistently exceeding expectations. When I ask about advancement, I get vague answers.",
      "There's no real investment in employee development here. I've asked multiple times for training budget to attend a certification program, and I've been denied every time.",
      "My manager has no interest in my career development. Our one-on-ones are always about immediate tasks. When I try to discuss growth, the conversation gets redirected.",
      "The promotion process is completely opaque. There's no clear criteria, no timeline, no transparency about what it takes to move up.",
      "I've been promised a promotion for two years now, and it keeps getting pushed back. First it was budget, then reorganization, now it's we need to see more.",
      "The lack of learning opportunities is stifling. We're expected to keep up with industry trends on our own time and dime, while the company invests nothing.",
    ]
  },
  'Management Support': {
    positive: [
      "My manager is genuinely one of the best I've ever had. She gives me autonomy while being available when I need support. She fights for her team and shields us from unnecessary politics.",
      "I appreciate how transparent my manager is about what's happening at higher levels. He shares context about decisions and involves us in problem-solving.",
      "The feedback I receive is specific, timely, and actionable. My manager takes time to explain not just what to improve but how.",
      "My manager has my back. When I made a significant mistake on a project, he took responsibility with leadership and then worked with me privately to learn from it.",
      "I feel comfortable bringing problems to my manager, even difficult ones. He creates a safe space where we can be honest about challenges without fear of judgment.",
      "My manager actively invests in my development. She identifies opportunities for me to grow and advocates for my advancement.",
    ],
    neutral: [
      "My manager is fine - not great, not terrible. He leaves me alone to do my work, which I appreciate, but I sometimes wish there was more guidance.",
      "Management here is inconsistent. My direct manager is pretty good, but leadership above that level seems disconnected from the realities of our work.",
      "My manager means well but is stretched too thin. She manages 12 people across multiple projects, so individual attention is limited.",
      "Feedback is pretty generic. I get the sense my manager doesn't have deep visibility into my day-to-day work, so reviews feel surface-level.",
      "My manager delegates well but doesn't always provide enough context. I often execute tasks without fully understanding the strategy or why it matters.",
    ],
    negative: [
      "My manager is a huge source of stress for me. She micromanages everything, questions my every decision, and makes me feel incompetent despite years of experience.",
      "The lack of support from leadership is astounding. When I raised concerns about workload and burnout, I was essentially told to work smarter, not harder.",
      "My manager plays favorites, and I'm not one of them. Certain team members get praised for average work while others of us exceed expectations and hear nothing.",
      "I've never received constructive feedback, only criticism. My manager focuses exclusively on what went wrong rather than recognizing what went right.",
      "Communication from leadership is terrible. Decisions get made behind closed doors without explanation. We're expected to just accept and execute.",
      "My manager throws the team under the bus to protect himself. When projects fail, he points fingers at us rather than taking accountability as a leader.",
    ]
  },
  'Team Collaboration': {
    positive: [
      "My team is incredibly supportive. We work really well together and communicate openly. When someone is struggling, we all jump in to help without being asked.",
      "I love how collaborative our team is. Everyone is willing to share knowledge and help each other out. There's no ego or competition, just genuine teamwork.",
      "The team dynamics are great. We have regular check-ins where everyone's input is valued, and we've built real trust over time.",
      "We have excellent collaboration tools and our team meetings are always productive. People come prepared, contribute meaningfully, and follow through on commitments.",
      "The cross-functional collaboration here has been eye-opening. Working with people from different departments has taught me so much and made projects more successful.",
    ],
    neutral: [
      "Team collaboration is decent. We work together when needed, but don't interact much outside of specific projects. It's functional but not particularly tight-knit.",
      "Collaboration happens when it needs to, but there's room for improvement. Some people are great team players; others are more siloed in their work.",
      "We have good moments of collaboration, but also some friction between different groups. The engineering and product teams don't always see eye to eye.",
      "The team is okay. Communication could be better, and sometimes it feels like we're working in parallel rather than truly together.",
    ],
    negative: [
      "There's a lack of communication between teams. We often duplicate work or miss important updates because nobody's talking to each other. It's incredibly frustrating and wastes so much time.",
      "Some team members don't respond to messages for days, which completely blocks projects. I don't understand how that's acceptable in a collaborative environment.",
      "I feel isolated from the rest of the team. We rarely have meaningful collaboration, and when we do, it feels forced or uncomfortable. There's not much trust.",
      "There's too much competition between team members instead of working together. People hoard information to protect their positions, which kills any chance of real teamwork.",
      "The silos are terrible. Each department guards their territory and resists collaboration. It makes getting anything done cross-functionally nearly impossible.",
    ]
  },
  'Workplace Culture': {
    positive: [
      "The culture here is genuinely special. People are collaborative, supportive, and actually care about each other beyond just getting work done. I've made real friendships here.",
      "What I love most is the emphasis on psychological safety. We're encouraged to take risks, share ideas, and even fail without fear of punishment.",
      "The company lives its values, which is rare. When they say they prioritize diversity and inclusion, they back it with real action and accountability.",
      "There's a strong sense of mission here that unites everyone. We all believe in what we're building and why it matters. That shared purpose is motivating.",
      "The culture celebrates both individual and team success. Recognition is generous and public, and wins are shared rather than hoarded.",
      "I appreciate how the culture balances professionalism with humanity. We're expected to deliver quality work, but there's understanding that we're whole people with lives outside the office.",
    ],
    neutral: [
      "The culture is okay - pretty standard for a tech company. It's professional and generally positive, though I wouldn't call it distinctive.",
      "Culture varies significantly by team. Some departments have amazing dynamics; others feel more corporate and transactional.",
      "We talk a lot about culture and values, but I'm not always sure how deeply they penetrate. Day-to-day, I question how much they actually influence behavior.",
      "There's a disconnect between stated values and lived experience. We say we value balance and transparency, but in practice, I see people working constantly.",
      "The culture is very work-focused. We talk about projects and deliverables but less about people, growth, or well-being. It's professionally stimulating but emotionally flat.",
    ],
    negative: [
      "The culture here is toxic. There's constant backstabbing, politics, and competition instead of collaboration. People are more focused on self-promotion than team success.",
      "Leadership preaches values they don't practice. They talk about transparency while withholding information, respect while talking down to employees, and innovation while punishing deviation.",
      "This is the most political environment I've ever experienced. Success is more about who you know and how you play the game than actual performance.",
      "The culture feels hostile to anyone who doesn't fit a specific mold. If you're not part of the in-group, you're marginalized. The lack of true inclusion is obvious.",
      "There's a culture of fear here. People are afraid to speak up, challenge ideas, or admit mistakes because the response is usually punitive.",
      "Burnout culture is celebrated here. People brag about all-nighters and working weekends like it's a badge of honor. Anyone who sets boundaries is viewed as uncommitted.",
    ]
  }
};

// Context-aware AI responses organized by stage and sentiment
const aiResponses = {
  opening: [
    "Hello! Thank you for taking the time to share your feedback with me today. This conversation is completely confidential. How are you feeling about work lately?",
    "Hi! I appreciate you being here. Your honest thoughts are really valuable. What's been on your mind recently regarding work?",
    "Welcome! I'm here to listen and understand your experience. To start, how would you describe your overall experience at work lately?",
  ],
  validation_positive: [
    "That's wonderful to hear! It's great that you're having such a positive experience.",
    "I'm so glad things are going well for you. Those kinds of experiences make a real difference.",
    "That's fantastic! It's clear that's having a meaningful impact on you.",
  ],
  validation_negative: [
    "Thank you for being honest about that. I can hear how challenging this has been for you.",
    "I appreciate you sharing that. What you're experiencing sounds really tough.",
    "That sounds incredibly frustrating. Your feelings about this are completely valid.",
    "I hear how hard this is for you. It takes courage to be this open about these challenges.",
  ],
  probing: [
    "Can you tell me more about that? I want to make sure I understand your full experience.",
    "What would it look like if this situation were improved?",
    "Help me understand - when did you first notice this becoming an issue?",
    "What impact is this having on you, both professionally and personally?",
    "If you could change one thing about this, what would make the biggest difference?",
    "Walk me through a specific example. What did that look like?",
    "How long has this been going on? Has it gotten better or worse over time?",
  ],
  transition: [
    "That's really helpful to understand. While we're talking, I'd also like to hear your thoughts on another aspect...",
    "Building on what you just shared, I'm wondering about...",
    "That gives me good context. Another area I'd like to explore if you're comfortable is...",
  ],
  closing: [
    "We're coming to the end of our conversation. Before we wrap up, is there anything else you'd like to share?",
    "Thank you so much for your openness today. Your insights are truly valuable. Is there anything else on your mind?",
    "This has been really helpful. Before we finish, what's the one thing you most want leadership to understand?",
  ]
};

// Departments for variety
const departments = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'HR',
  'Finance',
  'Customer Success'
];

// Generate a random number between min and max
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// UUID helpers for demo
const DEMO_SURVEY_UUID = '00000000-0000-0000-0000-000000000001';

function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// Generate a random date within the last 30 days
function randomDate(daysAgo: number = 30): string {
  const now = new Date();
  const daysBack = randomInt(0, daysAgo);
  const date = new Date(now);
  date.setDate(date.getDate() - daysBack);
  date.setHours(randomInt(9, 17), randomInt(0, 59), randomInt(0, 59));
  return date.toISOString();
}

// Calculate sentiment score from sentiment category (0-100 range for display)
// Note: Database stores as decimal(3,2) but we'll store as 0-100 range (0.70-0.95 becomes 70-95)
function getSentimentScore(sentiment: 'positive' | 'neutral' | 'negative'): number {
  switch (sentiment) {
    case 'positive':
      return 70 + Math.random() * 25; // 70 to 95
    case 'neutral':
      return 40 + Math.random() * 25; // 40 to 65
    case 'negative':
      return 10 + Math.random() * 30; // 10 to 40
  }
}

// Generate a conversation session
function generateSession(
  surveyId: string,
  index: number,
  themeIds: Record<string, string | null>,
  employeeId: string | null = null // Will be set by caller for RLS compliance
): MockConversationSession {
  const initialMood = randomInt(30, 80);
  const moodChange = randomInt(-15, 20); // Conversations can improve or slightly worsen mood
  const finalMood = Math.max(10, Math.min(100, initialMood + moodChange));
  
  const startedAt = randomDate(30);
  const durationMinutes = randomInt(5, 25);
  const endedAt = new Date(new Date(startedAt).getTime() + durationMinutes * 60000).toISOString();

  return {
    id: crypto.randomUUID(),
    survey_id: surveyId,
    employee_id: employeeId, // Set to current user ID for RLS compliance (even though anonymization_level is 'anonymous')
    initial_mood: initialMood,
    final_mood: finalMood,
    started_at: startedAt,
    ended_at: endedAt,
    anonymization_level: 'anonymous', // Data is anonymous despite having employee_id (for RLS)
    status: 'completed',
    consent_given: true,
    consent_timestamp: new Date(new Date(startedAt).getTime() - 60000).toISOString(),
  };
}

// Generate responses for a conversation
function generateResponses(
  session: MockConversationSession,
  surveyId: string,
  themeIds: Record<string, string | null>,
  responseIndex: number
): MockResponse[] {
  const responses: MockResponse[] = [];
  const numExchanges = randomInt(5, 10); // 5-10 exchanges for richer conversations
  
  // Determine overall conversation sentiment (mostly positive, neutral, or negative)
  const conversationTone = Math.random() < 0.4 ? 'negative' : Math.random() < 0.6 ? 'neutral' : 'positive';
  
  // Select 1-3 themes for this conversation
  const themeNames = Object.keys(responseTemplates);
  const numThemes = randomInt(1, 3);
  const selectedThemes = themeNames.sort(() => Math.random() - 0.5).slice(0, numThemes);
  
  let currentThemeIndex = 0;
  
  for (let i = 0; i < numExchanges; i++) {
    const themeName = selectedThemes[currentThemeIndex % selectedThemes.length];
    const themeId = themeIds[themeName] ?? null;
    
    // Mix sentiments within conversation, but lean toward conversation tone
    let sentiment: 'positive' | 'neutral' | 'negative';
    const rand = Math.random();
    if (conversationTone === 'positive') {
      sentiment = rand < 0.6 ? 'positive' : rand < 0.85 ? 'neutral' : 'negative';
    } else if (conversationTone === 'negative') {
      sentiment = rand < 0.5 ? 'negative' : rand < 0.8 ? 'neutral' : 'positive';
    } else {
      sentiment = rand < 0.4 ? 'neutral' : rand < 0.7 ? 'positive' : 'negative';
    }
    
    const templates = responseTemplates[themeName][sentiment];
    const content = templates[randomInt(0, templates.length - 1)];
    
    // Sometimes add variation to make it feel more natural
    const variedContent = Math.random() < 0.3 
      ? content + (Math.random() < 0.5 ? " It's been on my mind lately." : " I thought I'd mention it.")
      : content;
    
    const sentimentScore = getSentimentScore(sentiment);
    const createdAt = new Date(
      new Date(session.started_at).getTime() + i * 60000 * randomInt(1, 3)
    ).toISOString();
    
    // Select contextual AI response based on sentiment and position
    let aiResponse: string | null = null;
    if (Math.random() < 0.85) {
      if (i === 0) {
        aiResponse = aiResponses.opening[randomInt(0, aiResponses.opening.length - 1)];
      } else if (i === numExchanges - 1) {
        aiResponse = aiResponses.closing[randomInt(0, aiResponses.closing.length - 1)];
      } else if (sentiment === 'positive') {
        aiResponse = Math.random() < 0.5 
          ? aiResponses.validation_positive[randomInt(0, aiResponses.validation_positive.length - 1)]
          : aiResponses.probing[randomInt(0, aiResponses.probing.length - 1)];
      } else if (sentiment === 'negative') {
        aiResponse = Math.random() < 0.6
          ? aiResponses.validation_negative[randomInt(0, aiResponses.validation_negative.length - 1)]
          : aiResponses.probing[randomInt(0, aiResponses.probing.length - 1)];
      } else {
        aiResponse = Math.random() < 0.3
          ? aiResponses.transition[randomInt(0, aiResponses.transition.length - 1)]
          : aiResponses.probing[randomInt(0, aiResponses.probing.length - 1)];
      }
    }
    
    // Convert sentiment score to database format (0-1 range for decimal(3,2))
    // Database expects 0-1 range, so divide by 100
    const dbSentimentScore = sentimentScore / 100;
    
    const response: MockResponse = {
      id: crypto.randomUUID(),
      survey_id: surveyId,
      conversation_session_id: session.id,
      content: variedContent,
      ai_response: aiResponse,
      ai_analysis: aiResponse ? {
        detected_theme: themeName,
        sentiment: sentiment,
        key_phrases: variedContent.split(' ').slice(0, 5),
        follow_up_needed: Math.random() < 0.4
      } : null,
      sentiment: sentiment,
      sentiment_score: dbSentimentScore, // Store as 0-1 range for database
      theme_id: themeId,
      created_at: createdAt,
      is_paraphrased: false,
      urgency_escalated: sentiment === 'negative' && sentimentScore < 25 && Math.random() < 0.3,
    };
    
    responses.push(response);
    
    // Switch themes occasionally
    if (Math.random() < 0.3) {
      currentThemeIndex++;
    }
  }
  
  return responses;
}

/**
 * Generate 45 mock conversations with realistic data
 */
export async function generateMockConversations(
  surveyId: string = 'demo-survey-001',
  employeeId: string | null = null // Current user ID for RLS compliance
): Promise<{ sessions: MockConversationSession[], responses: MockResponse[] }> {
  const targetSurveyId = isValidUUID(surveyId) ? surveyId : DEMO_SURVEY_UUID;
  // Get theme IDs from survey_themes table (they're referenced by name in surveys.themes JSONB)
  const themeIds: Record<string, string | null> = {};
  
  try {
    // First, get the survey to see what themes it uses
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('themes')
      .eq('id', targetSurveyId)
      .single();
    
    if (!surveyError && survey?.themes) {
      // Themes in survey are stored as JSONB array of theme names
      const themeNames = Array.isArray(survey.themes) ? survey.themes : [];
      
      // Now fetch the actual theme records by name
      const themeNamesArray = themeNames.filter((name): name is string => typeof name === 'string');
      const { data: themes, error: themesError } = await supabase
        .from('survey_themes')
        .select('id, name')
        .in('name', themeNamesArray)
        .eq('is_active', true);
      
      if (!themesError && themes) {
        themes.forEach(theme => {
          themeIds[theme.name] = theme.id;
        });
      }
    }
  } catch (error) {
    console.warn('Could not fetch themes, using placeholder IDs:', error);
  }
  
  // If no themes found, create placeholder mapping based on demo survey themes
  const demoThemes = [
    'Work-Life Balance',
    'Team Collaboration',
    'Career Development',
    'Management Support',
    'Workplace Culture'
  ];
  
  // Also try to fetch all active themes and match by name
  try {
    const { data: allThemes } = await supabase
      .from('survey_themes')
      .select('id, name')
      .eq('is_active', true);
    
    if (allThemes) {
      allThemes.forEach(theme => {
        if (demoThemes.includes(theme.name)) {
          themeIds[theme.name] = theme.id;
        }
      });
    }
  } catch (error) {
    console.warn('Error fetching all themes:', error);
  }
  
  // Create missing themes if needed
  const missingThemes = demoThemes.filter(themeName => !themeIds[themeName]);
  if (missingThemes.length > 0) {
    console.log(`Creating ${missingThemes.length} missing themes:`, missingThemes);
    
    for (const themeName of missingThemes) {
      try {
        const { data: newTheme, error: createError } = await supabase
          .from('survey_themes')
          .insert({
            name: themeName,
            description: `Theme for ${themeName} feedback`,
            is_active: true,
          })
          .select('id')
          .single();
        
        if (!createError && newTheme) {
          themeIds[themeName] = newTheme.id;
          console.log(`Created theme: ${themeName} (${newTheme.id})`);
        } else {
          console.warn(`Failed to create theme ${themeName}:`, createError);
        }
      } catch (error) {
        console.warn(`Error creating theme ${themeName}:`, error);
      }
    }
  }
  
  // Final check: ensure all demo themes have IDs
  demoThemes.forEach((themeName) => {
    if (!themeIds[themeName]) {
      console.warn(`Theme ${themeName} still has no ID after creation attempts`);
    }
  });
  
  const sessions: MockConversationSession[] = [];
  const allResponses: MockResponse[] = [];
  let responseCounter = 0;
  
  // Generate 45 conversations with unique demo employee IDs to avoid assignment uniqueness conflicts
  const fakeEmployeeIds = Array.from({ length: 45 }, () => crypto.randomUUID());
  for (let i = 1; i <= 45; i++) {
    const session = generateSession(targetSurveyId, i, themeIds, fakeEmployeeIds[i - 1]);
    sessions.push(session);
    
    const responses = generateResponses(session, targetSurveyId, themeIds, responseCounter);
    allResponses.push(...responses);
    responseCounter += responses.length;
  }
  
  return { sessions, responses: allResponses };
}

/**
 * Check if user has HR admin role and assign it if needed (for demo mode)
 */
async function ensureHRAdminRole(userId: string): Promise<boolean> {
  try {
    // First check if user already has the role
    const { data: roles, error: checkError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'hr_admin');
    
    if (checkError) {
      console.warn('Error checking HR admin role:', checkError);
      // Continue to try assigning anyway
    } else if (roles && roles.length > 0) {
      return true;
    }
    
    // User doesn't have HR admin role, try to assign it
    // For demo mode, try assign_demo_hr_admin first (always works, even if other admins exist)
    try {
      const { error: demoRpcError } = await supabase.rpc('assign_demo_hr_admin');
      
      if (!demoRpcError) {
        // Wait a bit for the function to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify the role was assigned
        const { data: verifyRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'hr_admin');
        
        if (verifyRoles && verifyRoles.length > 0) {
          return true;
        }
      } else {
        console.warn('assign_demo_hr_admin failed, trying assign_initial_hr_admin:', demoRpcError);
      }
    } catch (demoRpcError) {
      console.warn('assign_demo_hr_admin RPC call failed:', demoRpcError);
      // Continue to fallback methods
    }
    
    // Fallback: Try assign_initial_hr_admin (only works if no admin exists)
    try {
      const { error: rpcError } = await supabase.rpc('assign_initial_hr_admin');
      
      if (!rpcError) {
        // Wait a bit for the function to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify the role was assigned
        const { data: verifyRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'hr_admin');
        
        if (verifyRoles && verifyRoles.length > 0) {
          return true;
        }
      } else {
        console.warn('assign_initial_hr_admin failed, trying fallback methods:', rpcError);
      }
    } catch (rpcError) {
      console.warn('assign_initial_hr_admin RPC call failed:', rpcError);
      // Continue to fallback methods
    }
    
    // Method 2: Try direct insert (might work if RLS allows it)
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'hr_admin' });
    
    if (!insertError) {
      // Success! Verify it was assigned
      await new Promise(resolve => setTimeout(resolve, 100));
      const { data: verifyRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'hr_admin');
      
      return verifyRoles && verifyRoles.length > 0;
    }
    
    // If it's a unique constraint violation, the role might have been assigned by another request
    if (insertError.code === '23505') {
      // Verify it was actually assigned
      await new Promise(resolve => setTimeout(resolve, 200));
      const { data: verifyRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'hr_admin');
      
      return verifyRoles && verifyRoles.length > 0;
    }
    
    // Method 3: Try using assign_demo_hr_admin or assign_initial_hr_admin functions
    // These use SECURITY DEFINER so they can bypass RLS
    if (insertError.code === '42501' || insertError.message?.includes('permission') || insertError.message?.includes('policy')) {
      console.warn('Direct insert failed due to RLS, trying assign_demo_hr_admin function as fallback...');
      
      // Try assign_demo_hr_admin first (works even if other admins exist)
      const { error: demoRpcError } = await supabase.rpc('assign_demo_hr_admin');
      
      if (!demoRpcError) {
        // Wait a bit for the function to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify the role was assigned
        const { data: verifyRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'hr_admin');
        
        if (verifyRoles && verifyRoles.length > 0) {
          return true;
        }
      } else {
        console.warn('assign_demo_hr_admin failed, trying assign_initial_hr_admin:', demoRpcError);
        
        // Fallback to assign_initial_hr_admin (only works if no admin exists)
        const { error: rpcError } = await supabase.rpc('assign_initial_hr_admin');
        
        if (!rpcError) {
          // Wait a bit for the function to complete
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Verify the role was assigned
          const { data: verifyRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'hr_admin');
          
          if (verifyRoles && verifyRoles.length > 0) {
            return true;
          }
        } else {
          console.warn('assign_initial_hr_admin also failed:', rpcError);
        }
      }
    }
    
    console.warn('Error assigning HR admin role:', insertError);
    return false;
  } catch (error) {
    console.warn('Exception checking/assigning HR admin role:', error);
    return false;
  }
}

/**
 * Ensure the survey exists, creating it if necessary
 */
async function ensureSurveyExists(surveyId: string): Promise<string> {
  const targetSurveyId = isValidUUID(surveyId) ? surveyId : DEMO_SURVEY_UUID;
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Must be authenticated to create survey');
  }
  
  // Check if survey exists (with retry logic for eventual consistency)
  let existingSurvey = null;
  let fetchError = null;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('surveys')
      .select('id')
      .eq('id', targetSurveyId)
      .single();
    
    if (data && !error) {
      existingSurvey = data;
      break;
    }
    
    fetchError = error;
    
    // If not found, wait a bit and retry (in case of eventual consistency)
    if (attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
  
  if (existingSurvey) {
    // Verify the survey is actually accessible (not blocked by RLS)
    return existingSurvey.id;
  }
  
  // Survey doesn't exist, ensure user has HR admin role before creating
  // For demo mode, always attempt to assign the role first
  console.log('Attempting to assign HR admin role for demo mode...');
  let roleAssignmentAttempted = false;
  
  try {
    // Try assign_demo_hr_admin directly (works even if other admins exist)
    const { error: demoRpcError } = await supabase.rpc('assign_demo_hr_admin');
    
    if (!demoRpcError) {
      console.log('assign_demo_hr_admin called successfully');
      roleAssignmentAttempted = true;
      
      // Wait for the function to complete
      await new Promise(resolve => setTimeout(resolve, 300));
    } else {
      console.warn('assign_demo_hr_admin RPC error:', demoRpcError.message || demoRpcError);
      
      // If the function doesn't exist, try direct insert as fallback
      if (demoRpcError.message?.includes('function') || demoRpcError.code === '42883') {
        console.log('RPC function not found, trying direct role insert...');
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: 'hr_admin' })
          .select();
        
        if (!insertError || insertError.code === '23505') {
          // Success or already exists
          roleAssignmentAttempted = true;
          console.log('Direct role insert succeeded or role already exists');
          await new Promise(resolve => setTimeout(resolve, 200));
        } else {
          console.warn('Direct role insert also failed:', insertError.message);
        }
      }
    }
  } catch (error) {
    console.warn('Error calling assign_demo_hr_admin:', error);
    
    // Try direct insert as last resort
    try {
      console.log('Attempting direct role insert as fallback...');
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: 'hr_admin' })
        .select();
      
      if (!insertError || insertError.code === '23505') {
        roleAssignmentAttempted = true;
        console.log('Fallback direct role insert succeeded');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (fallbackError) {
      console.warn('All role assignment methods failed');
    }
  }
  
  // Check if user now has HR admin role
  const hasAdminRole = await ensureHRAdminRole(user.id);
  
  if (!hasAdminRole && !roleAssignmentAttempted) {
    // If we haven't tried yet, try one more time
    console.warn('User does not have HR admin role, making final attempt to assign it...');
    try {
      const { error: demoRpcError } = await supabase.rpc('assign_demo_hr_admin');
      
      if (!demoRpcError) {
        roleAssignmentAttempted = true;
        console.log('Final assign_demo_hr_admin call succeeded');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.warn('Final attempt to assign demo HR admin role failed:', error);
    }
  }
  
  // In demo mode, proceed even if role verification fails - let survey creation attempt proceed
  // If permissions are truly insufficient, the survey creation will fail with a more specific error
  if (!hasAdminRole && !roleAssignmentAttempted) {
    console.warn(
      'Could not assign or verify HR admin role, but proceeding anyway in demo mode. ' +
      'The survey creation will be attempted and may fail if permissions are insufficient.'
    );
  } else if (hasAdminRole) {
    console.log('HR admin role confirmed - proceeding with survey creation');
  } else if (roleAssignmentAttempted) {
    console.log('Role assignment attempted - proceeding with survey creation');
  }
  
  const demoThemes = [
    'Work-Life Balance',
    'Team Collaboration',
    'Career Development',
    'Management Support',
    'Workplace Culture'
  ];
  
  const surveyData = {
    id: targetSurveyId,
    title: 'Quarterly Feedback Survey - Demo',
    description: 'Demo survey for testing HR analytics with mock conversation data',
    created_by: user.id,
    themes: demoThemes,
    schedule: {
      target_type: 'all',
      schedule_type: 'one_time',
    },
    consent_config: {
      anonymization_level: 'anonymous',
      data_retention_days: 60,
      consent_message: 'Your responses will be kept confidential and used to improve our workplace.'
    },
    first_message: 'Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone.',
    status: 'active',
  };
  
  // Try to create the survey with retry logic
  let newSurvey = null;
  let createError = null;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from('surveys')
      .insert(surveyData)
      .select('id')
      .single();
    
    if (data && !error) {
      newSurvey = data;
      break;
    }
    
    createError = error;
    
    // If it's a unique constraint violation, the survey might have been created by another request
    if (createError?.code === '23505') {
      // Try to fetch it again with a delay
      await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
      const { data: retrySurvey, error: retryError } = await supabase
        .from('surveys')
        .select('id')
        .eq('id', targetSurveyId)
        .single();
      
      if (retrySurvey && !retryError) {
        newSurvey = retrySurvey;
        createError = null;
        break;
      }
    } else if (createError?.code === '42501' || createError?.message?.includes('permission') || createError?.message?.includes('policy')) {
      // RLS policy violation - try one more time after ensuring role
      if (attempt < 2) {
        await ensureHRAdminRole(user.id);
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }
    }
    
    // Don't retry on other errors
    if (attempt === 2) {
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
  }
  
  if (createError) {
    // If it's an RLS policy violation, provide a helpful error message
    if (createError.code === '42501' || createError.message?.includes('permission') || createError.message?.includes('policy')) {
      throw new Error(
        'Permission denied: You need HR admin role to create surveys. ' +
        `Attempted to assign role but still cannot create survey. Error: ${createError.message}`
      );
    }
    
    console.error('Error creating survey:', createError);
    throw new Error(`Failed to create survey: ${createError.message || createError.code}`);
  }
  
  if (!newSurvey || !newSurvey.id) {
    throw new Error('Survey creation succeeded but no survey ID was returned');
  }
  
  // Verify the survey is accessible after creation (with retry for eventual consistency)
  let verifySurvey = null;
  let verifyError = null;
  
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('surveys')
      .select('id')
      .eq('id', newSurvey.id)
      .single();
    
    if (data && !error) {
      verifySurvey = data;
      break;
    }
    
    verifyError = error;
    
    // Wait before retrying (for eventual consistency)
    if (attempt < 4) {
      await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }
  
  if (verifyError || !verifySurvey) {
    throw new Error(
      `Survey was created but is not accessible after creation. ` +
      `This may be due to Row Level Security (RLS) policies or eventual consistency. ` +
      `Survey ID: ${newSurvey.id}, Error: ${verifyError?.message || 'Unknown error'}`
    );
  }
  
  return verifySurvey.id;
}

/**
 * Insert mock conversations into the database
 */
export async function insertMockConversations(
  surveyId: string = 'demo-survey-001',
  onProgress?: (message: string) => void
): Promise<{ sessionsCreated: number, responsesCreated: number, assignmentsCreated: number }> {
  console.log('[insertMockConversations] Starting mock data generation for survey:', surveyId);
  onProgress?.('Starting mock data generation...');
  
  // Get current user ID for RLS compliance (needed for conversation_sessions INSERT policy)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Must be authenticated to generate mock data');
  }
  
  console.log('[insertMockConversations] User authenticated:', user.id);
  onProgress?.('User authenticated ✓');
  
  // Ensure the survey exists first (this will also ensure user has HR admin role)
  const actualSurveyId = await ensureSurveyExists(surveyId);
  console.log('[insertMockConversations] Survey ensured, using ID:', actualSurveyId);
  onProgress?.('Survey verified ✓');
  
  // Double-check the survey exists and is accessible before inserting sessions (with retry)
  let verifySurveyBeforeInsert = null;
  let verifyErrorBeforeInsert = null;
  
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('surveys')
      .select('id')
      .eq('id', actualSurveyId)
      .single();
    
    if (data && !error) {
      verifySurveyBeforeInsert = data;
      break;
    }
    
    verifyErrorBeforeInsert = error;
    
    // Wait before retrying (for eventual consistency)
    if (attempt < 4) {
      await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }
  
  if (verifyErrorBeforeInsert || !verifySurveyBeforeInsert) {
    throw new Error(
      `Cannot insert mock conversations: Survey with ID ${actualSurveyId} does not exist or is not accessible. ` +
      `This may be due to Row Level Security (RLS) policies or eventual consistency issues. ` +
      `Error: ${verifyErrorBeforeInsert?.message || 'Unknown error'}. ` +
      `Please try again in a moment.`
    );
  }
  
  // Generate mock conversations with current user ID for RLS compliance
  // Note: anonymization_level is still 'anonymous' even though employee_id is set
  console.log('[insertMockConversations] Generating conversation data...');
  onProgress?.('Generating conversation data...');
  // Generate sessions for multiple employees (unique IDs) to avoid duplicate assignment conflicts
  const { sessions, responses } = await generateMockConversations(actualSurveyId, null);
  console.log('[insertMockConversations] Generated', sessions.length, 'sessions and', responses.length, 'responses');
  onProgress?.(`Generated ${sessions.length} conversations with ${responses.length} responses ✓`);
  
  // Verify all sessions have the correct survey_id and valid employee_id
  const invalidSessions = sessions.filter(s => 
    s.survey_id !== actualSurveyId || !s.employee_id
  );
  if (invalidSessions.length > 0) {
    throw new Error(`Invalid session data: ${invalidSessions.length} sessions have incorrect survey_id or missing employee_id`);
  }
  
  // Verify all responses reference valid session IDs
  const sessionIds = new Set(sessions.map(s => s.id));
  const invalidResponses = responses.filter(r => !sessionIds.has(r.conversation_session_id));
  if (invalidResponses.length > 0) {
    throw new Error(`Invalid response data: ${invalidResponses.length} responses reference non-existent session IDs`);
  }
  
  // Create survey assignments FIRST (one for each unique employee/session)
  console.log('[insertMockConversations] Creating survey assignments...');
  onProgress?.('Creating survey assignments...');
  
  const assignments = sessions.map((session) => ({
    id: crypto.randomUUID(),
    survey_id: actualSurveyId,
    employee_id: session.employee_id,
    assigned_at: session.started_at,
    completed_at: session.ended_at,
    status: 'completed' as const
  }));
  
  const { error: assignmentsError } = await supabase
    .from('survey_assignments')
    .upsert(assignments, { onConflict: 'survey_id,employee_id' });
  
  if (assignmentsError) {
    console.error('[insertMockConversations] Error inserting assignments:', assignmentsError);
    throw new Error(`Failed to insert survey assignments: ${assignmentsError.message || assignmentsError.code}`);
  }
  
  console.log('[insertMockConversations] Successfully inserted', assignments.length, 'assignments');
  onProgress?.(`Created ${assignments.length} survey assignments ✓`);
  
  // Insert sessions with retry logic for foreign key issues
  onProgress?.('Creating conversation sessions...');
  let sessionsError = null;
  
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase
      .from('conversation_sessions')
      .upsert(sessions, { onConflict: 'id' });
    
    if (!error) {
      sessionsError = null;
      break;
    }
    
    sessionsError = error;
    
    // If it's a foreign key violation, verify the survey still exists
    if (sessionsError.code === '23503' || sessionsError.message?.includes('foreign key')) {
      if (attempt < 2) {
        // Wait and verify survey exists
        await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
        const { data: verifySurvey } = await supabase
          .from('surveys')
          .select('id')
          .eq('id', actualSurveyId)
          .single();
        
        if (!verifySurvey) {
          throw new Error(
            `Foreign key constraint violation: The survey with ID ${actualSurveyId} does not exist in the database. ` +
            `This usually means the survey was deleted or is not accessible due to RLS policies. ` +
            `Original error: ${sessionsError.message}`
          );
        }
        
        // Survey exists, retry insert
        continue;
      } else {
        // Final attempt failed
        throw new Error(
          `Foreign key constraint violation: The survey with ID ${actualSurveyId} may not exist or be accessible. ` +
          `Survey verification passed but insert still fails. This may be a timing/consistency issue. ` +
          `Original error: ${sessionsError.message}. Please try again.`
        );
      }
    } else {
      // Not a foreign key error, don't retry
      break;
    }
  }
  
  if (sessionsError) {
    console.error('[insertMockConversations] Error inserting sessions:', sessionsError);
    throw new Error(`Failed to insert conversation sessions: ${sessionsError.message || sessionsError.code}`);
  }
  
  console.log('[insertMockConversations] Successfully inserted', sessions.length, 'sessions');
  onProgress?.(`Created ${sessions.length} conversation sessions ✓`);
  
  // Insert responses in batches to avoid overwhelming the database
  onProgress?.('Creating responses in batches...');
  const batchSize = 50;
  let responsesCreated = 0;
  
  for (let i = 0; i < responses.length; i += batchSize) {
    const batch = responses.slice(i, i + batchSize);
    let batchError = null;
    
    // Retry logic for response batches
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase
        .from('responses')
        .upsert(batch, { onConflict: 'id' });
      
      if (!error) {
        batchError = null;
        break;
      }
      
      batchError = error;
      
      // If foreign key error, verify sessions exist
      if (batchError.code === '23503' || batchError.message?.includes('foreign key')) {
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
          // Verify sessions exist
          const sessionIdsInBatch = new Set(batch.map(r => r.conversation_session_id));
          const { data: verifySessions } = await supabase
            .from('conversation_sessions')
            .select('id')
            .in('id', Array.from(sessionIdsInBatch));
          
          if (!verifySessions || verifySessions.length !== sessionIdsInBatch.size) {
            throw new Error(
              `Foreign key constraint violation: Some conversation sessions referenced by responses do not exist. ` +
              `Expected ${sessionIdsInBatch.size} sessions, found ${verifySessions?.length || 0}. ` +
              `Original error: ${batchError.message}`
            );
          }
          
          continue;
        }
      } else {
        // Not a foreign key error, don't retry
        break;
      }
    }
    
    if (batchError) {
      console.error('Error inserting responses batch:', batchError);
      throw new Error(`Failed to insert responses batch: ${batchError.message || batchError.code}`);
    }
    
    responsesCreated += batch.length;
  }
  
  console.log('[insertMockConversations] Successfully inserted all responses:', responsesCreated);
  console.log('[insertMockConversations] Final result - assignments:', assignments.length, 'sessions:', sessions.length, 'responses:', responsesCreated);
  onProgress?.(`Created ${responsesCreated} responses ✓`);
  onProgress?.('✅ Mock data generation complete!');
  
  return {
    sessionsCreated: sessions.length,
    responsesCreated: responsesCreated,
    assignmentsCreated: assignments.length
  };
}
