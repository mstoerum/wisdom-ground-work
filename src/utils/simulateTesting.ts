/**
 * Testing Simulation Script
 * Simulates comprehensive testing across all personas with realistic data
 */

import { supabase } from '@/integrations/supabase/client';

interface PersonaProfile {
  id: string;
  organization_type: string;
  age_range: string;
  tech_comfort_level: number;
  role_level: string;
  characteristics: {
    communication_style: string;
    concerns: string[];
    preferences: string[];
  };
}

const PERSONAS: PersonaProfile[] = [
  {
    id: 'maria_chen',
    organization_type: 'large_corp',
    age_range: '31-40',
    tech_comfort_level: 5,
    role_level: 'individual_contributor',
    characteristics: {
      communication_style: 'direct, data-driven',
      concerns: ['work-life balance', 'global team disconnection', 'time zones'],
      preferences: ['async communication', 'technical precision'],
    },
  },
  {
    id: 'james_mitchell',
    organization_type: 'large_corp',
    age_range: '41-50',
    tech_comfort_level: 3,
    role_level: 'manager',
    characteristics: {
      communication_style: 'relationship-focused, conversational',
      concerns: ['team morale', 'sales targets', 'leadership communication'],
      preferences: ['voice communication', 'personal connection'],
    },
  },
  {
    id: 'priya_sharma',
    organization_type: 'large_corp',
    age_range: '20-30',
    tech_comfort_level: 4,
    role_level: 'individual_contributor',
    characteristics: {
      communication_style: 'casual, digital-native',
      concerns: ['career growth', 'work environment', 'manager relationship'],
      preferences: ['chat for privacy', 'text communication'],
    },
  },
  {
    id: 'alex_rivera',
    organization_type: 'startup',
    age_range: '20-30',
    tech_comfort_level: 5,
    role_level: 'executive',
    characteristics: {
      communication_style: 'fast-paced, direct',
      concerns: ['burnout', 'team culture', 'maintaining values'],
      preferences: ['efficiency', 'multitasking', 'voice while mobile'],
    },
  },
  {
    id: 'jordan_kim',
    organization_type: 'startup',
    age_range: '20-30',
    tech_comfort_level: 5,
    role_level: 'individual_contributor',
    characteristics: {
      communication_style: 'informal, emoji-friendly',
      concerns: ['learning curve', 'fitting in', 'compensation'],
      preferences: ['mobile-first', 'async', 'chat'],
    },
  },
  {
    id: 'sam_taylor',
    organization_type: 'startup',
    age_range: '31-40',
    tech_comfort_level: 3,
    role_level: 'manager',
    characteristics: {
      communication_style: 'professional, detailed',
      concerns: ['remote isolation', 'unclear processes', 'compensation fairness'],
      preferences: ['detailed reflection', 'chat for depth'],
    },
  },
  {
    id: 'fatima_almahmoud',
    organization_type: 'ngo',
    age_range: '31-40',
    tech_comfort_level: 3,
    role_level: 'individual_contributor',
    characteristics: {
      communication_style: 'storytelling, mission-driven',
      concerns: ['burnout', 'limited resources', 'feeling heard'],
      preferences: ['voice for stories', 'emotional expression'],
    },
  },
  {
    id: 'marcus_johnson',
    organization_type: 'ngo',
    age_range: '41-50',
    tech_comfort_level: 4,
    role_level: 'manager',
    characteristics: {
      communication_style: 'strategic, data-focused',
      concerns: ['team retention', 'donor pressure', 'work-life balance'],
      preferences: ['efficiency', 'voice during commute'],
    },
  },
  {
    id: 'aisha_patel',
    organization_type: 'ngo',
    age_range: '20-30',
    tech_comfort_level: 3,
    role_level: 'individual_contributor',
    characteristics: {
      communication_style: 'practical, contextual',
      concerns: ['safety', 'field conditions', 'support from HQ'],
      preferences: ['mobile voice', 'practical communication'],
    },
  },
  {
    id: 'david_obrien',
    organization_type: 'public_sector',
    age_range: '51-60',
    tech_comfort_level: 2,
    role_level: 'individual_contributor',
    characteristics: {
      communication_style: 'formal, thorough',
      concerns: ['job security', 'bureaucratic inefficiency', 'retirement'],
      preferences: ['reading/writing', 'chat over voice'],
    },
  },
  {
    id: 'lisa_anderson',
    organization_type: 'public_sector',
    age_range: '31-40',
    tech_comfort_level: 4,
    role_level: 'individual_contributor',
    characteristics: {
      communication_style: 'analytical, evidence-based',
      concerns: ['work-life balance', 'bureaucratic processes', 'career advancement'],
      preferences: ['structured input', 'chat for analysis'],
    },
  },
  {
    id: 'roberto_silva',
    organization_type: 'public_sector',
    age_range: '20-30',
    tech_comfort_level: 3,
    role_level: 'individual_contributor',
    characteristics: {
      communication_style: 'empathetic, story-focused',
      concerns: ['burnout', 'caseload', 'support from management'],
      preferences: ['voice for emotion', 'personal connection'],
    },
  },
];

// Generate realistic responses based on persona
function generatePersonaResponse(
  persona: PersonaProfile,
  questionType: string,
  questionId: string
): any {
  const { tech_comfort_level, characteristics } = persona;

  // Pre-interaction questions
  if (questionType === 'pre_interaction') {
    switch (questionId) {
      case 'tech_comfort':
        return [tech_comfort_level];
      case 'previous_experience':
        return tech_comfort_level >= 4 ? 'Yes' : 'No';
      case 'primary_concerns':
        return characteristics.concerns.join(', ');
      case 'preference':
        if (characteristics.preferences.some(p => p.includes('voice'))) return 'Prefer speaking';
        if (characteristics.preferences.some(p => p.includes('chat') || p.includes('text'))) return 'Prefer typing';
        return 'No preference';
    }
  }

  // Post-interaction questions - vary by method
  if (questionType === 'post_interaction') {
    const method = questionId.includes('chat') ? 'chat' : questionId.includes('voice') ? 'voice' : 'survey';
    
    // Base scores on persona and method
    let baseScore = tech_comfort_level;
    
    if (method === 'chat') {
      if (characteristics.preferences.some(p => p.includes('chat') || p.includes('text'))) {
        baseScore = Math.min(5, baseScore + 1);
      }
      if (persona.id === 'priya_sharma') baseScore = 5; // Privacy in shared space
      if (persona.id === 'david_obrien') baseScore = 4; // Prefers reading/writing
    }
    
    if (method === 'voice') {
      if (characteristics.preferences.some(p => p.includes('voice'))) {
        baseScore = Math.min(5, baseScore + 1);
      }
      if (persona.id === 'james_mitchell') baseScore = 5; // Talks for a living
      if (persona.id === 'roberto_silva') baseScore = 5; // Emotional expression
      if (persona.id === 'david_obrien') baseScore = 2; // Low tech comfort
    }

    // Add some variance
    const variance = Math.floor(Math.random() * 2) - 1; // -1, 0, or 1
    const score = Math.max(1, Math.min(5, baseScore + variance));

    switch (questionId) {
      case 'ease_of_use':
        return [score];
      case 'comfort':
        return [score + (persona.id === 'priya_sharma' && method === 'chat' ? 1 : 0)];
      case 'trust':
        return [4]; // Generally high trust
      case 'privacy_confidence':
        if (method === 'voice' && persona.id === 'priya_sharma') return [2]; // Privacy concern
        return [4];
      case 'depth':
        if (method === 'chat' && persona.id === 'sam_taylor') return 'Yes';
        if (method === 'voice' && persona.id === 'roberto_silva') return 'Yes';
        return 'Somewhat';
      case 'time':
        if (method === 'voice' && persona.id === 'alex_rivera') return 'About right';
        if (method === 'survey') return 'Too long';
        return 'About right';
      case 'would_use_again':
        return score >= 4 ? 'Yes' : 'Maybe';
      case 'overall_thoughts':
        return generateThoughts(persona, method);
    }
  }

  // Comparison questions
  if (questionType === 'comparison') {
    const preferredMethod = getPreferredMethod(persona);
    
    switch (questionId) {
      case 'preference':
        return preferredMethod;
      case 'preference_reasoning':
        return generatePreferenceReasoning(persona, preferredMethod);
      case 'time_comparison':
        if (persona.id === 'alex_rivera') return 'Voice'; // Faster
        return 'Similar';
      case 'depth_comparison':
        if (persona.id === 'sam_taylor') return 'Chat'; // Detailed reflection
        if (persona.id === 'roberto_silva') return 'Voice'; // Emotional depth
        return 'Similar';
      case 'comfort_comparison':
        if (preferredMethod === 'Chat Interface') return 'Chat';
        if (preferredMethod === 'Voice Interface') return 'Voice';
        return 'Similar';
      case 'honesty_comparison':
        if (persona.id === 'priya_sharma') return 'Chat'; // Privacy
        return 'Similar';
      case 'engagement_comparison':
        if (preferredMethod === 'Chat Interface') return 'Chat';
        if (preferredMethod === 'Voice Interface') return 'Voice';
        return 'Survey';
      case 'recommendation':
        const prefScore = preferredMethod === 'Traditional Survey' ? 3 : 4;
        return [prefScore];
    }
  }

  // Final reflection
  if (questionType === 'final_reflection') {
    const preferredMethod = getPreferredMethod(persona);
    
    switch (questionId) {
      case 'overall_satisfaction':
        return [4];
      case 'future_method':
        return preferredMethod;
      case 'improvement_suggestions':
        return generateImprovementSuggestions(persona);
      case 'additional_comments':
        return generateFinalComments(persona);
    }
  }

  return null;
}

function getPreferredMethod(persona: PersonaProfile): string {
  if (persona.characteristics.preferences.some(p => p.includes('voice'))) {
    return 'Voice Interface';
  }
  if (persona.characteristics.preferences.some(p => p.includes('chat') || p.includes('text'))) {
    return 'Chat Interface';
  }
  if (persona.id === 'david_obrien') return 'Traditional Survey'; // Traditional preference
  // Default: prefer chat for most tech-comfortable, voice for relationship-focused
  if (persona.id === 'james_mitchell' || persona.id === 'roberto_silva') {
    return 'Voice Interface';
  }
  return 'Chat Interface';
}

function generateThoughts(persona: PersonaProfile, method: string): string {
  const thoughts: Record<string, Record<string, string>> = {
    maria_chen: {
      chat: 'The chat interface was efficient and allowed me to think through my responses. Perfect for my work style.',
      voice: 'Voice was convenient but I prefer text for technical discussions. Felt less anonymous.',
      survey: 'Traditional survey felt too rigid. I wanted to elaborate on some points.',
    },
    james_mitchell: {
      chat: 'Chat was okay but I prefer talking. It feels more natural for me.',
      voice: 'Voice was perfect! I talk for a living so this felt natural and comfortable.',
      survey: 'The survey format was too formal. I wanted to have a conversation.',
    },
    priya_sharma: {
      chat: 'Chat was great for privacy in my shared desk space. I felt more comfortable expressing concerns.',
      voice: 'Voice made me nervous about privacy. I worried people could hear me.',
      survey: 'The survey was okay but I prefer the conversational approach.',
    },
    alex_rivera: {
      chat: 'Chat was efficient. I could multitask while responding.',
      voice: 'Voice was great for when I was on the go. Much faster than typing.',
      survey: 'The survey took too long. I need something quicker.',
    },
    roberto_silva: {
      chat: 'Chat was good but I prefer speaking. It\'s easier to express emotions verbally.',
      voice: 'Voice was perfect for sharing my experiences. I felt I could express myself more fully.',
      survey: 'The survey format didn\'t capture the emotional aspects of my work.',
    },
  };

  return thoughts[persona.id]?.[method] || 'The experience was interesting. I can see potential in this approach.';
}

function generatePreferenceReasoning(persona: PersonaProfile, method: string): string {
  const reasoning: Record<string, string> = {
    maria_chen: 'Chat allows me to think through responses and be precise. Voice felt less anonymous.',
    james_mitchell: 'Voice feels natural since I talk for a living. It\'s more engaging than typing.',
    priya_sharma: 'Chat provides better privacy in shared spaces. I can express concerns without worrying about being overheard.',
    alex_rivera: 'Voice is faster and I can use it while multitasking. Perfect for my busy schedule.',
    sam_taylor: 'Chat allows me to reflect deeply and provide detailed responses. I prefer written communication.',
    fatima_almahmoud: 'Voice is better for storytelling. I can express emotions and context more naturally.',
    roberto_silva: 'Voice captures the emotional aspects of my work better. I can express empathy and concern more naturally.',
    david_obrien: 'Traditional survey feels more formal and structured. I\'m comfortable with this format.',
    lisa_anderson: 'Chat allows for analytical thinking and structured responses. I can review and refine my thoughts.',
  };

  return reasoning[persona.id] || `I prefer ${method.toLowerCase()} because it aligns with my communication style.`;
}

function generateImprovementSuggestions(persona: PersonaProfile): string {
  const suggestions: Record<string, string> = {
    maria_chen: 'Consider adding voice transcription for review. Also, better privacy indicators would help.',
    james_mitchell: 'Voice quality was good but sometimes interruptions didn\'t work smoothly.',
    priya_sharma: 'More privacy indicators would help. Also, ability to switch between chat and voice mid-session.',
    alex_rivera: 'Make it even faster. Consider voice shortcuts or quick responses.',
    roberto_silva: 'The voice interface was great but sometimes it didn\'t capture emotional nuance well.',
    david_obrien: 'More instructions and help text would be useful. Also, ability to save progress.',
  };

  return suggestions[persona.id] || 'The system is good overall. Consider adding more customization options.';
}

function generateFinalComments(persona: PersonaProfile): string {
  const comments: Record<string, string> = {
    maria_chen: 'Overall, chat fits my work style better. Voice has potential but privacy concerns remain.',
    james_mitchell: 'I loved the voice interface! It felt natural and engaging. Would definitely use this again.',
    priya_sharma: 'Chat was perfect for my situation. The privacy aspect is crucial for me.',
    alex_rivera: 'Both chat and voice are improvements over traditional surveys. Speed is key for me.',
    roberto_silva: 'Voice interface really helps me express the emotional aspects of my work. This is important.',
    david_obrien: 'I prefer traditional surveys but I can see how younger employees might prefer chat/voice.',
  };

  return comments[persona.id] || 'Thank you for the opportunity to test these new methods. I can see potential in this approach.';
}

// Simulate interaction metrics
function generateInteractionMetrics(persona: PersonaProfile, method: string) {
  const baseMetrics = {
    traditional_survey: {
      duration_seconds: 600 + Math.floor(Math.random() * 300), // 10-15 min
      message_count: 0,
      word_count: 150 + Math.floor(Math.random() * 100),
      interaction_count: 10 + Math.floor(Math.random() * 5),
      sentiment_score: 3.0 + (Math.random() * 1.0),
    },
    chat: {
      duration_seconds: 480 + Math.floor(Math.random() * 240), // 8-12 min
      message_count: 8 + Math.floor(Math.random() * 5),
      word_count: 200 + Math.floor(Math.random() * 150),
      interaction_count: 8 + Math.floor(Math.random() * 5),
      sentiment_score: 3.2 + (Math.random() * 1.0),
    },
    voice: {
      duration_seconds: 360 + Math.floor(Math.random() * 180), // 6-9 min
      message_count: 6 + Math.floor(Math.random() * 4),
      word_count: 250 + Math.floor(Math.random() * 200),
      interaction_count: 6 + Math.floor(Math.random() * 4),
      sentiment_score: 3.5 + (Math.random() * 1.0),
    },
  };

  const metrics = baseMetrics[method as keyof typeof baseMetrics];
  
  // Adjust based on persona
  if (persona.id === 'alex_rivera' && method === 'voice') {
    metrics.duration_seconds = Math.floor(metrics.duration_seconds * 0.8); // Faster
  }
  if (persona.id === 'sam_taylor' && method === 'chat') {
    metrics.word_count = Math.floor(metrics.word_count * 1.3); // More detailed
  }
  if (persona.id === 'roberto_silva' && method === 'voice') {
    metrics.word_count = Math.floor(metrics.word_count * 1.2); // More expressive
    metrics.sentiment_score = 3.8 + (Math.random() * 0.5); // Higher emotion
  }

  return metrics;
}

export async function simulateTesting(personaIds?: string[]): Promise<void> {
  const personasToTest = personaIds 
    ? PERSONAS.filter(p => personaIds.includes(p.id))
    : PERSONAS;

  console.log(`Starting simulation for ${personasToTest.length} personas...`);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to run simulation');
  }

  // Get or create test survey
  let testSurveyId: string;
  const { data: existingSurvey } = await supabase
    .from('surveys')
    .select('id')
    .eq('title', 'Testing - Traditional Survey')
    .limit(1)
    .single();

  if (existingSurvey) {
    testSurveyId = existingSurvey.id;
  } else {
    const { data: newSurvey, error } = await supabase
      .from('surveys')
      .insert({
        title: 'Testing - Traditional Survey',
        description: 'Test survey for simulation',
        created_by: user.id,
        status: 'active',
        first_message: 'Welcome to the test survey.',
        consent_config: {
          anonymization_level: 'anonymous',
          data_retention_days: 30,
        },
      })
      .select()
      .single();

    if (error) throw error;
    testSurveyId = newSurvey.id;
  }

  for (const persona of personasToTest) {
    console.log(`Simulating ${persona.id}...`);

    try {
      // Create testing session
      const participantCode = `${persona.id}_sim_${Date.now()}`;
      const { data: session, error: sessionError } = await supabase
        .from('testing_sessions')
        .insert({
          persona_id: persona.id,
          organization_type: persona.organization_type,
          participant_code: participantCode,
          test_sequence: ['traditional_survey', 'chat', 'voice'],
          status: 'in_progress',
          age_range: persona.age_range,
          tech_comfort_level: persona.tech_comfort_level,
          role_level: persona.role_level,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create pre-interaction questionnaire
      const preResponses: Record<string, any> = {
        tech_comfort: generatePersonaResponse(persona, 'pre_interaction', 'tech_comfort'),
        previous_experience: generatePersonaResponse(persona, 'pre_interaction', 'previous_experience'),
        primary_concerns: generatePersonaResponse(persona, 'pre_interaction', 'primary_concerns'),
        preference: generatePersonaResponse(persona, 'pre_interaction', 'preference'),
      };

      await supabase.from('testing_questionnaires').insert({
        testing_session_id: session.id,
        questionnaire_type: 'pre_interaction',
        responses: preResponses,
        ease_of_use_score: null,
        comfort_score: null,
        trust_score: null,
        privacy_confidence: null,
        engagement_score: null,
        overall_satisfaction: null,
      });

      // Simulate each method
      const methods = ['traditional_survey', 'chat', 'voice'];
      const interactionIds: string[] = [];

      for (const method of methods) {
        const metrics = generateInteractionMetrics(persona, method);
        const startedAt = new Date();
        startedAt.setMinutes(startedAt.getMinutes() - Math.floor(metrics.duration_seconds / 60));
        const completedAt = new Date(startedAt);
        completedAt.setSeconds(completedAt.getSeconds() + metrics.duration_seconds);

        const { data: interaction, error: interactionError } = await supabase
          .from('testing_interactions')
          .insert({
            testing_session_id: session.id,
            method,
            started_at: startedAt.toISOString(),
            completed_at: completedAt.toISOString(),
            duration_seconds: metrics.duration_seconds,
            message_count: metrics.message_count,
            word_count: metrics.word_count,
            interaction_count: metrics.interaction_count,
            completed: true,
            error_count: Math.random() < 0.1 ? 1 : 0, // 10% chance of error
            device_type: /Mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            browser: navigator.userAgent.substring(0, 50),
            location: persona.organization_type === 'ngo' ? 'field' : 'office',
            sentiment_score: metrics.sentiment_score,
          })
          .select()
          .single();

        if (interactionError) throw interactionError;
        interactionIds.push(interaction.id);

        // Create post-interaction questionnaire
        const postResponses: Record<string, any> = {
          ease_of_use: generatePersonaResponse(persona, 'post_interaction', 'ease_of_use'),
          comfort: generatePersonaResponse(persona, 'post_interaction', 'comfort'),
          trust: generatePersonaResponse(persona, 'post_interaction', 'trust'),
          privacy_confidence: generatePersonaResponse(persona, 'post_interaction', 'privacy_confidence'),
          depth: generatePersonaResponse(persona, 'post_interaction', 'depth'),
          depth_reasoning: 'Based on my experience and preferences.',
          time: generatePersonaResponse(persona, 'post_interaction', 'time'),
          would_use_again: generatePersonaResponse(persona, 'post_interaction', 'would_use_again'),
          overall_thoughts: generatePersonaResponse(persona, 'post_interaction', 'overall_thoughts'),
        };

        const postEase = Array.isArray(postResponses.ease_of_use) ? postResponses.ease_of_use[0] : postResponses.ease_of_use;
        const postComfort = Array.isArray(postResponses.comfort) ? postResponses.comfort[0] : postResponses.comfort;
        const postTrust = Array.isArray(postResponses.trust) ? postResponses.trust[0] : postResponses.trust;
        const postPrivacy = Array.isArray(postResponses.privacy_confidence) ? postResponses.privacy_confidence[0] : postResponses.privacy_confidence;

        await supabase.from('testing_questionnaires').insert({
          testing_session_id: session.id,
          testing_interaction_id: interaction.id,
          questionnaire_type: 'post_interaction',
          method_tested: method,
          responses: postResponses,
          ease_of_use_score: postEase,
          comfort_score: postComfort,
          trust_score: postTrust,
          privacy_confidence: postPrivacy,
          engagement_score: null,
          overall_satisfaction: null,
        });
      }

      // Create comparison questionnaire
      const comparisonResponses: Record<string, any> = {
        preference: generatePersonaResponse(persona, 'comparison', 'preference'),
        preference_reasoning: generatePersonaResponse(persona, 'comparison', 'preference_reasoning'),
        time_comparison: generatePersonaResponse(persona, 'comparison', 'time_comparison'),
        depth_comparison: generatePersonaResponse(persona, 'comparison', 'depth_comparison'),
        comfort_comparison: generatePersonaResponse(persona, 'comparison', 'comfort_comparison'),
        honesty_comparison: generatePersonaResponse(persona, 'comparison', 'honesty_comparison'),
        engagement_comparison: generatePersonaResponse(persona, 'comparison', 'engagement_comparison'),
        recommendation: generatePersonaResponse(persona, 'comparison', 'recommendation'),
      };

      const preferredMethod = comparisonResponses.preference;
      const methodA = 'Traditional Survey';
      const methodB = preferredMethod === 'Chat Interface' ? 'Chat Interface' : 'Voice Interface';

      await supabase.from('testing_comparisons').insert({
        testing_session_id: session.id,
        method_a: methodA,
        method_b: methodB,
        preference: preferredMethod,
        preference_reasoning: comparisonResponses.preference_reasoning,
        time_comparison: comparisonResponses.time_comparison,
        depth_comparison: comparisonResponses.depth_comparison,
        comfort_comparison: comparisonResponses.comfort_comparison,
        honesty_comparison: comparisonResponses.honesty_comparison,
        engagement_comparison: comparisonResponses.engagement_comparison,
        would_recommend: Array.isArray(comparisonResponses.recommendation) 
          ? comparisonResponses.recommendation[0] >= 4 
          : true,
        recommendation_score: Array.isArray(comparisonResponses.recommendation) 
          ? comparisonResponses.recommendation[0] 
          : 4,
      });

      await supabase.from('testing_questionnaires').insert({
        testing_session_id: session.id,
        questionnaire_type: 'comparison',
        responses: comparisonResponses,
        ease_of_use_score: null,
        comfort_score: null,
        trust_score: null,
        privacy_confidence: null,
        engagement_score: Array.isArray(comparisonResponses.recommendation) 
          ? comparisonResponses.recommendation[0] 
          : null,
        overall_satisfaction: null,
      });

      // Create final reflection
      const finalResponses: Record<string, any> = {
        overall_satisfaction: generatePersonaResponse(persona, 'final_reflection', 'overall_satisfaction'),
        future_method: generatePersonaResponse(persona, 'final_reflection', 'future_method'),
        improvement_suggestions: generatePersonaResponse(persona, 'final_reflection', 'improvement_suggestions'),
        additional_comments: generatePersonaResponse(persona, 'final_reflection', 'additional_comments'),
      };

      await supabase.from('testing_questionnaires').insert({
        testing_session_id: session.id,
        questionnaire_type: 'final_reflection',
        responses: finalResponses,
        ease_of_use_score: null,
        comfort_score: null,
        trust_score: null,
        privacy_confidence: null,
        engagement_score: null,
        overall_satisfaction: Array.isArray(finalResponses.overall_satisfaction) 
          ? finalResponses.overall_satisfaction[0] 
          : null,
      });

      // Mark session as completed
      await supabase
        .from('testing_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', session.id);

      console.log(`? Completed ${persona.id}`);
    } catch (error) {
      console.error(`? Error simulating ${persona.id}:`, error);
    }
  }

  console.log(`Simulation complete! Generated data for ${personasToTest.length} personas.`);
}
