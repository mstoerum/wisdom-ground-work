# HR Demo Mode - Visual Guide

## User Experience Flow

### State 1: Initial Load (No Real Data)

```
┌─────────────────────────────────────────────────────────────┐
│ 🎯 Demo Mode - HR Analytics    📊 Mock Data • Q1 2025      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     🗄️ DATABASE ICON                         │
│                                                               │
│     Generate Mock Data to See the System in Action          │
│                                                               │
│  The analytics below are currently showing placeholder      │
│  data. Generate realistic mock conversations to see how     │
│  the HR Analytics dashboard processes and analyzes actual   │
│  employee feedback data.                                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🗄️ Mock Data Generator                              │   │
│  │                                                       │   │
│  │ Generate 45 realistic employee conversations        │   │
│  │ to test HR analytics                                 │   │
│  │                                                       │   │
│  │ • Creates 45 conversation sessions                   │   │
│  │ • Generates 3-8 responses per conversation           │   │
│  │ • Includes realistic mood tracking                   │   │
│  │                                                       │   │
│  │  [Generate 45 Mock Conversations]                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Employee Feedback Analytics
[Placeholder Data] Preview showing 45 sample conversations

[Dimmed - 60% opacity]
┌─────────────────────────────────────────────────────────────┐
│  📊 81%    😊 72/100    ⏱️ 12.3m    ⚠️ 4    🛡️ N/A        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Currently Viewing Placeholder Analytics                  │
│                                                               │
│ These charts show sample data for demonstration purposes.   │
│ Generate mock data above to see real analytics computed     │
│ from actual conversation data.                               │
└─────────────────────────────────────────────────────────────┘

[Analytics tabs and charts - dimmed]
```

---

### State 2: Data Generation in Progress

```
┌─────────────────────────────────────────────────────────────┐
│ 🗄️ Mock Data Generator                                      │
│                                                               │
│ 🔄 Generating Mock Data...                                  │
│                                                               │
│ Please wait while we create realistic conversation data...  │
└─────────────────────────────────────────────────────────────┘
```

---

### State 3: Data Generated Successfully (With Real Data)

```
┌─────────────────────────────────────────────────────────────┐
│ 🎯 Demo Mode - HR Analytics    ✅ Using Real Data (45)      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ✅ Using Real Generated Data                                │
│                                                               │
│ Analytics are computed from 45 actual conversation          │
│ sessions with 287 responses    [🔄 Refresh Analytics]       │
└─────────────────────────────────────────────────────────────┘

Employee Feedback Analytics
Real insights from 45 completed conversations • High Confidence

[Full opacity - Normal brightness]
┌─────────────────────────────────────────────────────────────┐
│  📊 100%   😊 68/100    ⏱️ 11.8m    ⚠️ 3    🛡️ 82/100     │
└─────────────────────────────────────────────────────────────┘

[Analytics tabs and charts - full brightness with real data]
[Quality metrics, themes, sentiment, all populated with generated data]
```

---

## Key Visual Indicators

### Placeholder Data State
- 🟨 **Amber warning banners**
- 😶‍🌫️ **60% opacity on analytics**
- 📋 **"Placeholder Data" badge**
- 🔔 **Prominent call-to-action to generate data**

### Real Data State
- 🟩 **Green success banner**
- ✨ **Full opacity on analytics**
- ✅ **"Using Real Data" badge with count**
- 🔄 **Quick refresh button**

---

## Color Coding

| State | Banner Color | Indicator |
|-------|-------------|-----------|
| No Data | Blue/Primary | Large CTA card |
| Placeholder | Amber | Warning |
| Real Data | Green | Success |
| Error | Red | Alert |

---

## User Actions

### When No Real Data:
1. **Primary Action**: Click "Generate 45 Mock Conversations"
2. **Alternative**: Scroll to view placeholder analytics (dimmed)

### When Real Data Exists:
1. **Primary Action**: Explore analytics tabs
2. **Alternative**: Click "Refresh Analytics" to reload data
3. **Option**: Back to Demo Menu

---

## Accessibility Features

- ✅ Clear visual hierarchy
- ✅ Color-coded states with icons
- ✅ Descriptive text for all states
- ✅ High contrast between states
- ✅ Loading indicators
- ✅ Success/error feedback
- ✅ Keyboard navigation support

---

## Mobile Responsive

All states maintain functionality on mobile:
- Stacked layouts for cards
- Touch-friendly buttons
- Readable text sizes
- Collapsed navigation

---

## Analytics Behavior

### Data Flow:
1. Generate button clicked
2. MockDataGenerator creates 45 sessions + 150-360 responses
3. Queries invalidated automatically
4. Analytics hooks refetch data
5. Component re-evaluates `useRealData` flag
6. UI updates with real data
7. Success toast shown

### Refresh Logic:
- Invalidates 11+ React Query cache keys
- Waits 1 second for dependent queries
- Updates refresh key to force re-render
- Shows toast notification

---

## Developer Notes

### Key Component Props:
- `useRealData`: Boolean flag checking if real sessions/responses exist
- `realAnalytics`: Hook for conversation analytics data
- `basicAnalytics`: Hook for basic participation/sentiment data
- `handleDataGenerated`: Callback to refresh all analytics

### State Management:
- React Query for server state
- `dataRefreshKey` for forcing re-renders
- `useRealData` computed from responses.length and sessions.length

---

## Summary

The improved HR Demo mode provides:
- **Clear guidance** for first-time users
- **Visual feedback** at every step
- **Smooth transitions** between states
- **Professional polish** throughout
- **Educational value** showing system capabilities
