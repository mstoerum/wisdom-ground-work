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

// Calculate sentiment score from sentiment category
function getSentimentScore(sentiment: 'positive' | 'neutral' | 'negative'): number {
  switch (sentiment) {
    case 'positive':
      return randomInt(70, 95);
    case 'neutral':
      return randomInt(40, 65);
    case 'negative':
      return randomInt(10, 40);
  }
}

// Generate a conversation session
function generateSession(
  surveyId: string,
  index: number,
  themeIds: Record<string, string | null>
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
    employee_id: null, // Anonymous in demo
    initial_mood: initialMood,
    final_mood: finalMood,
    started_at: startedAt,
    ended_at: endedAt,
    anonymization_level: 'anonymous',
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
      sentiment_score: sentimentScore,
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
  surveyId: string = 'demo-survey-001'
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
  
demoThemes.forEach((themeName, index) => {
  if (!themeIds[themeName]) {
    // Fallback: leave as null when not found to avoid invalid UUIDs in DB
    themeIds[themeName] = null;
  }
});
  
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
    // Ignore errors, we'll use placeholders
  }
  
  const sessions: MockConversationSession[] = [];
  const allResponses: MockResponse[] = [];
  let responseCounter = 0;
  
  // Generate 45 conversations
  for (let i = 1; i <= 45; i++) {
    const session = generateSession(targetSurveyId, i, themeIds);
    sessions.push(session);
    
    const responses = generateResponses(session, targetSurveyId, themeIds, responseCounter);
    allResponses.push(...responses);
    responseCounter += responses.length;
  }
  
  return { sessions, responses: allResponses };
}

/**
 * Insert mock conversations into the database
 */
export async function insertMockConversations(
  surveyId: string = 'demo-survey-001'
): Promise<{ sessionsCreated: number, responsesCreated: number }> {
  const { sessions, responses } = await generateMockConversations(surveyId);
  
  // Insert sessions
  const { error: sessionsError } = await supabase
    .from('conversation_sessions')
    .upsert(sessions, { onConflict: 'id' });
  
  if (sessionsError) {
    console.error('Error inserting sessions:', sessionsError);
    throw sessionsError;
  }
  
  // Insert responses in batches to avoid overwhelming the database
  const batchSize = 50;
  let responsesCreated = 0;
  
  for (let i = 0; i < responses.length; i += batchSize) {
    const batch = responses.slice(i, i + batchSize);
    const { error: responsesError } = await supabase
      .from('responses')
      .upsert(batch, { onConflict: 'id' });
    
    if (responsesError) {
      console.error('Error inserting responses batch:', responsesError);
      throw responsesError;
    }
    
    responsesCreated += batch.length;
  }
  
  return {
    sessionsCreated: sessions.length,
    responsesCreated: responsesCreated
  };
}
