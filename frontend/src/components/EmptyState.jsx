import React from 'react';

/**
 * EmptyState — reusable empty state display
 * 
 * @param {React.ElementType} icon     - Lucide icon component
 * @param {string}            title    - Main heading
 * @param {string}            subtitle - Supporting text
 * @param {React.ReactNode}   action   - Optional CTA button/element
 * @param {string}            size     - 'sm' | 'md' | 'lg'
 */
const EmptyState = ({ icon: Icon, title, subtitle, action, size = 'md' }) => {
  const sizes = {
    sm: { container: 'py-10', icon: 'h-10 w-10', title: 'text-base', subtitle: 'text-xs' },
    md: { container: 'py-16', icon: 'h-14 w-14', title: 'text-lg', subtitle: 'text-sm' },
    lg: { container: 'py-24', icon: 'h-20 w-20', title: 'text-xl', subtitle: 'text-base' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex flex-col items-center justify-center text-center ${s.container} px-6`}>
      {Icon && (
        <div className="mb-5 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800">
          <Icon className={`${s.icon} text-slate-300 dark:text-slate-600`} />
        </div>
      )}
      <h3 className={`${s.title} font-semibold text-slate-700 dark:text-slate-300 mb-2`}>
        {title}
      </h3>
      {subtitle && (
        <p className={`${s.subtitle} text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed`}>
          {subtitle}
        </p>
      )}
      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
