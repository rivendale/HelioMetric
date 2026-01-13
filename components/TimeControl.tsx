'use client';

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

/**
 * TimeControl: Temporal Navigation Interface
 *
 * A scientific "Seeker" bar that allows temporal shift of the Global Clock.
 * Enables "Time Travel" simulation for analyzing interference patterns
 * across different dates and zodiac years.
 */
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

  // Format date for display
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

  // Handle date input change
  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      // Preserve current time
      newDate.setHours(globalDate.getHours(), globalDate.getMinutes());
      setTimeVector(newDate);
    }
  }, [globalDate, setTimeVector]);

  // Get element color
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

  // Get element background
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

  // Calculate progress through the energetic year (0-100)
  const yearProgress = useMemo(() => {
    return Math.min(100, (temporalState.dayOfEnergeticYear / 365) * 100);
  }, [temporalState.dayOfEnergeticYear]);

  // Calculate progress through current solar term (0-100)
  const termProgress = useMemo(() => {
    return temporalState.progressInTerm * 100;
  }, [temporalState.progressInTerm]);

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Collapsed Header Bar */}
      <div
        className={`p-4 cursor-pointer transition-colors ${
          isExpanded ? 'bg-gray-850' : 'hover:bg-gray-850'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          {/* Left: Mode Indicator & Date */}
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
              <span className="font-[family-name:var(--font-geist-mono)] text-gray-100">
                {formattedDate}
              </span>
              <span className="text-gray-500 text-sm">
                {formattedTime}
              </span>
            </div>
          </div>

          {/* Center: Zodiac Year Display */}
          <div className={`px-3 py-1 rounded border ${getElementBg(temporalState.yearElement)}`}>
            <span className={`font-semibold font-[family-name:var(--font-geist-mono)] ${getElementColor(temporalState.yearElement)}`}>
              {temporalState.yearElement} {temporalState.yearArchetype}
            </span>
            <span className="text-gray-500 text-sm ml-2">
              ({temporalState.energeticYear})
            </span>
          </div>

          {/* Right: Solar Position */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Sun className="w-4 h-4 text-yellow-400" />
              <span className="font-[family-name:var(--font-geist-mono)] text-sm">
                {temporalState.solarLongitudeFormatted}
              </span>
            </div>
            <div className="text-gray-500 text-sm">
              {temporalState.currentSolarTerm.name}
            </div>
            <ChevronRight
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="border-t border-gray-800 p-4 space-y-4">
          {/* Temporal Controls Row */}
          <div className="flex items-center justify-between gap-4">
            {/* Quick Navigation Buttons */}
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
                title="Shift -1 Day"
              >
                -1d
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(1); }}
                className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors text-xs font-medium"
                title="Shift +1 Day"
              >
                +1d
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(30); }}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                title="Shift +30 Days"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shiftTimeVector(365); }}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                title="Shift +1 Year"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            {/* Date Picker */}
            <div className="flex-1 max-w-xs">
              <label className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                Vector Calibration
              </label>
              <input
                type="date"
                value={globalDate.toISOString().split('T')[0]}
                onChange={handleDateChange}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 font-[family-name:var(--font-geist-mono)] text-sm focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
              />
            </div>

            {/* Real-Time Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTimeVector(new Date());
                }}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                title="Reset to Now"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRealTimeMode(!isRealTimeMode);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded font-medium text-sm transition-colors ${
                  isRealTimeMode
                    ? 'bg-green-900/50 text-green-400 border border-green-700 hover:bg-green-900/70'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                }`}
              >
                {isRealTimeMode ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Real-Time Active</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Enable Real-Time</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="grid grid-cols-2 gap-4">
            {/* Year Progress */}
            <div className="bg-gray-950 rounded p-3 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                  Energetic Year Progress
                </span>
                <span className="text-xs font-[family-name:var(--font-geist-mono)] text-gray-400">
                  Day {temporalState.dayOfEnergeticYear}/365
                </span>
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

            {/* Solar Term Progress */}
            <div className="bg-gray-950 rounded p-3 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">
                  Solar Term: {temporalState.currentSolarTerm.name}
                </span>
                <span className="text-xs text-gray-400">
                  {temporalState.currentSolarTerm.meaning}
                </span>
              </div>
              <div className="bg-gray-900 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${termProgress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-600">
                  {temporalState.currentSolarTerm.longitude}°
                </span>
                <span className="text-xs text-gray-600">
                  Next: {temporalState.nextSolarTerm.name} ({temporalState.nextSolarTerm.longitude}°)
                </span>
              </div>
            </div>
          </div>

          {/* Solar Longitude Arc Visualization */}
          <div className="bg-gray-950 rounded p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider">
                Solar Longitude Arc
              </span>
              <span className="font-[family-name:var(--font-geist-mono)] text-cyan-400 text-sm">
                {temporalState.solarLongitudeFormatted}
              </span>
            </div>

            {/* Arc Visualization */}
            <div className="relative h-8">
              {/* Background track */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-gray-800 rounded-full" />

              {/* Key markers */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-1">
                {[0, 90, 180, 270].map((deg) => (
                  <div
                    key={deg}
                    className="w-1 h-4 bg-gray-600 rounded"
                    title={`${deg}°`}
                  />
                ))}
              </div>

              {/* Li Chun marker (315°) */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-1.5 h-5 bg-red-500 rounded"
                style={{ left: `${(315 / 360) * 100}%` }}
                title="Li Chun (315°) - New Year"
              />

              {/* Current position */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-300 shadow-lg shadow-yellow-400/30 transition-all duration-500"
                style={{ left: `calc(${(temporalState.solarLongitude / 360) * 100}% - 8px)` }}
              />
            </div>

            {/* Legend */}
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>0° Spring Eq.</span>
              <span>90° Summer Sol.</span>
              <span>180° Autumn Eq.</span>
              <span>270° Winter Sol.</span>
              <span className="text-red-400">315° Li Chun</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
