import React, { useState, useCallback, useMemo } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Calendar
} from 'lucide-react';
import { useTemporalState } from '@/context/SystemState';

export function TimeControl() {
  const {
    globalDate,
    isRealTimeMode,
    temporalState,
    setTimeVector,
    toggleRealTimeMode,
    shiftTimeVector,
  } = useTemporalState();

  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = useMemo(() => {
    return globalDate.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [globalDate]);

  const formattedTime = useMemo(() => {
    return globalDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  }, [globalDate]);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      newDate.setHours(globalDate.getHours(), globalDate.getMinutes());
      setTimeVector(newDate);
    }
  }, [globalDate, setTimeVector]);

  const getElementColor = (element: string): string => {
    const colors: Record<string, string> = {
      Fire: 'text-red-500',
      Earth: 'text-amber-600',
      Metal: 'text-slate-500',
      Water: 'text-blue-500',
      Wood: 'text-green-500',
    };
    return colors[element] || 'text-slate-500';
  };

  const getElementBg = (element: string): string => {
    const colors: Record<string, string> = {
      Fire: 'bg-red-50 border-red-200',
      Earth: 'bg-amber-50 border-amber-200',
      Metal: 'bg-slate-100 border-slate-300',
      Water: 'bg-blue-50 border-blue-200',
      Wood: 'bg-green-50 border-green-200',
    };
    return colors[element] || 'bg-slate-50 border-slate-200';
  };

  const yearProgress = useMemo(() => {
    return Math.min(100, (temporalState.dayOfEnergeticYear / 365) * 100);
  }, [temporalState.dayOfEnergeticYear]);

  const termProgress = useMemo(() => {
    return temporalState.progressInTerm * 100;
  }, [temporalState.progressInTerm]);

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div
        className={`p-4 cursor-pointer transition-colors ${
          isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isRealTimeMode ? (
                <div className="flex items-center gap-1.5 text-green-600">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium uppercase tracking-wider">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wider">Custom Date</span>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-slate-800">{formattedDate}</span>
              <span className="text-slate-500 text-sm">{formattedTime}</span>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-lg border ${getElementBg(temporalState.yearElement)}`}>
            <span className={`font-semibold ${getElementColor(temporalState.yearElement)}`}>
              {temporalState.yearElement} {temporalState.yearArchetype}
            </span>
            <span className="text-slate-500 text-sm ml-2">({temporalState.energeticYear})</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-sm">{temporalState.solarLongitudeFormatted}</span>
            </div>
            <div className="text-slate-500 text-sm hidden sm:block">{temporalState.currentSolarTerm.name}</div>
            <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-200 p-4 space-y-4 bg-slate-50">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(-365); }}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Shift -1 Year"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(-30); }}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Shift -30 Days"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(-1); }}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors text-xs font-medium"
              >
                -1d
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(1); }}
                className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors text-xs font-medium"
              >
                +1d
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(30); }}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(365); }}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 max-w-xs">
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Select Date</label>
              <input
                type="date"
                value={globalDate.toISOString().split('T')[0]}
                onChange={handleDateChange}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setTimeVector(new Date()); }}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Reset to Now"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); toggleRealTimeMode(!isRealTimeMode); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isRealTimeMode
                    ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {isRealTimeMode ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRealTimeMode ? 'Live Mode On' : 'Enable Live'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Year Progress</span>
                <span className="text-xs text-slate-600">Day {temporalState.dayOfEnergeticYear}/365</span>
              </div>
              <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    temporalState.yearElement === 'Fire' ? 'bg-gradient-to-r from-red-500 to-orange-400' :
                    temporalState.yearElement === 'Earth' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                    temporalState.yearElement === 'Metal' ? 'bg-gradient-to-r from-slate-400 to-slate-300' :
                    temporalState.yearElement === 'Water' ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                    'bg-gradient-to-r from-green-500 to-emerald-400'
                  }`}
                  style={{ width: `${yearProgress}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Solar Term: {temporalState.currentSolarTerm.name}</span>
                <span className="text-xs text-slate-600">{temporalState.currentSolarTerm.meaning}</span>
              </div>
              <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                  style={{ width: `${termProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
