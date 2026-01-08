import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface ArticleCard {
  id: number;
  title: string;
  description: string;
  category: string;
  imageGradient: string;
}

const articles: ArticleCard[] = [
  {
    id: 1,
    title: "The post-AI paradox: How AI-generated insights could reshape real organizational change",
    description: "Understanding the shift from data collection to pattern recognition.",
    category: "ARTICLE",
    imageGradient: "from-[hsl(var(--teal-primary))] via-[hsl(200,40%,60%)] to-[hsl(var(--tan-primary))]",
  },
  {
    id: 2,
    title: "Column: benchmarking is a thermos check. It does not offer any insights",
    description: "Why comparing against industry averages misses the point entirely.",
    category: "ARTICLE",
    imageGradient: "from-[hsl(var(--tan-primary))] via-[hsl(25,30%,75%)] to-[hsl(var(--cream-muted))]",
  },
  {
    id: 3,
    title: "How addressing friction in organization can rebuild retention and improve efficiency",
    description: "Small irritants compound into major turnover drivers.",
    category: "ARTICLE",
    imageGradient: "from-[hsl(200,35%,65%)] via-[hsl(var(--teal-light))] to-[hsl(var(--teal-primary))]",
  },
  {
    id: 4,
    title: "The hidden cost of survey fatigue—and what actually works instead",
    description: "Employees stop caring when they don't see change.",
    category: "ARTICLE",
    imageGradient: "from-[hsl(var(--cream-muted))] via-[hsl(var(--tan-light))] to-[hsl(var(--tan-primary))]",
  },
];

export const ArticlesSection = () => {
  return (
    <section className="py-24 bg-[hsl(var(--teal-primary))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-white leading-snug max-w-2xl">
            Why we think workplace intelligence is the next step for companies?
          </h2>
        </motion.div>

        {/* Articles grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {articles.map((article, index) => (
            <motion.a
              key={article.id}
              href="#"
              className="group block"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Image placeholder with gradient */}
              <div className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${article.imageGradient} mb-4 overflow-hidden relative`}>
                {/* Abstract wave pattern overlay */}
                <svg 
                  className="absolute inset-0 w-full h-full opacity-30"
                  viewBox="0 0 200 150"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <path
                    d="M0,75 Q50,50 100,75 T200,75"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                  <path
                    d="M0,100 Q50,75 100,100 T200,100"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                  <path
                    d="M0,50 Q50,25 100,50 T200,50"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                </svg>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>

              {/* Category */}
              <p className="text-xs font-medium text-white/60 tracking-wide uppercase mb-2">
                {article.category}
              </p>

              {/* Title */}
              <h3 className="text-white font-medium leading-snug group-hover:text-white/80 transition-colors duration-200 line-clamp-3">
                {article.title}
              </h3>

              {/* Read more */}
              <div className="flex items-center gap-1 mt-3 text-white/60 text-sm group-hover:text-white/80 transition-colors duration-200">
                <span>Read more</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
