import { useState, useEffect, useRef } from "react";
import { EditorView, Decoration } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import { StateField, StateEffect, EditorSelection } from "@codemirror/state";
import "./SearchBar.css";

interface SearchBarProps {
  view: EditorView | null;
  isVisible: boolean;
  onClose: () => void;
}

// Couleurs personnalisables
const SEARCH_MATCH_COLOR = "rgba(255, 215, 0, 0.3)"; // Jaune par défaut
const SEARCH_CURRENT_COLOR = "rgba(255, 140, 0, 0.5)"; // Orange pour la correspondance actuelle

// Effet pour mettre à jour les décorations de recherche
const setSearchMatches = StateEffect.define<{ matches: { from: number; to: number }[]; currentIndex: number }>();

// Champ d'état pour stocker les décorations
const searchMatchField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    
    for (const effect of tr.effects) {
      if (effect.is(setSearchMatches)) {
        const { matches, currentIndex } = effect.value;
        const decos = matches.map((match, index) => {
          const isCurrentMatch = index === currentIndex;
          return Decoration.mark({
            class: isCurrentMatch ? "search-match-current" : "search-match",
            attributes: {
              style: `background-color: ${isCurrentMatch ? SEARCH_CURRENT_COLOR : SEARCH_MATCH_COLOR}; border-radius: 2px;`
            }
          }).range(match.from, match.to);
        });
        decorations = Decoration.set(decos, true);
      }
    }
    
    return decorations;
  },
  provide: f => EditorView.decorations.from(f)
});

// Extension pour le surlignage de recherche
export const searchHighlightExtension = [searchMatchField];

export default function SearchBar({ view, isVisible, onClose }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [matchCount, setMatchCount] = useState({ current: 0, total: 0 });
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const matchesRef = useRef<{ from: number; to: number }[]>([]);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isVisible]);

  // Fonction pour trouver toutes les correspondances
  const findMatches = (text: string, searchText: string, isCaseSensitive: boolean, isRegex: boolean) => {
    const matches: { from: number; to: number }[] = [];
    
    if (!searchText) return matches;

    try {
      let pattern: RegExp;
      if (isRegex) {
        pattern = new RegExp(searchText, isCaseSensitive ? "g" : "gi");
      } else {
        const escapedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        pattern = new RegExp(escapedSearch, isCaseSensitive ? "g" : "gi");
      }

      let match;
      while ((match = pattern.exec(text)) !== null) {
        matches.push({ from: match.index, to: match.index + match[0].length });
        if (!pattern.global) break;
      }
    } catch (e) {
      // Si regex invalide, on ignore
      console.error("Regex invalide:", e);
    }

    return matches;
  };

  // Mettre à jour la recherche et les surlignages
  useEffect(() => {
    if (!view) return;

    if (searchTerm) {
      const text = view.state.doc.toString();
      const matches = findMatches(text, searchTerm, caseSensitive, useRegex);
      matchesRef.current = matches;

      // Mettre à jour les décorations
      view.dispatch({
        effects: setSearchMatches.of({ matches, currentIndex: currentMatchIndex })
      });

      setMatchCount({ current: matches.length > 0 ? currentMatchIndex + 1 : 0, total: matches.length });
    } else {
      // Effacer les surlignages
      matchesRef.current = [];
      view.dispatch({
        effects: setSearchMatches.of({ matches: [], currentIndex: 0 })
      });
      setMatchCount({ current: 0, total: 0 });
      setCurrentMatchIndex(0);
    }
  }, [searchTerm, caseSensitive, useRegex, view, currentMatchIndex]);

  const handleNext = () => {
    if (!view || matchesRef.current.length === 0) return;
    
    const newIndex = (currentMatchIndex + 1) % matchesRef.current.length;
    setCurrentMatchIndex(newIndex);
    
    // Déplacer le curseur vers la correspondance
    const match = matchesRef.current[newIndex];
    view.dispatch({
      selection: EditorSelection.single(match.from, match.to),
      scrollIntoView: true
    });
  };

  const handlePrevious = () => {
    if (!view || matchesRef.current.length === 0) return;
    
    const newIndex = currentMatchIndex === 0 ? matchesRef.current.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(newIndex);
    
    // Déplacer le curseur vers la correspondance
    const match = matchesRef.current[newIndex];
    view.dispatch({
      selection: EditorSelection.single(match.from, match.to),
      scrollIntoView: true
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        handlePrevious();
      } else {
        handleNext();
      }
      e.preventDefault();
    } else if (e.key === "Escape") {
      onClose();
      e.preventDefault();
    }
  };

  const handleClose = () => {
    if (view) {
      // Effacer les surlignages
      view.dispatch({
        effects: setSearchMatches.of({ matches: [], currentIndex: 0 })
      });
    }
    setSearchTerm("");
    matchesRef.current = [];
    setCurrentMatchIndex(0);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="search-bar">
      <div className="search-bar-content">
        <div className="search-input-container">
          <svg className="search-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {searchTerm && (
            <span className="match-count">
              {matchCount.total > 0 ? `${matchCount.current}/${matchCount.total}` : "Aucun résultat"}
            </span>
          )}
        </div>

        <div className="search-controls">
          <button
            className={`search-btn toggle-btn ${caseSensitive ? "active" : ""}`}
            onClick={() => setCaseSensitive(!caseSensitive)}
            title="Respecter la casse (Alt+C)"
          >
            Aa
          </button>
          <button
            className={`search-btn toggle-btn ${useRegex ? "active" : ""}`}
            onClick={() => setUseRegex(!useRegex)}
            title="Utiliser les expressions régulières (Alt+R)"
          >
            .*
          </button>
          <div className="search-divider"></div>
          <button
            className="search-btn nav-btn"
            onClick={handlePrevious}
            disabled={!searchTerm || matchCount.total === 0}
            title="Résultat précédent (Shift+Enter)"
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 12L4 8l4-4v8z"/>
            </svg>
          </button>
          <button
            className="search-btn nav-btn"
            onClick={handleNext}
            disabled={!searchTerm || matchCount.total === 0}
            title="Résultat suivant (Enter)"
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4l4 4-4 4V4z"/>
            </svg>
          </button>
          <div className="search-divider"></div>
          <button
            className="search-btn close-btn"
            onClick={handleClose}
            title="Fermer (Escape)"
          >
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
