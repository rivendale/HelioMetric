'use client';

import React from 'react';
import { type FamilyNode, RELATIONSHIP_LABELS } from '@/context/SystemState';
import { getZodiacByName, getCurrentZodiacHour } from '@/data/zodiac';
import { getWesternZodiacDateRange } from '@/data/western-zodiac';
import { Sun, Moon, Clock, Calendar, Star } from 'lucide-react';

const ELEMENT_COLORS: Record<string, string> = {
  Fire: 'text-red-400',
  Earth: 'text-amber-400',
  Metal: 'text-gray-300',
  Water: 'text-blue-400',
  Wood: 'text-green-400',
  Air: 'text-sky-400',
};

const ELEMENT_BG: Record<string, string> = {
  Fire: 'bg-red-950/30 border-red-900/40',
  Earth: 'bg-amber-950/30 border-amber-900/40',
  Metal: 'bg-gray-800/30 border-gray-700/40',
  Water: 'bg-blue-950/30 border-blue-900/40',
  Wood: 'bg-green-950/30 border-green-900/40',
};

const ZODIAC_EMOJI: Record<string, string> = {
  Rat: '🐀', Ox: '🐂', Tiger: '🐅', Rabbit: '🐇',
  Dragon: '🐉', Snake: '🐍', Horse: '🐎', Goat: '🐐',
  Monkey: '🐒', Rooster: '🐓', Dog: '🐕', Pig: '🐖',
};

export function ZodiacProfileCard({ node }: { node: FamilyNode }) {
  const chineseAnimal = getZodiacByName(node.zodiacSign.name);
  const elemColor = ELEMENT_COLORS[node.zodiacSign.element] || 'text-gray-400';
  const elemBg = ELEMENT_BG[node.zodiacSign.element] || 'bg-gray-900 border-gray-800';

  // Determine birth hour zodiac animal if birth time is provided
  let birthHourAnimal = null;
  if (node.birthTime) {
    const [hours] = node.birthTime.split(':').map(Number);
    const tempDate = new Date();
    tempDate.setHours(hours, 0, 0, 0);
    birthHourAnimal = getCurrentZodiacHour(tempDate);
  }

  return (
    <div className={`rounded-lg border p-5 ${elemBg}`}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">
          {ZODIAC_EMOJI[node.zodiacSign.name] || '?'}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-100">{node.name}</h3>
          <div className="text-xs text-gray-500">
            {RELATIONSHIP_LABELS[node.relationship]}
          </div>
          {node.birthDate && (
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(node.birthDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {node.birthTime && (
                <span className="ml-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {node.birthTime}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dual Zodiac Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Chinese Zodiac */}
        <div className="bg-gray-950/60 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Chinese Zodiac</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Animal</span>
              <span className={`font-semibold ${elemColor}`}>
                {ZODIAC_EMOJI[node.zodiacSign.name]} {node.zodiacSign.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Element</span>
              <span className={`text-sm ${elemColor}`}>{node.zodiacSign.element}</span>
            </div>
            {chineseAnimal && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Polarity</span>
                  <span className="text-sm text-gray-300">{chineseAnimal.polarity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Earthly Branch</span>
                  <span className="text-sm text-gray-300">
                    {chineseAnimal.earthlyBranch} ({chineseAnimal.earthlyBranchPinyin})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Direction</span>
                  <span className="text-sm text-gray-300">{chineseAnimal.direction}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Season</span>
                  <span className="text-sm text-gray-300">{chineseAnimal.season}</span>
                </div>
                <div className="pt-2 border-t border-gray-800">
                  <span className="text-gray-500 text-xs">Traits: </span>
                  <span className="text-gray-400 text-xs">{chineseAnimal.traits.join(', ')}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Western Zodiac */}
        <div className="bg-gray-950/60 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-400">Western Zodiac</span>
          </div>
          {node.westernZodiac ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Sign</span>
                <span className="font-semibold text-indigo-300">
                  {node.westernZodiac.symbol} {node.westernZodiac.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Dates</span>
                <span className="text-sm text-gray-300">
                  {getWesternZodiacDateRange(node.westernZodiac)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Element</span>
                <span className={`text-sm ${ELEMENT_COLORS[node.westernZodiac.element] || 'text-gray-300'}`}>
                  {node.westernZodiac.element}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Modality</span>
                <span className="text-sm text-gray-300">{node.westernZodiac.modality}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Ruler</span>
                <span className="text-sm text-gray-300">{node.westernZodiac.rulingPlanet}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Opposite</span>
                <span className="text-sm text-red-400">{node.westernZodiac.oppositeSign}</span>
              </div>
              <div className="pt-2 border-t border-gray-800">
                <span className="text-gray-500 text-xs">Traits: </span>
                <span className="text-gray-400 text-xs">{node.westernZodiac.traits.join(', ')}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Star className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-xs">
                Enter a full date of birth to see Western zodiac details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Birth Hour Zodiac (if time provided) */}
      {birthHourAnimal && (
        <div className="mt-4 bg-gray-950/60 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-400 font-semibold">Birth Hour (Shichen)</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xl">{ZODIAC_EMOJI[birthHourAnimal.name]}</span>
            <div>
              <span className="text-gray-200 text-sm font-semibold">{birthHourAnimal.hourName}</span>
              <span className="text-gray-400 text-xs ml-2">
                ({birthHourAnimal.name} Hour - {String(birthHourAnimal.hourStart).padStart(2, '0')}:00 to {String(birthHourAnimal.hourEnd).padStart(2, '0')}:00)
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            The birth hour animal reveals your inner self and how others perceive you.
          </p>
        </div>
      )}
    </div>
  );
}
