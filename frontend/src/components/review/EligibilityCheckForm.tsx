import { useEffect, useState } from "react";
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    Calendar,
    User,
} from "lucide-react";

interface EligibilityCheckFormProps {
    onSubmit: (data: EligibilityCheckData) => void;
    onCancel: () => void;
    loading?: boolean;
    defaults?: Partial<EligibilityCheckData>;
}

export interface EligibilityCheckData {
    isScStObcVerified: boolean;
    categoryProofValid: boolean;
    employeeIdVerified: boolean;
    medicalCardValid: boolean;
    relationshipVerified: boolean;
    hasPendingClaims: boolean;
    isWithinLimits: boolean;
    isTreatmentCovered: boolean;
    priorPermissionStatus: "required" | "obtained" | "not_required" | "pending";
    eligibilityStatus: "eligible" | "not_eligible" | "conditional";
    ineligibilityReasons: string[];
    conditions: string[];
    notes: string;
}

const EligibilityCheckForm: React.FC<EligibilityCheckFormProps> = ({
    onSubmit,
    onCancel,
    loading,
    defaults,
}) => {
    const [formData, setFormData] = useState<EligibilityCheckData>({
        isScStObcVerified: false,
        categoryProofValid: false,
        employeeIdVerified: false,
        medicalCardValid: false,
        relationshipVerified: false,
        hasPendingClaims: false,
        isWithinLimits: true,
        isTreatmentCovered: true,
        priorPermissionStatus: "not_required",
        eligibilityStatus: "eligible",
        ineligibilityReasons: [],
        conditions: [],
        notes: "",
    });

    useEffect(() => {
        if (defaults) {
            setFormData((prev) => ({
                ...prev,
                ...defaults,
            }));
        }
        // rerun when defaults object identity changes
    }, [defaults]);

    const [newReason, setNewReason] = useState("");
    const [newCondition, setNewCondition] = useState("");

    const handleCheckboxChange = (
        field: keyof EligibilityCheckData,
        value: boolean
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Auto-update eligibility status based on critical fields
        if (
            !value &&
            [
                "isScStObcVerified",
                "categoryProofValid",
                "employeeIdVerified",
            ].includes(field)
        ) {
            setFormData((prev) => ({
                ...prev,
                eligibilityStatus: "not_eligible",
            }));
        }
    };

    const addReason = () => {
        if (newReason.trim()) {
            setFormData((prev) => ({
                ...prev,
                ineligibilityReasons: [
                    ...prev.ineligibilityReasons,
                    newReason.trim(),
                ],
            }));
            setNewReason("");
        }
    };

    const removeReason = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            ineligibilityReasons: prev.ineligibilityReasons.filter(
                (_, i) => i !== index
            ),
        }));
    };

    const addCondition = () => {
        if (newCondition.trim()) {
            setFormData((prev) => ({
                ...prev,
                conditions: [...prev.conditions, newCondition.trim()],
            }));
            setNewCondition("");
        }
    };

    const removeCondition = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            conditions: prev.conditions.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Verification */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Category Verification
                </h3>
                <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isScStObcVerified}
                            onChange={(e) =>
                                handleCheckboxChange(
                                    "isScStObcVerified",
                                    e.target.checked
                                )
                            }
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                            SC/ST/OBC Category Verified
                        </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.categoryProofValid}
                            onChange={(e) =>
                                handleCheckboxChange(
                                    "categoryProofValid",
                                    e.target.checked
                                )
                            }
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                            Category Certificate Valid
                        </span>
                    </label>
                </div>
            </div>

            {/* Employee Verification */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Employee Verification
                </h3>
                <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.employeeIdVerified}
                            onChange={(e) =>
                                handleCheckboxChange(
                                    "employeeIdVerified",
                                    e.target.checked
                                )
                            }
                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                            Employee ID Verified
                        </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.medicalCardValid}
                            onChange={(e) =>
                                handleCheckboxChange(
                                    "medicalCardValid",
                                    e.target.checked
                                )
                            }
                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                            Medical Card Valid
                        </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.relationshipVerified}
                            onChange={(e) =>
                                handleCheckboxChange(
                                    "relationshipVerified",
                                    e.target.checked
                                )
                            }
                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                            Relationship Verified (for dependents)
                        </span>
                    </label>
                </div>
            </div>

            {/* Policy Compliance */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Policy Compliance
                </h3>
                <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!formData.hasPendingClaims}
                            onChange={(e) =>
                                handleCheckboxChange(
                                    "hasPendingClaims",
                                    !e.target.checked
                                )
                            }
                            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">No Pending Claims</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isWithinLimits}
                            onChange={(e) =>
                                handleCheckboxChange(
                                    "isWithinLimits",
                                    e.target.checked
                                )
                            }
                            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                            Within Annual/Treatment Limits
                        </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isTreatmentCovered}
                            onChange={(e) =>
                                handleCheckboxChange(
                                    "isTreatmentCovered",
                                    e.target.checked
                                )
                            }
                            className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">
                            Treatment Covered Under Policy
                        </span>
                    </label>
                </div>
            </div>

            {/* Prior Permission */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                    Prior Permission Status
                </h3>
                <div className="space-y-2">
                    {["required", "obtained", "not_required", "pending"].map(
                        (status) => (
                            <label
                                key={status}
                                className="flex items-center space-x-3 cursor-pointer"
                            >
                                <input
                                    type="radio"
                                    name="priorPermission"
                                    value={status}
                                    checked={
                                        formData.priorPermissionStatus ===
                                        status
                                    }
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            priorPermissionStatus: e.target
                                                .value as any,
                                        }))
                                    }
                                    className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                                />
                                <span className="text-gray-700 capitalize">
                                    {status.replace("_", " ")}
                                </span>
                            </label>
                        )
                    )}
                </div>
            </div>

            {/* Eligibility Decision */}
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Eligibility Decision
                </h3>
                <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="radio"
                            name="eligibility"
                            value="eligible"
                            checked={formData.eligibilityStatus === "eligible"}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    eligibilityStatus: e.target.value as any,
                                }))
                            }
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-gray-700 font-medium">
                            Eligible
                        </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="radio"
                            name="eligibility"
                            value="not_eligible"
                            checked={
                                formData.eligibilityStatus === "not_eligible"
                            }
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    eligibilityStatus: e.target.value as any,
                                }))
                            }
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-gray-700 font-medium">
                            Not Eligible
                        </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                            type="radio"
                            name="eligibility"
                            value="conditional"
                            checked={
                                formData.eligibilityStatus === "conditional"
                            }
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    eligibilityStatus: e.target.value as any,
                                }))
                            }
                            className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                        />
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-gray-700 font-medium">
                            Conditional
                        </span>
                    </label>
                </div>
            </div>

            {/* Ineligibility Reasons */}
            {formData.eligibilityStatus === "not_eligible" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-900 mb-3">
                        Ineligibility Reasons
                    </h3>
                    <div className="space-y-2 mb-3">
                        {formData.ineligibilityReasons.map((reason, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between bg-white p-2 rounded border border-red-200"
                            >
                                <span className="text-sm text-gray-700">
                                    {reason}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeReason(index)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newReason}
                            onChange={(e) => setNewReason(e.target.value)}
                            placeholder="Add reason..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button
                            type="button"
                            onClick={addReason}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}

            {/* Conditions */}
            {formData.eligibilityStatus === "conditional" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-3">
                        Conditions
                    </h3>
                    <div className="space-y-2 mb-3">
                        {formData.conditions.map((condition, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between bg-white p-2 rounded border border-yellow-200"
                            >
                                <span className="text-sm text-gray-700">
                                    {condition}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeCondition(index)}
                                    className="text-yellow-600 hover:text-yellow-800"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newCondition}
                            onChange={(e) => setNewCondition(e.target.value)}
                            placeholder="Add condition..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                        <button
                            type="button"
                            onClick={addCondition}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                </label>
                <textarea
                    value={formData.notes}
                    onChange={(e) =>
                        setFormData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                        }))
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any additional observations or notes..."
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Submitting...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Submit Eligibility Check</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default EligibilityCheckForm;
