import { describe, expect, it } from "vitest";
import { transactionTypeToCategoryType } from "./categoryType";

describe("transactionTypeToCategoryType", () => {
  it("maps INCOME to INCOME", () => {
    expect(transactionTypeToCategoryType("INCOME")).toBe("INCOME");
  });

  it("maps EXPENSE to EXPENSE", () => {
    expect(transactionTypeToCategoryType("EXPENSE")).toBe("EXPENSE");
  });

  it("maps OPENING to EXPENSE", () => {
    expect(transactionTypeToCategoryType("OPENING")).toBe("EXPENSE");
  });

  it("maps TRANSFER to TRANSFER", () => {
    expect(transactionTypeToCategoryType("TRANSFER")).toBe("TRANSFER");
  });

  it("returns null for unknown types", () => {
    expect(transactionTypeToCategoryType("UNKNOWN")).toBeNull();
  });
});
