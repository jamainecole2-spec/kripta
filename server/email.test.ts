import { describe, expect, it } from "vitest";
import emailService from "./services/emailService";

describe("EmailService", () => {
  it("should have order confirmation method", () => {
    expect(typeof emailService.sendOrderConfirmation).toBe("function");
  });

  it("should have deposit confirmation method", () => {
    expect(typeof emailService.sendDepositConfirmation).toBe("function");
  });

  it("should have withdrawal confirmation method", () => {
    expect(typeof emailService.sendWithdrawalConfirmation).toBe("function");
  });

  it("should have price alert method", () => {
    expect(typeof emailService.sendPriceAlert).toBe("function");
  });

  it("should have security alert method", () => {
    expect(typeof emailService.sendSecurityAlert).toBe("function");
  });

  it("should have generic email method", () => {
    expect(typeof emailService.sendEmail).toBe("function");
  });

  it("should be a valid service instance", () => {
    expect(emailService).toBeDefined();
    expect(emailService).not.toBeNull();
  });
});
