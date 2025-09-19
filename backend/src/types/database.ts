// Database interface definitions for modular architecture
// This allows easy swapping between different database providers

export interface DatabaseConfig {
    type: "supabase" | "postgresql" | "mysql" | "mongodb";
    connectionString?: string;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
    // Supabase specific
    supabaseUrl?: string;
    supabaseKey?: string;
    serviceKey?: string;
}

export interface DatabaseConnection {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    query<T = any>(sql: string, params?: any[]): Promise<T[]>;
    queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
    transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
}

export interface DatabaseRepository<T, CreateData, UpdateData> {
    create(data: CreateData): Promise<T>;
    findById(id: string): Promise<T | null>;
    findAll(filters?: Partial<T>): Promise<T[]>;
    update(id: string, data: Partial<UpdateData>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
    count(filters?: Partial<T>): Promise<number>;
}

// Application-specific interfaces
export interface MedicalApplication {
    id: string;
    applicationNumber: string;
    status: "pending" | "under_review" | "approved" | "rejected" | "completed";
    submittedAt: Date;
    updatedAt: Date;

    // Employee details
    employeeName: string;
    employeeId: string;
    designation: string;
    department: string;
    cghsCardNumber: string;
    cghsDispensary: string;
    cardValidity: Date;
    wardEntitlement: string;

    // Patient details
    patientName: string;
    patientCghsCard: string;
    relationshipWithEmployee: string;

    // Treatment details
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

    // Financial details
    totalAmountClaimed: number;
    totalAmountPassed: number;

    // Bank details
    bankName: string;
    branchAddress: string;
    accountNumber: string;
    ifscCode: string;

    // Documents
    enclosuresCount: number;
    photocopyCGHSCard: boolean;
    photocopiesOriginalPrescriptions: boolean;
    originalBills: boolean;

    // Declaration
    signature: string;
    declarationPlace: string;
    declarationDate: Date;
    facultyEmployeeId: string;
    mobileNumber: string;
    email: string;

    // Admin fields
    reviewedBy?: string;
    reviewedAt?: Date;
    reviewComments?: string;
    processedBy?: string;
    processedAt?: Date;
}

export interface ExpenseItem {
    id: string;
    applicationId: string;
    billNumber: string;
    billDate: Date;
    description: string;
    amountClaimed: number;
    amountPassed: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ApplicationDocument {
    id: string;
    applicationId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    filePath: string;
    documentType:
        | "cghs_card"
        | "prescription"
        | "bill"
        | "receipt"
        | "medical_certificate"
        | "other";
    uploadedAt: Date;
    uploadedBy: string;
}

export interface User {
    id: string;
    email: string;
    password: string;
    role: "employee" | "admin" | "super_admin" | "medical_officer";
    name: string;
    employeeId?: string;
    department?: string;
    designation?: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuditLog {
    id: string;
    entityType: "application" | "user" | "document";
    entityId: string;
    action: "create" | "update" | "delete" | "view" | "approve" | "reject";
    userId: string;
    userEmail: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

// Create data interfaces (without generated fields)
export interface CreateMedicalApplicationData
    extends Omit<
        MedicalApplication,
        | "id"
        | "applicationNumber"
        | "submittedAt"
        | "updatedAt"
        | "reviewedBy"
        | "reviewedAt"
        | "reviewComments"
        | "processedBy"
        | "processedAt"
    > {}

export interface CreateExpenseItemData
    extends Omit<ExpenseItem, "id" | "createdAt" | "updatedAt"> {}

export interface CreateApplicationDocumentData
    extends Omit<ApplicationDocument, "id" | "uploadedAt"> {}

export interface CreateUserData
    extends Omit<User, "id" | "lastLogin" | "createdAt" | "updatedAt"> {}

export interface CreateAuditLogData
    extends Omit<AuditLog, "id" | "timestamp"> {}

// Update data interfaces
export interface UpdateMedicalApplicationData
    extends Partial<Omit<CreateMedicalApplicationData, "submittedAt">> {}

export interface UpdateExpenseItemData
    extends Partial<Omit<CreateExpenseItemData, "applicationId">> {}

export interface UpdateUserData
    extends Partial<Omit<CreateUserData, "email">> {}

// Repository interfaces
export interface MedicalApplicationRepository
    extends DatabaseRepository<
        MedicalApplication,
        CreateMedicalApplicationData,
        UpdateMedicalApplicationData
    > {
    findByEmployeeId(employeeId: string): Promise<MedicalApplication[]>;
    findByStatus(
        status: MedicalApplication["status"]
    ): Promise<MedicalApplication[]>;
    findByApplicationNumber(
        applicationNumber: string
    ): Promise<MedicalApplication | null>;
    updateStatus(
        id: string,
        status: MedicalApplication["status"],
        reviewerId?: string,
        comments?: string
    ): Promise<MedicalApplication | null>;
    getApplicationsForReview(): Promise<MedicalApplication[]>;
    getApplicationStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        completed: number;
    }>;
}

export interface ExpenseItemRepository
    extends DatabaseRepository<
        ExpenseItem,
        CreateExpenseItemData,
        UpdateExpenseItemData
    > {
    findByApplicationId(applicationId: string): Promise<ExpenseItem[]>;
    getTotalAmountByApplication(
        applicationId: string
    ): Promise<{ claimed: number; passed: number }>;
}

export interface ApplicationDocumentRepository
    extends DatabaseRepository<
        ApplicationDocument,
        CreateApplicationDocumentData,
        ApplicationDocument
    > {
    findByApplicationId(applicationId: string): Promise<ApplicationDocument[]>;
    findByDocumentType(
        applicationId: string,
        documentType: ApplicationDocument["documentType"]
    ): Promise<ApplicationDocument[]>;
}

export interface UserRepository
    extends DatabaseRepository<User, CreateUserData, UpdateUserData> {
    findByEmail(email: string): Promise<User | null>;
    findByEmployeeId(employeeId: string): Promise<User | null>;
    findByRole(role: User["role"]): Promise<User[]>;
    updateLastLogin(id: string): Promise<void>;
    deactivateUser(id: string): Promise<boolean>;
}

export interface AuditLogRepository
    extends DatabaseRepository<AuditLog, CreateAuditLogData, AuditLog> {
    findByEntityId(
        entityType: AuditLog["entityType"],
        entityId: string
    ): Promise<AuditLog[]>;
    findByUserId(userId: string): Promise<AuditLog[]>;
    findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]>;
}
