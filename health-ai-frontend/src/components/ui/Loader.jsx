import React from 'react';

const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

const Loader = ({ size = 'md', text }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`animate-spin rounded-full border-[3px] border-border-default border-t-brand ${sizeMap[size] || sizeMap.md}`}
      />
      {text && <p className="text-sm text-fg-muted">{text}</p>}
    </div>
  );
};

export default Loader;
