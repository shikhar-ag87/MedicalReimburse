// API service for medical reimbursement applications
import { apiService } from "./api";
import type { FormData } from "../types/form";

export interface ApplicationSubmissionResponse {
    applicationId: string;
    applicationNumber: string;
    status: string;
    submittedAt: string;
}

export interface Application {
    id: string;
    applicationNumber: string;
    status: "pending" | "under_review" | "approved" | "rejected" | "completed";
    submittedAt: string;
    updatedAt: string;
    employeeName: string;
    employeeId: string;
    patientName: string;
    totalAmountClaimed: number;
    totalAmountPassed: number;
}

export interface ApplicationDetails extends Application {
    // Full application details matching the database schema
    designation: string;
    department: string;
    cghsCardNumber: string;
    cghsDispensary: string;
    cardValidity: string;
    wardEntitlement: string;
    patientCghsCard: string;
    relationshipWithEmployee: string;
    hospitalName: string;
    hospitalAddress: string;
    treatmentType: "opd" | "inpatient" | "emergency";
    clothesProvided: boolean;
    priorPermission: boolean;
    permissionDetails?: string;
    emergencyTreatment: boolean;
    emergencyDetails?: string;
    healthInsurance: boolean;
    insuranceAmount?: string;
    bankName: string;
    branchAddress: string;
    accountNumber: string;
    ifscCode: string;
    enclosuresCount: number;
    photocopyCGHSCard: boolean;
    photocopiesOriginalPrescriptions: boolean;
    originalBills: boolean;
    signature: string;
    declarationPlace: string;
    declarationDate: string;
    facultyEmployeeId: string;
    mobileNumber: string;
    email: string;
    reviewComments?: string;
}

class ApplicationService {
    /**
     * Submit a new medical reimbursement application
     */
    async submitApplication(
        formData: FormData
    ): Promise<ApplicationSubmissionResponse> {
        // Transform frontend FormData to backend format
        const applicationData = {
            // Employee details
            employeeName: formData.employee.facultyEmployeeName,
            employeeId: formData.declaration.facultyEmployeeId,
            designation: formData.employee.designation,
            department: formData.employee.schoolCentreDepartment,
            cghsCardNumber: formData.employee.cghsCardNumber,
            cghsDispensary: formData.employee.cghsDispensary,
            cardValidity: formData.employee.cardValidity,
            wardEntitlement: formData.employee.wardEntitlement,

            // Patient details
            patientName: formData.patient.patientName,
            patientCghsCard: formData.patient.cghsCardNumber,
            relationshipWithEmployee: formData.patient.relationshipWithEmployee,

            // Treatment details
            hospitalName: formData.treatment.hospitalName,
            hospitalAddress: formData.treatment.hospitalAddress,
            treatmentType: formData.treatment.treatmentType,
            clothesProvided: formData.treatment.clothesProvided,
            priorPermission: formData.treatment.priorPermission,
            permissionDetails: formData.treatment.permissionDetails,
            emergencyTreatment: formData.treatment.emergencyTreatment,
            emergencyDetails: formData.treatment.emergencyDetails,
            healthInsurance: formData.treatment.healthInsurance,
            insuranceAmount: formData.treatment.insuranceAmount,

            // Financial details - calculated from expenses
            totalAmountClaimed: formData.expenses.reduce(
                (sum, expense) => sum + expense.amountClaimed,
                0
            ),
            totalAmountPassed: formData.expenses.reduce(
                (sum, expense) => sum + expense.amountPassed,
                0
            ),

            // Bank details
            bankName: formData.bankDetails.bankName,
            branchAddress: formData.bankDetails.branchAddress,
            accountNumber: formData.bankDetails.accountNumber,
            ifscCode: formData.bankDetails.ifscCode,

            // Documents
            enclosuresCount: formData.documents.enclosures,
            photocopyCGHSCard: formData.documents.photocopyCGHSCard,
            photocopiesOriginalPrescriptions:
                formData.documents.photocopiesOriginalPrescriptions,
            originalBills: formData.documents.originalBills,

            // Declaration
            signature: formData.declaration.signature,
            declarationPlace: formData.declaration.place,
            declarationDate: formData.declaration.date,
            facultyEmployeeId: formData.declaration.facultyEmployeeId,
            mobileNumber: formData.declaration.mobileNumber,
            email: formData.declaration.email,

            // Expenses
            expenses: formData.expenses,
        };

        const response = await apiService.post<ApplicationSubmissionResponse>(
            "/applications",
            applicationData
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to submit application");
        }

        return response.data;
    }

    /**
     * Get all applications for the current user
     */
    async getMyApplications(): Promise<Application[]> {
        const response = await apiService.get<Application[]>("/applications");

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to fetch applications");
        }

        return response.data;
    }

    /**
     * Get application details by ID
     */
    async getApplication(id: string): Promise<ApplicationDetails> {
        const response = await apiService.get<ApplicationDetails>(
            `/applications/${id}`
        );

        if (!response.success || !response.data) {
            throw new Error(
                response.message || "Failed to fetch application details"
            );
        }

        return response.data;
    }

    /**
     * Get application by application number
     */
    async getApplicationByNumber(
        applicationNumber: string
    ): Promise<ApplicationDetails> {
        const response = await apiService.get<ApplicationDetails>(
            "/applications",
            {
                applicationNumber,
            }
        );

        if (!response.success || !response.data) {
            throw new Error(response.message || "Application not found");
        }

        return response.data;
    }

    /**
     * Check application status
     */
    async checkStatus(
        applicationNumber: string
    ): Promise<{ status: string; message?: string }> {
        try {
            const application = await this.getApplicationByNumber(
                applicationNumber
            );
            return {
                status: application.status,
                message: application.reviewComments,
            };
        } catch (error) {
            throw new Error("Application not found or access denied");
        }
    }

    /**
     * Upload documents for an application
     */
    async uploadDocuments(
        applicationId: string,
        files: File[]
    ): Promise<{ uploadedFiles: string[] }> {
        const formData = new FormData();

        formData.append("applicationId", applicationId);
        files.forEach((file, index) => {
            formData.append(`documents`, file);
        });

        const response = await apiService.uploadFile<{
            uploadedFiles: string[];
        }>("/files/upload", formData);

        if (!response.success || !response.data) {
            throw new Error(response.message || "Failed to upload documents");
        }

        return response.data;
    }

    /**
     * Delete an application (if allowed)
     */
    async deleteApplication(id: string): Promise<void> {
        const response = await apiService.delete(`/applications/${id}`);

        if (!response.success) {
            throw new Error(response.message || "Failed to delete application");
        }
    }
}

// Create and export singleton instance
export const applicationService = new ApplicationService();

// Export class for testing or custom instances
export { ApplicationService };
