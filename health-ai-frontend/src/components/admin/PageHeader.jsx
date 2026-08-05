// src/components/admin/PageHeader.jsx
import React from 'react';

const PageHeader = ({ eyebrow, title, description, actions }) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand">{eyebrow}</p>
        )}
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-fg md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;