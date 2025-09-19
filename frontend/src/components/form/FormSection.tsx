import React, { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, subtitle, children }) => {
  return (
    <div className="space-y-6">
      <div className="card-gov-header">
        <h2 className="card-gov-title">{title}</h2>
        <p className="card-gov-subtitle font-hindi">{subtitle}</p>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

export default FormSection;