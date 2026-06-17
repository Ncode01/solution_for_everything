import React from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, required, hint, className = '', children }: FieldProps) {
  return (
    <div className={className}>
      <label className="label">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-600 mt-1">{hint}</p>}
    </div>
  );
}

interface FormActionsProps {
  submitLabel: string;
  onCancel: () => void;
}

export function FormActions({ submitLabel, onCancel }: FormActionsProps) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="submit" className="btn-primary flex-1 justify-center">
        {submitLabel}
      </button>
      <button type="button" className="btn-secondary" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
