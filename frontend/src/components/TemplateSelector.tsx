import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportTemplatesApi, ReportTemplate } from '@/api/report_templates';

interface Props {
  selectedTemplate: string;
  onSelect: (templateId: string) => void;
  disabled?: boolean;
}

export const TemplateSelector: React.FC<Props> = ({ selectedTemplate, onSelect, disabled }) => {
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['report_templates'],
    queryFn: () => reportTemplatesApi.list()
  });

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading templates...</div>;
  }

  if (error || !templates) {
    return <div className="text-sm text-red-500">Failed to load templates.</div>;
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-semibold text-gray-700">Select Report Format</label>
      {templates.length === 0 ? (
        <div className="text-sm text-gray-500 italic p-4 border rounded-lg bg-gray-50">
          No report templates available. Please contact administrator.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((tmpl: ReportTemplate) => (
            <div
              key={tmpl.type_key}
              onClick={() => !disabled && onSelect(tmpl.type_key)}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
              } ${
                selectedTemplate === tmpl.type_key
                  ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="font-medium text-gray-900">{tmpl.name}</div>
              <div className="text-xs text-gray-500 mt-1">{tmpl.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
