const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FHE Credit Scoring Contract", function () {
  let CreditScoring, creditScoring;
  let owner, user1, user2, user3, lender1, lender2, lender3;

  // Test encrypted data (proper bytes32 format - exactly 64 hex characters)
  const encryptedData = {
    income: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    debt: "0x234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1",
    paymentHistory: "0x34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
    utilization: "0x4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123",
    accountAge: "0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234",
    minScore: "0x000000000000000000000000000000000000000000000000000000000000028a" // 650 in hex
  };

  beforeEach(async function () {
    [owner, user1, user2, user3, lender1, lender2, lender3] = await ethers.getSigners();
    
    CreditScoring = await ethers.getContractFactory("CreditScoring");
    creditScoring = await CreditScoring.deploy();
    
    await creditScoring.waitForDeployment();
  });

  describe("Contract Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await creditScoring.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero profiles", async function () {
      const [profilesCount] = await creditScoring.getContractStats();
      expect(profilesCount).to.equal(0);
    });
  });

  describe("Profile Management", function () {
    it("Should create a user profile successfully", async function () {
      const tx = await creditScoring.connect(user1).createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );

      await expect(tx)
        .to.emit(creditScoring, "ProfileCreated")
        .withArgs(user1.address, await time.latest());

      expect(await creditScoring.checkProfileExists(user1.address)).to.be.true;
      
      const [profilesCount] = await creditScoring.getContractStats();
      expect(profilesCount).to.equal(1);
    });

    it("Should calculate credit score on profile creation", async function () {
      await creditScoring.connect(user1).createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );

      const encryptedScore = await creditScoring.connect(user1).getEncryptedScore(user1.address);
      expect(encryptedScore).to.not.equal(ethers.ZeroHash);
      
      const [lastUpdated, version] = await creditScoring.connect(user1).getScoreMetadata(user1.address);
      expect(lastUpdated).to.be.greaterThan(0);
      expect(version).to.equal(1);
    });

    it("Should update user profile", async function () {
      await creditScoring.connect(user1).createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );

      const newIncome = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      const tx = await creditScoring.connect(user1).updateProfile(
        newIncome,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );

      await expect(tx)
        .to.emit(creditScoring, "ProfileUpdated")
        .withArgs(user1.address, await time.latest());
    });

    it("Should prevent duplicate profile creation", async function () {
      await creditScoring.connect(user1).createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );

      await expect(
        creditScoring.connect(user1).createProfile(
          encryptedData.income,
          encryptedData.debt,
          encryptedData.paymentHistory,
          encryptedData.utilization,
          encryptedData.accountAge
        )
      ).to.be.revertedWith("Profile already exists");
    });

    it("Should validate profile data", async function () {
      await expect(
        creditScoring.connect(user1).createProfile(
          ethers.ZeroHash,
          encryptedData.debt,
          encryptedData.paymentHistory,
          encryptedData.utilization,
          encryptedData.accountAge
        )
      ).to.be.revertedWith("Invalid income data");

      await expect(
        creditScoring.connect(user1).createProfile(
          encryptedData.income,
          encryptedData.debt,
          ethers.ZeroHash,
          encryptedData.utilization,
          encryptedData.accountAge
        )
      ).to.be.revertedWith("Invalid payment history");
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      await creditScoring.connect(user1).createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );
    });

    it("Should grant access to single lender", async function () {
      const tx = await creditScoring.connect(user1).grantAccess(lender1.address);
      
      await expect(tx)
        .to.emit(creditScoring, "AccessGranted")
        .withArgs(user1.address, lender1.address, await time.latest());

      expect(await creditScoring.hasAccess(user1.address, lender1.address)).to.be.true;
    });

    it("Should grant batch access to multiple lenders", async function () {
      const lenders = [lender1.address, lender2.address, lender3.address];
      const tx = await creditScoring.connect(user1).grantBatchAccess(lenders);
      
      expect(await creditScoring.hasAccess(user1.address, lender1.address)).to.be.true;
      expect(await creditScoring.hasAccess(user1.address, lender2.address)).to.be.true;
      expect(await creditScoring.hasAccess(user1.address, lender3.address)).to.be.true;
    });

    it("Should revoke lender access", async function () {
      await creditScoring.connect(user1).grantAccess(lender1.address);
      
      const tx = await creditScoring.connect(user1).revokeAccess(lender1.address);
      
      await expect(tx)
        .to.emit(creditScoring, "AccessRevoked")
        .withArgs(user1.address, lender1.address, await time.latest());

      expect(await creditScoring.hasAccess(user1.address, lender1.address)).to.be.false;
    });

    it("Should prevent self-access grant", async function () {
      await expect(
        creditScoring.connect(user1).grantAccess(user1.address)
      ).to.be.revertedWith("Cannot grant access to self");
    });
  });

  describe("Credit Checks", function () {
    beforeEach(async function () {
      await creditScoring.connect(user1).createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );
      await creditScoring.connect(user1).grantAccess(lender1.address);
    });

    it("Should perform credit threshold check", async function () {
      const tx = await creditScoring.connect(lender1).checkCreditThreshold(
        user1.address,
        encryptedData.minScore
      );

      // Just check that the event is emitted without specific parameters
      await expect(tx).to.emit(creditScoring, "CreditCheckPerformed");

      const [, checksCount] = await creditScoring.getContractStats();
      expect(checksCount).to.equal(1);
    });

    it("Should prevent unauthorized credit checks", async function () {
      await expect(
        creditScoring.connect(lender2).checkCreditThreshold(user1.address, encryptedData.minScore)
      ).to.be.revertedWith("Access not granted");
    });

    it("Should validate credit check parameters", async function () {
      await expect(
        creditScoring.connect(lender1).checkCreditThreshold(user1.address, ethers.ZeroHash)
      ).to.be.revertedWith("Invalid minimum score");
    });
  });

  describe("Lender Requests", function () {
    beforeEach(async function () {
      await creditScoring.connect(user1).createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );
    });

    it("Should allow lenders to request access", async function () {
      const tx = await creditScoring.connect(lender1).requestAccess(user1.address, 700);
      
      await expect(tx)
        .to.emit(creditScoring, "LenderRequested")
        .withArgs(user1.address, lender1.address, 700, await time.latest());

      const requests = await creditScoring.connect(user1).getPendingRequests();
      expect(requests.length).to.equal(1);
      expect(requests[0].lender).to.equal(lender1.address);
      expect(requests[0].minScore).to.equal(700);
      expect(requests[0].approved).to.be.false;
    });

    it("Should allow users to approve lender requests", async function () {
      await creditScoring.connect(lender1).requestAccess(user1.address, 700);
      
      const tx = await creditScoring.connect(user1).approveRequest(0);
      
      await expect(tx)
        .to.emit(creditScoring, "AccessGranted")
        .withArgs(user1.address, lender1.address, await time.latest());

      const requests = await creditScoring.connect(user1).getPendingRequests();
      expect(requests[0].approved).to.be.true;
      expect(await creditScoring.hasAccess(user1.address, lender1.address)).to.be.true;
    });
  });

  describe("Data Privacy", function () {
    beforeEach(async function () {
      await creditScoring.connect(user1).createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );
    });

    it("Should only allow users to access their own profile", async function () {
      await expect(
        creditScoring.connect(user2).getEncryptedProfile(user1.address)
      ).to.be.revertedWith("Can only access own profile");
    });

    it("Should only allow authorized lenders to access scores", async function () {
      await expect(
        creditScoring.connect(lender1).getEncryptedScore(user1.address)
      ).to.be.revertedWith("Access not granted");

      await creditScoring.connect(user1).grantAccess(lender1.address);
      
      const score = await creditScoring.connect(lender1).getEncryptedScore(user1.address);
      expect(score).to.not.equal(ethers.ZeroHash);
    });

    it("Should only allow authorized access to score metadata", async function () {
      await expect(
        creditScoring.connect(lender1).getScoreMetadata(user1.address)
      ).to.be.revertedWith("Access not granted");

      await creditScoring.connect(user1).grantAccess(lender1.address);
      
      const [lastUpdated, version] = await creditScoring.connect(lender1).getScoreMetadata(user1.address);
      expect(lastUpdated).to.be.greaterThan(0);
      expect(version).to.equal(1);
    });
  });

  describe("Admin Functions", function () {
    beforeEach(async function () {
      await creditScoring.connect(user1).createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );
    });

    it("Should allow owner to recalculate scores", async function () {
      const originalData = await creditScoring.connect(user1).getScoreMetadata(user1.address);
      const originalVersion = Number(originalData[1]);
      
      const tx = await creditScoring.connect(owner).recalculateScore(user1.address);
      await tx.wait();
      
      const newData = await creditScoring.connect(user1).getScoreMetadata(user1.address);
      const newVersion = Number(newData[1]);
      expect(newVersion).to.equal(originalVersion + 1);
    });

    it("Should prevent non-owners from recalculating scores", async function () {
      await expect(
        creditScoring.connect(user1).recalculateScore(user1.address)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should allow owner to transfer ownership", async function () {
      await creditScoring.connect(owner).transferOwnership(user2.address);
      expect(await creditScoring.owner()).to.equal(user2.address);
    });

    it("Should prevent non-owners from transferring ownership", async function () {
      await expect(
        creditScoring.connect(user1).transferOwnership(user2.address)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple users", async function () {
      // User 1
      await creditScoring.connect(user1).createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );

      // User 2 with different data (proper bytes32 format - exactly 64 hex chars)
      const user2Data = {
        income: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
        debt: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
        paymentHistory: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
        utilization: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
        accountAge: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba"
      };

      await creditScoring.connect(user2).createProfile(
        user2Data.income,
        user2Data.debt,
        user2Data.paymentHistory,
        user2Data.utilization,
        user2Data.accountAge
      );

      expect(await creditScoring.checkProfileExists(user1.address)).to.be.true;
      expect(await creditScoring.checkProfileExists(user2.address)).to.be.true;

      const [profilesCount] = await creditScoring.getContractStats();
      expect(profilesCount).to.equal(2);
    });

    it("Should handle large batch operations", async function () {
      const lenders = [];
      for (let i = 0; i < 5; i++) {
        const wallet = ethers.Wallet.createRandom();
        lenders.push(wallet.address);
      }

      await creditScoring.connect(user1).createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );

      await creditScoring.connect(user1).grantBatchAccess(lenders);

      for (let lender of lenders) {
        expect(await creditScoring.hasAccess(user1.address, lender)).to.be.true;
      }
    });

    it("Should handle zero address validation", async function () {
      await expect(
        creditScoring.connect(user1).createProfile(
          encryptedData.income,
          encryptedData.debt,
          encryptedData.paymentHistory,
          encryptedData.utilization,
          encryptedData.accountAge
        )
      ).to.not.be.reverted;

      await expect(
        creditScoring.connect(user1).grantAccess(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Contract Statistics", function () {
    it("Should track profile and check counts correctly", async function () {
      const [initialProfiles, initialChecks] = await creditScoring.getContractStats();
      expect(initialProfiles).to.equal(0);
      expect(initialChecks).to.equal(0);

      // Create profile
      await creditScoring.connect(user1).createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );

      const [afterCreateProfiles, afterCreateChecks] = await creditScoring.getContractStats();
      expect(afterCreateProfiles).to.equal(1);
      expect(afterCreateChecks).to.equal(0);

      // Grant access and perform check
      await creditScoring.connect(user1).grantAccess(lender1.address);
      await creditScoring.connect(lender1).checkCreditThreshold(
        user1.address,
        encryptedData.minScore
      );

      const [finalProfiles, finalChecks] = await creditScoring.getContractStats();
      expect(finalProfiles).to.equal(1);
      expect(finalChecks).to.equal(1);
    });
  });

  // Simple functionality test to ensure basic operations work
  describe("Basic Functionality", function () {
    it("Should perform complete user journey", async function () {
      // 1. User creates profile
      await creditScoring.connect(user1).createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.utilization,
        encryptedData.accountAge
      );

      // 2. Check profile exists
      expect(await creditScoring.checkProfileExists(user1.address)).to.be.true;

      // 3. User grants access to lender
      await creditScoring.connect(user1).grantAccess(lender1.address);

      // 4. Lender checks credit threshold - just verify it doesn't revert
      const tx = await creditScoring.connect(lender1).checkCreditThreshold(
        user1.address,
        encryptedData.minScore
      );

      // Wait for transaction to complete
      await tx.wait();

      // 5. Verify stats updated
      const [profiles, checks] = await creditScoring.getContractStats();
      expect(profiles).to.equal(1);
      expect(checks).to.equal(1);
    });
  });
});