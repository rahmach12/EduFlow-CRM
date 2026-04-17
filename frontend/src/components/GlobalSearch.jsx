import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, UserCheck, School, X, Command, ArrowRight } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';

const TYPE_CONFIG = {
  Student: { icon: Users, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
  Teacher: { icon: UserCheck, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  Class:   { icon: School, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
};

const GlobalSearch = ({ isOpen, onClose }) => {
  const { search } = useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Run search on query change
  useEffect(() => {
    if (!search) return;
    const r = search(query);
    setResults(r);
    setActiveIndex(0);
  }, [query, search]);

  const handleSelect = useCallback((result) => {
    navigate(result.href);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIndex]) { handleSelect(results[activeIndex]); }
  };

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search students, teachers, classes..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-base outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs rounded-md">
            <span>Esc</span>
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.length < 2 ? (
            <div className="px-4 py-8 text-center">
              <Command className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Type at least 2 characters to search</p>
              <div className="mt-4 flex justify-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Students</span>
                <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> Teachers</span>
                <span className="flex items-center gap-1"><School className="h-3 w-3" /> Classes</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-400">
              No results for "<span className="font-semibold text-slate-600 dark:text-slate-300">{query}</span>"
            </div>
          ) : (
            <ul className="py-2">
              {results.map((result, i) => {
                const cfg = TYPE_CONFIG[result.type] || TYPE_CONFIG.Student;
                const Icon = cfg.icon;
                const isActive = i === activeIndex;
                return (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors ${
                        isActive ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center ${cfg.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{result.title}</p>
                        <p className="text-xs text-slate-400 truncate">{result.subtitle}</p>
                      </div>
                      <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {result.type}
                      </span>
                      {isActive && <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex gap-4 text-xs text-slate-400">
            <span><kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">↑↓</kbd> navigate</span>
            <span><kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Enter</kbd> select</span>
            <span><kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Esc</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
