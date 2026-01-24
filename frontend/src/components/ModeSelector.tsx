import { useState } from 'react';
import { useUIMode, type UIMode, getModeInfo } from '@/context/UIMode';
import { getZodiacSign } from '@/lib/HelioEngine';

// Western zodiac calculation
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
      // Handle Capricorn spanning year boundary
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

interface ModeSelectorProps {
  isOnboarding?: boolean;
  onComplete?: () => void;
}

export function ModeSelector({ isOnboarding = false, onComplete }: ModeSelectorProps) {
  const { state, setMode, completeOnboarding, updateAstrologyProfile } = useUIMode();
  const [selectedMode, setSelectedMode] = useState<UIMode>(state.mode);
  const [showCustomSetup, setShowCustomSetup] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(state.astrologyProfile.dateOfBirth || '');
  const [timeOfBirth, setTimeOfBirth] = useState(state.astrologyProfile.timeOfBirth || '');
  const [birthLocation, setBirthLocation] = useState(state.astrologyProfile.birthLocation || '');

  const modes: UIMode[] = ['basic', 'investment', 'custom'];

  const handleModeSelect = (mode: UIMode) => {
    setSelectedMode(mode);
    if (mode === 'custom') {
      setShowCustomSetup(true);
    } else {
      setShowCustomSetup(false);
    }
  };

  const handleContinue = () => {
    if (selectedMode === 'custom' && dateOfBirth) {
      // Calculate zodiac signs
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
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Personalize Your Experience
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Enter your birth details to see personalized astrology and Chinese zodiac insights.
            </p>

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
                <p className="text-xs text-slate-500 mt-1">
                  For more accurate astrological calculations
                </p>
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
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={selectedMode === 'custom' && !dateOfBirth}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            selectedMode === 'custom' && !dateOfBirth
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
