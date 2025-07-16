import { useEffect } from 'react';

interface A11yOptions {
  trapFocus?: boolean;
  escapeKeyCloses?: boolean;
  onClose?: () => void;
}

export function useA11y(
  ref: React.RefObject<HTMLElement>,
  isOpen: boolean,
  options: A11yOptions = {}
) {
  const { trapFocus = true, escapeKeyCloses = true, onClose } = options;

  // Handle escape key press
  useEffect(() => {
    if (!isOpen || !escapeKeyCloses) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, escapeKeyCloses, onClose]);

  // Handle focus trapping
  useEffect(() => {
    if (!isOpen || !trapFocus || !ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    // Focus the first element when opened
    firstElement?.focus();

    element.addEventListener('keydown', handleTabKey);
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, trapFocus, ref]);
}