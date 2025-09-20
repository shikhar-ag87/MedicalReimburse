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
     * Generate mock user data
     */
    static generateUser(
        overrides: Partial<CreateUserData> = {}
    ): CreateUserData {
        return {
            email: faker.internet.email(),
            password: "TestPassword123!",
            name: faker.person.fullName(),
            role: faker.helpers.arrayElement([
                "employee",
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
        userId: string,
        overrides: Partial<CreateApplicationData> = {}
    ): CreateApplicationData {
        const treatmentDate = faker.date.recent({ days: 30 });

        return {
            userId,
            patientName: faker.person.fullName(),
            relation: faker.helpers.arrayElement([
                "self",
                "spouse",
                "child",
                "parent",
                "dependent",
            ]),
            age: faker.number.int({ min: 1, max: 90 }),
            gender: faker.helpers.arrayElement(["male", "female", "other"]),
            treatmentType: faker.helpers.arrayElement([
                "outpatient",
                "inpatient",
                "emergency",
                "specialty",
                "diagnostic",
                "preventive",
                "dental",
                "eye_care",
                "maternity",
                "surgery",
            ]),
            hospitalName: faker.company.name() + " Hospital",
            doctorName: "Dr. " + faker.person.fullName(),
            treatmentDate: treatmentDate.toISOString().split("T")[0],
            diagnosis: faker.lorem.sentence(),
            symptoms: faker.lorem.paragraph(),
            totalAmount: faker.number.float({
                min: 500,
                max: 50000,
                fractionDigits: 2,
            }),
            expenseItems: this.generateExpenseItems(),
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
            employeeId: userData.employeeId,
            department: userData.department,
            designation: userData.designation,
            isActive: true,
            createdAt: new Date(faker.date.past()),
            updatedAt: new Date(faker.date.recent()),
            lastLogin: faker.date.recent(),
            ...overrides,
        };
    }

    /**
     * Generate a complete application object
     */
    static generateCompleteApplication(
        userId: string,
        overrides: Partial<Application> = {}
    ): Application {
        const appData = this.generateApplication(userId);
        const submittedAt = faker.date.recent({ days: 10 });

        return {
            id: faker.string.uuid(),
            applicationNumber:
                "MR" +
                faker.date.recent().getFullYear() +
                faker.string.numeric(6),
            userId,
            status: faker.helpers.arrayElement([
                "draft",
                "submitted",
                "under_review",
                "approved",
                "rejected",
                "clarification_required",
            ]),
            patientName: appData.patientName,
            relation: appData.relation,
            age: appData.age,
            gender: appData.gender,
            treatmentType: appData.treatmentType,
            hospitalName: appData.hospitalName,
            doctorName: appData.doctorName,
            treatmentDate: appData.treatmentDate,
            diagnosis: appData.diagnosis,
            symptoms: appData.symptoms,
            totalAmount: appData.totalAmount,
            expenseItems: appData.expenseItems,
            submittedAt: submittedAt.toISOString(),
            reviewedAt: faker.datatype.boolean()
                ? faker.date
                      .between({ from: submittedAt, to: new Date() })
                      .toISOString()
                : undefined,
            reviewedBy: faker.datatype.boolean()
                ? faker.string.uuid()
                : undefined,
            comments: faker.datatype.boolean()
                ? faker.lorem.paragraph()
                : undefined,
            approvedAmount: faker.datatype.boolean()
                ? faker.number.float({
                      min: 500,
                      max: appData.totalAmount,
                      fractionDigits: 2,
                  })
                : undefined,
            createdAt: faker.date.past().toISOString(),
            updatedAt: faker.date.recent().toISOString(),
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
        userId: string,
        count: number,
        overrides: Partial<Application> = {}
    ): Application[] {
        return Array.from({ length: count }, () =>
            this.generateCompleteApplication(userId, overrides)
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
            username: "admin",
            fullName: "System Administrator",
            ...overrides,
        });
    }

    /**
     * Generate employee user
     */
    static generateEmployeeUser(overrides: Partial<User> = {}): User {
        return this.generateCompleteUser({
            role: "employee",
            email: "employee@jnu.ac.in",
            username: "employee",
            ...overrides,
        });
    }

    /**
     * Generate health centre user
     */
    static generateHealthCentreUser(overrides: Partial<User> = {}): User {
        return this.generateCompleteUser({
            role: "health_centre",
            email: "health@jnu.ac.in",
            username: "health_centre",
            ...overrides,
        });
    }

    /**
     * Generate OBC user
     */
    static generateOBCUser(overrides: Partial<User> = {}): User {
        return this.generateCompleteUser({
            role: "obc",
            email: "obc@jnu.ac.in",
            username: "obc_officer",
            ...overrides,
        });
    }

    /**
     * Generate a complete dataset for testing
     */
    static generateTestDataset() {
        const adminUser = this.generateAdminUser();
        const employeeUser = this.generateEmployeeUser();
        const healthCentreUser = this.generateHealthCentreUser();
        const obcUser = this.generateOBCUser();

        const applications = this.generateApplications(employeeUser.id, 5);

        return {
            users: {
                admin: adminUser,
                employee: employeeUser,
                healthCentre: healthCentreUser,
                obc: obcUser,
            },
            applications,
            allUsers: [adminUser, employeeUser, healthCentreUser, obcUser],
            tokens: {
                admin: "admin-test-token",
                employee: "employee-test-token",
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
