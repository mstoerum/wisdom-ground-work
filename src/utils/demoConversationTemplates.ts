/**
 * Conversation templates for the Nexus Technologies demo
 * These create rich semantic patterns that the analytics engine will discover
 */

// Demo company context
export const demoCompany = {
  id: "demo-nexus-pulse-2025",
  name: "Nexus Technologies",
  employeeCount: 320,
  surveyName: "Post-Product Launch Pulse",
  surveyPeriod: "February 2025",
  story: "How Spradley discovered that burnout wasn't about workload - it was about invisible expectations"
};

// Theme definitions for the demo survey
export const demoThemes = [
  { id: "theme-wlb-demo", name: "Work-Life Balance", description: "Expectations around working hours and boundaries" },
  { id: "theme-culture-demo", name: "Post-Launch Culture", description: "How organizational culture shifted after Q4 product launch" },
  { id: "theme-leadership-demo", name: "Leadership & Communication", description: "Manager support and organizational transparency" },
  { id: "theme-career-demo", name: "Career Growth", description: "Development opportunities and progression" },
  { id: "theme-team-demo", name: "Team Collaboration", description: "Team dynamics and working relationships" },
];

// Departments with distribution
export const departments = [
  { name: "Engineering", weight: 0.45 },  // 45% - largest department
  { name: "Product", weight: 0.20 },
  { name: "Design", weight: 0.12 },
  { name: "Sales", weight: 0.13 },
  { name: "Marketing", weight: 0.10 },
];

/**
 * Pattern 1: "I love my work, but..." - Hidden burnout masked by pride
 * This is the KEY pattern Spradley will discover
 */
export const hiddenBurnoutConversations = [
  {
    mood: { initial: 7, final: 4 },
    department: "Engineering",
    exchanges: [
      { 
        user: "I genuinely love what we're building here. The product is something I'm really proud of.", 
        sentiment: "positive", 
        score: 78,
        theme: "theme-culture-demo"
      },
      { 
        user: "But I haven't had a real weekend in about two months now. My partner is starting to notice.", 
        sentiment: "negative", 
        score: 32,
        theme: "theme-wlb-demo"
      },
      { 
        user: "It's hard because I don't want to seem uncommitted. Everyone else seems fine with it.", 
        sentiment: "negative", 
        score: 41,
        theme: "theme-culture-demo"
      }
    ]
  },
  {
    mood: { initial: 8, final: 5 },
    department: "Engineering",
    exchanges: [
      { 
        user: "The launch was incredible - seeing our work go live felt amazing.", 
        sentiment: "positive", 
        score: 85,
        theme: "theme-culture-demo"
      },
      { 
        user: "I just wish I could have celebrated it instead of immediately jumping to the next sprint.", 
        sentiment: "neutral", 
        score: 45,
        theme: "theme-wlb-demo"
      },
      { 
        user: "My therapist says I'm showing signs of burnout. But how do you say that when you're proud of what you built?", 
        sentiment: "negative", 
        score: 28,
        theme: "theme-wlb-demo"
      }
    ]
  },
  {
    mood: { initial: 7, final: 4 },
    department: "Product",
    exchanges: [
      { 
        user: "Being part of this launch is a career highlight. I tell everyone about what we shipped.", 
        sentiment: "positive", 
        score: 82,
        theme: "theme-career-demo"
      },
      { 
        user: "But I missed my daughter's first steps because I was in a 'critical' meeting. That haunts me.", 
        sentiment: "negative", 
        score: 18,
        theme: "theme-wlb-demo"
      }
    ]
  },
  {
    mood: { initial: 6, final: 4 },
    department: "Engineering",
    exchanges: [
      { 
        user: "I'm passionate about the technology. The architecture we've built is genuinely innovative.", 
        sentiment: "positive", 
        score: 75,
        theme: "theme-career-demo"
      },
      { 
        user: "I've gained 15 pounds since October. I don't exercise anymore. I just code and sleep.", 
        sentiment: "negative", 
        score: 22,
        theme: "theme-wlb-demo"
      },
      { 
        user: "It feels impossible to raise this because the product is successful. Success hides the cost.", 
        sentiment: "negative", 
        score: 35,
        theme: "theme-culture-demo"
      }
    ]
  },
  {
    mood: { initial: 8, final: 5 },
    department: "Design",
    exchanges: [
      { 
        user: "The design system we created is beautiful. I put my heart into every component.", 
        sentiment: "positive", 
        score: 88,
        theme: "theme-career-demo"
      },
      { 
        user: "But I haven't seen my friends in months. They've stopped inviting me to things.", 
        sentiment: "negative", 
        score: 30,
        theme: "theme-wlb-demo"
      }
    ]
  },
  {
    mood: { initial: 7, final: 3 },
    department: "Engineering",
    exchanges: [
      { 
        user: "I love solving hard problems. The technical challenges here are exactly what I wanted in my career.", 
        sentiment: "positive", 
        score: 80,
        theme: "theme-career-demo"
      },
      { 
        user: "But I'm exhausted. Not just tired - exhausted in a way that sleep doesn't fix.", 
        sentiment: "negative", 
        score: 25,
        theme: "theme-wlb-demo"
      },
      {
        user: "I had a panic attack last month. First one ever. Haven't told anyone at work.",
        sentiment: "negative",
        score: 15,
        theme: "theme-wlb-demo"
      }
    ]
  },
  {
    mood: { initial: 8, final: 4 },
    department: "Engineering",
    exchanges: [
      { 
        user: "The impact we're having is real. Users love the product and that's incredibly motivating.", 
        sentiment: "positive", 
        score: 85,
        theme: "theme-culture-demo"
      },
      { 
        user: "I just... I can't remember the last time I read a book or had a hobby.", 
        sentiment: "negative", 
        score: 38,
        theme: "theme-wlb-demo"
      }
    ]
  },
  {
    mood: { initial: 6, final: 4 },
    department: "Product",
    exchanges: [
      { 
        user: "I believe in this company's mission. That's why I push myself so hard.", 
        sentiment: "positive", 
        score: 72,
        theme: "theme-culture-demo"
      },
      { 
        user: "But my doctor says my blood pressure is concerning for someone my age.", 
        sentiment: "negative", 
        score: 28,
        theme: "theme-wlb-demo"
      }
    ]
  },
];

/**
 * Pattern 2: "10pm Slack expectation" - Implicit after-hours pressure
 */
export const afterHoursConversations = [
  {
    mood: { initial: 5, final: 4 },
    department: "Engineering",
    exchanges: [
      { 
        user: "Nobody explicitly says you have to reply at night. But when your manager messages at 10pm, you feel the pressure to respond.", 
        sentiment: "negative", 
        score: 28,
        theme: "theme-wlb-demo"
      },
      { 
        user: "It started during the launch crunch and just... never stopped.", 
        sentiment: "negative", 
        score: 35,
        theme: "theme-culture-demo"
      }
    ]
  },
  {
    mood: { initial: 5, final: 4 },
    department: "Product",
    exchanges: [
      { 
        user: "I get Slack notifications at 11pm regularly. The unspoken rule is to respond within an hour.", 
        sentiment: "negative", 
        score: 32,
        theme: "theme-wlb-demo"
      },
      { 
        user: "My partner asked me to turn off notifications but I'm afraid I'll miss something important.", 
        sentiment: "negative", 
        score: 38,
        theme: "theme-wlb-demo"
      }
    ]
  },
  {
    mood: { initial: 6, final: 3 },
    department: "Engineering",
    exchanges: [
      { 
        user: "The VP sent an email at 2am last week asking for a status update. By 8am everyone had replied.", 
        sentiment: "negative", 
        score: 25,
        theme: "theme-leadership-demo"
      },
      { 
        user: "That tells you everything about what's expected here.", 
        sentiment: "negative", 
        score: 30,
        theme: "theme-culture-demo"
      }
    ]
  },
  {
    mood: { initial: 5, final: 4 },
    department: "Design",
    exchanges: [
      { 
        user: "I've started keeping my laptop next to my bed. Just in case something comes in.", 
        sentiment: "negative", 
        score: 28,
        theme: "theme-wlb-demo"
      },
      { 
        user: "It's not healthy, I know. But I saw someone get 'feedback' for a slow response once.", 
        sentiment: "negative", 
        score: 32,
        theme: "theme-leadership-demo"
      }
    ]
  },
  {
    mood: { initial: 6, final: 4 },
    department: "Engineering",
    exchanges: [
      { 
        user: "Weekend work is just expected now. Nobody asks, everyone just knows.", 
        sentiment: "negative", 
        score: 35,
        theme: "theme-wlb-demo"
      },
      { 
        user: "The irony is we're supposed to be building work-life balance tools for our users.", 
        sentiment: "neutral", 
        score: 42,
        theme: "theme-culture-demo"
      }
    ]
  },
  {
    mood: { initial: 5, final: 3 },
    department: "Engineering",
    exchanges: [
      { 
        user: "Last Sunday I was at my kid's birthday party and had to step out for a 'quick call' that lasted 2 hours.", 
        sentiment: "negative", 
        score: 22,
        theme: "theme-wlb-demo"
      },
      { 
        user: "The look on my kid's face... I don't want to be that parent.", 
        sentiment: "negative", 
        score: 18,
        theme: "theme-wlb-demo"
      }
    ]
  },
  {
    mood: { initial: 5, final: 4 },
    department: "Sales",
    exchanges: [
      { 
        user: "Clients know they can reach us anytime. That became a selling point somewhere along the way.", 
        sentiment: "negative", 
        score: 35,
        theme: "theme-culture-demo"
      },
      { 
        user: "Now we're expected to live up to that promise. But it's not sustainable.", 
        sentiment: "negative", 
        score: 30,
        theme: "theme-wlb-demo"
      }
    ]
  },
];

/**
 * Pattern 3: Career Growth - POSITIVE pattern to show contrast
 */
export const careerGrowthConversations = [
  {
    mood: { initial: 7, final: 8 },
    department: "Engineering",
    exchanges: [
      { 
        user: "The mentorship program has been incredible. Sarah has really helped me navigate the technical landscape.", 
        sentiment: "positive", 
        score: 88,
        theme: "theme-career-demo"
      },
      { 
        user: "I feel like I've grown more in 6 months here than 2 years at my last job.", 
        sentiment: "positive", 
        score: 85,
        theme: "theme-career-demo"
      }
    ]
  },
  {
    mood: { initial: 7, final: 9 },
    department: "Product",
    exchanges: [
      { 
        user: "Leadership genuinely invests in our development. The learning budget is real and easy to use.", 
        sentiment: "positive", 
        score: 90,
        theme: "theme-career-demo"
      },
      { 
        user: "I took a design thinking course last month that directly improved my work.", 
        sentiment: "positive", 
        score: 82,
        theme: "theme-career-demo"
      }
    ]
  },
  {
    mood: { initial: 6, final: 8 },
    department: "Design",
    exchanges: [
      { 
        user: "The exposure to different parts of the product has been amazing for my portfolio.", 
        sentiment: "positive", 
        score: 85,
        theme: "theme-career-demo"
      },
      { 
        user: "My manager creates a development plan with me every quarter. It's not just lip service.", 
        sentiment: "positive", 
        score: 88,
        theme: "theme-leadership-demo"
      }
    ]
  },
  {
    mood: { initial: 7, final: 8 },
    department: "Engineering",
    exchanges: [
      { 
        user: "The tech stack here is modern and we're encouraged to experiment with new tools.", 
        sentiment: "positive", 
        score: 82,
        theme: "theme-career-demo"
      },
      { 
        user: "Conference attendance is supported, and they actually want us to share what we learn.", 
        sentiment: "positive", 
        score: 85,
        theme: "theme-career-demo"
      }
    ]
  },
  {
    mood: { initial: 6, final: 8 },
    department: "Marketing",
    exchanges: [
      { 
        user: "The cross-functional projects have given me visibility I wouldn't get elsewhere.", 
        sentiment: "positive", 
        score: 80,
        theme: "theme-career-demo"
      },
      { 
        user: "My career path here feels genuinely exciting.", 
        sentiment: "positive", 
        score: 85,
        theme: "theme-career-demo"
      }
    ]
  },
];

/**
 * Pattern 4: Team Collaboration - Mixed signals
 */
export const teamCollaborationConversations = [
  {
    mood: { initial: 6, final: 7 },
    department: "Engineering",
    exchanges: [
      { 
        user: "The engineering team has great camaraderie. We help each other debug at 2am.", 
        sentiment: "positive", 
        score: 72,
        theme: "theme-team-demo"
      },
      { 
        user: "Though I wish we didn't need to be debugging at 2am in the first place.", 
        sentiment: "neutral", 
        score: 50,
        theme: "theme-wlb-demo"
      }
    ]
  },
  {
    mood: { initial: 7, final: 7 },
    department: "Product",
    exchanges: [
      { 
        user: "Cross-team collaboration has improved since the launch. We learned to work together under pressure.", 
        sentiment: "positive", 
        score: 75,
        theme: "theme-team-demo"
      }
    ]
  },
  {
    mood: { initial: 5, final: 5 },
    department: "Design",
    exchanges: [
      { 
        user: "Engineering and design have some friction around handoffs, but we're working on it.", 
        sentiment: "neutral", 
        score: 52,
        theme: "theme-team-demo"
      },
      { 
        user: "The tension usually comes when deadlines are tight. Which is always now.", 
        sentiment: "negative", 
        score: 42,
        theme: "theme-culture-demo"
      }
    ]
  },
  {
    mood: { initial: 7, final: 6 },
    department: "Engineering",
    exchanges: [
      { 
        user: "Our team bonding is actually strong because we've been through so much together.", 
        sentiment: "positive", 
        score: 78,
        theme: "theme-team-demo"
      },
      { 
        user: "Trauma bonding, someone joked. It was a little too accurate.", 
        sentiment: "neutral", 
        score: 48,
        theme: "theme-culture-demo"
      }
    ]
  },
];

/**
 * Pattern 5: Leadership Communication - Trust but concern
 */
export const leadershipConversations = [
  {
    mood: { initial: 6, final: 5 },
    department: "Engineering",
    exchanges: [
      { 
        user: "I trust my direct manager. She advocates for us and pushes back on unrealistic timelines.", 
        sentiment: "positive", 
        score: 78,
        theme: "theme-leadership-demo"
      },
      { 
        user: "But somewhere above her, someone keeps saying yes to things we can't deliver.", 
        sentiment: "negative", 
        score: 38,
        theme: "theme-leadership-demo"
      }
    ]
  },
  {
    mood: { initial: 5, final: 4 },
    department: "Product",
    exchanges: [
      { 
        user: "Executive communication has been sparse since the launch. We don't know what's next.", 
        sentiment: "negative", 
        score: 40,
        theme: "theme-leadership-demo"
      },
      { 
        user: "The silence makes people anxious. Are we pivoting? Are there layoffs coming?", 
        sentiment: "negative", 
        score: 32,
        theme: "theme-culture-demo"
      }
    ]
  },
  {
    mood: { initial: 6, final: 5 },
    department: "Sales",
    exchanges: [
      { 
        user: "The CEO did a town hall after the launch. It was all celebration, no acknowledgment of the cost.", 
        sentiment: "neutral", 
        score: 45,
        theme: "theme-leadership-demo"
      },
      { 
        user: "Recognition is nice, but I'd rather have sustainable expectations.", 
        sentiment: "negative", 
        score: 38,
        theme: "theme-culture-demo"
      }
    ]
  },
  {
    mood: { initial: 7, final: 6 },
    department: "Engineering",
    exchanges: [
      { 
        user: "Our skip-level is actually really transparent about challenges. I appreciate that honesty.", 
        sentiment: "positive", 
        score: 75,
        theme: "theme-leadership-demo"
      },
      { 
        user: "I just wish that honesty included admitting we're stretched too thin.", 
        sentiment: "neutral", 
        score: 48,
        theme: "theme-culture-demo"
      }
    ]
  },
];

/**
 * Combine all patterns with proper distribution
 * ~67% of Engineering shows hidden burnout pattern (as promised in the story)
 */
export function generateAllConversations() {
  const allConversations = [
    // Hidden burnout (the key pattern) - heavy Engineering focus
    ...hiddenBurnoutConversations.map(c => ({ ...c, pattern: "hidden-burnout" })),
    ...hiddenBurnoutConversations.map(c => ({ ...c, pattern: "hidden-burnout", id: crypto.randomUUID() })), // Duplicate for volume
    ...hiddenBurnoutConversations.slice(0, 5).map(c => ({ ...c, pattern: "hidden-burnout", id: crypto.randomUUID() })), // More duplicates
    
    // After-hours expectation 
    ...afterHoursConversations.map(c => ({ ...c, pattern: "after-hours" })),
    ...afterHoursConversations.map(c => ({ ...c, pattern: "after-hours", id: crypto.randomUUID() })),
    
    // Career growth (positive contrast)
    ...careerGrowthConversations.map(c => ({ ...c, pattern: "career-growth" })),
    ...careerGrowthConversations.map(c => ({ ...c, pattern: "career-growth", id: crypto.randomUUID() })),
    
    // Team collaboration
    ...teamCollaborationConversations.map(c => ({ ...c, pattern: "team-collaboration" })),
    
    // Leadership
    ...leadershipConversations.map(c => ({ ...c, pattern: "leadership" })),
    ...leadershipConversations.map(c => ({ ...c, pattern: "leadership", id: crypto.randomUUID() })),
  ];
  
  return allConversations;
}

export type ConversationTemplate = typeof hiddenBurnoutConversations[0];
export type Exchange = ConversationTemplate["exchanges"][0];
