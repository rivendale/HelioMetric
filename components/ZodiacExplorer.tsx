'use client';

import React, { useState } from 'react';
import { ZODIAC_ANIMALS, TRINE_GROUPS, type ZodiacAnimal, type TrineGroup } from '@/data/zodiac';
import {
  WESTERN_ZODIAC_SIGNS,
  getWesternZodiacDateRange,
  getWesternElementColor,
  getWesternElementBg,
  type WesternZodiacSign,
} from '@/data/western-zodiac';
import { Sun, Moon } from 'lucide-react';

type ZodiacSystem = 'chinese' | 'western';

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
  Air: 'bg-sky-950/30 border-sky-900/40',
};

function ChineseSignCard({ animal, isSelected, onClick }: {
  animal: ZodiacAnimal;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        text-left p-3 rounded-lg border transition-all
        ${isSelected
          ? 'bg-cyan-950/40 border-cyan-700 ring-1 ring-cyan-700/50'
          : 'bg-gray-900 border-gray-800 hover:border-gray-600'
        }
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{animal.emoji}</span>
        <span className="font-semibold text-gray-100">{animal.name}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className={`${ELEMENT_COLORS[animal.fixedElement]}`}>
          {animal.fixedElement}
        </span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-400">{animal.polarity}</span>
      </div>
    </button>
  );
}

function ChineseSignDetail({ animal }: { animal: ZodiacAnimal }) {
  const trineGroup = TRINE_GROUPS[animal.trineGroup as TrineGroup];
  const companions = trineGroup.signs.filter((s) => s !== animal.name);

  return (
    <div className={`rounded-lg border p-5 ${ELEMENT_BG[animal.fixedElement]}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{animal.emoji}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-100">{animal.name}</h3>
              <div className="text-sm text-gray-400">
                {animal.earthlyBranch} ({animal.earthlyBranchPinyin}) - Branch #{animal.branchNumber}
              </div>
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded text-sm font-semibold ${ELEMENT_COLORS[animal.fixedElement]}`}>
          {animal.fixedElement} {animal.polarity}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="bg-gray-950/50 rounded p-3">
          <div className="text-gray-500 text-xs mb-1">Hour (Shichen)</div>
          <div className="text-gray-200">{animal.hourName}</div>
          <div className="text-gray-400 text-xs">
            {String(animal.hourStart).padStart(2, '0')}:00 - {String(animal.hourEnd).padStart(2, '0')}:00
          </div>
        </div>
        <div className="bg-gray-950/50 rounded p-3">
          <div className="text-gray-500 text-xs mb-1">Direction</div>
          <div className="text-gray-200">{animal.direction}</div>
          <div className="text-gray-400 text-xs">{animal.season}</div>
        </div>
        <div className="bg-gray-950/50 rounded p-3">
          <div className="text-gray-500 text-xs mb-1">Lunar Month</div>
          <div className="text-gray-200">Month {animal.lunarMonth}</div>
          <div className="text-gray-400 text-xs">{animal.gregorianMonthApprox}</div>
        </div>
        <div className="bg-gray-950/50 rounded p-3">
          <div className="text-gray-500 text-xs mb-1">Trine Group</div>
          <div className="text-gray-200">Group {animal.trineGroup}</div>
          <div className="text-gray-400 text-xs">{companions.join(', ')}</div>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <span className="text-gray-500">Traits: </span>
          <span className="text-gray-300">{animal.traits.join(', ')}</span>
        </div>
        <div className="flex gap-4">
          <div>
            <span className="text-gray-500">Secret Friend: </span>
            <span className="text-green-400">{animal.secretFriend}</span>
          </div>
          <div>
            <span className="text-gray-500">Conflict: </span>
            <span className="text-red-400">{animal.conflictSign}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 italic">
          {trineGroup.characteristics}
        </div>
      </div>
    </div>
  );
}

function WesternSignCard({ sign, isSelected, onClick }: {
  sign: WesternZodiacSign;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        text-left p-3 rounded-lg border transition-all
        ${isSelected
          ? 'bg-cyan-950/40 border-cyan-700 ring-1 ring-cyan-700/50'
          : 'bg-gray-900 border-gray-800 hover:border-gray-600'
        }
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{sign.symbol}</span>
        <span className="font-semibold text-gray-100">{sign.name}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className={getWesternElementColor(sign.element)}>
          {sign.element}
        </span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-400">{sign.modality}</span>
      </div>
    </button>
  );
}

function WesternSignDetail({ sign }: { sign: WesternZodiacSign }) {
  return (
    <div className={`rounded-lg border p-5 ${getWesternElementBg(sign.element)} border-gray-700/40`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{sign.symbol}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-100">{sign.name}</h3>
              <div className="text-sm text-gray-400">
                {getWesternZodiacDateRange(sign)}
              </div>
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded text-sm font-semibold ${getWesternElementColor(sign.element)}`}>
          {sign.element} - {sign.modality}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="bg-gray-950/50 rounded p-3">
          <div className="text-gray-500 text-xs mb-1">Ruling Planet</div>
          <div className="text-gray-200">{sign.rulingPlanet}</div>
        </div>
        <div className="bg-gray-950/50 rounded p-3">
          <div className="text-gray-500 text-xs mb-1">Element</div>
          <div className={getWesternElementColor(sign.element)}>{sign.element}</div>
          <div className="text-gray-400 text-xs">{sign.modality}</div>
        </div>
        <div className="bg-gray-950/50 rounded p-3">
          <div className="text-gray-500 text-xs mb-1">Compatible Signs</div>
          <div className="text-green-400 text-xs">{sign.compatibleSigns.join(', ')}</div>
        </div>
        <div className="bg-gray-950/50 rounded p-3">
          <div className="text-gray-500 text-xs mb-1">Opposite Sign</div>
          <div className="text-red-400">{sign.oppositeSign}</div>
        </div>
      </div>

      <div className="text-sm">
        <span className="text-gray-500">Traits: </span>
        <span className="text-gray-300">{sign.traits.join(', ')}</span>
      </div>
    </div>
  );
}

export function ZodiacExplorer() {
  const [system, setSystem] = useState<ZodiacSystem>('chinese');
  const [selectedChinese, setSelectedChinese] = useState<ZodiacAnimal>(ZODIAC_ANIMALS[0]);
  const [selectedWestern, setSelectedWestern] = useState<WesternZodiacSign>(WESTERN_ZODIAC_SIGNS[0]);

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-cyan-400 font-[family-name:var(--font-geist-mono)]">
          Zodiac Explorer
        </h2>

        {/* System Toggle */}
        <div className="flex bg-gray-950 rounded-lg border border-gray-700 p-0.5">
          <button
            onClick={() => setSystem('chinese')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
              ${system === 'chinese'
                ? 'bg-red-900/50 text-red-300 border border-red-800/50'
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <Moon className="w-4 h-4" />
            Chinese
          </button>
          <button
            onClick={() => setSystem('western')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
              ${system === 'western'
                ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-800/50'
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <Sun className="w-4 h-4" />
            Western
          </button>
        </div>
      </div>

      {system === 'chinese' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {ZODIAC_ANIMALS.map((animal) => (
              <ChineseSignCard
                key={animal.name}
                animal={animal}
                isSelected={selectedChinese.name === animal.name}
                onClick={() => setSelectedChinese(animal)}
              />
            ))}
          </div>
          <ChineseSignDetail animal={selectedChinese} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {WESTERN_ZODIAC_SIGNS.map((sign) => (
              <WesternSignCard
                key={sign.name}
                sign={sign}
                isSelected={selectedWestern.name === sign.name}
                onClick={() => setSelectedWestern(sign)}
              />
            ))}
          </div>
          <WesternSignDetail sign={selectedWestern} />
        </div>
      )}
    </section>
  );
}
