import { expect, test } from "@playwright/test";

const adminOwner = process.env.RISKA_FORK_ADMIN_OWNER;

test.describe("deployed World Chain Sepolia contracts on a local fork", () => {
  test.skip(!adminOwner, "RISKA_FORK_ADMIN_OWNER is required for the fork-only browser test.");

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((owner) => {
      window.sessionStorage.setItem("riska.admin-wallet-session", JSON.stringify({
        address: owner,
        chainId: 4801,
        method: "browser",
        status: "connected"
      }));
    }, adminOwner);
  });

  test("shows three policies issued to three distinct people", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/admin");

    const metric = page.getByText("Pólizas emitidas").locator("..");
    await expect(metric.getByText("3", { exact: true })).toBeVisible();

    await page.goto("/admin/policies");
    await expect(page.getByText("3 emitidas", { exact: true })).toBeVisible();

    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(3);
    const holders = await rows.locator("td:nth-child(2)").allTextContents();
    expect(new Set(holders).size).toBe(3);
    await expect(rows.locator("td:nth-child(4)")).toHaveText(["30 USDC", "30 USDC", "30 USDC"]);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
