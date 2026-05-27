// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract RiskaDeathVerifier is Ownable, Pausable {
    enum DeathReportStatus {
        None,
        Reported,
        Disputed,
        Verified,
        Rejected,
        Settled
    }

    struct DeathReport {
        address reporter;
        bytes32 evidenceHash;
        uint256 reportedAt;
        uint256 disputeEndsAt;
        uint256 verifiedAt;
        address verifiedBy;
        DeathReportStatus status;
    }

    uint256 public constant DISPUTE_WINDOW = 90 days;

    address public verifier;
    address public policyManager;

    mapping(uint256 => DeathReport) public deathReports;

    event VerifierUpdated(address indexed verifier);
    event PolicyManagerUpdated(address indexed policyManager);
    event DeathReported(
        uint256 indexed policyId,
        address indexed reporter,
        bytes32 indexed evidenceHash,
        uint256 disputeEndsAt
    );
    event DeathDisputed(uint256 indexed policyId, address indexed disputer, bytes32 indexed evidenceHash);
    event DeathVerified(uint256 indexed policyId, address indexed verifier, bytes32 indexed evidenceHash);
    event DeathRejected(uint256 indexed policyId, address indexed verifier);
    event DeathConsumed(uint256 indexed policyId);

    modifier onlyVerifier() {
        require(msg.sender == verifier, "ONLY_VERIFIER");
        _;
    }

    modifier onlyPolicyManager() {
        require(msg.sender == policyManager, "ONLY_POLICY_MANAGER");
        _;
    }

    constructor(address verifier_) Ownable(msg.sender) {
        require(verifier_ != address(0), "INVALID_VERIFIER");
        verifier = verifier_;
        emit VerifierUpdated(verifier_);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setVerifier(address nextVerifier) external onlyOwner {
        require(nextVerifier != address(0), "INVALID_VERIFIER");
        verifier = nextVerifier;
        emit VerifierUpdated(nextVerifier);
    }

    function setPolicyManager(address nextPolicyManager) external onlyOwner {
        require(nextPolicyManager != address(0), "INVALID_POLICY_MANAGER");
        policyManager = nextPolicyManager;
        emit PolicyManagerUpdated(nextPolicyManager);
    }

    function reportDeath(uint256 policyId, bytes32 evidenceHash) external whenNotPaused {
        require(policyId != 0, "INVALID_POLICY");
        require(evidenceHash != bytes32(0), "INVALID_EVIDENCE");

        DeathReportStatus status = deathReports[policyId].status;
        require(
            status == DeathReportStatus.None ||
                status == DeathReportStatus.Rejected,
            "REPORT_EXISTS"
        );

        uint256 disputeEndsAt = block.timestamp + DISPUTE_WINDOW;
        deathReports[policyId] = DeathReport({
            reporter: msg.sender,
            evidenceHash: evidenceHash,
            reportedAt: block.timestamp,
            disputeEndsAt: disputeEndsAt,
            verifiedAt: 0,
            verifiedBy: address(0),
            status: DeathReportStatus.Reported
        });

        emit DeathReported(policyId, msg.sender, evidenceHash, disputeEndsAt);
    }

    function disputeDeath(uint256 policyId, bytes32 evidenceHash) external whenNotPaused {
        require(evidenceHash != bytes32(0), "INVALID_EVIDENCE");

        DeathReport storage report = deathReports[policyId];
        require(
            report.status == DeathReportStatus.Reported ||
                report.status == DeathReportStatus.Disputed,
            "NOT_DISPUTABLE"
        );
        require(block.timestamp < report.disputeEndsAt, "DISPUTE_WINDOW_CLOSED");

        report.status = DeathReportStatus.Disputed;
        emit DeathDisputed(policyId, msg.sender, evidenceHash);
    }

    function verifyDeath(uint256 policyId) external onlyVerifier whenNotPaused {
        DeathReport storage report = deathReports[policyId];
        require(
            report.status == DeathReportStatus.Reported ||
                report.status == DeathReportStatus.Disputed,
            "NOT_VERIFIABLE"
        );
        require(block.timestamp >= report.disputeEndsAt, "DISPUTE_WINDOW_OPEN");

        report.status = DeathReportStatus.Verified;
        report.verifiedAt = block.timestamp;
        report.verifiedBy = msg.sender;

        emit DeathVerified(policyId, msg.sender, report.evidenceHash);
    }

    function rejectDeath(uint256 policyId) external onlyVerifier whenNotPaused {
        DeathReport storage report = deathReports[policyId];
        require(
            report.status == DeathReportStatus.Reported ||
                report.status == DeathReportStatus.Disputed,
            "NOT_REJECTABLE"
        );

        report.status = DeathReportStatus.Rejected;
        report.verifiedAt = block.timestamp;
        report.verifiedBy = msg.sender;

        emit DeathRejected(policyId, msg.sender);
    }

    function consumeVerifiedDeath(uint256 policyId) external onlyPolicyManager whenNotPaused returns (bytes32 evidenceHash) {
        DeathReport storage report = deathReports[policyId];
        require(report.status == DeathReportStatus.Verified, "DEATH_NOT_VERIFIED");

        evidenceHash = report.evidenceHash;
        report.status = DeathReportStatus.Settled;

        emit DeathConsumed(policyId);
    }

    function isVerified(uint256 policyId) external view returns (bool) {
        return deathReports[policyId].status == DeathReportStatus.Verified;
    }
}
