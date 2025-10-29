import { createContext, useContext, ReactNode } from "react";

interface PreviewModeContextValue {
  isPreviewMode: boolean;
  previewSurveyId?: string;
  previewSurveyData?: any;
}

const PreviewModeContext = createContext<PreviewModeContextValue>({
  isPreviewMode: false,
});

export const usePreviewMode = () => useContext(PreviewModeContext);

interface PreviewModeProviderProps {
  children: ReactNode;
  isPreviewMode: boolean;
  previewSurveyId?: string;
  previewSurveyData?: any;
}

export const PreviewModeProvider = ({
  children,
  isPreviewMode,
  previewSurveyId,
  previewSurveyData,
}: PreviewModeProviderProps) => {
  return (
    <PreviewModeContext.Provider
      value={{ isPreviewMode, previewSurveyId, previewSurveyData }}
    >
      {children}
    </PreviewModeContext.Provider>
  );
};
