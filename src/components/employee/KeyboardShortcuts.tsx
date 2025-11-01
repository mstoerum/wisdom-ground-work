import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsProps {
  isVoiceActive: boolean;
}

/**
 * Displays keyboard shortcuts for voice interface
 * Improves accessibility and discoverability
 */
export const KeyboardShortcuts = ({ isVoiceActive }: KeyboardShortcutsProps) => {
  if (isVoiceActive) {
    return (
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Keyboard className="h-3 w-3" />
          <kbd className="px-2 py-1 bg-muted rounded text-[10px] font-mono">ESC</kbd>
          <span>to stop</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <Keyboard className="h-3 w-3" />
        <kbd className="px-2 py-1 bg-muted rounded text-[10px] font-mono">SPACE</kbd>
        <span>to start</span>
      </div>
    </div>
  );
};
