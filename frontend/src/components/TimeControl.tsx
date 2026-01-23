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
      Fire: 'text-red-400',
      Earth: 'text-amber-400',
      Metal: 'text-gray-300',
      Water: 'text-blue-400',
      Wood: 'text-green-400',
    };
    return colors[element] || 'text-gray-400';
  };

  const getElementBg = (element: string): string => {
    const colors: Record<string, string> = {
      Fire: 'bg-red-950/50 border-red-800/50',
      Earth: 'bg-amber-950/50 border-amber-800/50',
      Metal: 'bg-gray-800/50 border-gray-600/50',
      Water: 'bg-blue-950/50 border-blue-800/50',
      Wood: 'bg-green-950/50 border-green-800/50',
    };
    return colors[element] || 'bg-gray-900/50 border-gray-700/50';
  };

  const yearProgress = useMemo(() => {
    return Math.min(100, (temporalState.dayOfEnergeticYear / 365) * 100);
  }, [temporalState.dayOfEnergeticYear]);

  const termProgress = useMemo(() => {
    return temporalState.progressInTerm * 100;
  }, [temporalState.progressInTerm]);

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div
        className={`p-4 cursor-pointer transition-colors ${
          isExpanded ? 'bg-gray-850' : 'hover:bg-gray-850'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isRealTimeMode ? (
                <div className="flex items-center gap-1.5 text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-medium uppercase tracking-wider">LIVE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium uppercase tracking-wider">SHIFTED</span>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-gray-700" />

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-gray-100">{formattedDate}</span>
              <span className="text-gray-500 text-sm">{formattedTime}</span>
            </div>
          </div>

          <div className={`px-3 py-1 rounded border ${getElementBg(temporalState.yearElement)}`}>
            <span className={`font-semibold font-mono ${getElementColor(temporalState.yearElement)}`}>
              {temporalState.yearElement} {temporalState.yearArchetype}
            </span>
            <span className="text-gray-500 text-sm ml-2">({temporalState.energeticYear})</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Sun className="w-4 h-4 text-yellow-400" />
              <span className="font-mono text-sm">{temporalState.solarLongitudeFormatted}</span>
            </div>
            <div className="text-gray-500 text-sm">{temporalState.currentSolarTerm.name}</div>
            <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-800 p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(-365); }}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                title="Shift -1 Year"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(-30); }}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                title="Shift -30 Days"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(-1); }}
                className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors text-xs font-medium"
              >
                -1d
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(1); }}
                className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors text-xs font-medium"
              >
                +1d
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(30); }}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(365); }}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 max-w-xs">
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">Vector Calibration</label>
              <input
                type="date"
                value={globalDate.toISOString().split('T')[0]}
                onChange={handleDateChange}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 font-mono text-sm focus:outline-none focus:border-cyan-600"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setTimeVector(new Date()); }}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                title="Reset to Now"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); toggleRealTimeMode(!isRealTimeMode); }}
                className={`flex items-center gap-2 px-4 py-2 rounded font-medium text-sm transition-colors ${
                  isRealTimeMode
                    ? 'bg-green-900/50 text-green-400 border border-green-700 hover:bg-green-900/70'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                }`}
              >
                {isRealTimeMode ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRealTimeMode ? 'Real-Time Active' : 'Enable Real-Time'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-950 rounded p-3 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Energetic Year Progress</span>
                <span className="text-xs font-mono text-gray-400">Day {temporalState.dayOfEnergeticYear}/365</span>
              </div>
              <div className="bg-gray-900 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    temporalState.yearElement === 'Fire' ? 'bg-gradient-to-r from-red-600 to-orange-500' :
                    temporalState.yearElement === 'Earth' ? 'bg-gradient-to-r from-amber-600 to-yellow-500' :
                    temporalState.yearElement === 'Metal' ? 'bg-gradient-to-r from-gray-400 to-slate-300' :
                    temporalState.yearElement === 'Water' ? 'bg-gradient-to-r from-blue-600 to-cyan-500' :
                    'bg-gradient-to-r from-green-600 to-emerald-500'
                  }`}
                  style={{ width: `${yearProgress}%` }}
                />
              </div>
            </div>

            <div className="bg-gray-950 rounded p-3 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Solar Term: {temporalState.currentSolarTerm.name}</span>
                <span className="text-xs text-gray-400">{temporalState.currentSolarTerm.meaning}</span>
              </div>
              <div className="bg-gray-900 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-500"
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
