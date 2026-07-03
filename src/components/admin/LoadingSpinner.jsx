import React from 'react';

export default function LoadingSpinner({ small }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className={`animate-spin rounded-full border-b-2 border-cyan-400 ${small ? 'h-6 w-6' : 'h-10 w-10'}`}></div>
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
    </div>
  );
}
