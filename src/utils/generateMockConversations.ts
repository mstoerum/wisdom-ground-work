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

// Realistic employee response templates by theme and sentiment
const responseTemplates: Record<string, {
  positive: string[];
  neutral: string[];
  negative: string[];
}> = {
  'Work-Life Balance': {
    positive: [
      "I really appreciate the flexible work hours. It helps me balance my personal life with work responsibilities.",
      "The company has been great about respecting boundaries. I rarely feel pressured to work after hours.",
      "I feel like I have a good work-life balance. The remote work options have been amazing.",
      "The leadership really understands the importance of downtime. I never feel guilty taking my vacation days."
    ],
    neutral: [
      "The work-life balance is okay. Some weeks are busier than others, but it's manageable.",
      "I think we could improve work-life balance, but it's not terrible right now.",
      "It depends on the project. Sometimes I work more hours, sometimes less.",
      "The balance is fine for the most part, though I do occasionally work weekends."
    ],
    negative: [
      "I often find myself answering emails late at night. There's an unspoken expectation to always be available.",
      "The work-life balance has gotten worse. I'm working 50+ hours a week regularly.",
      "I feel burnt out. There's no clear boundary between work and personal time anymore.",
      "I had to cancel personal plans multiple times because of urgent work requests. It's frustrating."
    ]
  },
  'Team Collaboration': {
    positive: [
      "My team is incredibly supportive. We work really well together and communicate openly.",
      "I love how collaborative our team is. Everyone is willing to help each other out.",
      "The team dynamics are great. We have regular check-ins and everyone's input is valued.",
      "We have excellent collaboration tools and our team meetings are always productive."
    ],
    neutral: [
      "Team collaboration is decent. We work together when needed, but don't interact much outside of projects.",
      "The team is okay. Some people collaborate more than others.",
      "Collaboration happens when it needs to, but there's room for improvement.",
      "We have good moments of collaboration, but also some silos between different groups."
    ],
    negative: [
      "There's a lack of communication between teams. We often duplicate work or miss important updates.",
      "Some team members don't respond to messages for days, which slows down projects.",
      "I feel isolated from the rest of the team. We rarely have meaningful collaboration.",
      "There's too much competition between team members instead of working together."
    ]
  },
  'Career Development': {
    positive: [
      "The career development workshops have been really helpful for my growth.",
      "I appreciate the learning opportunities and mentorship programs available.",
      "My manager has been supportive of my career goals and helped me find growth opportunities.",
      "The company invests in employee development. I've learned a lot in the past year."
    ],
    neutral: [
      "There are some development opportunities, but I'm not sure about the path forward.",
      "Career growth exists, but it's not always clear how to advance.",
      "I've had some training opportunities, but could use more guidance on career progression.",
      "The development programs are okay, but I'd like to see more options."
    ],
    negative: [
      "I feel stuck in my role. There are no clear advancement opportunities.",
      "Career development feels like an afterthought. Promotions are rare and unclear.",
      "I've asked about growth opportunities multiple times but haven't gotten concrete answers.",
      "The training programs are generic and don't address my specific career goals."
    ]
  },
  'Management Support': {
    positive: [
      "My manager is approachable and really listens to employee feedback.",
      "The leadership team is transparent and keeps us informed about company decisions.",
      "I feel supported by management. They provide clear direction and helpful feedback.",
      "Management recognizes our hard work and provides constructive guidance."
    ],
    neutral: [
      "Management is okay. They're available when needed but not overly involved.",
      "The leadership is fine, though communication could be better.",
      "I have mixed feelings about management. Some things are good, some could improve.",
      "Management is approachable, but I'd like to see more proactive support."
    ],
    negative: [
      "My manager is rarely available and doesn't seem to care about my concerns.",
      "There's a lack of transparency from leadership. Important decisions are made without explanation.",
      "I don't feel heard by management. My feedback seems to fall on deaf ears.",
      "The leadership style is too micromanaging. I don't have autonomy in my work."
    ]
  },
  'Workplace Culture': {
    positive: [
      "The company culture is inclusive and welcoming. I feel comfortable being myself at work.",
      "I love the positive atmosphere. People are friendly and respectful.",
      "The culture promotes innovation and creativity. I feel empowered to share ideas.",
      "There's a strong sense of community and shared values at the company."
    ],
    neutral: [
      "The culture is fine. It's not amazing, but it's not toxic either.",
      "The workplace culture is pretty standard. Nothing stands out as particularly good or bad.",
      "I see both positive and negative aspects of the culture.",
      "The culture varies by department. Some areas are more positive than others."
    ],
    negative: [
      "The culture feels competitive in a negative way. People are always trying to one-up each other.",
      "There's a lot of gossip and negativity. It's not a healthy work environment.",
      "The company talks about values but doesn't practice them consistently.",
      "I don't feel like I fit in with the culture. It's not inclusive."
    ]
  }
};

// AI response templates
const aiResponses = [
  "Thank you for sharing that. Can you tell me more about how that makes you feel?",
  "I understand. What would you say is the biggest factor contributing to that?",
  "That's helpful context. Have you discussed this with anyone else at work?",
  "I appreciate you being open about this. What would you like to see change?",
  "That sounds challenging. What support do you think would help the most?",
  "Thank you for that insight. How long have you been experiencing this?",
  "I hear you. What would an ideal situation look like for you?",
  "That's valuable feedback. Can you think of any positive aspects as well?",
];

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
  const numExchanges = randomInt(3, 8); // 3-8 exchanges per conversation
  
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
    
    // AI responds to most but not all messages
    const aiResponse = Math.random() < 0.8 
      ? aiResponses[randomInt(0, aiResponses.length - 1)]
      : null;
    
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
  
  // Generate 45 conversations
  for (let i = 1; i <= 45; i++) {
    const session = generateSession(targetSurveyId, i, themeIds, employeeId);
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
  const hasAdminRole = await ensureHRAdminRole(user.id);
  
  if (!hasAdminRole) {
    console.warn('User does not have HR admin role, attempting to assign it...');
    // Try assign_demo_hr_admin one more time (works even if other admins exist)
    let demoRoleAssigned = false;
    try {
      const { error: demoRpcError } = await supabase.rpc('assign_demo_hr_admin');
      
      if (!demoRpcError) {
        // Function call succeeded - role should be assigned
        demoRoleAssigned = true;
        console.log('assign_demo_hr_admin called successfully');
        
        // Wait a bit for the function to complete
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verify the role was assigned
        const { data: finalRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'hr_admin');
        
        if (finalRoles && finalRoles.length > 0) {
          // Role assigned successfully! Continue to create survey
          console.log('HR admin role successfully assigned via assign_demo_hr_admin');
        } else {
          // Role not yet visible, but continue anyway - it might be a timing issue
          console.warn('Role assignment may have succeeded but not yet visible. Proceeding anyway.');
        }
      } else {
        console.warn('assign_demo_hr_admin failed:', demoRpcError);
      }
    } catch (error) {
      console.warn('Final attempt to assign demo HR admin role failed:', error);
    }
    
    // If assign_demo_hr_admin succeeded, proceed even if verification fails (timing issue)
    if (demoRoleAssigned) {
      console.log('Proceeding with survey creation - role assignment was attempted');
      // Continue to create survey - the RPC function should have assigned the role
    } else {
      // If still no role, try one more verification check with a delay
      await new Promise(resolve => setTimeout(resolve, 200));
      const { data: finalRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'hr_admin');
      
      if (!finalRoles || finalRoles.length === 0) {
        throw new Error(
          'Permission denied: Cannot assign HR admin role. ' +
          'Please ensure you have proper permissions or contact an administrator.'
        );
      }
    }
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
  surveyId: string = 'demo-survey-001'
): Promise<{ sessionsCreated: number, responsesCreated: number }> {
  // Get current user ID for RLS compliance (needed for conversation_sessions INSERT policy)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Must be authenticated to generate mock data');
  }
  
  // Ensure the survey exists first (this will also ensure user has HR admin role)
  const actualSurveyId = await ensureSurveyExists(surveyId);
  
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
  const { sessions, responses } = await generateMockConversations(actualSurveyId, user.id);
  
  // Verify all sessions have the correct survey_id and employee_id
  const invalidSessions = sessions.filter(s => 
    s.survey_id !== actualSurveyId || s.employee_id !== user.id
  );
  if (invalidSessions.length > 0) {
    throw new Error(`Invalid session data: ${invalidSessions.length} sessions have incorrect survey_id or employee_id`);
  }
  
  // Verify all responses reference valid session IDs
  const sessionIds = new Set(sessions.map(s => s.id));
  const invalidResponses = responses.filter(r => !sessionIds.has(r.conversation_session_id));
  if (invalidResponses.length > 0) {
    throw new Error(`Invalid response data: ${invalidResponses.length} responses reference non-existent session IDs`);
  }
  
  // Insert sessions with retry logic for foreign key issues
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
    console.error('Error inserting sessions:', sessionsError);
    throw new Error(`Failed to insert conversation sessions: ${sessionsError.message || sessionsError.code}`);
  }
  
  // Insert responses in batches to avoid overwhelming the database
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
  
  return {
    sessionsCreated: sessions.length,
    responsesCreated: responsesCreated
  };
}
