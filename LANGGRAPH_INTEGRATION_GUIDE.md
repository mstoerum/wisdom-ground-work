# LangGraph Integration Guide for HR Analytics

## Overview

This guide provides a comprehensive roadmap for integrating LangGraph agents into Spradley's HR Analytics system. The goal is to leverage LangGraph's agentic workflows to generate deep, actionable insights from conversational survey data.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [LangGraph Agent Design Recommendations](#langgraph-agent-design-recommendations)
3. [Integration Patterns](#integration-patterns)
4. [Data Flow](#data-flow)
5. [Implementation Guide](#implementation-guide)
6. [Best Practices](#best-practices)
7. [Example Agent Workflows](#example-agent-workflows)

---

## Architecture Overview

### Current State

```
┌─────────────────────────────────────────────────┐
│  React Frontend (Analytics Page)                │
│  - useAnalytics hook                            │
│  - useConversationAnalytics hook                │
│  - UI Components (NarrativeSummary, etc.)       │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Supabase PostgreSQL                             │
│  - conversation_sessions                         │
│  - responses (with ai_analysis JSONB)           │
│  - survey_themes                                 │
│  - action_commitments                            │
└─────────────────────────────────────────────────┘
```

### Proposed State with LangGraph

```
┌─────────────────────────────────────────────────┐
│  React Frontend (Analytics Page)                │
│  - useAnalytics hook                             │
│  - useConversationAnalytics hook (enhanced)      │
│  - useLangGraphInsights hook (NEW)              │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Supabase Edge Function / External Service      │
│  - LangGraph Agent Orchestrator                 │
│  - Agent workflows for different insights       │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  LangGraph Agent System                          │
│  ┌─────────────────────────────────────────┐   │
│  │ 1. Data Analysis Agent                   │   │
│  │ 2. Pattern Recognition Agent             │   │
│  │ 3. Root Cause Analysis Agent             │   │
│  │ 4. Intervention Recommendation Agent     │   │
│  │ 5. Narrative Generation Agent            │   │
│  │ 6. Predictive Analytics Agent            │   │
│  └─────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  LLM (OpenAI / Anthropic)                       │
│  - GPT-4 / Claude for analysis                  │
│  - Embeddings for semantic search               │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Supabase PostgreSQL (Results Cache)            │
│  - analytics_cache (enhanced)                    │
│  - langgraph_insights (NEW table)               │
└─────────────────────────────────────────────────┘
```

---

## LangGraph Agent Design Recommendations

### Recommended Multi-Agent Architecture

For Spradley's HR Analytics, I recommend a **Hierarchical Multi-Agent System** where specialized agents collaborate:

#### 1. **Orchestrator Agent** (Entry Point)
- **Purpose**: Routes analysis requests to appropriate specialist agents
- **Input**: Survey ID, analysis type (narrative, patterns, interventions, etc.)
- **Output**: Coordinates workflow, aggregates results
- **Decision Logic**: 
  - Determine which agents need to run based on request
  - Check cache for existing insights
  - Prioritize agents based on data freshness

#### 2. **Data Collection & Preparation Agent**
- **Purpose**: Fetches and preprocesses conversation data
- **Responsibilities**:
  - Query Supabase for responses, sessions, themes
  - Filter by date ranges, departments, themes
  - Extract and structure quotes, sentiment data
  - Prepare context for downstream agents
- **Output**: Structured dataset ready for analysis

#### 3. **Pattern Recognition Agent**
- **Purpose**: Discovers cross-conversation patterns and themes
- **Specialized For**:
  - Identifying recurring phrases across conversations
  - Finding correlated themes (e.g., "work-life balance" + "overtime")
  - Temporal pattern detection (trends over time)
  - Department-specific patterns
- **Tools**:
  - Semantic similarity search (embeddings)
  - Statistical correlation analysis
  - Time-series pattern detection
- **Output**: Pattern insights with frequency, correlation strength, representative quotes

#### 4. **Root Cause Analysis Agent**
- **Purpose**: Deep dives into WHY issues are occurring
- **Specialized For**:
  - Analyzing sentiment drivers to find underlying causes
  - Connecting themes to root problems
  - Identifying systemic vs. isolated issues
  - Evidence collection from quotes
- **Approach**:
  - Use "5 Whys" methodology via LLM
  - Analyze sentiment drivers for causality
  - Cross-reference with multiple data sources
- **Output**: Root causes with evidence chains, impact scores

#### 5. **Intervention Recommendation Agent**
- **Purpose**: Generates actionable, prioritized interventions
- **Specialized For**:
  - Creating specific, contextual recommendations
  - Prioritizing by impact vs. effort
  - Identifying quick wins
  - Linking recommendations to root causes
- **Approach**:
  - Analyze root causes + patterns + sentiment data
  - Generate evidence-based recommendations
  - Calculate impact predictions
  - Provide implementation timelines
- **Output**: Prioritized interventions with impact predictions

#### 6. **Narrative Generation Agent**
- **Purpose**: Transforms data into human-readable stories
- **Specialized For**:
  - Executive summaries
  - Employee voice compilation
  - Theme narratives
  - Cultural insights storytelling
- **Approach**:
  - Synthesize insights from all other agents
  - Use quotes and examples to tell stories
  - Maintain anonymity while preserving meaning
- **Output**: Narrative summaries, quote compilations, executive reports

#### 7. **Predictive Analytics Agent**
- **Purpose**: Forecasts future trends and identifies early warning signs
- **Specialized For**:
  - Sentiment trajectory projection
  - Emerging theme detection
  - Risk prediction (retention, burnout)
  - Intervention timing recommendations
- **Approach**:
  - Time-series analysis of sentiment/theme data
  - Anomaly detection for new patterns
  - Trend extrapolation with confidence intervals
- **Output**: Predictions, early warnings, trajectory charts

#### 8. **Quality Assurance Agent** (Optional)
- **Purpose**: Validates insights and ensures quality
- **Responsibilities**:
  - Check insight coherence
  - Verify evidence support
  - Flag potential biases
  - Ensure recommendations are actionable

---

## Integration Patterns

### Option 1: Supabase Edge Function (Recommended)

**Pros:**
- Integrated with your existing Supabase infrastructure
- Direct database access
- Easy to deploy
- Automatic scaling
- Built-in authentication/authorization

**Cons:**
- Runtime limitations (CPU, memory, execution time)
- Requires LangGraph to be lightweight

**Implementation:**
```typescript
// supabase/functions/langgraph-analytics/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { LangGraph } from 'your-langgraph-import'

serve(async (req) => {
  // Initialize LangGraph agent
  // Process request
  // Return insights
})
```

### Option 2: Separate Node.js/Python Service

**Pros:**
- Full control over runtime environment
- Can handle heavier workloads
- Better for complex multi-agent workflows
- Can use LangGraph SDK fully

**Cons:**
- Additional infrastructure to manage
- Need to handle authentication separately
- More deployment complexity

**Implementation:**
- Deploy as separate service (Vercel, Railway, AWS Lambda)
- Use Supabase client to access data
- Expose REST API for frontend to call

### Option 3: Hybrid Approach (Best for Production)

**Use Edge Functions for:**
- Simple queries and cached results
- Quick insights generation

**Use Separate Service for:**
- Complex multi-agent workflows
- Long-running analyses
- Batch processing

---

## Data Flow

### Request Flow

```
1. User opens Analytics page
   └─> useLangGraphInsights hook triggers

2. Frontend calls Supabase Edge Function
   └─> POST /functions/v1/langgraph-analytics
       Body: { surveyId, analysisType, filters }

3. Edge Function:
   ├─> Checks analytics_cache for existing insights
   ├─> If cached and fresh: return cached
   └─> If not: Initialize LangGraph workflow

4. LangGraph Orchestrator:
   ├─> Data Collection Agent fetches data from Supabase
   ├─> Routes to appropriate specialist agents
   ├─> Agents process in parallel/sequential as needed
   └─> Orchestrator aggregates results

5. Results:
   ├─> Stored in analytics_cache table
   ├─> Returned to frontend
   └─> Frontend updates UI with insights
```

### Agent Workflow Example

```
Orchestrator Agent
  │
  ├─> Data Collection Agent (runs first)
  │   └─> Fetches responses, sessions, themes
  │
  ├─> Pattern Recognition Agent (parallel)
  │   └─> Analyzes cross-conversation patterns
  │
  ├─> Root Cause Analysis Agent (parallel)
  │   └─> Identifies underlying causes
  │
  ├─> Intervention Recommendation Agent (sequential, depends on root causes)
  │   └─> Generates prioritized actions
  │
  └─> Narrative Generation Agent (final, depends on all)
      └─> Creates executive summary
```

---

## Implementation Guide

### Step 1: Install Dependencies

```bash
# For Edge Function (Deno)
# Add to supabase/functions/langgraph-analytics/imports.json

# For Node.js Service
npm install @langchain/langgraph
npm install @langchain/openai  # or @langchain/anthropic
npm install @langchain/community  # for tools
```

### Step 2: Create Database Schema for Caching

```sql
-- Add to a new migration
CREATE TABLE IF NOT EXISTS public.langgraph_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES public.surveys(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL, -- 'narrative', 'patterns', 'interventions', etc.
  insights JSONB NOT NULL,
  metadata JSONB, -- filters, agent versions, etc.
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(survey_id, insight_type)
);

CREATE INDEX idx_langgraph_insights_survey ON public.langgraph_insights(survey_id);
CREATE INDEX idx_langgraph_insights_type ON public.langgraph_insights(insight_type);
CREATE INDEX idx_langgraph_insights_expires ON public.langgraph_insights(expires_at);

-- Add RLS policies
ALTER TABLE public.langgraph_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR admins can view insights"
ON public.langgraph_insights FOR SELECT
USING (public.has_role(auth.uid(), 'hr_admin') OR public.has_role(auth.uid(), 'hr_analyst'));
```

### Step 3: Create LangGraph Agent Structure

```typescript
// Example structure (adjust based on your LangGraph setup)
// supabase/functions/langgraph-analytics/agents.ts

import { StateGraph, START, END } from "@langchain/langgraph"
import { BaseMessage } from "@langchain/core/messages"

// Define state for agent workflow
interface AgentState {
  surveyId: string
  responses: any[]
  sessions: any[]
  themes: any[]
  patterns: any[]
  rootCauses: any[]
  interventions: any[]
  narrative: string | null
}

// Data Collection Agent
async function collectData(state: AgentState): Promise<Partial<AgentState>> {
  // Fetch from Supabase
  const { data: responses } = await supabase
    .from('responses')
    .select('*, survey_themes(name)')
    .eq('survey_id', state.surveyId)
  
  const { data: sessions } = await supabase
    .from('conversation_sessions')
    .select('*')
    .eq('survey_id', state.surveyId)
  
  return {
    responses: responses || [],
    sessions: sessions || []
  }
}

// Pattern Recognition Agent
async function recognizePatterns(state: AgentState): Promise<Partial<AgentState>> {
  // Use LLM to identify patterns
  // This is where LangGraph shines - you can have agents that:
  // 1. Analyze responses for common phrases
  // 2. Use embeddings to find semantic similarities
  // 3. Identify temporal patterns
  // 4. Cross-reference themes
  
  // Example using LangChain
  const patterns = await analyzePatternsWithLLM(state.responses)
  
  return { patterns }
}

// Root Cause Analysis Agent
async function analyzeRootCauses(state: AgentState): Promise<Partial<AgentState>> {
  // Deep dive analysis using LLM with "5 Whys" approach
  const rootCauses = await performRootCauseAnalysis(
    state.patterns,
    state.responses,
    state.themes
  )
  
  return { rootCauses }
}

// Build the graph
const workflow = new StateGraph({
  channels: {
    // Define your state channels
  }
})
  .addNode("collect_data", collectData)
  .addNode("recognize_patterns", recognizePatterns)
  .addNode("analyze_root_causes", analyzeRootCauses)
  // ... add more agents
  .addEdge(START, "collect_data")
  .addEdge("collect_data", "recognize_patterns")
  .addEdge("recognize_patterns", "analyze_root_causes")
  // ... connect agents
  .addEdge("last_agent", END)

const app = workflow.compile()
```

### Step 4: Create Edge Function

```typescript
// supabase/functions/langgraph-analytics/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { app } from './agents.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Parse request
    const { surveyId, analysisType, filters } = await req.json()

    // Check cache first
    const { data: cached } = await supabase
      .from('langgraph_insights')
      .select('*')
      .eq('survey_id', surveyId)
      .eq('insight_type', analysisType)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (cached) {
      return new Response(
        JSON.stringify({ insights: cached.insights, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Run LangGraph workflow
    const initialState = {
      surveyId,
      responses: [],
      sessions: [],
      themes: [],
      patterns: [],
      rootCauses: [],
      interventions: [],
      narrative: null
    }

    const result = await app.invoke(initialState)

    // Cache results
    await supabase
      .from('langgraph_insights')
      .upsert({
        survey_id: surveyId,
        insight_type: analysisType,
        insights: result,
        metadata: { filters },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })

    return new Response(
      JSON.stringify({ insights: result, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 5: Create Frontend Hook

```typescript
// src/hooks/useLangGraphInsights.ts

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export interface LangGraphInsightsOptions {
  surveyId?: string
  analysisType: 'narrative' | 'patterns' | 'interventions' | 'root_causes' | 'predictions'
  filters?: {
    startDate?: Date
    endDate?: Date
    department?: string
    themeId?: string
  }
}

export function useLangGraphInsights(options: LangGraphInsightsOptions) {
  return useQuery({
    queryKey: ['langgraph-insights', options],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('langgraph-analytics', {
        body: {
          surveyId: options.surveyId,
          analysisType: options.analysisType,
          filters: options.filters
        }
      })

      if (error) throw error
      return data
    },
    enabled: !!options.surveyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

### Step 6: Integrate into Analytics Page

```typescript
// src/pages/hr/Analytics.tsx (add to existing)

import { useLangGraphInsights } from "@/hooks/useLangGraphInsights"

// In component:
const { data: langGraphInsights, isLoading: langGraphLoading } = useLangGraphInsights({
  surveyId: filters.surveyId,
  analysisType: 'narrative' // or based on current tab
})

// Use langGraphInsights.narrative, langGraphInsights.patterns, etc.
```

---

## Best Practices

### 1. **Caching Strategy**
- Cache insights for 24 hours (or configurable)
- Invalidate cache when new responses arrive
- Use Redis or Supabase for distributed caching

### 2. **Error Handling**
- Gracefully fall back to rule-based insights if LangGraph fails
- Log errors for monitoring
- Return partial results if some agents fail

### 3. **Cost Management**
- Batch analysis requests when possible
- Use cheaper models (gpt-3.5-turbo) for simple tasks
- Reserve GPT-4/Claude for complex reasoning
- Implement rate limiting

### 4. **Privacy & Security**
- Never include PII in prompts
- Use anonymized/paraphrased text only
- Validate user permissions before running analysis
- Audit all agent prompts

### 5. **Performance**
- Run independent agents in parallel
- Stream results when possible for long-running analyses
- Use database indexes for fast data retrieval
- Consider background jobs for heavy analyses

### 6. **Monitoring**
- Track agent execution times
- Monitor LLM API costs
- Log insight quality metrics
- Alert on failures

---

## Example Agent Workflows

### Workflow 1: Executive Summary Generation

```
1. Orchestrator receives request for "narrative" insights
2. Data Collection Agent → Fetches all responses and sessions
3. Pattern Recognition Agent → Identifies top 5 patterns (parallel)
4. Root Cause Analysis Agent → Analyzes top 3 concerns (parallel)
5. Narrative Generation Agent → Synthesizes into executive summary
6. Results cached and returned
```

### Workflow 2: Intervention Recommendations

```
1. Orchestrator receives request for "interventions"
2. Data Collection Agent → Fetches theme-specific responses
3. Root Cause Analysis Agent → Deep dives into identified issues
4. Intervention Recommendation Agent → Generates prioritized actions
5. Predictive Analytics Agent → Estimates impact for each intervention
6. Results cached and returned
```

### Workflow 3: Real-time Pattern Detection

```
1. New response arrives (triggered by Supabase realtime)
2. Quick Pattern Check Agent → Identifies if response matches known patterns
3. If new pattern detected → Full Pattern Recognition Agent runs
4. Alert generated if critical pattern identified
5. Frontend updated via realtime subscription
```

---

## Next Steps

1. **Start Small**: Implement one agent (e.g., Narrative Generation) first
2. **Test with Real Data**: Use existing conversation data to validate
3. **Iterate**: Add more agents as you identify needs
4. **Monitor**: Track costs, performance, and user feedback
5. **Scale**: Optimize based on usage patterns

---

## Recommended Agent Prompts

### Pattern Recognition Agent Prompt Template

```
You are an HR analytics expert analyzing employee survey conversations.

Given the following conversation responses about [THEME]:
[RESPONSES]

Identify:
1. Common phrases or concerns mentioned across multiple conversations
2. Sentiment patterns (what drives positive vs negative sentiment)
3. Emerging themes or new topics
4. Correlations with other themes (if context provided)

Return structured insights with:
- Pattern name
- Frequency (how many conversations mention this)
- Representative quotes (anonymized)
- Sentiment impact
- Correlation strength with other patterns
```

### Root Cause Analysis Agent Prompt Template

```
You are conducting a root cause analysis for HR concerns.

Theme: [THEME_NAME]
Current Sentiment: [SENTIMENT_SCORE]
Identified Patterns: [PATTERNS]
Employee Quotes: [QUOTES]

Use the "5 Whys" methodology to identify root causes:
1. Why is sentiment low for this theme?
2. Why does [FIRST_WHY] occur?
3. Why does [SECOND_WHY] occur?
...continue until root cause is identified

For each root cause, provide:
- Cause description
- Evidence from quotes
- Impact score (0-100)
- Affected employee count
- Representative examples
```

### Intervention Recommendation Agent Prompt Template

```
Based on the following root causes and patterns, generate prioritized intervention recommendations:

Root Causes: [ROOT_CAUSES]
Patterns: [PATTERNS]
Theme: [THEME]
Current Sentiment: [SENTIMENT]

For each recommendation, provide:
- Title
- Description
- Rationale (why this addresses root causes)
- Estimated impact (sentiment improvement)
- Effort level (low/medium/high)
- Timeline
- Priority (critical/high/medium/low)
- Specific action steps
- Success metrics

Prioritize by:
1. Impact vs effort ratio
2. Addresses multiple root causes
3. Quick wins first
```

---

This guide provides a solid foundation for integrating LangGraph into your HR Analytics system. Start with one agent and gradually expand as you validate the approach!
