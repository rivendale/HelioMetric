import { useUIMode } from '@/context/UIMode';

type WuXingElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

interface PersonalInsightsProps {
  kIndex: number;
  yearElement: WuXingElement;
}

// Element compatibility data
const ELEMENT_COMPATIBILITY: Record<string, Record<string, { compatibility: string; description: string }>> = {
  Fire: {
    Fire: { compatibility: 'Neutral', description: 'Similar energies, may intensify emotions' },
    Earth: { compatibility: 'Supportive', description: 'Fire generates Earth, nurturing growth' },
    Metal: { compatibility: 'Challenging', description: 'Fire controls Metal, potential friction' },
    Water: { compatibility: 'Challenging', description: 'Water controls Fire, may feel drained' },
    Wood: { compatibility: 'Excellent', description: 'Wood feeds Fire, energizing connection' },
  },
  Earth: {
    Fire: { compatibility: 'Supportive', description: 'Fire generates Earth, feel supported' },
    Earth: { compatibility: 'Neutral', description: 'Similar grounded energy' },
    Metal: { compatibility: 'Supportive', description: 'Earth generates Metal, productive time' },
    Water: { compatibility: 'Challenging', description: 'Earth controls Water, may feel stuck' },
    Wood: { compatibility: 'Challenging', description: 'Wood controls Earth, extra effort needed' },
  },
  Metal: {
    Fire: { compatibility: 'Challenging', description: 'Fire controls Metal, feeling pressured' },
    Earth: { compatibility: 'Excellent', description: 'Earth generates Metal, feel strong' },
    Metal: { compatibility: 'Neutral', description: 'Similar precise energy' },
    Water: { compatibility: 'Supportive', description: 'Metal generates Water, creative flow' },
    Wood: { compatibility: 'Challenging', description: 'Metal controls Wood, decisive period' },
  },
  Water: {
    Fire: { compatibility: 'Challenging', description: 'Water controls Fire, powerful but tiring' },
    Earth: { compatibility: 'Challenging', description: 'Earth controls Water, obstacles present' },
    Metal: { compatibility: 'Excellent', description: 'Metal generates Water, wisdom flows' },
    Water: { compatibility: 'Neutral', description: 'Deep emotional currents' },
    Wood: { compatibility: 'Supportive', description: 'Water generates Wood, growth period' },
  },
  Wood: {
    Fire: { compatibility: 'Supportive', description: 'Wood generates Fire, inspiring time' },
    Earth: { compatibility: 'Challenging', description: 'Wood controls Earth, assertive period' },
    Metal: { compatibility: 'Challenging', description: 'Metal controls Wood, refinement needed' },
    Water: { compatibility: 'Excellent', description: 'Water generates Wood, flourishing' },
    Wood: { compatibility: 'Neutral', description: 'Strong growth energy' },
  },
};

// Western zodiac insights based on K-Index
function getWesternZodiacInsight(sign: string, kIndex: number): string {
  const baseInsights: Record<string, string> = {
    Aries: 'Your pioneering spirit is amplified today',
    Taurus: 'Focus on stability and practical matters',
    Gemini: 'Communication flows easily, share your ideas',
    Cancer: 'Trust your intuition in decision making',
    Leo: 'Your natural leadership shines through',
    Virgo: 'Details matter, pay attention to the fine print',
    Libra: 'Seek balance in relationships and decisions',
    Scorpio: 'Deep transformation is possible now',
    Sagittarius: 'Adventure and learning are favored',
    Capricorn: 'Steady progress toward your goals',
    Aquarius: 'Innovation and originality serve you well',
    Pisces: 'Creative and spiritual pursuits are highlighted',
  };

  const stormModifier = kIndex >= 5 ? ' - Geomagnetic activity may heighten sensitivity.' : '';
  return (baseInsights[sign] || 'Cosmic energies are in flux') + stormModifier;
}

export function PersonalInsights({ kIndex, yearElement }: PersonalInsightsProps) {
  const { state } = useUIMode();
  const { astrologyProfile } = state;

  if (!astrologyProfile.dateOfBirth) {
    return (
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Personal Insights
        </h2>
        <p className="text-slate-500 text-sm">
          Add your birth date in settings to see personalized astrology insights.
        </p>
      </section>
    );
  }

  const birthDate = new Date(astrologyProfile.dateOfBirth);
  const westernSign = astrologyProfile.westernZodiac || 'Unknown';
  const chineseSign = astrologyProfile.chineseZodiac || 'Unknown';
  const chineseElement = astrologyProfile.chineseElement || 'Unknown';

  // Get compatibility with current year element
  const compatibility = chineseElement && yearElement
    ? ELEMENT_COMPATIBILITY[chineseElement]?.[yearElement]
    : null;

  const getCompatibilityColor = (comp: string) => {
    switch (comp) {
      case 'Excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'Supportive': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Neutral': return 'text-slate-600 bg-slate-50 border-slate-200';
      case 'Challenging': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

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
      Fire: 'bg-red-50',
      Earth: 'bg-amber-50',
      Metal: 'bg-slate-100',
      Water: 'bg-blue-50',
      Wood: 'bg-green-50',
    };
    return colors[element] || 'bg-slate-50';
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Your Personal Insights
        </h2>
        <span className="text-xs text-slate-400">
          Born {birthDate.toLocaleDateString()}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Western Zodiac */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {getWesternZodiacEmoji(westernSign)}
            </span>
            <div>
              <h3 className="font-medium text-slate-800">Western Zodiac</h3>
              <p className="text-sm text-slate-500">{westernSign}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
            {getWesternZodiacInsight(westernSign, kIndex)}
          </p>
        </div>

        {/* Chinese Zodiac */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {getChineseZodiacEmoji(chineseSign)}
            </span>
            <div>
              <h3 className="font-medium text-slate-800">Chinese Zodiac</h3>
              <p className="text-sm text-slate-500">
                <span className={getElementColor(chineseElement)}>{chineseElement}</span> {chineseSign}
              </p>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${getElementBg(chineseElement)}`}>
            <p className="text-sm text-slate-600">
              Your {chineseElement} {chineseSign} nature brings unique strengths to navigate current cosmic conditions.
            </p>
          </div>
        </div>
      </div>

      {/* Element Compatibility */}
      {compatibility && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-medium text-slate-600 mb-3">
            Current Year Element Compatibility
          </h3>
          <div className={`p-4 rounded-lg border ${getCompatibilityColor(compatibility.compatibility)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                Your {chineseElement} + Current {yearElement}
              </span>
              <span className="text-sm font-semibold">
                {compatibility.compatibility}
              </span>
            </div>
            <p className="text-sm opacity-90">
              {compatibility.description}
            </p>
          </div>
        </div>
      )}

      {/* Solar Activity Impact */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-medium text-slate-600 mb-3">
          Solar Activity Impact
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Sensitivity Level</div>
            <div className={`text-lg font-semibold ${getSensitivityColor(westernSign, kIndex)}`}>
              {getSensitivityLevel(westernSign, kIndex)}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-xs text-slate-500 mb-1">Energy Forecast</div>
            <div className="text-lg font-semibold text-slate-700">
              {getEnergyForecast(chineseElement, yearElement, kIndex)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getWesternZodiacEmoji(sign: string): string {
  const emojis: Record<string, string> = {
    Aries: '\u2648',
    Taurus: '\u2649',
    Gemini: '\u264A',
    Cancer: '\u264B',
    Leo: '\u264C',
    Virgo: '\u264D',
    Libra: '\u264E',
    Scorpio: '\u264F',
    Sagittarius: '\u2650',
    Capricorn: '\u2651',
    Aquarius: '\u2652',
    Pisces: '\u2653',
  };
  return emojis[sign] || '\u2728';
}

function getChineseZodiacEmoji(sign: string): string {
  const emojis: Record<string, string> = {
    Rat: '\uD83D\uDC00',
    Ox: '\uD83D\uDC02',
    Tiger: '\uD83D\uDC05',
    Rabbit: '\uD83D\uDC07',
    Dragon: '\uD83D\uDC09',
    Snake: '\uD83D\uDC0D',
    Horse: '\uD83D\uDC0E',
    Goat: '\uD83D\uDC10',
    Monkey: '\uD83D\uDC12',
    Rooster: '\uD83D\uDC13',
    Dog: '\uD83D\uDC15',
    Pig: '\uD83D\uDC16',
  };
  return emojis[sign] || '\u2728';
}

function getSensitivityLevel(sign: string, kIndex: number): string {
  // Water signs are more sensitive to geomagnetic activity
  const waterSigns = ['Cancer', 'Scorpio', 'Pisces'];
  const isWaterSign = waterSigns.includes(sign);

  if (kIndex < 3) return isWaterSign ? 'Moderate' : 'Low';
  if (kIndex < 5) return isWaterSign ? 'High' : 'Moderate';
  return isWaterSign ? 'Very High' : 'High';
}

function getSensitivityColor(sign: string, kIndex: number): string {
  const level = getSensitivityLevel(sign, kIndex);
  switch (level) {
    case 'Low': return 'text-green-600';
    case 'Moderate': return 'text-blue-600';
    case 'High': return 'text-amber-600';
    case 'Very High': return 'text-red-600';
    default: return 'text-slate-600';
  }
}

function getEnergyForecast(personalElement: string, yearElement: string, kIndex: number): string {
  const compatibility = ELEMENT_COMPATIBILITY[personalElement]?.[yearElement];
  if (!compatibility) return 'Balanced';

  if (kIndex >= 5) {
    return compatibility.compatibility === 'Excellent' || compatibility.compatibility === 'Supportive'
      ? 'Resilient'
      : 'Turbulent';
  }

  switch (compatibility.compatibility) {
    case 'Excellent': return 'Thriving';
    case 'Supportive': return 'Flowing';
    case 'Neutral': return 'Steady';
    case 'Challenging': return 'Adapting';
    default: return 'Balanced';
  }
}
