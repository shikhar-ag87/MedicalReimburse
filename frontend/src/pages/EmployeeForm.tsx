import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, FileText, Save } from 'lucide-react';

interface FormData {
  employee: {
    name?: string;
    employeeId?: string;
    department?: string;
    designation?: string;
    mobile?: string;
    email?: string;
    address?: string;
    medicalCardNumber?: string;
    cardValidity?: string;
  };
  patient: any;
  treatment: any;
  expenses: any[];
  documents: any[];
  declaration: any;
}

const EmployeeForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    employee: {},
    patient: {},
    treatment: {},
    expenses: [],
    documents: [],
    declaration: {}
  });
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    const savedData = localStorage.getItem('jnu-medical-form');
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

  useEffect(() => {
    setIsAutoSaving(true);
    const saveTimer = setTimeout(() => {
      localStorage.setItem('jnu-medical-form', JSON.stringify(formData));
      setIsAutoSaving(false);
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [formData]);

  const updateFormData = (section: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const handleEmployeeChange = (field: string, value: string) => {
    updateFormData('employee', {
      ...formData.employee,
      [field]: value
    });
  };

  const steps = [
    { number: 1, title: 'Employee Details', subtitle: 'Personal & Employment Information' },
    { number: 2, title: 'Patient Details', subtitle: 'Patient Information' },
    { number: 3, title: 'Treatment Details', subtitle: 'Medical Treatment Information' },
    { number: 4, title: 'Expense Breakdown', subtitle: 'Medical Expenses' },
    { number: 5, title: 'Document Uploads', subtitle: 'Supporting Documents' },
    { number: 6, title: 'Declaration', subtitle: 'Final Declaration & Submission' }
  ];

  const currentStepData = steps[currentStep - 1];
  const completedSteps = currentStep - 1;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="card-gov animate-fade-in">
        <div className="card-gov-header">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-responsive-h1 text-gov-primary-800 font-bold">
                Medical Reimbursement Application
              </h1>
              <p className="text-gov-neutral-600 mt-2 font-hindi text-lg">
                चिकित्सा प्रतिपूर्ति आवेदन पत्र
              </p>
              <div className="flex items-center mt-4 space-x-4 text-sm text-gov-neutral-600">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Form ID: MR-2024-001</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Estimated Time: 15-20 minutes</span>
                </div>
              </div>
            </div>
            
            {/* Auto-save status */}
            <div className="flex items-center space-x-2 text-sm">
              {isAutoSaving ? (
                <div className="flex items-center space-x-2 text-gov-accent-600">
                  <div className="w-4 h-4 border-2 border-gov-accent-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-gov-secondary-600">
                  <Save className="w-4 h-4" />
                  <span>Auto-saved</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gov-neutral-800">
              Step {currentStep} of {steps.length}: {currentStepData.title}
            </h2>
            <span className="text-sm font-medium text-gov-neutral-600">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="progress-gov">
            <div 
              className="progress-gov-bar" 
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Form completion: ${Math.round(progressPercentage)}%`}
            />
          </div>
          
          <p className="text-gov-neutral-600">{currentStepData.subtitle}</p>
        </div>
      </div>

      {/* Step Navigation - Desktop */}
      <div className="hidden lg:block card-gov">
        <nav aria-label="Form steps" className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex items-center space-x-3">
                <div 
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                    currentStep > step.number 
                      ? 'bg-gov-secondary-100 text-gov-secondary-800' 
                      : currentStep === step.number
                      ? 'bg-gov-primary-600 text-white shadow-gov'
                      : 'bg-gov-neutral-200 text-gov-neutral-600'
                  }`}
                  aria-current={currentStep === step.number ? 'step' : undefined}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" aria-label="Completed" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className={`${currentStep === step.number ? 'text-gov-primary-800' : 'text-gov-neutral-600'}`}>
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-gov-neutral-500">{step.subtitle}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                    currentStep > step.number ? 'bg-gov-secondary-300' : 'bg-gov-neutral-200'
                  }`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Mobile Step Indicator */}
      <div className="lg:hidden card-gov">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gov-neutral-600">Step {currentStep} of {steps.length}</div>
            <div className="text-lg font-semibold text-gov-primary-800">{currentStepData.title}</div>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-gov-primary-600 text-white shadow-gov">
            {currentStep}
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="alert-gov-info animate-slide-up">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-gov-primary-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-gov-primary-800 mb-1">Important Instructions</h3>
            <ul className="text-sm text-gov-primary-700 space-y-1">
              <li>• All mandatory fields are marked with red asterisk (*)</li>
              <li>• Upload clear, legible copies of all supporting documents</li>
              <li>• Ensure all information is accurate before final submission</li>
              <li>• Your form data is automatically saved as you progress</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Form Card - Employee Details */}
      <div className="card-gov animate-slide-up">
        <div className="card-gov-header">
          <h2 className="card-gov-title">Employee Details</h2>
          <p className="card-gov-subtitle font-hindi">कर्मचारी विवरण</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="emp-name" className="label-gov label-gov-required">
              Name of Faculty/Employee
              <span className="block text-xs text-gov-neutral-500 font-normal font-hindi mt-1">
                संकाय/कर्मचारी का नाम
              </span>
            </label>
            <input
              id="emp-name"
              type="text"
              value={formData.employee.name || ''}
              onChange={(e) => handleEmployeeChange('name', e.target.value)}
              className="input-gov"
              placeholder="Enter your full name"
              required
              aria-describedby="emp-name-help"
            />
            <p id="emp-name-help" className="text-xs text-gov-neutral-500">
              Enter your full name as mentioned in official documents
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="emp-id" className="label-gov label-gov-required">
              Employee ID
              <span className="block text-xs text-gov-neutral-500 font-normal font-hindi mt-1">
                कर्मचारी आईडी
              </span>
            </label>
            <input
              id="emp-id"
              type="text"
              value={formData.employee.employeeId || ''}
              onChange={(e) => handleEmployeeChange('employeeId', e.target.value)}
              className="input-gov"
              placeholder="e.g., EMP001234"
              required
              aria-describedby="emp-id-help"
            />
            <p id="emp-id-help" className="text-xs text-gov-neutral-500">
              Your official employee identification number
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="department" className="label-gov label-gov-required">
              Department/School/Office
              <span className="block text-xs text-gov-neutral-500 font-normal font-hindi mt-1">
                विभाग/स्कूल/कार्यालय
              </span>
            </label>
            <select
              id="department"
              value={formData.employee.department || ''}
              onChange={(e) => handleEmployeeChange('department', e.target.value)}
              className="input-gov"
              required
              aria-describedby="department-help"
            >
              <option value="">Select Department</option>
              <option value="administration">Administration</option>
              <option value="biotechnology">School of Biotechnology</option>
              <option value="computer-science">School of Computer & Systems Sciences</option>
              <option value="environmental-sciences">School of Environmental Sciences</option>
              <option value="international-studies">School of International Studies</option>
              <option value="language-literature">School of Language, Literature & Culture Studies</option>
              <option value="life-sciences">School of Life Sciences</option>
              <option value="physical-sciences">School of Physical Sciences</option>
              <option value="social-sciences">School of Social Sciences</option>
              <option value="arts-aesthetics">School of Arts & Aesthetics</option>
              <option value="engineering">School of Engineering</option>
              <option value="other">Other</option>
            </select>
            <p id="department-help" className="text-xs text-gov-neutral-500">
              Select your department or school
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="designation" className="label-gov label-gov-required">
              Designation
              <span className="block text-xs text-gov-neutral-500 font-normal font-hindi mt-1">
                पदनाम
              </span>
            </label>
            <select
              id="designation"
              value={formData.employee.designation || ''}
              onChange={(e) => handleEmployeeChange('designation', e.target.value)}
              className="input-gov"
              required
              aria-describedby="designation-help"
            >
              <option value="">Select Designation</option>
              <option value="professor">Professor</option>
              <option value="associate-professor">Associate Professor</option>
              <option value="assistant-professor">Assistant Professor</option>
              <option value="research-scholar">Research Scholar</option>
              <option value="administrative-officer">Administrative Officer</option>
              <option value="junior-research-fellow">Junior Research Fellow</option>
              <option value="senior-research-fellow">Senior Research Fellow</option>
              <option value="post-doc-fellow">Post Doctoral Fellow</option>
              <option value="visiting-faculty">Visiting Faculty</option>
              <option value="staff">Staff</option>
              <option value="other">Other</option>
            </select>
            <p id="designation-help" className="text-xs text-gov-neutral-500">
              Your current position at the university
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="mobile" className="label-gov label-gov-required">
              Mobile Number
              <span className="block text-xs text-gov-neutral-500 font-normal font-hindi mt-1">
                मोबाइल नंबर
              </span>
            </label>
            <input
              id="mobile"
              type="tel"
              value={formData.employee.mobile || ''}
              onChange={(e) => handleEmployeeChange('mobile', e.target.value)}
              className="input-gov"
              placeholder="10-digit mobile number"
              pattern="[0-9]{10}"
              maxLength={10}
              required
              aria-describedby="mobile-help"
            />
            <p id="mobile-help" className="text-xs text-gov-neutral-500">
              Enter 10-digit mobile number without country code
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="label-gov label-gov-required">
              Email Address
              <span className="block text-xs text-gov-neutral-500 font-normal font-hindi mt-1">
                ईमेल पता
              </span>
            </label>
            <input
              id="email"
              type="email"
              value={formData.employee.email || ''}
              onChange={(e) => handleEmployeeChange('email', e.target.value)}
              className="input-gov"
              placeholder="your.email@jnu.ac.in"
              required
              aria-describedby="email-help"
            />
            <p id="email-help" className="text-xs text-gov-neutral-500">
              Official university email address preferred
            </p>
          </div>

          <div className="lg:col-span-2 space-y-2">
            <label htmlFor="address" className="label-gov label-gov-required">
              Residential Address
              <span className="block text-xs text-gov-neutral-500 font-normal font-hindi mt-1">
                आवासीय पता
              </span>
            </label>
            <textarea
              id="address"
              value={formData.employee.address || ''}
              onChange={(e) => handleEmployeeChange('address', e.target.value)}
              className="input-gov min-h-[100px] resize-vertical"
              placeholder="Enter your complete residential address"
              required
              aria-describedby="address-help"
            />
            <p id="address-help" className="text-xs text-gov-neutral-500">
              Complete address including pin code for communication
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="medical-card" className="label-gov label-gov-required">
              CGHS/JNU Medical Card Number
              <span className="block text-xs text-gov-neutral-500 font-normal font-hindi mt-1">
                सीजीएचएस/जेएनयू मेडिकल कार्ड नंबर
              </span>
            </label>
            <input
              id="medical-card"
              type="text"
              value={formData.employee.medicalCardNumber || ''}
              onChange={(e) => handleEmployeeChange('medicalCardNumber', e.target.value)}
              className="input-gov"
              placeholder="e.g., CGHS123456789"
              required
              aria-describedby="medical-card-help"
            />
            <p id="medical-card-help" className="text-xs text-gov-neutral-500">
              Your CGHS or JNU medical card number
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="card-validity" className="label-gov label-gov-required">
              Card Validity Date
              <span className="block text-xs text-gov-neutral-500 font-normal font-hindi mt-1">
                कार्ड की वैधता तिथि
              </span>
            </label>
            <input
              id="card-validity"
              type="date"
              value={formData.employee.cardValidity || ''}
              onChange={(e) => handleEmployeeChange('cardValidity', e.target.value)}
              className="input-gov"
              required
              aria-describedby="card-validity-help"
            />
            <p id="card-validity-help" className="text-xs text-gov-neutral-500">
              Medical card expiry date
            </p>
          </div>
        </div>

        {/* Help section for this step */}
        <div className="alert-gov-info mt-6">
          <h4 className="font-semibold text-gov-primary-800 mb-2">Instructions for Employee Details:</h4>
          <ul className="text-sm text-gov-primary-700 space-y-1">
            <li>• Ensure all details match your official university records</li>
            <li>• Use your official university email address for faster processing</li>
            <li>• Double-check your employee ID for accuracy</li>
            <li>• Medical card should be valid and active</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 mt-8 border-t border-gov-neutral-200">
          <button 
            className="btn-gov-secondary" 
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            Previous
          </button>
          <button 
            className="btn-gov-primary"
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={currentStep === steps.length}
          >
            {currentStep === steps.length ? 'Submit Application' : 'Next: Patient Details'}
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="card-gov bg-gov-neutral-50">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gov-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-gov-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gov-neutral-800 mb-2">Need Help?</h3>
            <p className="text-gov-neutral-600 mb-4">
              If you face any issues while filling this form, please contact our support team.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gov-neutral-800">Email Support</div>
                <div className="text-gov-primary-600">medical@jnu.ac.in</div>
              </div>
              <div>
                <div className="font-medium text-gov-neutral-800">Phone Support</div>
                <div className="text-gov-primary-600">011-26704077</div>
              </div>
              <div>
                <div className="font-medium text-gov-neutral-800">Office Hours</div>
                <div className="text-gov-neutral-600">Mon-Fri, 9:00 AM - 5:00 PM</div>
              </div>
              <div>
                <div className="font-medium text-gov-neutral-800">Response Time</div>
                <div className="text-gov-neutral-600">Within 24 hours</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;
