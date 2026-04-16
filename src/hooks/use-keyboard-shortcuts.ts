import { useEffect } from "react";

interface ShortcutHandlers {
  onSearch?: () => void;
  onNewEntry?: () => void;
  onExport?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey;

      // Don't trigger if user is typing in an input field (unless it's the search dialog)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (isModifier && e.key === "k") {
        e.preventDefault();
        handlers.onSearch?.();
        return;
      }

      if (isInput) return;

      if (isModifier && e.key === "n") {
        e.preventDefault();
        handlers.onNewEntry?.();
        return;
      }

      if (isModifier && e.key === "e") {
        e.preventDefault();
        handlers.onExport?.();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
