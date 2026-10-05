import React from 'react';

/**
 * PrintablePaper wrapper component enforcing standard A4 paper dimensions
 * (210mm x 297mm in print mode, ~850px x 1120px in display mode).
 * Uses flex layout so bottom signatures always stick to the bottom margin.
 */
export function PrintablePaper({ children, className = '', id = 'printable-document-canvas' }) {
  return (
    <div className="w-full flex justify-center py-2 sm:py-4 no-print-padding print:p-0 print:m-0">
      <div
        id={id}
        className={`printable-a4-paper bg-white text-slate-900 shadow-2xl rounded-[4px] w-full max-w-[850px] p-6 sm:p-8 min-h-[1050px] flex flex-col justify-between print:min-h-0 print:h-auto print:p-0 print:m-0 print:shadow-none print:w-full print:max-w-none ${className}`}
        style={{ color: '#111827' }}
      >
        {children}
      </div>
    </div>
  );
}
