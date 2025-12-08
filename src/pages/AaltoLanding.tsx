import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { VoiceHero } from '@/components/landing/aalto/VoiceHero';
import { EmergenceVisualization } from '@/components/landing/aalto/EmergenceVisualization';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AaltoLanding = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Transform scroll progress to different phases
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4, 0.5], [1, 1, 0]);
  const emergenceOpacity = useTransform(scrollYProgress, [0.35, 0.5, 0.95, 1], [0, 1, 1, 0]);
  const ctaOpacity = useTransform(scrollYProgress, [0.9, 1], [0, 1]);

  return (
    <div ref={containerRef} className="min-h-[400vh] relative bg-aalto-dark">
      {/* Sticky viewport for scroll-based animations */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Voice Hero - fragmenting quote */}
        <motion.div 
          style={{ opacity: heroOpacity }}
          className="absolute inset-0"
        >
          <VoiceHero scrollProgress={scrollYProgress} />
        </motion.div>

        {/* Emergence Visualization - semantic clustering */}
        <motion.div 
          style={{ opacity: emergenceOpacity }}
          className="absolute inset-0"
        >
          <EmergenceVisualization scrollProgress={scrollYProgress} />
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          style={{ opacity: ctaOpacity }}
          className="absolute inset-0 flex items-center justify-center bg-background"
        >
          <div className="text-center space-y-8 px-6 max-w-2xl">
            <motion.h2 
              className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground tracking-tight"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              From fragments to understanding.
            </motion.h2>
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              See how Spradley transforms individual voices into organizational insight.
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button asChild size="lg" className="group">
                <Link to="/demo">
                  Experience the Conversation
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/">
                  View Current Landing
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]) }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-aalto-warm-white/50 text-sm tracking-widest uppercase flex flex-col items-center gap-2"
        >
          <span>Scroll to transform</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-50">
            <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AaltoLanding;
