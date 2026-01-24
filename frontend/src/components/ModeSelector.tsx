import { useState } from 'react';
import { useUIMode, type UIMode, getModeInfo } from '@/context/UIMode';
import { getZodiacSign } from '@/lib/HelioEngine';

// Western zodiac signs with date ranges for display
const WESTERN_SIGNS = [
  { name: 'Aries', dates: 'Mar 21 - Apr 19' },
  { name: 'Taurus', dates: 'Apr 20 - May 20' },
  { name: 'Gemini', dates: 'May 21 - Jun 20' },
  { name: 'Cancer', dates: 'Jun 21 - Jul 22' },
  { name: 'Leo', dates: 'Jul 23 - Aug 22' },
  { name: 'Virgo', dates: 'Aug 23 - Sep 22' },
  { name: 'Libra', dates: 'Sep 23 - Oct 22' },
  { name: 'Scorpio', dates: 'Oct 23 - Nov 21' },
  { name: 'Sagittarius', dates: 'Nov 22 - Dec 21' },
  { name: 'Capricorn', dates: 'Dec 22 - Jan 19' },
  { name: 'Aquarius', dates: 'Jan 20 - Feb 18' },
  { name: 'Pisces', dates: 'Feb 19 - Mar 20' },
];

// Chinese zodiac animals
const CHINESE_ANIMALS = [
  'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
  'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'
];

// Chinese elements
const CHINESE_ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

// Western zodiac calculation from date
function getWesternZodiac(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const signs = [
    { name: 'Capricorn', start: [12, 22], end: [1, 19] },
    { name: 'Aquarius', start: [1, 20], end: [2, 18] },
    { name: 'Pisces', start: [2, 19], end: [3, 20] },
    { name: 'Aries', start: [3, 21], end: [4, 19] },
    { name: 'Taurus', start: [4, 20], end: [5, 20] },
    { name: 'Gemini', start: [5, 21], end: [6, 20] },
    { name: 'Cancer', start: [6, 21], end: [7, 22] },
    { name: 'Leo', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', start: [8, 23], end: [9, 22] },
    { name: 'Libra', start: [9, 23], end: [10, 22] },
    { name: 'Scorpio', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', start: [11, 22], end: [12, 21] },
  ];

  for (const sign of signs) {
    const [startMonth, startDay] = sign.start;
    const [endMonth, endDay] = sign.end;

    if (startMonth === 12 && endMonth === 1) {
      if ((month === 12 && day >= startDay) || (month === 1 && day <= endDay)) {
        return sign.name;
      }
    } else if (
      (month === startMonth && day >= startDay) ||
      (month === endMonth && day <= endDay)
    ) {
      return sign.name;
    }
  }

  return 'Unknown';
}

type InputMethod = 'date' | 'signs';

interface ModeSelectorProps {
  isOnboarding?: boolean;
  onComplete?: () => void;
}

export function ModeSelector({ isOnboarding = false, onComplete }: ModeSelectorProps) {
  const { state, setMode, completeOnboarding, updateAstrologyProfile } = useUIMode();
  const [selectedMode, setSelectedMode] = useState<UIMode>(state.mode);
  const [showCustomSetup, setShowCustomSetup] = useState(false);

  // Input method toggle
  const [inputMethod, setInputMethod] = useState<InputMethod>('date');

  // Date-based inputs
  const [dateOfBirth, setDateOfBirth] = useState(state.astrologyProfile.dateOfBirth || '');
  const [timeOfBirth, setTimeOfBirth] = useState(state.astrologyProfile.timeOfBirth || '');
  const [birthLocation, setBirthLocation] = useState(state.astrologyProfile.birthLocation || '');

  // Direct sign selection
  const [selectedWesternSign, setSelectedWesternSign] = useState(state.astrologyProfile.westernZodiac || '');
  const [selectedChineseAnimal, setSelectedChineseAnimal] = useState(state.astrologyProfile.chineseZodiac || '');
  const [selectedChineseElement, setSelectedChineseElement] = useState(state.astrologyProfile.chineseElement || '');

  const modes: UIMode[] = ['basic', 'investment', 'custom'];

  const handleModeSelect = (mode: UIMode) => {
    setSelectedMode(mode);
    if (mode === 'custom') {
      setShowCustomSetup(true);
    } else {
      setShowCustomSetup(false);
    }
  };

  const isCustomModeValid = () => {
    if (inputMethod === 'date') {
      return !!dateOfBirth;
    } else {
      // At least one sign must be selected
      return !!selectedWesternSign || (!!selectedChineseAnimal && !!selectedChineseElement);
    }
  };

  const handleContinue = () => {
    if (selectedMode === 'custom') {
      if (inputMethod === 'date' && dateOfBirth) {
        // Calculate zodiac signs from date
        const birthYear = new Date(dateOfBirth).getFullYear();
        const chineseZodiac = getZodiacSign(birthYear);
        const westernZodiac = getWesternZodiac(dateOfBirth);

        updateAstrologyProfile({
          dateOfBirth,
          timeOfBirth: timeOfBirth || null,
          birthLocation: birthLocation || null,
          westernZodiac,
          chineseZodiac: chineseZodiac.name,
          chineseElement: chineseZodiac.element,
        });
      } else if (inputMethod === 'signs') {
        // Use manually selected signs
        updateAstrologyProfile({
          dateOfBirth: null,
          timeOfBirth: null,
          birthLocation: null,
          westernZodiac: selectedWesternSign || null,
          chineseZodiac: selectedChineseAnimal || null,
          chineseElement: selectedChineseElement || null,
        });
      }
    }

    setMode(selectedMode);
    completeOnboarding();
    onComplete?.();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-slate-800 mb-2">
            Welcome to HelioMetric
          </h1>
          <p className="text-slate-600">
            {isOnboarding
              ? "Choose how you'd like to explore space weather and solar data"
              : "Select your preferred viewing mode"
            }
          </p>
        </div>

        {/* Mode Cards */}
        <div className="space-y-4 mb-8">
          {modes.map((mode) => {
            const info = getModeInfo(mode);
            const isSelected = selectedMode === mode;

            return (
              <button
                key={mode}
                onClick={() => handleModeSelect(mode)}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{info.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                        {info.name}
                      </h3>
                      {isSelected && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${isSelected ? 'text-blue-600' : 'text-slate-600'}`}>
                      {info.description}
                    </p>
                    <p className={`text-xs mt-2 ${isSelected ? 'text-blue-500' : 'text-slate-500'}`}>
                      {info.subtitle}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Mode Setup */}
        {showCustomSetup && selectedMode === 'custom' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Personalize Your Experience
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Choose how you'd like to provide your zodiac information.
            </p>

            {/* Input Method Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setInputMethod('date')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  inputMethod === 'date'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                }`}
              >
                Enter Birth Date
              </button>
              <button
                onClick={() => setInputMethod('signs')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  inputMethod === 'signs'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                }`}
              >
                Select Signs Directly
              </button>
            </div>

            {inputMethod === 'date' ? (
              /* Date-based input */
              <div className="space-y-4">
                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-slate-700 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="dob"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    We'll automatically calculate your Western and Chinese zodiac signs
                  </p>
                </div>

                <div>
                  <label htmlFor="tob" className="block text-sm font-medium text-slate-700 mb-1">
                    Time of Birth <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="time"
                    id="tob"
                    value={timeOfBirth}
                    onChange={(e) => setTimeOfBirth(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">
                    Birth Location <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={birthLocation}
                    onChange={(e) => setBirthLocation(e.target.value)}
                    placeholder="City, Country"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              /* Direct sign selection */
              <div className="space-y-6">
                {/* Western Zodiac */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Western Zodiac Sign
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {WESTERN_SIGNS.map((sign) => (
                      <button
                        key={sign.name}
                        onClick={() => setSelectedWesternSign(
                          selectedWesternSign === sign.name ? '' : sign.name
                        )}
                        className={`p-2 rounded-lg text-sm transition-colors ${
                          selectedWesternSign === sign.name
                            ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-medium">{sign.name}</div>
                        <div className="text-xs opacity-70">{sign.dates}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chinese Zodiac */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Chinese Zodiac Animal
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {CHINESE_ANIMALS.map((animal) => (
                      <button
                        key={animal}
                        onClick={() => setSelectedChineseAnimal(
                          selectedChineseAnimal === animal ? '' : animal
                        )}
                        className={`p-2 rounded-lg text-sm transition-colors ${
                          selectedChineseAnimal === animal
                            ? 'bg-red-100 text-red-700 border-2 border-red-300'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {animal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chinese Element */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Chinese Element
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {CHINESE_ELEMENTS.map((element) => {
                      const elementColors: Record<string, string> = {
                        Wood: 'bg-green-100 text-green-700 border-green-300',
                        Fire: 'bg-red-100 text-red-700 border-red-300',
                        Earth: 'bg-amber-100 text-amber-700 border-amber-300',
                        Metal: 'bg-slate-200 text-slate-700 border-slate-400',
                        Water: 'bg-blue-100 text-blue-700 border-blue-300',
                      };
                      return (
                        <button
                          key={element}
                          onClick={() => setSelectedChineseElement(
                            selectedChineseElement === element ? '' : element
                          )}
                          className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedChineseElement === element
                              ? `${elementColors[element]} border-2`
                              : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {element}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Select at least your Western sign OR both Chinese animal and element
                </p>
              </div>
            )}
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={selectedMode === 'custom' && !isCustomModeValid()}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            selectedMode === 'custom' && !isCustomModeValid()
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isOnboarding ? 'Get Started' : 'Save Changes'}
        </button>

        {/* Skip option for onboarding */}
        {isOnboarding && (
          <button
            onClick={() => {
              setMode('basic');
              completeOnboarding();
              onComplete?.();
            }}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 mt-4"
          >
            Skip for now - I'll explore on my own
          </button>
        )}
      </div>
    </div>
  );
}
