import React, { useState, useEffect, useRef } from 'react';
import { Building, ChevronDown, Check, Search, RefreshCw, AlertCircle, X } from 'lucide-react';

/**
 * Helper to highlight matching query text in team names/IDs
 */
function highlightMatch(text, query) {
  if (!query || !query.trim() || !text) return text;
  const trimmed = query.trim();
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === trimmed.toLowerCase() ? (
      <span key={index} className="bg-emerald-500/30 text-emerald-200 font-bold px-0.5 rounded">
        {part}
      </span>
    ) : (
      part
    )
  );
}

/**
 * Custom styled dark-theme Team Select Dropdown with integrated Search Bar.
 * - Always includes a dedicated search option at the top of the dropdown menu
 * - Automatically filters teams in real time (e.g. typing "uthaya" filters "uthayasooryan", "uthayam", "uthayatharagai")
 * - Highlights search matches visually
 * - Supports keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
 * - Supports Render cold-start retry handling and empty option ("Free Agent" / "Clear Selection")
 */
export default function TeamSelectDropdown({
  teams = [],
  value = '',
  onChange,
  placeholder = '-- Select Club / Team --',
  searchPlaceholder = 'Search team name or ID...',
  emptyOptionLabel = '',
  disabledTeamId = '',
  disabledBadgeText = 'Current',
  loading = false,
  error = null,
  onRetry = null,
  showLeftIcon = false,
  disabled = false,
  searchable = true,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const safeTeams = Array.isArray(teams) ? teams : [];

  const selectedTeam = safeTeams.find(
    (t) => t?._id === value || (value && t?.team_id === value)
  );

  // Real-time multi-token filter for team names and team IDs
  const filteredTeams = safeTeams.filter((t) => {
    if (!searchQuery.trim()) return true;
    const tokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const teamName = String(t?.team_name || '').toLowerCase();
    const teamId = String(t?.team_id || '').toLowerCase();
    return tokens.every((tok) => teamName.includes(tok) || teamId.includes(tok));
  });

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleGlobalKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isOpen]);

  // Auto-focus the search bar immediately when the dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, searchable]);

  // Reset highlighted item when search query or open state changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery, isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) setSearchQuery('');
      return next;
    });
  };

  const handleSelect = (nextValue) => {
    setIsOpen(false);
    setSearchQuery('');
    if (onChange) {
      onChange(nextValue);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredTeams.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredTeams[highlightedIndex]) {
        const target = filteredTeams[highlightedIndex];
        if (!disabledTeamId || target._id !== disabledTeamId) {
          handleSelect(target._id);
        }
      } else if (filteredTeams.length === 1) {
        const target = filteredTeams[0];
        if (!disabledTeamId || target._id !== disabledTeamId) {
          handleSelect(target._id);
        }
      }
    } else if (e.key === 'Escape') {
      if (searchQuery) {
        setSearchQuery('');
      } else {
        setIsOpen(false);
      }
    }
  };

  const displayLabel = selectedTeam
    ? selectedTeam.team_name
    : value === '' && emptyOptionLabel
      ? emptyOptionLabel
      : placeholder;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full ${showLeftIcon ? 'pl-10' : 'pl-4'} pr-3.5 py-3 bg-slate-900 border rounded-xl text-left text-sm transition-all flex items-center justify-between gap-2 cursor-pointer focus:outline-none ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
            : 'border-slate-700 hover:border-slate-600 focus:ring-2 focus:ring-emerald-500'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {showLeftIcon && (
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Building className="w-4 h-4" />
          </span>
        )}

        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span
            className={`truncate ${
              selectedTeam
                ? 'text-white font-semibold'
                : value === '' && emptyOptionLabel
                  ? 'text-slate-200 font-medium'
                  : 'text-slate-400'
            }`}
          >
            {displayLabel}
          </span>
          {selectedTeam?.team_id && (
            <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
              {selectedTeam.team_id}
            </span>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-1.5 text-slate-400">
          {loading && <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/80 z-50 overflow-hidden backdrop-blur-md animate-fadeIn"
        >
          {/* Always Visible Search Bar */}
          {searchable && (
            <div className="p-2.5 border-b border-slate-800 bg-slate-950/90 sticky top-0 z-10 backdrop-blur-sm">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  autoComplete="off"
                  spellCheck="false"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Live search stats indicator */}
              {searchQuery.trim() && (
                <div className="mt-1.5 px-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Found <strong className="text-emerald-400">{filteredTeams.length}</strong> matching {filteredTeams.length === 1 ? 'team' : 'teams'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                    }}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          )}

          <div ref={listRef} className="max-h-64 overflow-y-auto py-1 divide-y divide-slate-800/40">
            {/* Optional Empty / Free-Agent Choice */}
            {emptyOptionLabel && !searchQuery.trim() && (
              <button
                type="button"
                role="option"
                aria-selected={value === ''}
                onClick={() => handleSelect('')}
                className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  value === ''
                    ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
                }`}
              >
                <span className="truncate">{emptyOptionLabel}</span>
                {value === '' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            )}

            {/* Loading State Row */}
            {loading && safeTeams.length === 0 && (
              <div className="px-4 py-5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Waking up server / Loading teams...</span>
              </div>
            )}

            {/* Teams Options */}
            {Array.isArray(filteredTeams) &&
              filteredTeams.map((t, idx) => {
                const isSelected = t._id === value || (value && t.team_id === value);
                const isDisabled = Boolean(disabledTeamId && t._id === disabledTeamId);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={t._id || t.team_id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={isDisabled}
                    onClick={() => !isDisabled && handleSelect(t._id)}
                    className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-colors ${
                      isDisabled
                        ? 'opacity-45 cursor-not-allowed bg-slate-900/50 text-slate-500'
                        : isHighlighted
                          ? 'bg-slate-800 text-white cursor-pointer ring-1 ring-inset ring-emerald-500/50'
                          : isSelected
                            ? 'bg-emerald-500/15 text-white font-semibold cursor-pointer'
                            : 'text-slate-200 hover:bg-slate-800/90 hover:text-white cursor-pointer'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="truncate">
                        {highlightMatch(t.team_name, searchQuery)}
                      </span>
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[10px] font-bold">
                        {highlightMatch(t.team_id, searchQuery)}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isDisabled && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-400">
                          {disabledBadgeText}
                        </span>
                      )}
                      {isSelected && !isDisabled && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}

            {/* No Filter Match State */}
            {!loading && filteredTeams.length === 0 && (
              <div className="px-4 py-6 text-center space-y-2">
                {error ? (
                  <>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Failed to load teams</span>
                    </div>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetry();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-semibold cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry Loading Teams</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6 text-slate-500 mx-auto opacity-50" />
                    <p className="text-xs text-slate-300 font-medium">
                      {searchQuery.trim()
                        ? `No clubs found matching "${searchQuery}"`
                        : 'No registered clubs found in database.'}
                    </p>
                    {searchQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          searchInputRef.current?.focus();
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
                      >
                        Clear search
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
