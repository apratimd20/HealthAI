import React from 'react';

const sizeMap = { sm: 40, md: 64, lg: 88 };

const Loader = ({ size = 'md', text = 'Loading...' }) => {
  const s = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: s, height: s }}>
        <div
          className="absolute inset-0 rounded-full border border-brand/30"
          style={{ animation: 'spin 1.8s linear infinite' }}
        />
        <div
          className="absolute inset-[12%] rounded-full border border-brand/70"
          style={{ animation: 'spin 1.3s linear infinite reverse' }}
        />
        <div className="h-3 w-3 rounded-full bg-brand shadow-[0_0_18px_rgba(16,185,129,0.8)]" />
      </div>
      {text && <p className="text-xs font-medium tracking-[0.18em] text-fg-muted uppercase">{text}</p>}
    </div>
  );
};

export default Loader;
