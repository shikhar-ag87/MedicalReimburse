import React from "react";
import { Receipt, Plus, Trash2, AlertCircle } from "lucide-react";
import { StepProps, ExpenseItem } from "../../types/form";

const ExpenseDetailsStep: React.FC<StepProps> = ({
    formData,
    updateFormData,
    validationErrors,
    onNext,
    onPrevious,
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext();
    };

    const addExpenseItem = () => {
        const newExpense: ExpenseItem = {
            id: Date.now().toString(),
            billNumber: "",
            billDate: "",
            description: "",
            amountClaimed: 0,
            amountPassed: 0,
        };
        updateFormData("expenses", [...formData.expenses, newExpense]);
    };

    const updateExpenseItem = (
        index: number,
        field: keyof ExpenseItem,
        value: any
    ) => {
        const updatedExpenses = formData.expenses.map((expense, i) =>
            i === index ? { ...expense, [field]: value } : expense
        );
        updateFormData("expenses", updatedExpenses);
    };

    const removeExpenseItem = (index: number) => {
        const updatedExpenses = formData.expenses.filter((_, i) => i !== index);
        updateFormData("expenses", updatedExpenses);
    };

    const calculateTotalClaimed = () => {
        return formData.expenses.reduce(
            (total, expense) => total + (expense.amountClaimed || 0),
            0
        );
    };

    const calculateTotalPassed = () => {
        return formData.expenses.reduce(
            (total, expense) => total + (expense.amountPassed || 0),
            0
        );
    };

    return (
        <div className="space-y-6">
            <div className="card-gov">
                <div className="card-gov-header">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gov-primary-100 rounded-full flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-gov-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gov-primary-800">
                                Expense Details
                            </h2>
                            <p className="text-gov-neutral-600 font-hindi">
                                व्यय विवरण - चिकित्सा दावा बिलों का विवरण
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Expense Items Table */}
                    <div className="overflow-x-auto">
                        <div className="min-w-full">
                            <div className="bg-gov-neutral-50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-gov-neutral-800 mb-4">
                                    Particulars of Medical Claim Bills
                                    <span className="font-hindi text-sm ml-2">
                                        चिकित्सा दावा बिलों का विवरण
                                    </span>
                                </h3>

                                {formData.expenses.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Receipt className="w-12 h-12 text-gov-neutral-400 mx-auto mb-4" />
                                        <p className="text-gov-neutral-600">
                                            No expense items added yet
                                        </p>
                                        <button
                                            type="button"
                                            onClick={addExpenseItem}
                                            className="btn-gov-primary mt-4"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add First Expense Item
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 gap-2 text-sm font-semibold text-gov-neutral-700 border-b border-gov-neutral-200 pb-2">
                                            <div className="col-span-2">
                                                S.No.
                                            </div>
                                            <div className="col-span-2">
                                                Bill No.
                                            </div>
                                            <div className="col-span-2">
                                                Date
                                            </div>
                                            <div className="col-span-3">
                                                Description
                                            </div>
                                            <div className="col-span-2">
                                                Amount Claimed (₹)
                                            </div>
                                            <div className="col-span-1">
                                                Actions
                                            </div>
                                        </div>

                                        {/* Expense Items */}
                                        {formData.expenses.map(
                                            (expense, index) => (
                                                <div
                                                    key={expense.id}
                                                    className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gov-neutral-100"
                                                >
                                                    <div className="col-span-2 text-gov-neutral-700 font-medium">
                                                        {index + 1}.
                                                    </div>

                                                    <div className="col-span-2">
                                                        <input
                                                            type="text"
                                                            value={
                                                                expense.billNumber
                                                            }
                                                            onChange={(e) =>
                                                                updateExpenseItem(
                                                                    index,
                                                                    "billNumber",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className={`input-gov text-sm ${
                                                                validationErrors[
                                                                    `expense_${index}_billNumber`
                                                                ]
                                                                    ? "border-red-500"
                                                                    : ""
                                                            }`}
                                                            placeholder="Bill number"
                                                        />
                                                        {validationErrors[
                                                            `expense_${index}_billNumber`
                                                        ] && (
                                                            <p className="text-red-600 text-xs mt-1">
                                                                {
                                                                    validationErrors[
                                                                        `expense_${index}_billNumber`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="col-span-2">
                                                        <input
                                                            type="date"
                                                            value={
                                                                expense.billDate
                                                            }
                                                            onChange={(e) =>
                                                                updateExpenseItem(
                                                                    index,
                                                                    "billDate",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className={`input-gov text-sm ${
                                                                validationErrors[
                                                                    `expense_${index}_billDate`
                                                                ]
                                                                    ? "border-red-500"
                                                                    : ""
                                                            }`}
                                                        />
                                                        {validationErrors[
                                                            `expense_${index}_billDate`
                                                        ] && (
                                                            <p className="text-red-600 text-xs mt-1">
                                                                {
                                                                    validationErrors[
                                                                        `expense_${index}_billDate`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="col-span-3">
                                                        <input
                                                            type="text"
                                                            value={
                                                                expense.description
                                                            }
                                                            onChange={(e) =>
                                                                updateExpenseItem(
                                                                    index,
                                                                    "description",
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            className={`input-gov text-sm ${
                                                                validationErrors[
                                                                    `expense_${index}_description`
                                                                ]
                                                                    ? "border-red-500"
                                                                    : ""
                                                            }`}
                                                            placeholder="Description of treatment/service"
                                                        />
                                                        {validationErrors[
                                                            `expense_${index}_description`
                                                        ] && (
                                                            <p className="text-red-600 text-xs mt-1">
                                                                {
                                                                    validationErrors[
                                                                        `expense_${index}_description`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="col-span-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={
                                                                expense.amountClaimed === 0 ? "" : expense.amountClaimed
                                                            }
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                const numValue = value === "" ? 0 : parseFloat(value);
                                                                updateExpenseItem(
                                                                    index,
                                                                    "amountClaimed",
                                                                    isNaN(numValue) ? 0 : numValue
                                                                );
                                                            }}
                                                            className={`input-gov text-sm ${
                                                                validationErrors[
                                                                    `expense_${index}_amountClaimed`
                                                                ]
                                                                    ? "border-red-500"
                                                                    : ""
                                                            }`}
                                                            placeholder="0.00"
                                                            required
                                                        />
                                                        {validationErrors[
                                                            `expense_${index}_amountClaimed`
                                                        ] && (
                                                            <p className="text-red-600 text-xs mt-1">
                                                                {
                                                                    validationErrors[
                                                                        `expense_${index}_amountClaimed`
                                                                    ]
                                                                }
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="col-span-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeExpenseItem(
                                                                    index
                                                                )
                                                            }
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Remove this expense item"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        )}

                                        {/* Totals Row */}
                                        <div className="grid grid-cols-12 gap-2 items-center pt-4 border-t-2 border-gov-neutral-300 bg-gov-neutral-50 -mx-4 px-4 pb-2 font-semibold text-gov-neutral-800">
                                            <div className="col-span-7 text-right">
                                                Total / कुल रुपये:
                                            </div>
                                            <div className="col-span-2 text-lg">
                                                ₹{" "}
                                                {calculateTotalClaimed().toFixed(
                                                    2
                                                )}
                                            </div>
                                            <div className="col-span-3"></div>
                                        </div>

                                        {/* Add New Item Button */}
                                        <div className="pt-4">
                                            <button
                                                type="button"
                                                onClick={addExpenseItem}
                                                className="btn-gov-secondary text-sm"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Another Expense Item
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {validationErrors.expenses && (
                                    <p className="text-red-600 text-sm mt-4 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {validationErrors.expenses}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div className="bg-gov-neutral-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gov-neutral-800 mb-4">
                            Bank Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label
                                    htmlFor="bankName"
                                    className="form-label"
                                >
                                    Name of Bank
                                    <span className="font-hindi text-sm ml-2">
                                        बैंक का नाम
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    id="bankName"
                                    value={formData.bankDetails.bankName}
                                    onChange={(e) =>
                                        updateFormData("bankDetails", {
                                            ...formData.bankDetails,
                                            bankName: e.target.value,
                                        })
                                    }
                                    className="input-gov"
                                    placeholder="Enter bank name"
                                />
                            </div>

                            <div className="form-group">
                                <label
                                    htmlFor="branchAddress"
                                    className="form-label"
                                >
                                    Address of Branch (other than SBI)
                                    <span className="font-hindi text-sm ml-2">
                                        शाखा का पता
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    id="branchAddress"
                                    value={formData.bankDetails.branchAddress}
                                    onChange={(e) =>
                                        updateFormData("bankDetails", {
                                            ...formData.bankDetails,
                                            branchAddress: e.target.value,
                                        })
                                    }
                                    className="input-gov"
                                    placeholder="Enter branch address"
                                />
                            </div>

                            <div className="form-group">
                                <label
                                    htmlFor="accountNumber"
                                    className="form-label"
                                >
                                    SB A/c Number
                                    <span className="font-hindi text-sm ml-2">
                                        खाता संख्या
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    id="accountNumber"
                                    value={formData.bankDetails.accountNumber}
                                    onChange={(e) =>
                                        updateFormData("bankDetails", {
                                            ...formData.bankDetails,
                                            accountNumber: e.target.value,
                                        })
                                    }
                                    className="input-gov"
                                    placeholder="Enter account number"
                                />
                            </div>

                            <div className="form-group">
                                <label
                                    htmlFor="ifscCode"
                                    className="form-label"
                                >
                                    IFSC Code (other than SBI)
                                    <span className="font-hindi text-sm ml-2">
                                        IFSC कोड
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    id="ifscCode"
                                    value={formData.bankDetails.ifscCode}
                                    onChange={(e) =>
                                        updateFormData("bankDetails", {
                                            ...formData.bankDetails,
                                            ifscCode:
                                                e.target.value.toUpperCase(),
                                        })
                                    }
                                    className="input-gov"
                                    placeholder="Enter IFSC code"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Navigation */}
                    <div className="flex justify-between pt-6 mt-8 border-t border-gov-neutral-200">
                        <button
                            type="button"
                            className="btn-gov-secondary"
                            onClick={onPrevious}
                        >
                            Previous: Treatment Details
                        </button>
                        <button
                            type="submit"
                            className="btn-gov-primary"
                            disabled={formData.expenses.length === 0}
                        >
                            Next: Document Upload
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
                            Expense Guidelines
                        </h3>
                        <ul className="text-gov-neutral-600 space-y-2 text-sm">
                            <li>
                                • Add all medical bills and expenses separately
                                with accurate details
                            </li>
                            <li>
                                • Bill numbers and dates must match with
                                original bills
                            </li>
                            <li>
                                • Provide clear description for each expense
                                item
                            </li>
                            <li>
                                • Bank details are required for direct
                                reimbursement transfer
                            </li>
                            <li>
                                • Attach additional sheet if more items need to
                                be added
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseDetailsStep;
