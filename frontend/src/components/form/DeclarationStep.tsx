import React from "react";
import { FileCheck, AlertCircle, CheckCircle } from "lucide-react";
import { StepProps, DeclarationData } from "../../types/form";

const DeclarationStep: React.FC<StepProps> = ({
    formData,
    updateFormData,
    validationErrors,
    onNext,
    onPrevious,
}) => {
    const handleInputChange = (
        field: keyof DeclarationData,
        value: string | boolean
    ) => {
        updateFormData("declaration", {
            ...formData.declaration,
            [field]: value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext();
    };

    const calculateTotalAmount = () => {
        return formData.expenses.reduce(
            (total, expense) => total + (expense.amountClaimed || 0),
            0
        );
    };

    return (
        <div className="space-y-6">
            <div className="card-gov">
                <div className="card-gov-header">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gov-primary-100 rounded-full flex items-center justify-center">
                            <FileCheck className="w-5 h-5 text-gov-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gov-primary-800">
                                Declaration
                            </h2>
                            <p className="text-gov-neutral-600 font-hindi">
                                घोषणा
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Application Summary */}
                    <div className="bg-gov-neutral-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gov-neutral-800 mb-4">
                            Application Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gov-neutral-600">
                                            Employee Name:
                                        </span>
                                        <span className="text-gov-neutral-800 font-medium">
                                            {formData.employee
                                                .facultyEmployeeName ||
                                                "Not provided"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gov-neutral-600">
                                            Patient Name:
                                        </span>
                                        <span className="text-gov-neutral-800 font-medium">
                                            {formData.patient.patientName ||
                                                "Not provided"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gov-neutral-600">
                                            Treatment Type:
                                        </span>
                                        <span className="text-gov-neutral-800 font-medium capitalize">
                                            {formData.treatment.treatmentType}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gov-neutral-600">
                                            Hospital:
                                        </span>
                                        <span className="text-gov-neutral-800 font-medium">
                                            {formData.treatment.hospitalName ||
                                                "Not provided"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gov-neutral-600">
                                            Total Expenses:
                                        </span>
                                        <span className="text-gov-neutral-800 font-medium">
                                            {formData.expenses.length} items
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gov-neutral-600">
                                            Total Amount:
                                        </span>
                                        <span className="text-gov-primary-800 font-bold text-lg">
                                            ₹{" "}
                                            {calculateTotalAmount().toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gov-neutral-600">
                                            Documents:
                                        </span>
                                        <span className="text-gov-neutral-800 font-medium">
                                            {
                                                formData.documents.uploadedFiles
                                                    .length
                                            }{" "}
                                            files uploaded
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Declaration Text */}
                    <div className="bg-white border-2 border-gov-primary-200 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-gov-primary-800 mb-4">
                            Declaration / घोषणा
                        </h3>
                        <div className="space-y-4 text-sm text-gov-neutral-700 leading-relaxed">
                            <p>
                                I declare that the above information is correct
                                and I am a CGHS/JNU Medical beneficiary. The
                                Card was valid at the time of treatment taken
                                and the person for whom medical expenses are
                                being claimed is wholly dependent on me. The
                                reimbursement shall be made as per prevailing
                                rules and amount paid excess, if any, shall be
                                refunded by me.
                            </p>
                            <p className="font-hindi">
                                मैं घोषणा करता/करती हूं कि उपर्युक्त जानकारी सही
                                है और मैं CGHS/JNU चिकित्सा लाभार्थी हूं। उपचार
                                के समय कार्ड वैध था और जिस व्यक्ति के लिए
                                चिकित्सा व्यय का दावा किया जा रहा है, वह पूर्णतः
                                मुझ पर आश्रित है। प्रतिपूर्ति प्रचलित नियमों के
                                अनुसार की जाएगी और अधिक भुगतान, यदि कोई हो, मेरे
                                द्वारा वापस की जाएगी।
                            </p>
                        </div>

                        {/* Agreement Checkbox */}
                        <div className="mt-6">
                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    id="agreed"
                                    checked={formData.declaration.agreed}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "agreed",
                                            e.target.checked
                                        )
                                    }
                                    className="w-4 h-4 text-gov-primary-600 border-gray-300 focus:ring-gov-primary-500 mt-1"
                                />
                                <div>
                                    <label
                                        htmlFor="agreed"
                                        className="form-label text-sm required"
                                    >
                                        I agree to the above declaration and
                                        confirm that all information provided is
                                        accurate and truthful.
                                        <span className="font-hindi text-sm block mt-1">
                                            मैं उपर्युक्त घोषणा से सहमत हूं और
                                            पुष्टि करता हूं कि प्रदान की गई सभी
                                            जानकारी सटीक और सत्य है।
                                        </span>
                                    </label>
                                    {validationErrors.agreed && (
                                        <p className="text-red-600 text-xs mt-1 flex items-center">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            {validationErrors.agreed}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Signature Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                            <label
                                htmlFor="signature"
                                className="form-label required"
                            >
                                Signature of Claimant
                                <span className="font-hindi text-sm ml-2">
                                    दावेदार का हस्ताक्षर
                                </span>
                            </label>
                            <input
                                type="text"
                                id="signature"
                                value={formData.declaration.signature}
                                onChange={(e) =>
                                    handleInputChange(
                                        "signature",
                                        e.target.value
                                    )
                                }
                                className={`input-gov ${
                                    validationErrors.signature
                                        ? "border-red-500"
                                        : ""
                                }`}
                                placeholder="Type your full name as signature"
                                aria-describedby={
                                    validationErrors.signature
                                        ? "signature-error"
                                        : undefined
                                }
                            />
                            {validationErrors.signature && (
                                <p
                                    id="signature-error"
                                    className="text-red-600 text-sm mt-1 flex items-center"
                                >
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {validationErrors.signature}
                                </p>
                            )}
                        </div>

                        <div className="form-group">
                            <label
                                htmlFor="facultyEmployeeId"
                                className="form-label"
                            >
                                Faculty/Employee I.D.
                                <span className="font-hindi text-sm ml-2">
                                    संकाय/कर्मचारी आई.डी.
                                </span>
                            </label>
                            <input
                                type="text"
                                id="facultyEmployeeId"
                                value={formData.declaration.facultyEmployeeId}
                                onChange={(e) =>
                                    handleInputChange(
                                        "facultyEmployeeId",
                                        e.target.value
                                    )
                                }
                                className="input-gov"
                                placeholder="Enter your employee ID"
                            />
                        </div>

                        <div className="form-group">
                            <label
                                htmlFor="mobileNumber"
                                className="form-label"
                            >
                                Mobile Number
                                <span className="font-hindi text-sm ml-2">
                                    मोबाइल नंबर
                                </span>
                            </label>
                            <input
                                type="tel"
                                id="mobileNumber"
                                value={formData.declaration.mobileNumber}
                                onChange={(e) =>
                                    handleInputChange(
                                        "mobileNumber",
                                        e.target.value
                                    )
                                }
                                className="input-gov"
                                placeholder="Enter mobile number"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                E-mail
                                <span className="font-hindi text-sm ml-2">
                                    ईमेल
                                </span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={formData.declaration.email}
                                onChange={(e) =>
                                    handleInputChange("email", e.target.value)
                                }
                                className="input-gov"
                                placeholder="Enter email address"
                            />
                        </div>

                        <div className="form-group">
                            <label
                                htmlFor="date"
                                className="form-label required"
                            >
                                Date
                                <span className="font-hindi text-sm ml-2">
                                    दिनांक
                                </span>
                            </label>
                            <input
                                type="date"
                                id="date"
                                value={formData.declaration.date}
                                onChange={(e) =>
                                    handleInputChange("date", e.target.value)
                                }
                                className={`input-gov ${
                                    validationErrors.date
                                        ? "border-red-500"
                                        : ""
                                }`}
                                aria-describedby={
                                    validationErrors.date
                                        ? "date-error"
                                        : undefined
                                }
                            />
                            {validationErrors.date && (
                                <p
                                    id="date-error"
                                    className="text-red-600 text-sm mt-1 flex items-center"
                                >
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {validationErrors.date}
                                </p>
                            )}
                        </div>

                        <div className="form-group">
                            <label
                                htmlFor="place"
                                className="form-label required"
                            >
                                Place
                                <span className="font-hindi text-sm ml-2">
                                    स्थान
                                </span>
                            </label>
                            <input
                                type="text"
                                id="place"
                                value={formData.declaration.place}
                                onChange={(e) =>
                                    handleInputChange("place", e.target.value)
                                }
                                className={`input-gov ${
                                    validationErrors.place
                                        ? "border-red-500"
                                        : ""
                                }`}
                                placeholder="Enter place (e.g., New Delhi)"
                                aria-describedby={
                                    validationErrors.place
                                        ? "place-error"
                                        : undefined
                                }
                            />
                            {validationErrors.place && (
                                <p
                                    id="place-error"
                                    className="text-red-600 text-sm mt-1 flex items-center"
                                >
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {validationErrors.place}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Official Use Section */}
                    <div className="bg-gray-100 p-6 rounded-lg border-2 border-gray-300">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Space for Official Use Only
                            <span className="font-hindi text-sm ml-2">
                                केवल कार्यालयी प्रयोग हेतु
                            </span>
                        </h3>
                        <p className="text-sm text-gray-600">
                            This section will be filled by the medical centre
                            administration during processing.
                        </p>
                    </div>

                    {/* Form Navigation */}
                    <div className="flex justify-between pt-6 mt-8 border-t border-gov-neutral-200">
                        <button
                            type="button"
                            className="btn-gov-secondary"
                            onClick={onPrevious}
                        >
                            Previous: Document Upload
                        </button>
                        <button
                            type="submit"
                            className="btn-gov-primary bg-gov-secondary-600 hover:bg-gov-secondary-700"
                            disabled={!formData.declaration.agreed}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Submit Application
                        </button>
                    </div>
                </form>
            </div>

            {/* Final Instructions */}
            <div className="card-gov bg-gov-secondary-50 border-gov-secondary-200">
                <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gov-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-gov-secondary-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gov-secondary-800 mb-2">
                            Ready to Submit
                        </h3>
                        <p className="text-gov-secondary-700 text-sm mb-3">
                            Please review all information before final
                            submission. Once submitted, you will receive a
                            confirmation with your application reference number.
                        </p>
                        <ul className="text-gov-secondary-700 space-y-1 text-sm">
                            <li>
                                • You will receive an email confirmation within
                                24 hours
                            </li>
                            <li>
                                • Processing typically takes 7-14 working days
                            </li>
                            <li>
                                • Track your application status using the
                                reference number
                            </li>
                            <li>
                                • Contact support for any queries or updates
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeclarationStep;
