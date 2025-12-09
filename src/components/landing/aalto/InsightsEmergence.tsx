import { motion, MotionValue, useTransform } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap, Clock, CheckCircle2 } from 'lucide-react';

interface InsightsEmergenceProps {
  scrollProgress: MotionValue<number>;
}

const clusterSummaries = [
  {
    id: 'connection',
    label: 'Team Connection',
    health: 85,
    trend: 'up' as const,
    color: 'hsl(152, 50%, 45%)',
    insight: 'Team bonds remain a core strength',
    agreement: 92,
    status: 'thriving' as const
  },
  {
    id: 'meetings',
    label: 'Time & Meetings',
    health: 38,
    trend: 'down' as const,
    color: 'hsl(12, 45%, 55%)',
    insight: 'Meeting overload affecting productivity',
    agreement: 78,
    status: 'critical' as const
  },
  {
    id: 'energy',
    label: 'Energy & Focus',
    health: 52,
    trend: 'stable' as const,
    color: 'hsl(10, 55%, 58%)',
    insight: 'Focus time is limited but improving',
    agreement: 85,
    status: 'attention' as const
  }
];

const recommendations = [
  {
    priority: 'high' as const,
    title: 'Implement "No Meeting Wednesdays"',
    impact: '+12 sentiment',
    effort: 'Low Effort',
    timeline: '1-2 weeks',
    icon: Clock
  },
  {
    priority: 'quick-win' as const,
    title: 'Audit recurring meetings for necessity',
    impact: '+8 sentiment',
    effort: 'Very Low Effort',
    timeline: '3 days',
    icon: CheckCircle2
  }
];

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="w-5 h-5 text-emerald-500" />;
  if (trend === 'down') return <TrendingDown className="w-5 h-5 text-red-500" />;
  return <Minus className="w-5 h-5 text-amber-500" />;
};

const StatusBadge = ({ status }: { status: 'thriving' | 'critical' | 'attention' }) => {
  const styles = {
    thriving: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    critical: 'bg-red-500/10 text-red-600 border-red-500/20',
    attention: 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  };
  
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export const InsightsEmergence = ({ scrollProgress }: InsightsEmergenceProps) => {
  // Animation transforms based on scroll
  const metricsProgress = useTransform(scrollProgress, [0.55, 0.7], [0, 1]);
  const recommendationsProgress = useTransform(scrollProgress, [0.7, 0.85], [0, 1]);
  const headerOpacity = useTransform(scrollProgress, [0.5, 0.6], [0, 1]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-aalto-dark to-background">
      {/* Section Header */}
      <motion.div 
        style={{ opacity: headerOpacity }}
        className="text-center mb-12"
      >
        <motion.p 
          className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-3"
        >
          The Intelligence
        </motion.p>
        <motion.h2 
          className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground tracking-tight"
        >
          From patterns to action
        </motion.h2>
      </motion.div>

      {/* Metric Cards */}
      <motion.div 
        style={{ opacity: metricsProgress }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-12"
      >
        {clusterSummaries.map((cluster, index) => (
          <motion.div
            key={cluster.id}
            initial={{ y: 30, opacity: 0 }}
            style={{ 
              opacity: useTransform(metricsProgress, [0, 0.3 + index * 0.2, 0.5 + index * 0.2], [0, 0, 1]),
              y: useTransform(metricsProgress, [0, 0.3 + index * 0.2, 0.5 + index * 0.2], [30, 30, 0])
            }}
            className="group relative bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg"
          >
            {/* Color accent bar */}
            <div 
              className="absolute top-0 left-6 right-6 h-1 rounded-b-full"
              style={{ backgroundColor: cluster.color }}
            />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4 mt-2">
              <h3 className="font-medium text-foreground">{cluster.label}</h3>
              <StatusBadge status={cluster.status} />
            </div>

            {/* Health Score */}
            <div className="flex items-end gap-3 mb-4">
              <motion.span 
                className="font-display text-5xl font-bold"
                style={{ color: cluster.color }}
              >
                {cluster.health}
              </motion.span>
              <div className="flex items-center gap-1 pb-2">
                <span className="text-muted-foreground text-sm">/100</span>
                <TrendIcon trend={cluster.trend} />
              </div>
            </div>

            {/* Insight */}
            <p className="text-sm text-muted-foreground italic mb-4">
              "{cluster.insight}"
            </p>

            {/* Agreement */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full rounded-full"
                  style={{ 
                    backgroundColor: cluster.color,
                    width: `${cluster.agreement}%`
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {cluster.agreement}% agreement
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Recommendations Panel */}
      <motion.div
        style={{ 
          opacity: recommendationsProgress,
          y: useTransform(recommendationsProgress, [0, 1], [40, 0])
        }}
        className="max-w-2xl w-full"
      >
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
          {/* Panel Header */}
          <div className="px-6 py-4 border-b border-border/50 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-foreground">Recommended Actions</h3>
          </div>

          {/* Recommendations List */}
          <div className="p-4 space-y-3">
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.title}
                style={{
                  opacity: useTransform(recommendationsProgress, [0.3 + index * 0.2, 0.5 + index * 0.2], [0, 1]),
                  x: useTransform(recommendationsProgress, [0.3 + index * 0.2, 0.5 + index * 0.2], [-20, 0])
                }}
                className={`group p-4 rounded-xl border-l-4 transition-all duration-200 hover:bg-muted/50 ${
                  rec.priority === 'high' 
                    ? 'border-l-red-500 bg-red-500/5' 
                    : 'border-l-emerald-500 bg-emerald-500/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    rec.priority === 'high' ? 'bg-red-500/10' : 'bg-emerald-500/10'
                  }`}>
                    <rec.icon className={`w-4 h-4 ${
                      rec.priority === 'high' ? 'text-red-500' : 'text-emerald-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium uppercase tracking-wide ${
                        rec.priority === 'high' ? 'text-red-500' : 'text-emerald-500'
                      }`}>
                        {rec.priority === 'high' ? 'High Priority' : 'Quick Win'}
                      </span>
                    </div>
                    <h4 className="font-medium text-foreground mb-2">{rec.title}</h4>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        {rec.impact}
                      </span>
                      <span>•</span>
                      <span>{rec.effort}</span>
                      <span>•</span>
                      <span>{rec.timeline}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
