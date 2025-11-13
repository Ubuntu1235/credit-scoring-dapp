export const CREDIT_SCORING_ABI = [
  "function submitCreditData(bytes _income, bytes _debt, bytes _paymentHistory, bytes _creditUtilization) external",
  "function checkCreditQualification(address _user, uint32 _minScore) external returns (bool)",
  "function registerLender(address _lender) external",
  "function getUserDataStatus(address _user) external view returns (bool)",
  "function getCreditScoreForTesting(address _user) external view returns (uint32)",
  "event CreditDataSubmitted(address indexed user)",
  "event CreditCheckPerformed(address indexed lender, address indexed user, bool qualified)"
];

export const MARKETPLACE_ABI = [
  "function createLoanOffer(uint256 _amount, uint32 _minCreditScore, uint256 _interestRate) external",
  "function applyForLoan(uint256 _offerId) external",
  "function approveLoan(uint256 _applicationId) external",
  "function getActiveOffers() external view returns (uint256[])",
  "function getLoanOffer(uint256 _offerId) external view returns (tuple(address lender, uint256 amount, uint32 minCreditScore, uint256 interestRate, bool active))",
  "function getApplicationsByBorrower(address _borrower) external view returns (uint256[])",
  "event LoanOfferCreated(uint256 offerId, address lender, uint256 amount, uint32 minScore)",
  "event LoanApplied(uint256 applicationId, address borrower, uint256 offerId)",
  "event LoanApproved(uint256 applicationId, address borrower, address lender)"
];
