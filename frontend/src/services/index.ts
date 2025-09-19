// Export all services for easy importing
export * from "./api";
export * from "./auth";
export * from "./admin";
export * from "./applications";
export * from "./files";
export * from "./users";
export * from "./statusTracker";

// Re-export service instances for convenience
export { apiService } from "./api";
export { authService } from "./auth";
export { adminService } from "./admin";
export { applicationService } from "./applications";
export { fileService } from "./files";
export { userService } from "./users";
export { statusTrackerService } from "./statusTracker";

// Service configuration
export const services = {
    api: () => import("./api").then((m) => m.apiService),
    auth: () => import("./auth").then((m) => m.authService),
    admin: () => import("./admin").then((m) => m.adminService),
    applications: () =>
        import("./applications").then((m) => m.applicationService),
    files: () => import("./files").then((m) => m.fileService),
    users: () => import("./users").then((m) => m.userService),
    statusTracker: () =>
        import("./statusTracker").then((m) => m.statusTrackerService),
} as const;

// Service types for TypeScript
export type ServiceName = keyof typeof services;

// Helper to get service instance
export async function getService<T extends ServiceName>(name: T) {
    return await services[name]();
}
