// Type extensions for Express Request to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: string;
                [key: string]: any;
            };
        }
    }
}

export {};
