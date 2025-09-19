import React from "react";
import { User, AlertCircle } from "lucide-react";
import { StepProps, EmployeeData } from "../../types/form";

const EmployeeDetailsStep: React.FC<StepProps> = ({
    formData,
    updateFormData,
    validationErrors,
    onNext,
    onPrevious,
    isFirstStep,
    isLastStep,
}) => {
    const handleInputChange = (field: keyof EmployeeData, value: string) => {
        updateFormData("employee", {
            ...formData.employee,
            [field]: value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext();
    };

    return (
        <div className="space-y-6">
            <div className="card-gov">
                <div className="card-gov-header">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gov-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gov-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gov-primary-800">
                                Employee Details
                            </h2>
                            <p className="text-gov-neutral-600 font-hindi">
                                कर्मचारी विवरण
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Faculty/Employee Name */}
                    <div className="form-group">
                        <label
                            htmlFor="facultyEmployeeName"
                            className="form-label required"
                        >
                            Name of Faculty/Employee
                            <span className="font-hindi text-sm ml-2">
                                संकाय/कर्मचारी का नाम
                            </span>
                        </label>
                        <input
                            type="text"
                            id="facultyEmployeeName"
                            name="facultyEmployeeName"
                            value={formData.employee.facultyEmployeeName}
                            onChange={(e) =>
                                handleInputChange(
                                    "facultyEmployeeName",
                                    e.target.value
                                )
                            }
                            className={`input-gov ${
                                validationErrors.facultyEmployeeName
                                    ? "border-red-500"
                                    : ""
                            }`}
                            placeholder="Enter full name as per official records"
                            aria-describedby={
                                validationErrors.facultyEmployeeName
                                    ? "facultyEmployeeName-error"
                                    : undefined
                            }
                        />
                        {validationErrors.facultyEmployeeName && (
                            <p
                                id="facultyEmployeeName-error"
                                className="text-red-600 text-sm mt-1 flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.facultyEmployeeName}
                            </p>
                        )}
                    </div>

                    {/* Designation */}
                    <div className="form-group">
                        <label
                            htmlFor="designation"
                            className="form-label required"
                        >
                            Designation
                            <span className="font-hindi text-sm ml-2">
                                पदनाम
                            </span>
                        </label>
                        <input
                            type="text"
                            id="designation"
                            name="designation"
                            value={formData.employee.designation}
                            onChange={(e) =>
                                handleInputChange("designation", e.target.value)
                            }
                            className={`input-gov ${
                                validationErrors.designation
                                    ? "border-red-500"
                                    : ""
                            }`}
                            placeholder="e.g., Professor, Assistant Professor, Administrative Officer"
                            aria-describedby={
                                validationErrors.designation
                                    ? "designation-error"
                                    : undefined
                            }
                        />
                        {validationErrors.designation && (
                            <p
                                id="designation-error"
                                className="text-red-600 text-sm mt-1 flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.designation}
                            </p>
                        )}
                    </div>

                    {/* School/Centre/Department/Office */}
                    <div className="form-group">
                        <label
                            htmlFor="schoolCentreDepartment"
                            className="form-label required"
                        >
                            School/Centre/Department/Office
                            <span className="font-hindi text-sm ml-2">
                                स्कूल/केंद्र/विभाग/कार्यालय
                            </span>
                        </label>
                        <input
                            type="text"
                            id="schoolCentreDepartment"
                            name="schoolCentreDepartment"
                            value={formData.employee.schoolCentreDepartment}
                            onChange={(e) =>
                                handleInputChange(
                                    "schoolCentreDepartment",
                                    e.target.value
                                )
                            }
                            className={`input-gov ${
                                validationErrors.schoolCentreDepartment
                                    ? "border-red-500"
                                    : ""
                            }`}
                            placeholder="e.g., School of Language, Literature & Culture Studies"
                            aria-describedby={
                                validationErrors.schoolCentreDepartment
                                    ? "schoolCentreDepartment-error"
                                    : undefined
                            }
                        />
                        {validationErrors.schoolCentreDepartment && (
                            <p
                                id="schoolCentreDepartment-error"
                                className="text-red-600 text-sm mt-1 flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.schoolCentreDepartment}
                            </p>
                        )}
                    </div>

                    {/* CGHS Card Number */}
                    <div className="form-group">
                        <label
                            htmlFor="cghsCardNumber"
                            className="form-label required"
                        >
                            CGHS Card No./JNU Medical Card No./Uncovered Area
                            Certificate No.
                            <span className="font-hindi text-sm ml-2">
                                CGHS कार्ड संख्या/JNU मेडिकल कार्ड संख्या
                            </span>
                        </label>
                        <input
                            type="text"
                            id="cghsCardNumber"
                            name="cghsCardNumber"
                            value={formData.employee.cghsCardNumber}
                            onChange={(e) =>
                                handleInputChange(
                                    "cghsCardNumber",
                                    e.target.value
                                )
                            }
                            className={`input-gov ${
                                validationErrors.cghsCardNumber
                                    ? "border-red-500"
                                    : ""
                            }`}
                            placeholder="Enter card number"
                            aria-describedby={
                                validationErrors.cghsCardNumber
                                    ? "cghsCardNumber-error"
                                    : undefined
                            }
                        />
                        {validationErrors.cghsCardNumber && (
                            <p
                                id="cghsCardNumber-error"
                                className="text-red-600 text-sm mt-1 flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.cghsCardNumber}
                            </p>
                        )}
                    </div>

                    {/* CGHS Dispensary */}
                    <div className="form-group">
                        <label
                            htmlFor="cghsDispensary"
                            className="form-label required"
                        >
                            Name of CGHS Dispensary to which Card is attached
                            <span className="font-hindi text-sm ml-2">
                                CGHS डिस्पेंसरी का नाम
                            </span>
                        </label>
                        <input
                            type="text"
                            id="cghsDispensary"
                            name="cghsDispensary"
                            value={formData.employee.cghsDispensary}
                            onChange={(e) =>
                                handleInputChange(
                                    "cghsDispensary",
                                    e.target.value
                                )
                            }
                            className={`input-gov ${
                                validationErrors.cghsDispensary
                                    ? "border-red-500"
                                    : ""
                            }`}
                            placeholder="Enter CGHS dispensary name"
                            aria-describedby={
                                validationErrors.cghsDispensary
                                    ? "cghsDispensary-error"
                                    : undefined
                            }
                        />
                        {validationErrors.cghsDispensary && (
                            <p
                                id="cghsDispensary-error"
                                className="text-red-600 text-sm mt-1 flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.cghsDispensary}
                            </p>
                        )}
                    </div>

                    {/* Card Validity */}
                    <div className="form-group">
                        <label htmlFor="cardValidity" className="form-label">
                            Validity of CGHS Card/JNU Medical Card/Uncovered
                            Area Certificate
                            <span className="font-hindi text-sm ml-2">
                                कार्ड की वैधता
                            </span>
                        </label>
                        <input
                            type="date"
                            id="cardValidity"
                            name="cardValidity"
                            value={formData.employee.cardValidity}
                            onChange={(e) =>
                                handleInputChange(
                                    "cardValidity",
                                    e.target.value
                                )
                            }
                            className={`input-gov ${
                                validationErrors.cardValidity
                                    ? "border-red-500"
                                    : ""
                            }`}
                            aria-describedby={
                                validationErrors.cardValidity
                                    ? "cardValidity-error"
                                    : undefined
                            }
                        />
                        {validationErrors.cardValidity && (
                            <p
                                id="cardValidity-error"
                                className="text-red-600 text-sm mt-1 flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.cardValidity}
                            </p>
                        )}
                    </div>

                    {/* Ward Entitlement */}
                    <div className="form-group">
                        <label htmlFor="wardEntitlement" className="form-label">
                            Ward Entitlement - Private/Semi-Private/General
                            <span className="font-hindi text-sm ml-2">
                                वार्ड एंटाइटलमेंट
                            </span>
                        </label>
                        <select
                            id="wardEntitlement"
                            name="wardEntitlement"
                            value={formData.employee.wardEntitlement}
                            onChange={(e) =>
                                handleInputChange(
                                    "wardEntitlement",
                                    e.target.value
                                )
                            }
                            className={`input-gov ${
                                validationErrors.wardEntitlement
                                    ? "border-red-500"
                                    : ""
                            }`}
                            aria-describedby={
                                validationErrors.wardEntitlement
                                    ? "wardEntitlement-error"
                                    : undefined
                            }
                        >
                            <option value="">Select ward entitlement</option>
                            <option value="private">Private</option>
                            <option value="semi-private">Semi-Private</option>
                            <option value="general">General</option>
                        </select>
                        {validationErrors.wardEntitlement && (
                            <p
                                id="wardEntitlement-error"
                                className="text-red-600 text-sm mt-1 flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.wardEntitlement}
                            </p>
                        )}
                    </div>

                    {/* Form Navigation */}
                    <div className="flex justify-between pt-6 mt-8 border-t border-gov-neutral-200">
                        <button
                            type="button"
                            className="btn-gov-secondary opacity-50 cursor-not-allowed"
                            disabled={isFirstStep}
                            onClick={onPrevious}
                        >
                            Previous
                        </button>
                        <button type="submit" className="btn-gov-primary">
                            Next: Patient Details
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
                            Employee Information Guidelines
                        </h3>
                        <ul className="text-gov-neutral-600 space-y-2 text-sm">
                            <li>
                                • Enter your name exactly as it appears on your
                                official employment records
                            </li>
                            <li>
                                • CGHS card must be valid and active for
                                reimbursement processing
                            </li>
                            <li>
                                • Ensure all information matches your official
                                documents
                            </li>
                            <li>
                                • Contact HR department if you need assistance
                                with your details
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailsStep;
