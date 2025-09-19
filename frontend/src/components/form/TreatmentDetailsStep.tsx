import React from "react";
import { Stethoscope, AlertCircle, MapPin } from "lucide-react";
import { StepProps, TreatmentData } from "../../types/form";

const TreatmentDetailsStep: React.FC<StepProps> = ({
    formData,
    updateFormData,
    validationErrors,
    onNext,
    onPrevious,
}) => {
    const handleInputChange = (
        field: keyof TreatmentData,
        value: string | boolean
    ) => {
        updateFormData("treatment", {
            ...formData.treatment,
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
                            <Stethoscope className="w-5 h-5 text-gov-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gov-primary-800">
                                Treatment Details
                            </h2>
                            <p className="text-gov-neutral-600 font-hindi">
                                उपचार विवरण
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Hospital/Diagnostic Centre Name */}
                    <div className="form-group">
                        <label
                            htmlFor="hospitalName"
                            className="form-label required"
                        >
                            Name & Address of the Hospital/Diagnostic
                            Centre/Imaging Centre, etc. where Treatment has
                            taken or Investigations done
                            <span className="font-hindi text-sm ml-2">
                                अस्पताल/डायग्नोस्टिक सेंटर का नाम और पता
                            </span>
                        </label>
                        <input
                            type="text"
                            id="hospitalName"
                            name="hospitalName"
                            value={formData.treatment.hospitalName}
                            onChange={(e) =>
                                handleInputChange(
                                    "hospitalName",
                                    e.target.value
                                )
                            }
                            className={`input-gov ${
                                validationErrors.hospitalName
                                    ? "border-red-500"
                                    : ""
                            }`}
                            placeholder="Enter hospital/diagnostic centre name"
                            aria-describedby={
                                validationErrors.hospitalName
                                    ? "hospitalName-error"
                                    : undefined
                            }
                        />
                        {validationErrors.hospitalName && (
                            <p
                                id="hospitalName-error"
                                className="text-red-600 text-sm mt-1 flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.hospitalName}
                            </p>
                        )}
                    </div>

                    {/* Hospital Address */}
                    <div className="form-group">
                        <label
                            htmlFor="hospitalAddress"
                            className="form-label required"
                        >
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Complete Address of Hospital/Diagnostic Centre
                            <span className="font-hindi text-sm ml-2">
                                पूरा पता
                            </span>
                        </label>
                        <textarea
                            id="hospitalAddress"
                            name="hospitalAddress"
                            rows={3}
                            value={formData.treatment.hospitalAddress}
                            onChange={(e) =>
                                handleInputChange(
                                    "hospitalAddress",
                                    e.target.value
                                )
                            }
                            className={`input-gov ${
                                validationErrors.hospitalAddress
                                    ? "border-red-500"
                                    : ""
                            }`}
                            placeholder="Enter complete address with city and state"
                            aria-describedby={
                                validationErrors.hospitalAddress
                                    ? "hospitalAddress-error"
                                    : undefined
                            }
                        />
                        {validationErrors.hospitalAddress && (
                            <p
                                id="hospitalAddress-error"
                                className="text-red-600 text-sm mt-1 flex items-center"
                            >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                {validationErrors.hospitalAddress}
                            </p>
                        )}
                    </div>

                    {/* Treatment Type */}
                    <div className="form-group">
                        <label className="form-label required">
                            Type of Treatment
                            <span className="font-hindi text-sm ml-2">
                                उपचार का प्रकार
                            </span>
                        </label>
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="treatmentTypeOPD"
                                    name="treatmentType"
                                    value="opd"
                                    checked={
                                        formData.treatment.treatmentType ===
                                        "opd"
                                    }
                                    onChange={(e) =>
                                        handleInputChange(
                                            "treatmentType",
                                            e.target.value
                                        )
                                    }
                                    className="w-4 h-4 text-gov-primary-600 border-gray-300 focus:ring-gov-primary-500"
                                />
                                <label
                                    htmlFor="treatmentTypeOPD"
                                    className="ml-2 text-gov-neutral-700"
                                >
                                    OPD Treatment{" "}
                                    <span className="font-hindi">
                                        (बाह्य रोगी उपचार)
                                    </span>
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="treatmentTypeInpatient"
                                    name="treatmentType"
                                    value="inpatient"
                                    checked={
                                        formData.treatment.treatmentType ===
                                        "inpatient"
                                    }
                                    onChange={(e) =>
                                        handleInputChange(
                                            "treatmentType",
                                            e.target.value
                                        )
                                    }
                                    className="w-4 h-4 text-gov-primary-600 border-gray-300 focus:ring-gov-primary-500"
                                />
                                <label
                                    htmlFor="treatmentTypeInpatient"
                                    className="ml-2 text-gov-neutral-700"
                                >
                                    In-patient Treatment{" "}
                                    <span className="font-hindi">
                                        (भर्ती रोगी उपचार)
                                    </span>
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    id="treatmentTypeEmergency"
                                    name="treatmentType"
                                    value="emergency"
                                    checked={
                                        formData.treatment.treatmentType ===
                                        "emergency"
                                    }
                                    onChange={(e) =>
                                        handleInputChange(
                                            "treatmentType",
                                            e.target.value
                                        )
                                    }
                                    className="w-4 h-4 text-gov-primary-600 border-gray-300 focus:ring-gov-primary-500"
                                />
                                <label
                                    htmlFor="treatmentTypeEmergency"
                                    className="ml-2 text-gov-neutral-700"
                                >
                                    Emergency Treatment{" "}
                                    <span className="font-hindi">
                                        (आपातकालीन उपचार)
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Clothes Provided */}
                    <div className="form-group">
                        <div className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                id="clothesProvided"
                                name="clothesProvided"
                                checked={formData.treatment.clothesProvided}
                                onChange={(e) =>
                                    handleInputChange(
                                        "clothesProvided",
                                        e.target.checked
                                    )
                                }
                                className="w-4 h-4 text-gov-primary-600 border-gray-300 focus:ring-gov-primary-500 mt-0.5"
                            />
                            <div>
                                <label
                                    htmlFor="clothesProvided"
                                    className="form-label"
                                >
                                    Whether Clothes have been provided or not
                                    (Yes/No)
                                    <span className="font-hindi text-sm ml-2">
                                        क्या कपड़े उपलब्ध कराए गए हैं
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Prior Permission */}
                    <div className="form-group">
                        <div className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                id="priorPermission"
                                name="priorPermission"
                                checked={formData.treatment.priorPermission}
                                onChange={(e) =>
                                    handleInputChange(
                                        "priorPermission",
                                        e.target.checked
                                    )
                                }
                                className="w-4 h-4 text-gov-primary-600 border-gray-300 focus:ring-gov-primary-500 mt-0.5"
                            />
                            <div>
                                <label
                                    htmlFor="priorPermission"
                                    className="form-label"
                                >
                                    Whether prior Permission/Referral was taken
                                    for the treatment
                                    <span className="font-hindi text-sm ml-2">
                                        क्या पूर्व अनुमति/रेफरल लिया गया था
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Permission Details */}
                    {formData.treatment.priorPermission && (
                        <div className="form-group">
                            <label
                                htmlFor="permissionDetails"
                                className="form-label"
                            >
                                Copy of Permission/Referral letter dated
                                <span className="font-hindi text-sm ml-2">
                                    अनुमति पत्र की प्रति दिनांक
                                </span>
                            </label>
                            <input
                                type="text"
                                id="permissionDetails"
                                name="permissionDetails"
                                value={formData.treatment.permissionDetails}
                                onChange={(e) =>
                                    handleInputChange(
                                        "permissionDetails",
                                        e.target.value
                                    )
                                }
                                className="input-gov"
                                placeholder="Enter permission/referral details and date"
                            />
                        </div>
                    )}

                    {/* Emergency Treatment */}
                    <div className="form-group">
                        <div className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                id="emergencyTreatment"
                                name="emergencyTreatment"
                                checked={formData.treatment.emergencyTreatment}
                                onChange={(e) =>
                                    handleInputChange(
                                        "emergencyTreatment",
                                        e.target.checked
                                    )
                                }
                                className="w-4 h-4 text-gov-primary-600 border-gray-300 focus:ring-gov-primary-500 mt-0.5"
                            />
                            <div>
                                <label
                                    htmlFor="emergencyTreatment"
                                    className="form-label"
                                >
                                    Whether treatment was taken in Emergency, if
                                    yes, attach Copy of Emergency Certificate
                                    dated
                                    <span className="font-hindi text-sm ml-2">
                                        क्या आपातकालीन उपचार लिया गया था
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Details */}
                    {formData.treatment.emergencyTreatment && (
                        <div className="form-group">
                            <label
                                htmlFor="emergencyDetails"
                                className="form-label"
                            >
                                Emergency Certificate Details and Date
                                <span className="font-hindi text-sm ml-2">
                                    आपातकालीन प्रमाण पत्र विवरण
                                </span>
                            </label>
                            <input
                                type="text"
                                id="emergencyDetails"
                                name="emergencyDetails"
                                value={formData.treatment.emergencyDetails}
                                onChange={(e) =>
                                    handleInputChange(
                                        "emergencyDetails",
                                        e.target.value
                                    )
                                }
                                className="input-gov"
                                placeholder="Enter emergency certificate details and date"
                            />
                        </div>
                    )}

                    {/* Health Insurance */}
                    <div className="form-group">
                        <div className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                id="healthInsurance"
                                name="healthInsurance"
                                checked={formData.treatment.healthInsurance}
                                onChange={(e) =>
                                    handleInputChange(
                                        "healthInsurance",
                                        e.target.checked
                                    )
                                }
                                className="w-4 h-4 text-gov-primary-600 border-gray-300 focus:ring-gov-primary-500 mt-0.5"
                            />
                            <div>
                                <label
                                    htmlFor="healthInsurance"
                                    className="form-label"
                                >
                                    Whether subscribing to any health/medical
                                    insurance Scheme, if yes, amount
                                    claimed/received
                                    <span className="font-hindi text-sm ml-2">
                                        क्या कोई स्वास्थ्य बीमा योजना में शामिल
                                        हैं
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Insurance Amount */}
                    {formData.treatment.healthInsurance && (
                        <div className="form-group">
                            <label
                                htmlFor="insuranceAmount"
                                className="form-label"
                            >
                                Amount Claimed/Received from Insurance (₹)
                                <span className="font-hindi text-sm ml-2">
                                    बीमा से प्राप्त राशि
                                </span>
                            </label>
                            <input
                                type="number"
                                id="insuranceAmount"
                                name="insuranceAmount"
                                step="0.01"
                                min="0"
                                value={formData.treatment.insuranceAmount}
                                onChange={(e) =>
                                    handleInputChange(
                                        "insuranceAmount",
                                        e.target.value
                                    )
                                }
                                className="input-gov"
                                placeholder="Enter insurance amount received"
                            />
                        </div>
                    )}

                    {/* Form Navigation */}
                    <div className="flex justify-between pt-6 mt-8 border-t border-gov-neutral-200">
                        <button
                            type="button"
                            className="btn-gov-secondary"
                            onClick={onPrevious}
                        >
                            Previous: Patient Details
                        </button>
                        <button type="submit" className="btn-gov-primary">
                            Next: Expense Details
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
                            Treatment Information Guidelines
                        </h3>
                        <ul className="text-gov-neutral-600 space-y-2 text-sm">
                            <li>
                                • Provide complete hospital/clinic information
                                including full address
                            </li>
                            <li>
                                • For emergency treatments, emergency
                                certificate is mandatory
                            </li>
                            <li>
                                • Prior referral/permission may be required for
                                certain treatments
                            </li>
                            <li>
                                • Declare any insurance claims to avoid
                                duplicate reimbursements
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TreatmentDetailsStep;
