import React from 'react';
import { AlertTriangle, PlusCircle, Info } from 'lucide-react';

interface ComparisonData {
  summary: string;
  discrepancies: string[];
  new_info: string[];
  conflicts: string[];
}

interface Props {
  data: ComparisonData | null;
}

const ComparisonPanel: React.FC<Props> = ({ data }) => {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <Info className="text-gray-400 mb-2" size={24} />
        <p className="text-sm text-gray-500 italic">No existing clinical records found for comparison.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2 text-sm">
          <Info size={16} />
          Audit Summary
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {data.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* New Information */}
        {data.new_info.length > 0 && (
          <div className="bg-green-50/30 border border-green-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-green-50 border-bottom border-green-100 flex items-center gap-2 text-green-700 font-semibold text-sm">
              <PlusCircle size={16} />
              New Information Detected
            </div>
            <div className="p-4 space-y-3">
              {data.new_info.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" />
                  <p className="text-sm text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discrepancies */}
        {data.discrepancies.length > 0 && (
          <div className="bg-amber-50/30 border border-amber-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-amber-50 border-bottom border-amber-100 flex items-center gap-2 text-amber-700 font-semibold text-sm">
              <AlertTriangle size={16} />
              Potential Discrepancies
            </div>
            <div className="p-4 space-y-3">
              {data.discrepancies.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <p className="text-sm text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conflicts */}
        {data.conflicts.length > 0 && (
          <div className="bg-red-50/30 border border-red-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-red-50 border-bottom border-red-100 flex items-center gap-2 text-red-700 font-semibold text-sm">
              <AlertTriangle size={16} />
              Critical Conflicts
            </div>
            <div className="p-4 space-y-3">
              {data.conflicts.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start font-medium">
                  <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                  <p className="text-sm text-red-900">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-[11px] text-gray-400 flex items-center gap-1.5 justify-center mt-4">
        <div className="w-1 h-1 rounded-full bg-gray-300" />
        AI-driven clinical auditing vs. most recent finalized record
      </div>
    </div>
  );
};

export default ComparisonPanel;
