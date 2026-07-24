import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// No global `test.globals` in vitest.config.ts, so @testing-library/react's
// own auto-cleanup (which relies on a global afterEach) never registers.
// mountedContainers stays empty for node-environment test files that never
// call render(), so this is a no-op for all the non-component test suites.
afterEach(cleanup);
