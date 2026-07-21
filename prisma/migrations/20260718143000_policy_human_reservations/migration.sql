-- Stores only a one-way digest of the World ID nullifier. The composite unique
-- constraint is the cross-instance, concurrency-safe one-policy-per-human lock.
CREATE TABLE "PolicyHumanReservation" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "nullifierHash" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "protocolVersion" TEXT NOT NULL,
    "credentialIdentifiers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyHumanReservation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PolicyHumanReservation_action_nullifierHash_key"
ON "PolicyHumanReservation"("action", "nullifierHash");

CREATE INDEX "PolicyHumanReservation_walletAddress_idx"
ON "PolicyHumanReservation"("walletAddress");
