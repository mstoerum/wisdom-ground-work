# Employee Chat & Voice Testing: Persona Quick Reference Matrix

Quick reference guide for testing across different employee personas and organizational contexts.

---

## Persona Matrix Overview

| Persona | Organization Type | Role | Age | Tech Comfort | Communication Style | Key Testing Focus |
|---------|------------------|------|-----|--------------|-------------------|-------------------|
| **Maria Chen** | Large Int'l Corp | Senior Software Engineer | 32 | Very High | Direct, data-driven | Time zones, voice anonymity, depth |
| **James Mitchell** | Large Int'l Corp | Sales Manager | 45 | Moderate | Relationship-focused | Voice preference, privacy, emotional expression |
| **Priya Sharma** | Large Int'l Corp | Junior HR Coordinator | 26 | High | Casual, anxious | Privacy in shared space, junior honesty |
| **Alex Rivera** | Small Startup | Co-founder/PM | 28 | Very High | Fast-paced, direct | Time efficiency, multitasking |
| **Jordan Kim** | Small Startup | Junior Developer | 24 | Very High | Informal, Gen Z | Mobile-first, async preference |
| **Sam Taylor** | Small Startup | Operations Lead (Remote) | 35 | Moderate | Professional, detailed | Remote connection, depth |
| **Fatima Al-Mahmoud** | NGO | Program Coordinator | 30 | Moderate | Storytelling, mission-driven | Language preference, emotional expression |
| **Marcus Johnson** | NGO | Development Director | 42 | Moderate-High | Strategic, time-constrained | Efficiency, commute usage |
| **Aisha Patel** | NGO | Field Coordinator | 27 | Moderate | Practical, contextual | Mobile, field conditions, connectivity |
| **David O'Brien** | Public Sector | Administrative Officer | 52 | Low-Moderate | Formal, traditional | Tech barriers, trust in digital |
| **Lisa Anderson** | Public Sector | Policy Analyst | 34 | High | Analytical, structured | Depth, nuanced policy feedback |
| **Roberto Silva** | Public Sector | Social Worker | 29 | Moderate | Empathetic, story-focused | Emotional expression, Portuguese |

---

## Testing Priority by Dimension

### 1. Tech Comfort Level

#### Very High Tech Comfort (Test Advanced Features)
- **Personas**: Maria, Alex, Jordan, Lisa
- **Focus**: Edge cases, multitasking, mobile features, advanced voice features
- **Testing**: Quick setup, minimal guidance, explore features

#### Moderate Tech Comfort (Test Standard Experience)
- **Personas**: James, Sam, Fatima, Marcus, Aisha, Roberto
- **Focus**: Clarity of instructions, error recovery, onboarding
- **Testing**: Provide standard instructions, observe learning curve

#### Low-Moderate Tech Comfort (Test Accessibility)
- **Personas**: David
- **Focus**: Simplicity, help resources, alternative methods
- **Testing**: Extra guidance, measure frustration, provide support

---

### 2. Communication Style

#### Relationship-Focused (Test Voice Preference)
- **Personas**: James, Roberto
- **Hypothesis**: Prefer voice for human connection
- **Testing**: Compare comfort and depth in voice vs. chat

#### Storytelling/Emotional (Test Voice Emotional Expression)
- **Personas**: Fatima, Roberto
- **Hypothesis**: Voice captures emotion better
- **Testing**: Compare emotional depth, sentiment accuracy

#### Analytical/Structured (Test Chat Depth)
- **Personas**: Lisa, Sam
- **Hypothesis**: Chat allows deeper reflection
- **Testing**: Compare detail and nuance in chat vs. voice

#### Fast-Paced/Efficient (Test Time Efficiency)
- **Personas**: Alex, Marcus
- **Hypothesis**: Need quick completion
- **Testing**: Compare time-to-complete, efficiency perception

---

### 3. Organizational Context

#### Large International Corporation
- **Personas**: Maria, James, Priya
- **Key Factors**: Anonymity concerns, hierarchy, cultural diversity
- **Testing Focus**: Privacy perception, cross-cultural adaptation, hierarchical comfort

#### Small Startup
- **Personas**: Alex, Jordan, Sam
- **Key Factors**: Fast pace, founder accessibility, remote work
- **Testing Focus**: Efficiency, multitasking, remote experience

#### NGO/Non-Profit
- **Personas**: Fatima, Marcus, Aisha
- **Key Factors**: Resource constraints, field work, mission focus
- **Testing Focus**: Mobile accessibility, connectivity, emotional/storytelling depth

#### Public Sector
- **Personas**: David, Lisa, Roberto
- **Key Factors**: Bureaucracy, tradition, high emotional labor
- **Testing Focus**: Trust in digital, tech barriers, emotional expression

---

### 4. Language & Cultural Context

#### Multilingual Testers
- **Personas**: Maria (Mandarin/English), Priya (Hindi/English), Fatima (Arabic/English), Roberto (Portuguese/English)
- **Testing Focus**: 
  - Language switching behavior
  - Native language preference for emotional topics
  - Code-switching patterns
  - Voice accent/dialect recognition

#### Cultural Communication Styles
- **High Context** (Fatima, Roberto): Test implicit communication, emotion from tone
- **Low Context** (Lisa, Alex): Test explicit communication, direct feedback
- **Power Distance** (James, Priya): Test comfort expressing concerns to authority

---

### 5. Work Environment

#### Office Settings
- **Open Office** (Maria, Priya): Test privacy concerns, voice in shared space
- **Private Office** (James): Test voice comfort, no privacy barriers
- **Traditional Office** (David): Test tech adoption, paper preference

#### Remote Settings
- **Home Office** (Sam): Test connection quality, quiet environment
- **Field Work** (Aisha): Test mobile, connectivity, noise

#### Mobile-First
- **Personas**: Jordan, Aisha
- **Testing**: Mobile chat/voice, on-the-go usage, connectivity variations

---

## Critical Testing Scenarios by Persona

### Scenario: Privacy & Anonymity
**High Priority Personas**: Priya (junior, shared space), James (manager), Roberto (sensitive concerns)
- **Test**: Privacy confidence scores, anonymity perception
- **Compare**: Voice feels less anonymous? Chat feels more private?

### Scenario: Emotional Expression
**High Priority Personas**: Roberto (social worker), Fatima (storytelling), Sam (isolation)
- **Test**: Sentiment depth, emotion detection, narrative richness
- **Compare**: Voice captures emotion better? Chat allows deeper reflection?

### Scenario: Time Efficiency
**High Priority Personas**: Alex (startup), Marcus (time-constrained), Jordan (mobile-first)
- **Test**: Time-to-complete, efficiency perception, multitasking capability
- **Compare**: Voice faster? Chat more flexible?

### Scenario: Technical Barriers
**High Priority Personas**: David (low tech), Aisha (field conditions), Roberto (language)
- **Test**: Error rates, device compatibility, connection requirements
- **Compare**: Chat more accessible? Voice requires better tech?

### Scenario: Hierarchy & Power
**High Priority Personas**: Priya (junior), Alex (co-founder dynamic), James (manager)
- **Test**: Comfort expressing concerns, honesty levels
- **Compare**: Voice more/less intimidating? Chat more anonymous?

---

## Testing Sequence Recommendations

### Recommended Order for Comprehensive Coverage

1. **Baseline: Traditional Survey** (All personas)
   - Establish baseline metrics
   - Measure completion, time, satisfaction

2. **Chat Interface** (All personas)
   - Test standard experience
   - Measure engagement, depth, comfort

3. **Voice Interface** (All personas)
   - Test voice experience
   - Measure naturalness, privacy, efficiency

4. **Comparative Analysis** (All personas)
   - Direct comparison
   - Preference and recommendation

### Priority Testing Sequence (If Limited Time)

**Week 1: Diverse Tech Comfort**
- David (low tech) - test accessibility
- Maria (high tech) - test advanced features
- James (moderate) - test standard experience

**Week 2: Organizational Context**
- Large Corp: Maria, James, Priya
- Startup: Alex, Jordan
- NGO: Fatima, Marcus

**Week 3: Communication Styles**
- Relationship: James, Roberto
- Analytical: Lisa, Sam
- Fast-paced: Alex, Marcus

**Week 4: Edge Cases**
- Remote: Sam, Aisha
- Mobile: Jordan, Aisha
- Multilingual: Maria, Fatima, Roberto

---

## Key Metrics by Persona Type

### Large Corporation Personas
- **Priority Metrics**: Privacy confidence, hierarchy comfort, cross-cultural adaptation
- **Success Indicators**: Privacy scores ≥ survey, comfort expressing concerns

### Startup Personas
- **Priority Metrics**: Time efficiency, multitasking capability, mobile experience
- **Success Indicators**: Completion time ≤ 150% survey time, mobile completion rate

### NGO Personas
- **Priority Metrics**: Mobile accessibility, emotional depth, field conditions
- **Success Indicators**: Mobile completion rate, emotional sentiment depth

### Public Sector Personas
- **Priority Metrics**: Tech barriers, trust in digital, emotional expression
- **Success Indicators**: Error rate <10%, trust scores ≥ survey

---

## Persona-Specific Test Scenarios

### Maria Chen (Tech-Savvy, Multilingual, Global Team)
**Test Scenario 1**: Chat during work hours (distracted) vs. voice after hours (focused)
**Hypothesis**: Voice better for focused reflection, chat better for quick check-ins
**Measure**: Depth of feedback, engagement level, time investment

**Test Scenario 2**: Voice anonymity perception (recognizable voice in small team)
**Hypothesis**: Less anonymous than chat, may reduce honesty
**Measure**: Privacy confidence, honesty self-report, expression depth

### James Mitchell (Relationship-Focused Manager)
**Test Scenario**: Voice preference (talks for a living)
**Hypothesis**: Prefers voice over typing, more natural expression
**Measure**: Preference, comfort, naturalness perception

**Test Scenario**: Manager perspective on subordinate feedback
**Hypothesis**: May have different concerns than individual contributors
**Measure**: Power dynamics awareness, trust in system

### Priya Sharma (Junior, Shared Space)
**Test Scenario**: Privacy in shared desk space
**Hypothesis**: Chat more private than voice in shared space
**Measure**: Privacy perception, choice of method, completion location

**Test Scenario**: Junior honesty level
**Hypothesis**: Voice may feel less anonymous, reducing honesty
**Measure**: Honesty self-report, expression depth, topic avoidance

### Alex Rivera (Fast-Paced Co-founder)
**Test Scenario**: Multitasking during interaction
**Hypothesis**: Voice allows multitasking better than chat
**Measure**: Multitasking behavior, completion success, quality of feedback

**Test Scenario**: Time efficiency
**Hypothesis**: Voice faster than typing for busy schedule
**Measure**: Time-to-complete, efficiency perception, recommendation

### Jordan Kim (Mobile-First Gen Z)
**Test Scenario**: Mobile chat vs. voice
**Hypothesis**: Mobile-first generation prefers chat for async, voice for quick
**Measure**: Device usage, preference, completion method

**Test Scenario**: Informal communication style
**Hypothesis**: Chat allows more informal expression
**Measure**: Formality level, comfort, naturalness

### Sam Taylor (Remote, Detailed)
**Test Scenario**: Remote connection quality
**Hypothesis**: Home office provides ideal environment for voice
**Measure**: Connection quality, audio clarity, error rate

**Test Scenario**: Depth preference
**Hypothesis**: Detailed style prefers chat for reflection
**Measure**: Response length, detail level, preference reasoning

### Fatima Al-Mahmoud (Storytelling, Multilingual)
**Test Scenario**: Language preference for emotional expression
**Hypothesis**: Native language (Arabic) better for emotional topics
**Measure**: Language choice, emotional depth, sentiment accuracy

**Test Scenario**: Storytelling in voice vs. chat
**Hypothesis**: Voice better for narrative storytelling
**Measure**: Narrative richness, story length, engagement

### Marcus Johnson (Time-Constrained Director)
**Test Scenario**: Efficiency during commute
**Hypothesis**: Voice allows completion during commute
**Measure**: Completion success, quality of feedback, multitasking

**Test Scenario**: Strategic communication fit
**Hypothesis**: Voice may not fit analytical style
**Measure**: Preference, comfort, naturalness for strategic topics

### Aisha Patel (Field Work, Mobile)
**Test Scenario**: Field conditions and connectivity
**Hypothesis**: Mobile voice works in field, connectivity issues impact
**Measure**: Completion success, error rate, connectivity impact

**Test Scenario**: Practical concerns expression
**Hypothesis**: Voice better for practical, contextual feedback
**Measure**: Context richness, practical detail level

### David O'Brien (Traditional, Low Tech)
**Test Scenario**: Tech barriers
**Hypothesis**: Low tech comfort creates barriers
**Measure**: Error rate, frustration level, completion success, support needs

**Test Scenario**: Preference for reading/writing
**Hypothesis**: Prefers chat (reading/writing) over voice
**Measure**: Preference, comfort, completion method

### Lisa Anderson (Analytical, Structured)
**Test Scenario**: Nuanced policy feedback
**Hypothesis**: Chat allows deeper, more nuanced reflection
**Measure**: Response detail, nuance level, policy depth

**Test Scenario**: Structured vs. conversational
**Hypothesis**: Analytical style prefers structured input
**Measure**: Comfort, naturalness, preference for structure

### Roberto Silva (Emotional, Multilingual)
**Test Scenario**: Emotional expression in Portuguese
**Hypothesis**: Native language better for emotional concerns
**Measure**: Emotional depth, sentiment accuracy, language choice

**Test Scenario**: Voice for emotional concerns
**Hypothesis**: Voice captures emotional nuance better
**Measure**: Emotion detection, sentiment depth, comfort expressing emotions

---

## Quick Decision Matrix: When to Test What

| If Testing Focus Is... | Prioritize These Personas | Key Test Scenarios |
|------------------------|---------------------------|-------------------|
| **Privacy/Anonymity** | Priya, James, Roberto | Privacy perception, hierarchy comfort |
| **Emotional Expression** | Roberto, Fatima, Sam | Sentiment depth, storytelling |
| **Time Efficiency** | Alex, Marcus, Jordan | Completion time, multitasking |
| **Technical Accessibility** | David, Aisha | Error rates, device compatibility |
| **Language/Culture** | Maria, Fatima, Roberto | Language preference, cultural adaptation |
| **Remote Work** | Sam, Aisha | Connection quality, mobile experience |
| **Hierarchy/Power** | Priya, James, Alex | Comfort expressing concerns, honesty |

---

This matrix serves as a quick reference during testing. Refer to the detailed persona profiles in the main review plan for comprehensive background information.
