// Mock faker for Jest compatibility
const mockFaker = {
    internet: {
        username: () => "testuser",
        email: () => "test@jnu.ac.in",
    },
    person: {
        fullName: () => "Test User",
    },
    helpers: {
        arrayElement: (arr: any[]) => arr[0],
    },
    string: {
        alphanumeric: (length: number) => "TEST123",
        numeric: (length: number) => "123456",
    },
    phone: {
        number: () => "+91-9876543210",
    },
    location: {
        streetAddress: () => "123 Test Street",
    },
    date: {
        recent: () => new Date(),
        past: () => new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
        between: ({ from, to }: { from: Date; to: Date }) => new Date(),
    },
    lorem: {
        sentence: () => "This is a test sentence.",
        paragraph: () => "This is a test paragraph with some test content.",
    },
    company: {
        name: () => "Test Company",
    },
    number: {
        int: ({ min, max }: { min: number; max: number }) =>
            Math.floor((min + max) / 2),
        float: ({
            min,
            max,
            fractionDigits,
        }: {
            min: number;
            max: number;
            fractionDigits?: number;
        }) => parseFloat(((min + max) / 2).toFixed(fractionDigits || 2)),
    },
    datatype: {
        boolean: () => true,
    },
};

export const faker = mockFaker;
export default mockFaker;
