import { MessageSquareOff, TrendingDown, Clock } from "lucide-react";

const painPoints = [
  {
    icon: MessageSquareOff,
    title: "Surface-Level Responses",
    description: "Multiple choice answers tell you what employees picked—not why. You're left guessing at root causes.",
  },
  {
    icon: TrendingDown,
    title: "Declining Participation",
    description: "Survey fatigue is real. Each cycle sees fewer responses, making your data less reliable.",
  },
  {
    icon: Clock,
    title: "Insights Too Late",
    description: "By the time you analyze results and act, the moment has passed. Problems fester, talent leaves.",
  },
];

export const ProblemSection = () => {
  return (
    <section className="bg-[hsl(var(--coral-accent))] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Traditional surveys are broken
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            You're collecting data, but are you really understanding your people?
          </p>
        </div>

        {/* Pain point cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-colors"
            >
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                <point.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {point.title}
              </h3>
              <p className="text-white/80 leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
