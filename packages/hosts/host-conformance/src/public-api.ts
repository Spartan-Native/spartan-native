/*
 * Public API surface of @spartan-native/host-conformance:
 * the test suite every @spartan-native/host-* adapter must pass.
 */
export { checkHostConformance, CHECKS, SkipCheck, validateAppearance, validatePlatform } from './lib/conformance';
export type { Check, CheckResult, CheckStatus, ConformanceReport, HostDriver } from './lib/conformance';
export { describeHostConformance } from './lib/describe';
export type { HostUnderTest } from './lib/describe';
