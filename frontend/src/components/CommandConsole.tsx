import { useSystemState, useFamilyMembers } from '@/context/SystemState';
import { calculateFamilyEntropy, type SystemEntropyReport } from '@/lib/EntanglementLogic';
import { Activity, Users, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

type WuXingElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

interface CommandConsoleProps {
  kIndex: number;
  yearElement?: WuXingElement;
}

function SystemEntropyPanel({ entropyReport }: { entropyReport: SystemEntropyReport }) {
  const stressLevel = entropyReport.systemStressScore < 30 ? 'Low' :
    entropyReport.systemStressScore < 60 ? 'Moderate' : 'High';

  const stressColor = entropyReport.systemStressScore < 30 ? 'text-green-600' :
    entropyReport.systemStressScore < 60 ? 'text-amber-600' : 'text-red-600';

  const stressBg = entropyReport.systemStressScore < 30 ? 'bg-green-50' :
    entropyReport.systemStressScore < 60 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Family Dynamics
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Relationship analysis based on Chinese zodiac</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${stressBg}`}>
          <Activity className={`w-4 h-4 ${stressColor}`} />
          <span className={`text-sm font-medium ${stressColor}`}>{stressLevel} Stress</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Stress Score</div>
          <div className={`text-2xl font-bold ${stressColor}`}>
            {entropyReport.systemStressScore}
          </div>
          <div className="text-xs text-slate-400">/ 100</div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Stability</div>
          <div className="text-2xl font-bold text-blue-600">
            {(entropyReport.stabilityIndex * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-400">index</div>
        </div>

        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Supportive
          </div>
          <div className="text-2xl font-bold text-green-600">
            {entropyReport.constructiveCount}
          </div>
          <div className="text-xs text-slate-400">pairs</div>
        </div>

        <div className="bg-red-50 rounded-lg p-3 border border-red-100">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            Challenging
          </div>
          <div className="text-2xl font-bold text-red-500">
            {entropyReport.destructiveCount}
          </div>
          <div className="text-xs text-slate-400">pairs</div>
        </div>
      </div>

      {entropyReport.dominantElement && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Dominant Element:</span>
          <span className="font-medium text-blue-600">{entropyReport.dominantElement}</span>
        </div>
      )}
    </div>
  );
}

function FamilyNodesPanel() {
  const { all: nodes } = useFamilyMembers();

  const getElementStyle = (element: string) => {
    const styles: Record<string, string> = {
      Fire: 'bg-red-50 text-red-600',
      Water: 'bg-blue-50 text-blue-600',
      Wood: 'bg-green-50 text-green-600',
      Metal: 'bg-slate-100 text-slate-600',
      Earth: 'bg-amber-50 text-amber-600',
    };
    return styles[element] || 'bg-slate-50 text-slate-600';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800">
          Family Members
        </h3>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Users className="w-3 h-3" />
          <span>{nodes.length} members</span>
        </div>
      </div>

      <div className="space-y-2">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg border border-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${node.role === 'Primary' ? 'bg-blue-500' : 'bg-slate-400'}`} />
              <div>
                <div className="text-sm text-slate-800">{node.name}</div>
                <div className="text-xs text-slate-500">
                  {node.birthYear} - {node.zodiacSign.name}
                </div>
              </div>
            </div>
            <div className={`text-xs px-2 py-0.5 rounded-full ${getElementStyle(node.zodiacSign.element)}`}>
              {node.zodiacSign.element}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CommandConsole(_props: CommandConsoleProps) {
  const { state } = useSystemState();
  const entropyReport = calculateFamilyEntropy(state.nodes);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 border border-blue-100">
          <Zap className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Family Analysis</h2>
          <p className="text-xs text-slate-500">Based on Chinese zodiac compatibility</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SystemEntropyPanel entropyReport={entropyReport} />
        <FamilyNodesPanel />
      </div>
    </section>
  );
}

export default CommandConsole;
