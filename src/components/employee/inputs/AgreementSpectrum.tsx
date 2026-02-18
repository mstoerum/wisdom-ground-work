import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";

interface AgreementSpectrumProps {
  labelLeft?: string;
  labelRight?: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export const AgreementSpectrum = ({
  labelLeft = "Not at all",
  labelRight = "Exactly right",
  onSubmit,
  disabled,
}: AgreementSpectrumProps) => {
  const [value, setValue] = useState(50);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (vals: number[]) => {
      if (disabled || submitted) return;
      const v = vals[0];
      setValue(v);

      // Auto-send after 1.2s of inactivity
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSubmitted(true);
        onSubmit(`[SLIDER: ${v}/100]`);
      }, 1200);
    },
    [disabled, submitted, onSubmit]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-2xl mx-auto space-y-3"
    >
      <Slider
        value={[value]}
        onValueChange={handleChange}
        min={0}
        max={100}
        step={1}
        disabled={disabled || submitted}
        className="py-2"
      />

      <div className="flex justify-between text-xs text-muted-foreground font-medium select-none">
        <span>{labelLeft}</span>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: submitted ? 1 : 0.6, y: 0 }}
          className="text-foreground tabular-nums"
        >
          {value}%
        </motion.span>
        <span>{labelRight}</span>
      </div>

      {submitted && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-muted-foreground"
        >
          Recorded ✓
        </motion.p>
      )}
    </motion.div>
  );
};
