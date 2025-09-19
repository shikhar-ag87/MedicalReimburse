import React from "react";
import { Heart, AlertCircle } from "lucide-react";
import { StepProps, PatientData } from "../../types/form";

const PatientDetailsStep: React.FC<StepProps> = ({
    formData,
    updateFormData,
    validationErrors,
    onNext,
    onPrevious,
    isFirstStep,
    isLastStep,
}) => {
    const handleInputChange = (field: keyof PatientData, value: string) => {
        updateFormData("patient", {
            ...formData.patient,
            [field]: value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext();
    };

    const relationshipOptions = [
        { value: "self", label: "Self" },
        { value: "spouse", label: "Spouse" },
        { value: "son", label: "Son" },
        { value: "daughter", label: "Daughter" },
        { value: "dependent-parent", label: "Dependent Parent" },
        { value: "other", label: "Other Dependent" },
    ];

    return (
        <div className="space-y-6">
            <div className="card-gov">
                <div className="card-gov-header">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gov-primary-100 rounded-full flex items-center justify-center">
                            <Heart className="w-5 h-5 text-gov-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gov-primary-800">
                                Patient Details
                            </h2>
                            <p className="text-gov-neutral-600 font-hindi">
                                रोगी विवरण
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Patient Name */}
                    <div className="form-group">
                        <label
                            htmlFor="patientName"
                            className="form-label required"
                        >
                            Name of Patient
                            <span className="font-hindi text-sm ml-2">
                                रोगी का नाम
                            </span>
                        </label>
                        <input
                            type="text"
                            id="patientName"
                            name="patientName"
                            value={formData.patient.patientName}
                            onChange={(e) =>
                                handleInputChange("patientName", e.target.value)
                            }
                            className={`input-gov ${
                                validationErrors.patientName
                                    ? "border-red-500"
                                    : ""
                            }`}
                            placeholder="Enter patient's full name"
                            aria-describedby={
                                validationErrors.patientName
                                    ? "patientName-error"
                                    : undefined
                            }
                        />
                        {validationErrors.patientName && (
                            <p
                                id="patientName-error"
                                className="text-red-600 text-sm mt-1 flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.patientName}
                            </p>
                        )}
                    </div>

                    {/* Patient CGHS Card Number */}
                    <div className="form-group">
                        <label
                            htmlFor="patientCghsCardNumber"
                            className="form-label"
                        >
                            CGHS Card No. of Patient
                            <span className="font-hindi text-sm ml-2">
                                रोगी की CGHS कार्ड संख्या
                            </span>
                        </label>
                        <input
                            type="text"
                            id="patientCghsCardNumber"
                            name="patientCghsCardNumber"
                            value={formData.patient.cghsCardNumber}
                            onChange={(e) =>
                                handleInputChange(
                                    "cghsCardNumber",
                                    e.target.value
                                )
                            }
                            className={`input-gov ${
                                validationErrors.patientCghsCardNumber
                                    ? "border-red-500"
                                    : ""
                            }`}
                            placeholder="Enter patient's CGHS card number (if different from employee)"
                            aria-describedby={
                                validationErrors.patientCghsCardNumber
                                    ? "patientCghsCardNumber-error"
                                    : undefined
                            }
                        />
                        {validationErrors.patientCghsCardNumber && (
                            <p
                                id="patientCghsCardNumber-error"
                                className="text-red-600 text-sm mt-1 flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.patientCghsCardNumber}
                            </p>
                        )}
                        <div className="text-sm text-gov-neutral-600 mt-1">
                            Leave blank if patient uses the same CGHS card as
                            the employee
                        </div>
                    </div>

                    {/* Relationship with Employee */}
                    <div className="form-group">
                        <label
                            htmlFor="relationshipWithEmployee"
                            className="form-label required"
                        >
                            Relationship with Faculty/Employee
                            <span className="font-hindi text-sm ml-2">
                                कर्मचारी के साथ रिश्ता
                            </span>
                        </label>
                        <select
                            id="relationshipWithEmployee"
                            name="relationshipWithEmployee"
                            value={formData.patient.relationshipWithEmployee}
                            onChange={(e) =>
                                handleInputChange(
                                    "relationshipWithEmployee",
                                    e.target.value
                                )
                            }
                            className={`input-gov ${
                                validationErrors.relationshipWithEmployee
                                    ? "border-red-500"
                                    : ""
                            }`}
                            aria-describedby={
                                validationErrors.relationshipWithEmployee
                                    ? "relationshipWithEmployee-error"
                                    : undefined
                            }
                        >
                            <option value="">Select relationship</option>
                            {relationshipOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {validationErrors.relationshipWithEmployee && (
                            <p
                                id="relationshipWithEmployee-error"
                                className="text-red-600 text-sm mt-1 flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.relationshipWithEmployee}
                            </p>
                        )}
                    </div>

                    {/* Additional Information for Dependents */}
                    {formData.patient.relationshipWithEmployee &&
                        formData.patient.relationshipWithEmployee !==
                            "self" && (
                            <div className="bg-gov-neutral-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gov-neutral-800 mb-2">
                                    Dependent Information
                                </h4>
                                <div className="text-sm text-gov-neutral-600 space-y-2">
                                    <p>
                                        • Ensure the patient is listed as a
                                        dependent on your CGHS card
                                    </p>
                                    <p>
                                        • For children above 21 years,
                                        additional documentation may be required
                                    </p>
                                    <p>
                                        • Dependent parents must be included in
                                        the CGHS coverage
                                    </p>
                                </div>
                            </div>
                        )}

                    {/* Form Navigation */}
                    <div className="flex justify-between pt-6 mt-8 border-t border-gov-neutral-200">
                        <button
                            type="button"
                            className="btn-gov-secondary"
                            onClick={onPrevious}
                        >
                            Previous: Employee Details
                        </button>
                        <button type="submit" className="btn-gov-primary">
                            Next: Treatment Details
                        </button>
                    </div>
                </form>
            </div>

            {/* Help Section */}
            <div className="card-gov bg-gov-neutral-50">
                <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gov-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-gov-primary-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gov-neutral-800 mb-2">
                            Patient Information Guidelines
                        </h3>
                        <ul className="text-gov-neutral-600 space-y-2 text-sm">
                            <li>
                                • Patient name should match exactly with medical
                                documents
                            </li>
                            <li>
                                • For self-treatment, enter your own name as
                                patient
                            </li>
                            <li>
                                • Dependents must be registered on your CGHS
                                card
                            </li>
                            <li>
                                • Contact Medical Centre for dependent
                                registration queries
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailsStep;
