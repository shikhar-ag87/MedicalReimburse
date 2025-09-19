// Form data types based on actual JNU Medical Reimbursement Form

export interface EmployeeData {
    facultyEmployeeName: string;
    designation: string;
    schoolCentreDepartment: string;
    cghsCardNumber: string;
    cghsDispensary: string;
    cardValidity: string;
    wardEntitlement: string;
}

export interface PatientData {
    patientName: string;
    cghsCardNumber: string;
    relationshipWithEmployee: string;
}

export interface TreatmentData {
    hospitalName: string;
    hospitalAddress: string;
    treatmentType: "opd" | "inpatient" | "emergency";
    clothesProvided: boolean;
    priorPermission: boolean;
    permissionDetails: string;
    emergencyTreatment: boolean;
    emergencyDetails: string;
    healthInsurance: boolean;
    insuranceAmount: string;
}

export interface ExpenseItem {
    id: string;
    billNumber: string;
    billDate: string;
    description: string;
    amountClaimed: number;
    amountPassed: number;
}

export interface BankDetails {
    bankName: string;
    branchAddress: string;
    accountNumber: string;
    ifscCode: string;
}

export interface DocumentData {
    enclosures: number;
    photocopyCGHSCard: boolean;
    photocopiesOriginalPrescriptions: boolean;
    originalBills: boolean;
    uploadedFiles: File[];
}

export interface DeclarationData {
    agreed: boolean;
    signature: string;
    date: string;
    place: string;
    facultyEmployeeId: string;
    mobileNumber: string;
    email: string;
}

export interface FormData {
    employee: EmployeeData;
    patient: PatientData;
    treatment: TreatmentData;
    expenses: ExpenseItem[];
    bankDetails: BankDetails;
    documents: DocumentData;
    declaration: DeclarationData;
}

export interface ValidationErrors {
    [key: string]: string;
}

export interface StepProps {
    formData: FormData;
    updateFormData: (section: keyof FormData, data: any) => void;
    validationErrors: ValidationErrors;
    onNext: () => void;
    onPrevious: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
}

export const initialFormData: FormData = {
    employee: {
        facultyEmployeeName: "",
        designation: "",
        schoolCentreDepartment: "",
        cghsCardNumber: "",
        cghsDispensary: "",
        cardValidity: "",
        wardEntitlement: "",
    },
    patient: {
        patientName: "",
        cghsCardNumber: "",
        relationshipWithEmployee: "",
    },
    treatment: {
        hospitalName: "",
        hospitalAddress: "",
        treatmentType: "opd",
        clothesProvided: false,
        priorPermission: false,
        permissionDetails: "",
        emergencyTreatment: false,
        emergencyDetails: "",
        healthInsurance: false,
        insuranceAmount: "",
    },
    expenses: [],
    bankDetails: {
        bankName: "",
        branchAddress: "",
        accountNumber: "",
        ifscCode: "",
    },
    documents: {
        enclosures: 0,
        photocopyCGHSCard: false,
        photocopiesOriginalPrescriptions: false,
        originalBills: false,
        uploadedFiles: [],
    },
    declaration: {
        agreed: false,
        signature: "",
        date: new Date().toISOString().split("T")[0],
        place: "",
        facultyEmployeeId: "",
        mobileNumber: "",
        email: "",
    },
};
