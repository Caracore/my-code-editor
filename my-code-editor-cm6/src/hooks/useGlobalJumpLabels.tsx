import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useMode, type EditorMode } from "../context/ModeContext";

// Characters used for hint labels (easy to type, home row first)
const HINT_CHARS = "asdfghjklqwertyuiopzxcvbnm";

interface JumpTarget {
  element: HTMLElement;
  label: string;
  rect: DOMRect;
}

interface GlobalJumpLabelsState {
  active: boolean;
  targets: JumpTarget[];
  inputBuffer: string;
}

// Generate labels for targets
function generateLabels(count: number): string[] {
  const labels: string[] = [];
  
  if (count <= HINT_CHARS.length) {
    // Single character labels
    for (let i = 0; i < count; i++) {
      labels.push(HINT_CHARS[i]);
    }
  } else {
    // Two character labels for more targets
    for (let i = 0; i < HINT_CHARS.length && labels.length < count; i++) {
      for (let j = 0; j < HINT_CHARS.length && labels.length < count; j++) {
        labels.push(HINT_CHARS[i] + HINT_CHARS[j]);
      }
    }
  }
  
  return labels;
}

// Find all clickable/focusable elements in the UI
function findClickableElements(): HTMLElement[] {
  const selectors = [
    // Buttons and links
    'button:not([disabled])',
    'a[href]',
    'a',
    '[role="button"]',
    '[role="link"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[role="option"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',
    '[role="listitem"]',
    
    // Form elements
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'label',
    
    // Interactive elements
    '[tabindex]:not([tabindex="-1"])',
    '[onclick]',
    '[data-clickable]',
    
    // Sidebar file tree items
    '.file-tree-item',
    '.sidebar-item',
    '[data-file-path]',
    '.file-node',
    '.folder-node',
    
    // Tabs
    '.tab-item',
    '.tab',
    '[data-tab]',
    
    // Menu items - TopMenu, Toolbar, dropdowns
    '.menu-item',
    '.dropdown-item',
    '.top-menu > div',
    '.toolbar button',
    '.toolbar > *',
    
    // Theme switcher and other UI elements
    '.theme-toggle',
    '.theme-switcher',
    '.toggle-button',
    '.icon-button',
    
    // Generic clickable divs/spans with cursor pointer
    '[style*="cursor: pointer"]',
    '[style*="cursor:pointer"]',
    
    // SVG icons that are clickable
    'svg[onclick]',
    '.clickable',
    
    // Custom clickable elements
    '[data-jump-target]',
  ];
  
  const allElements = document.querySelectorAll(selectors.join(', '));
  const clickableElements: HTMLElement[] = [];
  
  // Also find elements with cursor: pointer style
  const allDivs = document.querySelectorAll('div, span, li, svg');
  
  allDivs.forEach((el) => {
    const element = el as HTMLElement;
    const style = getComputedStyle(element);
    if (style.cursor === 'pointer' && !allElements.namedItem?.(element.id)) {
      // Check if not already in list
      if (!Array.from(allElements).includes(element)) {
        clickableElements.push(element);
      }
    }
  });
  
  allElements.forEach((el) => {
    const element = el as HTMLElement;
    
    // Skip hidden elements
    if (element.offsetParent === null && getComputedStyle(element).position !== 'fixed') {
      return;
    }
    
    // Skip elements inside CodeMirror (handled separately)
    if (element.closest('.cm-editor')) {
      return;
    }
    
    // Skip elements that are not visible
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    
    // Skip elements outside viewport
    if (rect.bottom < 0 || rect.top > window.innerHeight ||
        rect.right < 0 || rect.left > window.innerWidth) {
      return;
    }
    
    clickableElements.push(element);
  });
  
  return clickableElements;
}

// Jump Labels Overlay Component
function JumpLabelsOverlay({ 
  targets, 
  inputBuffer 
}: { 
  targets: JumpTarget[]; 
  inputBuffer: string;
}) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99999,
      }}
    >
      {targets.map((target, index) => {
        const isMatch = target.label.startsWith(inputBuffer.toLowerCase());
        const isExactMatch = target.label === inputBuffer.toLowerCase();
        
        if (!isMatch && inputBuffer.length > 0) {
          return null; // Hide non-matching labels
        }
        
        return (
          <div
            key={index}
            style={{
              position: 'fixed',
              left: target.rect.left + target.rect.width / 2,
              top: target.rect.top + target.rect.height / 2,
              transform: 'translate(-50%, -50%)',
              backgroundColor: isExactMatch ? '#4CAF50' : inputBuffer.length > 0 ? '#FF5555' : '#FFCC00',
              color: '#000',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '12px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              border: '1px solid rgba(0,0,0,0.3)',
              zIndex: 99999,
              pointerEvents: 'none',
            }}
          >
            {target.label}
          </div>
        );
      })}
      
      {/* Input indicator */}
      {inputBuffer.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#FFCC00',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          Jump: {inputBuffer}
        </div>
      )}
    </div>,
    document.body
  );
}

// Main hook
export function useGlobalJumpLabels(enabled: boolean = true) {
  const { mode, setMode } = useMode();
  const [state, setState] = useState<GlobalJumpLabelsState>({
    active: false,
    targets: [],
    inputBuffer: '',
  });
  
  const stateRef = useRef(state);
  stateRef.current = state;
  
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Activate jump mode
  const activate = useCallback(() => {
    if (!enabled) return;
    
    const elements = findClickableElements();
    const labels = generateLabels(elements.length);
    
    const targets: JumpTarget[] = elements.map((element, index) => ({
      element,
      label: labels[index],
      rect: element.getBoundingClientRect(),
    }));
    
    setMode("hint");
    setState({
      active: true,
      targets,
      inputBuffer: '',
    });
  }, [enabled]);

  // Deactivate jump mode
  const deactivate = useCallback(() => {
    setState({
      active: false,
      targets: [],
      inputBuffer: '',
    });
    setMode("normal");
  }, [setMode]);

  // Handle input
  const handleInput = useCallback((char: string) => {
    const currentState = stateRef.current;
    if (!currentState.active) return;
    
    const newBuffer = currentState.inputBuffer + char.toLowerCase();
    
    // Find matching targets
    const matches = currentState.targets.filter(t => 
      t.label.startsWith(newBuffer)
    );
    
    if (matches.length === 0) {
      // No matches, reset buffer
      setState(prev => ({ ...prev, inputBuffer: '' }));
      return;
    }
    
    if (matches.length === 1 && matches[0].label === newBuffer) {
      // Exact match - click the element
      const target = matches[0];
      deactivate();
      
      // Simulate mouse events for proper menu interaction
      setTimeout(() => {
        const element = target.element;
        
        // Get element position for realistic mouse events
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Simulate mouseover (bubbles, unlike mouseenter)
        const mouseOverEvent = new MouseEvent('mouseover', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: centerX,
          clientY: centerY,
        });
        element.dispatchEvent(mouseOverEvent);
        
        // Simulate mouseenter (for React onMouseEnter)
        const mouseEnterEvent = new MouseEvent('mouseenter', {
          bubbles: false,
          cancelable: true,
          view: window,
          clientX: centerX,
          clientY: centerY,
        });
        element.dispatchEvent(mouseEnterEvent);
        
        // Simulate pointerenter (modern browsers)
        const pointerEnterEvent = new PointerEvent('pointerenter', {
          bubbles: false,
          cancelable: true,
          view: window,
          clientX: centerX,
          clientY: centerY,
          pointerType: 'mouse',
        });
        element.dispatchEvent(pointerEnterEvent);
        
        // Focus the element
        element.focus();
        
        // Then click for elements that need click
        const mouseDownEvent = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: centerX,
          clientY: centerY,
        });
        element.dispatchEvent(mouseDownEvent);
        
        const mouseUpEvent = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: centerX,
          clientY: centerY,
        });
        element.dispatchEvent(mouseUpEvent);
        
        element.click();
      }, 10);
      return;
    }
    
    // Update buffer for partial match
    setState(prev => ({ ...prev, inputBuffer: newBuffer }));
  }, [deactivate, setMode]);

  // Sync with mode context - deactivate if mode changes away from hint
  useEffect(() => {
    if (mode !== "hint" && state.active) {
      setState({
        active: false,
        targets: [],
        inputBuffer: '',
      });
    }
  }, [mode, state.active]);

  // Global keyboard handler
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isCodeMirror = target.closest('.cm-editor');
      
      // In NORMAL mode, 'f' activates hint mode
      if (modeRef.current === "normal" && e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        activate();
        return;
      }

      // Alt+J still works as fallback (from anywhere except inputs)
      if (e.altKey && e.key.toLowerCase() === 'j') {
        if (!isInput || stateRef.current.active) {
          e.preventDefault();
          e.stopPropagation();
          if (stateRef.current.active) {
            deactivate();
          } else {
            activate();
          }
          return;
        }
      }

      // Handle active hint mode (mode === "hint")
      if (stateRef.current.active || modeRef.current === "hint") {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          deactivate();
          return;
        }

        if (e.key === 'Backspace') {
          e.preventDefault();
          e.stopPropagation();
          setState(prev => ({
            ...prev,
            inputBuffer: prev.inputBuffer.slice(0, -1),
          }));
          return;
        }

        // Handle letter input
        if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          handleInput(e.key);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled, activate, deactivate, handleInput, mode]);

  // Update target positions on scroll/resize
  useEffect(() => {
    if (!state.active) return;

    const updatePositions = () => {
      setState(prev => ({
        ...prev,
        targets: prev.targets.map(target => ({
          ...target,
          rect: target.element.getBoundingClientRect(),
        })),
      }));
    };

    window.addEventListener('scroll', updatePositions, true);
    window.addEventListener('resize', updatePositions);
    
    return () => {
      window.removeEventListener('scroll', updatePositions, true);
      window.removeEventListener('resize', updatePositions);
    };
  }, [state.active]);

  // Render overlay
  const JumpOverlay = state.active ? (
    <JumpLabelsOverlay targets={state.targets} inputBuffer={state.inputBuffer} />
  ) : null;

  return {
    isActive: state.active,
    activate,
    deactivate,
    JumpOverlay,
  };
}
