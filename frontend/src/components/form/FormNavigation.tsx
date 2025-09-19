import React from 'react';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

const FormNavigation: React.FC<FormNavigationProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit
}) => {
  return (
    <div className="flex justify-between items-center">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
          currentStep === 1
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous</span>
      </button>

      <div className="text-sm text-gray-600">
        Step {currentStep} of {totalSteps}
      </div>

      {currentStep === totalSteps ? (
        <button
          type="button"
          onClick={onSubmit}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Send className="w-4 h-4" />
          <span>Submit Claim</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default FormNavigation;