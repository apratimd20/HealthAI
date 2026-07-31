import React from 'react';

const sizeMap = { sm: 120, md: 160, lg: 200 };

const Loader = ({ size = 'md', text }) => {
  const s = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <svg width={s} height={s * 0.4} viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ecg-glow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="40%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="200" height="80" rx="12" fill="#10b981" fillOpacity="0.03" />

        <path d="M0 40 L35 40 L42 20 L48 60 L55 30 L62 50 L68 40 L200 40"
          stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="400" strokeDashoffset="400" opacity="0.15">
          <animate attributeName="stroke-dashoffset" from="400" to="0" dur="1.8s" repeatCount="indefinite" />
        </path>

        <path d="M0 40 L35 40 L42 20 L48 60 L55 30 L62 50 L68 40 L200 40"
          stroke="url(#ecg-glow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="400" strokeDashoffset="400">
          <animate attributeName="stroke-dashoffset" from="400" to="0" dur="1.8s" repeatCount="indefinite" />
        </path>

        <circle cx="0" cy="40" r="7" fill="#10b981" opacity="0.15">
          <animate attributeName="cx" values="0;200" dur="1.8s" repeatCount="indefinite" />
        </circle>

        <circle cx="0" cy="40" r="4" fill="#10b981" opacity="0.9">
          <animate attributeName="cx" values="0;200" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="r" values="3;5;3" dur="0.6s" repeatCount="indefinite" />
        </circle>
      </svg>
      {/* {text && <p className="text-sm text-fg-muted tracking-wide">{text}</p>} */}
    </div>
  );
};

export default Loader;
