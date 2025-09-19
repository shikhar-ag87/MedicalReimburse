import { FormData, ValidationErrors } from "../types/form";

export const validateStep = (
    step: number,
    formData: FormData
): ValidationErrors => {
    const errors: ValidationErrors = {};

    switch (step) {
        case 1: // Employee Details
            if (!formData.employee.facultyEmployeeName?.trim()) {
                errors.facultyEmployeeName =
                    "Faculty/Employee name is required";
            }
            if (!formData.employee.designation?.trim()) {
                errors.designation = "Designation is required";
            }
            if (!formData.employee.schoolCentreDepartment?.trim()) {
                errors.schoolCentreDepartment =
                    "School/Centre/Department is required";
            }
            if (!formData.employee.cghsCardNumber?.trim()) {
                errors.cghsCardNumber = "CGHS Card Number is required";
            }
            if (!formData.employee.cghsDispensary?.trim()) {
                errors.cghsDispensary = "CGHS Dispensary is required";
            }
            break;

        case 2: // Patient Details
            if (!formData.patient.patientName?.trim()) {
                errors.patientName = "Patient name is required";
            }
            if (!formData.patient.relationshipWithEmployee?.trim()) {
                errors.relationshipWithEmployee =
                    "Relationship with employee is required";
            }
            break;

        case 3: // Treatment Details
            if (!formData.treatment.hospitalName?.trim()) {
                errors.hospitalName =
                    "Hospital/Diagnostic Centre name is required";
            }
            if (!formData.treatment.hospitalAddress?.trim()) {
                errors.hospitalAddress = "Hospital address is required";
            }
            break;

        case 4: // Expense Details
            if (formData.expenses.length === 0) {
                errors.expenses = "At least one expense entry is required";
            } else {
                formData.expenses.forEach((expense, index) => {
                    if (!expense.billNumber?.trim()) {
                        errors[`expense_${index}_billNumber`] =
                            "Bill number is required";
                    }
                    if (!expense.billDate) {
                        errors[`expense_${index}_billDate`] =
                            "Bill date is required";
                    }
                    if (!expense.description?.trim()) {
                        errors[`expense_${index}_description`] =
                            "Description is required";
                    }
                    if (!expense.amountClaimed || expense.amountClaimed <= 0) {
                        errors[`expense_${index}_amountClaimed`] =
                            "Amount claimed must be greater than 0";
                    }
                });
            }
            break;

        case 5: // Document Upload
            if (!formData.documents.photocopyCGHSCard) {
                errors.photocopyCGHSCard = "Photocopy of CGHS Card is required";
            }
            if (!formData.documents.originalBills) {
                errors.originalBills = "Original bills are required";
            }
            break;

        case 6: // Declaration
            if (!formData.declaration.agreed) {
                errors.agreed = "You must agree to the declaration";
            }
            if (!formData.declaration.signature?.trim()) {
                errors.signature = "Signature is required";
            }
            if (!formData.declaration.place?.trim()) {
                errors.place = "Place is required";
            }
            if (!formData.declaration.date) {
                errors.date = "Date is required";
            }
            break;
    }

    return errors;
};

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validateMobile = (mobile: string): boolean => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
};

export const validateIFSC = (ifsc: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc);
};

export const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, "");
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
    }).format(amount);
};

export const calculateTotalExpenses = (expenses: any[]): number => {
    return expenses.reduce(
        (total, expense) => total + (expense.amountClaimed || 0),
        0
    );
};
