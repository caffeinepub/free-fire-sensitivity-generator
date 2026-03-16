import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PaidUserInfo {
    paidUntil: bigint;
    name: string;
    user: Principal;
    isPaid: boolean;
    deviceName: string;
}
export interface SensitivityProfile {
    freeLook: bigint;
    sniperScope: bigint;
    scope2x: bigint;
    scope4x: bigint;
    general: bigint;
    deviceTier: string;
    redDot: bigint;
}
export interface UserProfile {
    name: string;
    deviceName: string;
}
export interface Transaction {
    principal: Principal;
    txId: string;
    timestamp: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    approveTransaction(txId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    canGenerateToday(): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPaidUsers(): Promise<Array<PaidUserInfo>>;
    getPendingTransactions(): Promise<Array<Transaction>>;
    getRemainingGenerationsToday(): Promise<bigint>;
    getSensitivity(deviceName: string): Promise<SensitivityProfile>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerPaid(): Promise<boolean>;
    markUserAsPaid(user: Principal): Promise<void>;
    recordGeneration(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitTransactionId(txId: string): Promise<void>;
}
