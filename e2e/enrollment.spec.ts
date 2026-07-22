import { expect, test, type Page } from "@playwright/test";

const holder = "0x99d58aa8dd8311c3706d619176bb3bf2008148c3";
const beneficiaryA = "0x1111111111111111111111111111111111111111";
const beneficiaryB = "0x2222222222222222222222222222222222222222";
const policyManager = "0xeBB2dd0A8C59D2e1745eb94BF6f1714AfAb11673";

function verifiedEnrollment(overrides: Record<string, unknown> = {}) {
  return {
    applicationId: null,
    beneficiaries: [],
    humanReservation: {
      authorization: `0x${"11".repeat(65)}`,
      credentialIdentifiers: ["e2e-credential"],
      deadline: "2000000000",
      nullifier: "e2e-nullifier",
      nullifierHash: `0x${"22".repeat(32)}`,
      policyHumanVerifier: "0xDbe839D948A4EEA75490457F4d7C51063fbf779D",
      policyManager,
      protocolVersion: "0.1",
      reservedAt: "2026-07-18T00:00:00.000Z",
      walletAddress: holder
    },
    issuedPolicyId: null,
    issuedTransactionHash: null,
    paymentReady: false,
    quoteReviewed: false,
    riskAccepted: false,
    submitted: false,
    submittedAt: null,
    termsAccepted: false,
    walletSession: { address: holder, chainId: 4801, method: "browser", status: "connected" },
    ...overrides
  };
}

function enrollmentForIdentity({ address, nullifier, marker }: { address: string; nullifier: string; marker: string }) {
  return verifiedEnrollment({
    humanReservation: {
      ...verifiedEnrollment().humanReservation,
      authorization: `0x${marker.repeat(130)}`,
      nullifier,
      nullifierHash: `0x${marker.repeat(64)}`,
      walletAddress: address
    },
    walletSession: { address, chainId: 4801, method: "browser", status: "connected" }
  });
}

async function restoreEnrollment(page: Page, state = verifiedEnrollment()) {
  await page.addInitScript((enrollment) => {
    window.localStorage.setItem("riska.enrollment.v2", JSON.stringify(enrollment));
  }, state);
}

test("persists a verified human session after reload", async ({ page }) => {
  await restoreEnrollment(page);
  await page.goto("/apply");

  await expect(page.getByText("Humano verificado")).toBeVisible();
  await expect(page.getByText("Humano único verificado. Esta wallet puede continuar a beneficiarios.")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Humano único verificado. Esta wallet puede continuar a beneficiarios.")).toBeVisible();
});

test("invalidates an expired saved human authorization before enrollment can continue", async ({ page }) => {
  await restoreEnrollment(page, verifiedEnrollment({
    humanReservation: {
      ...verifiedEnrollment().humanReservation,
      deadline: "1"
    }
  }));
  await page.goto("/apply");

  await expect(page.getByRole("button", { name: "Verificar que soy humano" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const restored = JSON.parse(window.localStorage.getItem("riska.enrollment.v2") ?? "{}");
    return restored.humanReservation;
  })).toBeNull();
});

test("consumes a pending wallet redirect only once", async ({ page }) => {
  const enrollment = enrollmentForIdentity({
    address: "0x5000000000000000000000000000000000000005",
    marker: "5",
    nullifier: "505"
  });
  await restoreEnrollment(page, enrollment);
  await page.addInitScript((walletSession) => {
    if (window.sessionStorage.getItem("riska.e2e-pending-wallet-seeded")) {
      return;
    }
    window.sessionStorage.setItem("riska.e2e-pending-wallet-seeded", "true");
    window.sessionStorage.setItem("riska.pending-wallet-session", JSON.stringify(walletSession));
  }, enrollment.walletSession);
  await page.goto("/apply");

  await expect(page.getByRole("button", { name: "Verificar que soy humano" })).toBeVisible();
  expect(await page.evaluate(() => window.sessionStorage.getItem("riska.pending-wallet-session"))).toBeNull();

  await page.evaluate((enrollment) => {
    window.localStorage.setItem("riska.enrollment.v2", JSON.stringify(enrollment));
  }, enrollment);
  await page.reload();

  await expect(page.getByText("Humano único verificado. Esta wallet puede continuar a beneficiarios.")).toBeVisible();
});

test("keeps three distinct wallet and World ID reservations independent", async ({ page }) => {
  const identities = [
    { address: "0x1000000000000000000000000000000000000001", marker: "1", nullifier: "101" },
    { address: "0x2000000000000000000000000000000000000002", marker: "2", nullifier: "202" },
    { address: "0x3000000000000000000000000000000000000003", marker: "3", nullifier: "303" }
  ];

  await page.goto("/apply");

  for (const identity of identities) {
    const enrollment = enrollmentForIdentity(identity);
    await page.evaluate((state) => {
      window.localStorage.setItem("riska.enrollment.v2", JSON.stringify(state));
    }, enrollment);
    await page.reload();

    await expect(page.getByText("Humano único verificado. Esta wallet puede continuar a beneficiarios.")).toBeVisible();
    const restored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("riska.enrollment.v2") ?? "{}"));
    expect(restored.walletSession.address.toLowerCase()).toBe(identity.address.toLowerCase());
    expect(restored.humanReservation.walletAddress.toLowerCase()).toBe(identity.address.toLowerCase());
    expect(restored.humanReservation.nullifier).toBe(identity.nullifier);
  }
});

test("invalidates a saved authorization when the policy verifier changes", async ({ page }) => {
  await restoreEnrollment(page, verifiedEnrollment({
    humanReservation: {
      ...verifiedEnrollment().humanReservation,
      policyHumanVerifier: "0x636f792e8c2DdE8DDFC09ff41E68e85a442e1109"
    }
  }));
  await page.goto("/apply");

  await expect(page.getByRole("button", { name: "Verificar que soy humano" })).toBeVisible();
  await expect(page.getByText("Humano único verificado. Esta wallet puede continuar a beneficiarios.")).not.toBeVisible();
});

test("allows continuing without beneficiaries and prepares policy issuance", async ({ page }) => {
  await restoreEnrollment(page);
  await page.goto("/apply");

  await page.getByRole("button", { name: "Beneficiarios" }).click();
  await page.getByRole("button", { name: "Continuar sin beneficiarios" }).click();

  await expect(page.getByRole("heading", { name: "Crear póliza / bóveda" })).toBeVisible();
  await page.getByLabel("Revisé la fórmula de la póliza.").check();
  await page.getByLabel("Acepto los términos de la póliza Riska 30.").check();
  await page.getByLabel("Entiendo las reglas de pago y el requisito de auditoría de contratos antes de activar fondos de usuarios.").check();
  await page.getByLabel("Autorizo preparar el primer pago de 30 USDC para el paso de emisión.").check();

  await expect(page.getByRole("button", { name: "Abrir póliza" })).toBeEnabled();
});

test("keeps the user on the final step and preserves World ID when issuance fails", async ({ page }) => {
  await restoreEnrollment(page, enrollmentForIdentity({
    address: "0x4000000000000000000000000000000000000004",
    marker: "4",
    nullifier: "404"
  }));
  await page.addInitScript(() => {
    const stored = JSON.parse(window.localStorage.getItem("riska.enrollment.v2") ?? "{}");
    window.localStorage.setItem("riska.enrollment.v2", JSON.stringify({
      ...stored,
      paymentReady: true,
      quoteReviewed: true,
      riskAccepted: true,
      termsAccepted: true
    }));
  });
  await page.goto("/apply");

  await page.getByRole("button", { name: "Crear póliza / bóveda" }).click();
  await page.getByRole("button", { name: "Abrir póliza" }).click();

  await expect(page.getByRole("heading", { name: "Crear póliza / bóveda" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir póliza" })).toBeVisible();
  const restored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("riska.enrollment.v2") ?? "{}"));
  expect(restored.humanReservation).not.toBeNull();
});

test("blocks an invalid beneficiary split", async ({ page }) => {
  await restoreEnrollment(page, verifiedEnrollment({
    beneficiaries: [{ color: "bg-rose-500", id: "beneficiary-e2e", name: "Ana", percent: 60, wallet: beneficiaryA }]
  }));
  await page.goto("/apply");

  await page.getByRole("button", { name: "Beneficiarios" }).click();
  await expect(page.getByText("Los porcentajes deben sumar exactamente 100%.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeDisabled();
});

test("accepts a 100 percent beneficiary split", async ({ page }) => {
  await restoreEnrollment(page, verifiedEnrollment({
    beneficiaries: [
      { color: "bg-rose-500", id: "beneficiary-e2e-a", name: "Ana", percent: 60, wallet: beneficiaryA },
      { color: "bg-amber-500", id: "beneficiary-e2e-b", name: "Bruno", percent: 40, wallet: beneficiaryB }
    ]
  }));
  await page.goto("/apply");

  await page.getByRole("button", { name: "Beneficiarios" }).click();
  await expect(page.getByText("Asignación total: 100%")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeEnabled();
});

test("serves a configured World ID RP context through the adblock-safe endpoint", async ({ request }) => {
  const response = await request.post("/api/identity/rp-signature", { data: {} });
  const payload = await response.json();

  expect(response.ok()).toBeTruthy();
  expect(payload.configured).toBeTruthy();
  expect(payload.action).toBeTruthy();
  expect(payload.rpContext).toBeTruthy();
});
