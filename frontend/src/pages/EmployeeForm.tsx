import React, { useState, useEffect } from "react";
import {
    CheckCircle,
    AlertCircle,
    Clock,
    FileText,
    Save,
    User,
    Heart,
    Stethoscope,
    Receipt,
    Upload,
    FileCheck,
} from "lucide-react";
import { FormData, ValidationErrors, initialFormData } from "../types/form";
import { validateStep } from "../utils/validation";
import EmployeeDetailsStep from "../components/form/EmployeeDetailsStep";
import PatientDetailsStep from "../components/form/PatientDetailsStep";
import TreatmentDetailsStep from "../components/form/TreatmentDetailsStep";
import ExpenseDetailsStep from "../components/form/ExpenseDetailsStep";
import DocumentUploadStep from "../components/form/DocumentUploadStep";
import DeclarationStep from "../components/form/DeclarationStep";

const EmployeeForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
        {}
    );
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Auto-save functionality
    useEffect(() => {
        const savedData = localStorage.getItem("jnu-medical-form");
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                setFormData(parsedData);
            } catch (error) {
                console.error("Error parsing saved form data:", error);
            }
        }
    }, []);

    useEffect(() => {
        if (!isSubmitted) {
            setIsAutoSaving(true);
            const saveTimer = setTimeout(() => {
                localStorage.setItem(
                    "jnu-medical-form",
                    JSON.stringify(formData)
                );
                setIsAutoSaving(false);
            }, 1000);

            return () => clearTimeout(saveTimer);
        }
    }, [formData, isSubmitted]);

    const updateFormData = (section: keyof FormData, data: any) => {
        setFormData((prev) => ({
            ...prev,
            [section]: data,
        }));
    };

    const handleNext = () => {
        const errors = validateStep(currentStep, formData);

        if (Object.keys(errors).length === 0) {
            setValidationErrors({});
            if (currentStep < steps.length) {
                setCurrentStep(currentStep + 1);
            } else {
                // Final submission
                handleSubmit();
            }
        } else {
            setValidationErrors(errors);
            // Scroll to first error
            const firstErrorKey = Object.keys(errors)[0];
            const errorElement = document.getElementById(
                firstErrorKey.replace(/_/g, "-")
            );
            if (errorElement) {
                errorElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setValidationErrors({});
        }
    };

    const handleSubmit = async () => {
        try {
            // Here you would normally send the data to your backend API
            console.log("Submitting form data:", formData);

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Clear saved form data
            localStorage.removeItem("jnu-medical-form");
            setIsSubmitted(true);

            // Show success message or redirect
            alert(
                "Application submitted successfully! Reference ID: MR-2024-" +
                    Date.now()
            );
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Error submitting form. Please try again.");
        }
    };

    const steps = [
        {
            id: 1,
            number: 1,
            title: "Employee Details",
            subtitle: "Personal & Employment Information",
            icon: User,
            description: "Faculty/Employee Information",
        },
        {
            id: 2,
            number: 2,
            title: "Patient Details",
            subtitle: "Patient Information",
            icon: Heart,
            description: "Patient Information",
        },
        {
            id: 3,
            number: 3,
            title: "Treatment Details",
            subtitle: "Medical Treatment Information",
            icon: Stethoscope,
            description: "Treatment Information",
        },
        {
            id: 4,
            number: 4,
            title: "Expense Details",
            subtitle: "Medical Expenses",
            icon: Receipt,
            description: "Bill Particulars",
        },
        {
            id: 5,
            number: 5,
            title: "Document Upload",
            subtitle: "Supporting Documents",
            icon: Upload,
            description: "Supporting Documents",
        },
        {
            id: 6,
            number: 6,
            title: "Declaration",
            subtitle: "Final Declaration & Submission",
            icon: FileCheck,
            description: "Final Declaration",
        },
    ];

    const renderCurrentStep = () => {
        const stepProps = {
            formData,
            updateFormData,
            validationErrors,
            onNext: handleNext,
            onPrevious: handlePrevious,
            isFirstStep: currentStep === 1,
            isLastStep: currentStep === steps.length,
        };

        switch (currentStep) {
            case 1:
                return <EmployeeDetailsStep {...stepProps} />;
            case 2:
                return <PatientDetailsStep {...stepProps} />;
            case 3:
                return <TreatmentDetailsStep {...stepProps} />;
            case 4:
                return <ExpenseDetailsStep {...stepProps} />;
            case 5:
                return <DocumentUploadStep {...stepProps} />;
            case 6:
                return <DeclarationStep {...stepProps} />;
            default:
                return <EmployeeDetailsStep {...stepProps} />;
        }
    };

    const currentStepData = steps[currentStep - 1];
    const completedSteps = currentStep - 1;
    const progressPercentage = (completedSteps / steps.length) * 100;

    if (isSubmitted) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="card-gov text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gov-secondary-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gov-primary-800 mb-2">
                        Application Submitted Successfully!
                    </h1>
                    <p className="text-gov-neutral-600 mb-6">
                        Your medical reimbursement application has been
                        submitted and is being processed.
                    </p>
                    <div className="bg-gov-secondary-50 p-4 rounded-lg mb-6">
                        <p className="text-gov-secondary-800 font-semibold">
                            Reference ID: MR-2024-{Date.now()}
                        </p>
                        <p className="text-gov-secondary-700 text-sm mt-2">
                            Please save this reference ID for tracking your
                            application status.
                        </p>
                    </div>
                    <button
                        className="btn-gov-primary"
                        onClick={() => window.location.reload()}
                    >
                        Submit New Application
                    </button>
                </div>
            </div>
        );
    }

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
                                    <span>Auto-saved</span>
                                    {isAutoSaving && (
                                        <div className="animate-spin">
                                            <Save className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gov-neutral-600">
                                JNU Medical Centre
                            </div>
                            <div className="text-xs text-gov-neutral-500">
                                New Mehrauli Road, New Delhi
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gov-neutral-700">
                            Step {currentStep} of {steps.length}:{" "}
                            {currentStepData.title}
                        </span>
                        <span className="text-sm text-gov-neutral-600">
                            {Math.round(progressPercentage)}% Complete
                        </span>
                    </div>
                    <div className="w-full bg-gov-neutral-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-gov-primary-500 to-gov-secondary-500 h-2 rounded-full transition-all duration-300 ease-in-out"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <p className="text-gov-neutral-600 mt-2">
                        {currentStepData.subtitle}
                    </p>
                </div>

                {/* Step Navigation - Desktop */}
                <div className="hidden lg:flex justify-between mt-8 space-x-4">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center flex-1">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                        currentStep > step.id
                                            ? "bg-gov-secondary-600 text-white"
                                            : currentStep === step.id
                                            ? "bg-gov-primary-600 text-white"
                                            : "bg-gov-neutral-200 text-gov-neutral-600"
                                    }`}
                                    aria-current={
                                        currentStep === step.id
                                            ? "step"
                                            : undefined
                                    }
                                >
                                    {currentStep > step.id ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : (
                                        <step.icon className="w-5 h-5" />
                                    )}
                                </div>
                                <div
                                    className={`mt-2 text-center ${
                                        currentStep === step.id
                                            ? "text-gov-primary-800"
                                            : "text-gov-neutral-600"
                                    }`}
                                >
                                    <div className="text-xs font-medium">
                                        {step.title}
                                    </div>
                                    <div className="text-xs text-gov-neutral-500">
                                        {step.description}
                                    </div>
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`flex-1 h-0.5 self-center mt-5 ${
                                        currentStep > step.id
                                            ? "bg-gov-secondary-300"
                                            : "bg-gov-neutral-200"
                                    }`}
                                ></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step Navigation - Mobile */}
                <div className="lg:hidden mt-6 text-center">
                    <div className="inline-flex items-center space-x-2 bg-gov-neutral-100 rounded-full px-4 py-2">
                        <currentStepData.icon className="w-4 h-4 text-gov-primary-600" />
                        <div className="text-sm font-medium text-gov-neutral-600">
                            Step {currentStep} of {steps.length}
                        </div>
                        <div className="text-lg font-semibold text-gov-primary-800">
                            {currentStepData.title}
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Step Content */}
            {renderCurrentStep()}

            {/* Help Section */}
            <div className="card-gov bg-gov-neutral-50">
                <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gov-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-gov-primary-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gov-neutral-800 mb-2">
                            Need Help?
                        </h3>
                        <p className="text-gov-neutral-600 mb-4">
                            If you face any issues while filling this form,
                            please contact our support team.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="font-medium text-gov-neutral-800">
                                    Email Support
                                </div>
                                <div className="text-gov-primary-600">
                                    medical@jnu.ac.in
                                </div>
                            </div>
                            <div>
                                <div className="font-medium text-gov-neutral-800">
                                    Phone Support
                                </div>
                                <div className="text-gov-primary-600">
                                    011-26704077
                                </div>
                            </div>
                            <div>
                                <div className="font-medium text-gov-neutral-800">
                                    Office Hours
                                </div>
                                <div className="text-gov-neutral-600">
                                    Mon-Fri, 9:00 AM - 5:00 PM
                                </div>
                            </div>
                            <div>
                                <div className="font-medium text-gov-neutral-800">
                                    Response Time
                                </div>
                                <div className="text-gov-neutral-600">
                                    Within 24 hours
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeForm;
