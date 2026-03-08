import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// cmdk requires ResizeObserver and scrollIntoView which jsdom does not provide
globalThis.ResizeObserver ??= class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView ??= function () {};
  Element.prototype.hasPointerCapture ??= function () {
    return false;
  };
}

afterEach(() => {
  cleanup();
});
