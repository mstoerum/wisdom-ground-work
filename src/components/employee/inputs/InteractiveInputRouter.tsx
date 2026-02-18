import { AnswerInput } from "../AnswerInput";
import { ConfidenceCheck } from "./ConfidenceCheck";
import { WordCloudSelector } from "./WordCloudSelector";
import { SentimentPulse } from "./SentimentPulse";
import { AgreementSpectrum } from "./AgreementSpectrum";
import { ReflectionMoment } from "./ReflectionMoment";
import { PriorityRanking } from "./PriorityRanking";

export type InputType =
  | "text"
  | "confidence_check"
  | "word_cloud"
  | "sentiment_pulse"
  | "agreement_spectrum"
  | "reflection"
  | "priority_ranking";

export interface InputConfig {
  options?: string[];
  maxSelections?: number;
  allowOther?: boolean;
  labelLeft?: string;
  labelRight?: string;
  message?: string;
}

interface InteractiveInputRouterProps {
  inputType: InputType;
  inputConfig?: InputConfig;
  // Text input props (forwarded when inputType === "text")
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value?: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const InteractiveInputRouter = ({
  inputType,
  inputConfig,
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder,
  disabled,
}: InteractiveInputRouterProps) => {
  const handleInteractiveSubmit = (serialized: string) => {
    onSubmit(serialized);
  };

  switch (inputType) {
    case "confidence_check":
      return (
        <ConfidenceCheck
          options={inputConfig?.options || ["Yes", "Maybe", "No"]}
          onSubmit={handleInteractiveSubmit}
          disabled={disabled || isLoading}
        />
      );

    case "word_cloud":
      return (
        <WordCloudSelector
          options={inputConfig?.options || []}
          maxSelections={inputConfig?.maxSelections || 3}
          allowOther={inputConfig?.allowOther ?? true}
          onSubmit={handleInteractiveSubmit}
          disabled={disabled || isLoading}
        />
      );

    case "sentiment_pulse":
      return (
        <SentimentPulse
          onSubmit={handleInteractiveSubmit}
          disabled={disabled || isLoading}
        />
      );

    case "agreement_spectrum":
      return (
        <AgreementSpectrum
          labelLeft={inputConfig?.labelLeft}
          labelRight={inputConfig?.labelRight}
          onSubmit={handleInteractiveSubmit}
          disabled={disabled || isLoading}
        />
      );

    case "reflection":
      return (
        <ReflectionMoment
          message={inputConfig?.message}
          onContinue={() => handleInteractiveSubmit("[REFLECTION_COMPLETE]")}
          disabled={disabled || isLoading}
        />
      );

    case "priority_ranking":
      return (
        <PriorityRanking
          options={inputConfig?.options || []}
          onSubmit={handleInteractiveSubmit}
          disabled={disabled || isLoading}
        />
      );

    case "text":
    default:
      return (
        <AnswerInput
          value={value}
          onChange={onChange}
          onSubmit={() => onSubmit()}
          isLoading={isLoading}
          placeholder={placeholder}
          disabled={disabled}
        />
      );
  }
};
