import React, { useState, useEffect, useRef } from 'react';
import { Building, ChevronDown, Check, Search, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * Custom styled dark-theme Team Select Dropdown matching CricPass UI.
 * Guards against non-array teams, supports disabled entries, empty/free-agent option,
 * quick filtering for long lists, and retry controls during Render cold starts.
 */
export default function TeamSelectDropdown({
  teams = [],
  value = '',
  onChange,
  placeholder = '-- Select Club / Team --',
  emptyOptionLabel = '',
  disabledTeamId = '',
  disabledBadgeText = 'Current',
  loading = false,
  error = null,
  onRetry = null,
  showLeftIcon = false,
  disabled = false,
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const safeTeams = Array.isArray(teams) ? teams : [];

  const selectedTeam = safeTeams.find(
    (t) => t?._id === value || (value && t?.team_id === value)
  );

  const filteredTeams = searchQuery.trim()
    ? safeTeams.filter((t) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          String(t?.team_name || '').toLowerCase().includes(q) ||
          String(t?.team_id || '').toLowerCase().includes(q)
        );
      })
    : safeTeams;

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search bar when opening longer club lists
  useEffect(() => {
    if (isOpen && safeTeams.length > 6 && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, safeTeams.length]);

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
            ? 'border-emerald-500 ring-2 ring-emerald-500/40'
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
          className="absolute left-0 right-0 mt-2 bg-slate-900/98 border border-slate-700 rounded-xl shadow-2xl shadow-black/70 z-40 overflow-hidden backdrop-blur-md animate-fadeIn"
        >
          {/* Optional Search Input for larger club rosters */}
          {safeTeams.length > 6 && (
            <div className="p-2 border-b border-slate-800 bg-slate-950/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by team name or ID..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-slate-800/40">
            {/* Optional Empty / Free-Agent Choice */}
            {emptyOptionLabel && (
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
              filteredTeams.map((t) => {
                const isSelected = t._id === value || (value && t.team_id === value);
                const isDisabled = Boolean(disabledTeamId && t._id === disabledTeamId);

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
                        : isSelected
                          ? 'bg-emerald-500/15 text-white font-semibold cursor-pointer'
                          : 'text-slate-200 hover:bg-slate-800/90 hover:text-white cursor-pointer'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="truncate">{t.team_name}</span>
                      <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[10px] font-bold">
                        {t.team_id}
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

            {/* No Filter Match or Empty List */}
            {!loading && filteredTeams.length === 0 && (
              <div className="px-4 py-4 text-center space-y-2">
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
                  <p className="text-xs text-slate-400">
                    {searchQuery.trim()
                      ? `No clubs found matching "${searchQuery}"`
                      : 'No registered clubs found in database.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
