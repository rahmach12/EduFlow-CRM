import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Command, School, Search, UserCheck, Users, X } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';

const TYPE_CONFIG = {
  Student: { icon: Users, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
  Teacher: { icon: UserCheck, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  Class: { icon: School, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
};

const GlobalSearch = ({ isOpen, onClose }) => {
  const { search } = useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    if (!search) return [];
    return search(query);
  }, [query, search]);

  const closeSearch = useCallback(() => {
    setQuery('');
    setActiveIndex(0);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleSelect = useCallback((result) => {
    navigate(result.href);
    closeSearch();
  }, [closeSearch, navigate]);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeSearch();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }

    if (event.key === 'Enter' && results[activeIndex]) {
      handleSelect(results[activeIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-24" onClick={closeSearch}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <Search className="h-5 w-5 flex-shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search students, teachers, classes..."
            className="flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 sm:flex">
            <span>Esc</span>
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.length < 2 ? (
            <div className="px-4 py-8 text-center">
              <Command className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-400">Type at least 2 characters to search</p>
              <div className="mt-4 flex justify-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Students</span>
                <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> Teachers</span>
                <span className="flex items-center gap-1"><School className="h-3 w-3" /> Classes</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-400">
              No results for <span className="font-semibold text-slate-600 dark:text-slate-300">{query}</span>
            </div>
          ) : (
            <ul className="py-2">
              {results.map((result, index) => {
                const config = TYPE_CONFIG[result.type] || TYPE_CONFIG.Student;
                const Icon = config.icon;
                const isActive = index === activeIndex;

                return (
                  <li key={`${result.type}-${result.id}`}>
                    <button
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors ${
                        isActive ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{result.title}</p>
                        <p className="truncate text-xs text-slate-400">{result.subtitle}</p>
                      </div>
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
                        {result.type}
                      </span>
                      {isActive && <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {results.length > 0 && (
          <div className="flex gap-4 border-t border-slate-100 px-4 py-2 text-xs text-slate-400 dark:border-slate-800">
            <span><kbd className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">↑↓</kbd> navigate</span>
            <span><kbd className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">Enter</kbd> select</span>
            <span><kbd className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">Esc</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
