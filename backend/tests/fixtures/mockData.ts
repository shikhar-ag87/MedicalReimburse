import { faker } from "@faker-js/faker";
import {
    CreateUserData,
    CreateMedicalApplicationData,
    User,
    MedicalApplication,
} from "../../src/types/database";

type CreateApplicationData = CreateMedicalApplicationData;
type Application = MedicalApplication;

export class MockDataGenerator {
    /**
     * Generate mock admin user data
     */
    static generateUser(
        overrides: Partial<CreateUserData> = {}
    ): CreateUserData {
        return {
            email: faker.internet.email(),
            password: "TestPassword123!",
            name: faker.person.fullName(),
            role: faker.helpers.arrayElement([
                "admin",
                "super_admin",
                "medical_officer",
            ]),
            employeeId: faker.string.alphanumeric(8).toUpperCase(),
            department: faker.helpers.arrayElement([
                "Computer Science",
                "Mathematics",
                "Physics",
                "Chemistry",
                "English",
                "History",
            ]),
            designation: faker.helpers.arrayElement([
                "Assistant Professor",
                "Associate Professor",
                "Professor",
                "Research Scholar",
                "Administrative Officer",
            ]),
            isActive: true,
            ...overrides,
        };
    }

    /**
     * Generate mock application data
     */
    static generateApplication(
        overrides: Partial<CreateApplicationData> = {}
    ): CreateApplicationData {
        const treatmentDate = faker.date.recent({ days: 30 });

        return {
            status: faker.helpers.arrayElement([
                "pending",
                "under_review",
                "back_to_obc",
                "approved",
                "rejected",
                "completed",
                "reimbursed",
            ]),
            applicationNumber: `MR-${new Date().getFullYear()}-${faker.string.numeric(
                4
            )}`,
            // Employee details
            employeeName: faker.person.fullName(),
            employeeId: faker.string.alphanumeric(8).toUpperCase(),
            designation: faker.person.jobTitle(),
            department: faker.helpers.arrayElement([
                "Computer Science",
                "Mathematics",
                "Physics",
                "Chemistry",
                "Biology",
            ]),
            cghsCardNumber: faker.string.numeric(10),
            cghsDispensary: faker.location.city() + " CGHS",
            cardValidity: faker.date.future(),
            wardEntitlement: faker.helpers.arrayElement([
                "General",
                "Semi-Private",
                "Private",
            ]),

            // Patient details
            patientName: faker.person.fullName(),
            patientCghsCard: faker.string.numeric(10),
            relationshipWithEmployee: faker.helpers.arrayElement([
                "self",
                "spouse",
                "child",
                "parent",
                "dependent",
            ]),

            // Treatment details
            hospitalName: faker.company.name() + " Hospital",
            hospitalAddress: faker.location.streetAddress(),
            treatmentType: faker.helpers.arrayElement([
                "opd",
                "inpatient",
                "emergency",
            ]),
            clothesProvided: faker.datatype.boolean(),
            priorPermission: faker.datatype.boolean(),
            ...(faker.datatype.boolean() && {
                permissionDetails: faker.lorem.sentence(),
            }),
            emergencyTreatment: faker.datatype.boolean(),
            ...(faker.datatype.boolean() && {
                emergencyDetails: faker.lorem.sentence(),
            }),
            healthInsurance: faker.datatype.boolean(),
            ...(faker.datatype.boolean() && {
                insuranceAmount: faker.number.float({
                    min: 1000,
                    max: 50000,
                    fractionDigits: 2,
                }),
            }),

            // Financial details
            totalAmountClaimed: faker.number.float({
                min: 500,
                max: 50000,
                fractionDigits: 2,
            }),
            totalAmountPassed: faker.number.float({
                min: 500,
                max: 50000,
                fractionDigits: 2,
            }),

            // Bank details
            bankName: faker.finance.accountName(),
            branchAddress: faker.location.streetAddress(),
            accountNumber: faker.string.numeric(12),
            ifscCode: faker.string.alphanumeric(11).toUpperCase(),

            // Documents
            enclosuresCount: faker.number.int({ min: 1, max: 10 }),
            photocopyCGHSCard: faker.datatype.boolean(),
            photocopiesOriginalPrescriptions: faker.datatype.boolean(),
            originalBills: faker.datatype.boolean(),

            // Declaration
            signature: faker.person.fullName(),
            declarationPlace: faker.location.city(),
            declarationDate: faker.date.recent(),
            facultyEmployeeId: faker.string.alphanumeric(8).toUpperCase(),
            mobileNumber: faker.phone.number(),
            email: faker.internet.email(),

            ...overrides,
        };
    }

    /**
     * Generate expense items for an application
     */
    static generateExpenseItems(count: number = 3) {
        return Array.from({ length: count }, () => ({
            category: faker.helpers.arrayElement([
                "consultation",
                "medicines",
                "lab_tests",
                "surgery",
                "hospitalization",
                "other",
            ]),
            description: faker.lorem.sentence(),
            amount: faker.number.float({
                min: 100,
                max: 10000,
                fractionDigits: 2,
            }),
            billNumber: faker.string.alphanumeric(10).toUpperCase(),
            billDate: faker.date
                .recent({ days: 30 })
                .toISOString()
                .split("T")[0],
        }));
    }

    /**
     * Generate a complete user object (as returned by the database)
     */
    static generateCompleteUser(overrides: Partial<User> = {}): User {
        const userData = this.generateUser();
        return {
            id: faker.string.uuid(),
            email: userData.email,
            password: userData.password, // In real scenarios, this would be hashed
            name: userData.name,
            role: userData.role,
            ...(userData.employeeId && { employeeId: userData.employeeId }),
            ...(userData.department && { department: userData.department }),
            ...(userData.designation && { designation: userData.designation }),
            isActive: true,
            createdAt: new Date(faker.date.past()),
            updatedAt: new Date(faker.date.recent()),
            ...(faker.datatype.boolean() && { lastLogin: faker.date.recent() }),
            ...overrides,
        };
    }

    /**
     * Generate a complete application object
     */
    static generateCompleteApplication(
        overrides: Partial<Application> = {}
    ): Application {
        const appData = this.generateApplication();
        const submittedAt = faker.date.recent({ days: 10 });

        return {
            ...appData,
            id: faker.string.uuid(),
            submittedAt: submittedAt,
            updatedAt: faker.date.recent(),
            ...overrides,
        };
    }

    /**
     * Generate multiple users
     */
    static generateUsers(count: number, overrides: Partial<User> = {}): User[] {
        return Array.from({ length: count }, () =>
            this.generateCompleteUser(overrides)
        );
    }

    /**
     * Generate multiple applications
     */
    static generateApplications(
        count: number,
        overrides: Partial<Application> = {}
    ): Application[] {
        return Array.from({ length: count }, () =>
            this.generateCompleteApplication(overrides)
        );
    }

    /**
     * Generate test data for specific roles
     */
    static generateUserByRole(
        role: User["role"],
        overrides: Partial<User> = {}
    ): User {
        return this.generateCompleteUser({ role, ...overrides });
    }

    /**
     * Generate admin user
     */
    static generateAdminUser(overrides: Partial<User> = {}): User {
        return this.generateCompleteUser({
            role: "super_admin",
            email: "admin@jnu.ac.in",
            name: "System Administrator",
            ...overrides,
        });
    }

    /**
     * Generate regular admin user (for testing admin functionality)
     */
    static generateRegularAdminUser(overrides: Partial<User> = {}): User {
        return this.generateCompleteUser({
            role: "admin",
            email: "admin@jnu.ac.in",
            ...overrides,
        });
    }

    /**
     * Generate health centre user (medical officer)
     */
    static generateHealthCentreUser(overrides: Partial<User> = {}): User {
        return this.generateCompleteUser({
            role: "medical_officer",
            email: "health@jnu.ac.in",
            ...overrides,
        });
    }

    /**
     * Generate OBC user (admin role)
     */
    static generateOBCUser(overrides: Partial<User> = {}): User {
        return this.generateCompleteUser({
            role: "admin",
            email: "obc@jnu.ac.in",
            ...overrides,
        });
    }

    /**
     * Generate a complete dataset for testing
     */
    static generateTestDataset() {
        const adminUser = this.generateAdminUser();
        const regularAdminUser = this.generateRegularAdminUser();
        const healthCentreUser = this.generateHealthCentreUser();
        const obcUser = this.generateOBCUser();

        const applications = this.generateApplications(5);

        return {
            users: {
                admin: adminUser,
                regularAdmin: regularAdminUser,
                healthCentre: healthCentreUser,
                obc: obcUser,
            },
            applications,
            allUsers: [adminUser, regularAdminUser, healthCentreUser, obcUser],
            tokens: {
                admin: "admin-test-token",
                regularAdmin: "regular-admin-test-token",
                healthCentre: "health-centre-test-token",
                obc: "obc-test-token",
            },
        };
    }

    /**
     * Reset faker seed for consistent testing
     */
    static seed(seed: number = 12345) {
        faker.seed(seed);
    }
}

export default MockDataGenerator;
