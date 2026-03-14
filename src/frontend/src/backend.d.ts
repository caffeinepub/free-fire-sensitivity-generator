import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SensitivityProfile {
    freeLook: bigint;
    sniperScope: bigint;
    scope2x: bigint;
    scope4x: bigint;
    general: bigint;
    deviceTier: string;
    redDot: bigint;
}
export interface backendInterface {
    getSensitivity(deviceName: string): Promise<SensitivityProfile>;
}
