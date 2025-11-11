// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FHE Credit Scoring Protocol
 * @dev Privacy-preserving credit scoring system with FHE concepts
 * Features encrypted data storage, private computations, and user-controlled access
 */
contract CreditScoring {
    // Structs
    struct EncryptedProfile {
        bytes32 encryptedIncome;
        bytes32 encryptedDebt;
        bytes32 encryptedPaymentHistory;
        bytes32 encryptedCreditUtilization;
        bytes32 encryptedAccountAge;
        uint256 createdAt;
        bool exists;
    }
    
    struct CreditScore {
        bytes32 encryptedScore;
        uint256 lastUpdated;
        uint256 scoreVersion;
    }
    
    struct LenderRequest {
        address lender;
        uint256 minScore;
        uint256 requestedAt;
        bool approved;
    }
    
    // State variables
    mapping(address => EncryptedProfile) private profiles;
    mapping(address => CreditScore) private creditScores;
    mapping(address => mapping(address => bool)) private accessGrants;
    mapping(address => LenderRequest[]) private lenderRequests;
    mapping(address => uint256) private userNonces;
    
    address public owner;
    uint256 public totalProfiles;
    uint256 public totalCreditChecks;
    
    // Events
    event ProfileCreated(address indexed user, uint256 timestamp);
    event ProfileUpdated(address indexed user, uint256 timestamp);
    event CreditScoreCalculated(address indexed user, bytes32 encryptedScore, uint256 timestamp);
    event AccessGranted(address indexed user, address indexed lender, uint256 timestamp);
    event AccessRevoked(address indexed user, address indexed lender, uint256 timestamp);
    event CreditCheckPerformed(
        address indexed lender, 
        address indexed user, 
        bool approved, 
        uint256 minScore,
        uint256 timestamp
    );
    event LenderRequested(address indexed user, address indexed lender, uint256 minScore, uint256 timestamp);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier profileExists(address _user) {
        require(profiles[_user].exists, "User profile does not exist");
        _;
    }
    
    modifier scoreExists(address _user) {
        require(creditScores[_user].lastUpdated > 0, "No credit score available");
        _;
    }
    
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Invalid address");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        totalProfiles = 0;
        totalCreditChecks = 0;
    }
    
    /**
     * @dev Create user profile with encrypted financial data
     */
    function createProfile(
        bytes32 _encryptedIncome,
        bytes32 _encryptedDebt,
        bytes32 _encryptedPaymentHistory,
        bytes32 _encryptedCreditUtilization,
        bytes32 _encryptedAccountAge
    ) external validAddress(msg.sender) {
        require(!profiles[msg.sender].exists, "Profile already exists");
        require(_encryptedIncome != bytes32(0), "Invalid income data");
        require(_encryptedPaymentHistory != bytes32(0), "Invalid payment history");
        
        profiles[msg.sender] = EncryptedProfile({
            encryptedIncome: _encryptedIncome,
            encryptedDebt: _encryptedDebt,
            encryptedPaymentHistory: _encryptedPaymentHistory,
            encryptedCreditUtilization: _encryptedCreditUtilization,
            encryptedAccountAge: _encryptedAccountAge,
            createdAt: block.timestamp,
            exists: true
        });
        
        totalProfiles++;
        
        // Calculate initial credit score
        _calculateCreditScore(msg.sender);
        
        emit ProfileCreated(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update user profile with new encrypted data
     */
    function updateProfile(
        bytes32 _encryptedIncome,
        bytes32 _encryptedDebt,
        bytes32 _encryptedPaymentHistory,
        bytes32 _encryptedCreditUtilization,
        bytes32 _encryptedAccountAge
    ) external profileExists(msg.sender) {
        require(_encryptedIncome != bytes32(0), "Invalid income data");
        require(_encryptedPaymentHistory != bytes32(0), "Invalid payment history");
        
        profiles[msg.sender].encryptedIncome = _encryptedIncome;
        profiles[msg.sender].encryptedDebt = _encryptedDebt;
        profiles[msg.sender].encryptedPaymentHistory = _encryptedPaymentHistory;
        profiles[msg.sender].encryptedCreditUtilization = _encryptedCreditUtilization;
        profiles[msg.sender].encryptedAccountAge = _encryptedAccountAge;
        
        // Recalculate credit score
        _calculateCreditScore(msg.sender);
        
        emit ProfileUpdated(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Internal function to calculate credit score using FHE-like operations
     */
    function _calculateCreditScore(address _user) internal profileExists(_user) {
        EncryptedProfile memory profile = profiles[_user];
        
        // In a real FHE system, these operations would be performed on encrypted data
        // For demonstration, we simulate FHE operations using hash combinations
        
        // Simulate FHE computation by combining encrypted values
        bytes32 scoreHash = keccak256(abi.encodePacked(
            profile.encryptedIncome,
            profile.encryptedDebt,
            profile.encryptedPaymentHistory,
            profile.encryptedCreditUtilization,
            profile.encryptedAccountAge,
            userNonces[_user]
        ));
        
        // Store the "encrypted" score
        creditScores[_user] = CreditScore({
            encryptedScore: scoreHash,
            lastUpdated: block.timestamp,
            scoreVersion: creditScores[_user].scoreVersion + 1
        });
        
        userNonces[_user]++;
        
        emit CreditScoreCalculated(_user, scoreHash, block.timestamp);
    }
    
    /**
     * @dev Grant access to a specific lender
     */
    function grantAccess(address _lender) external 
        profileExists(msg.sender) 
        validAddress(_lender) 
    {
        require(_lender != msg.sender, "Cannot grant access to self");
        
        accessGrants[msg.sender][_lender] = true;
        
        emit AccessGranted(msg.sender, _lender, block.timestamp);
    }
    
    /**
     * @dev Grant access to multiple lenders at once
     */
    function grantBatchAccess(address[] calldata _lenders) external profileExists(msg.sender) {
        require(_lenders.length > 0, "No lenders provided");
        require(_lenders.length <= 50, "Too many lenders");
        
        for (uint256 i = 0; i < _lenders.length; i++) {
            if (_lenders[i] != address(0) && _lenders[i] != msg.sender) {
                accessGrants[msg.sender][_lenders[i]] = true;
                emit AccessGranted(msg.sender, _lenders[i], block.timestamp);
            }
        }
    }
    
    /**
     * @dev Revoke access from a lender
     */
    function revokeAccess(address _lender) external validAddress(_lender) {
        accessGrants[msg.sender][_lender] = false;
        
        emit AccessRevoked(msg.sender, _lender, block.timestamp);
    }
    
    /**
     * @dev Check if user meets credit threshold without revealing actual score
     */
    function checkCreditThreshold(
        address _user,
        bytes32 _encryptedMinScore
    ) external 
        profileExists(_user) 
        scoreExists(_user) 
        validAddress(_user)
        returns (bool) 
    {
        require(accessGrants[_user][msg.sender], "Access not granted");
        require(_encryptedMinScore != bytes32(0), "Invalid minimum score");
        
        // In real FHE, this would perform encrypted comparison
        // For demo, we simulate by checking if the user has any score
        bool meetsThreshold = creditScores[_user].encryptedScore != bytes32(0);
        
        totalCreditChecks++;
        
        emit CreditCheckPerformed(
            msg.sender, 
            _user, 
            meetsThreshold, 
            uint256(_encryptedMinScore), 
            block.timestamp
        );
        
        return meetsThreshold;
    }
    
    /**
     * @dev Request access to user's credit information
     */
    function requestAccess(address _user, uint256 _minScore) external 
        validAddress(_user) 
        profileExists(_user)
    {
        require(_user != msg.sender, "Cannot request access from self");
        
        lenderRequests[_user].push(LenderRequest({
            lender: msg.sender,
            minScore: _minScore,
            requestedAt: block.timestamp,
            approved: false
        }));
        
        emit LenderRequested(_user, msg.sender, _minScore, block.timestamp);
    }
    
    /**
     * @dev Approve a lender request
     */
    function approveRequest(uint256 _requestIndex) external profileExists(msg.sender) {
        require(_requestIndex < lenderRequests[msg.sender].length, "Invalid request index");
        
        LenderRequest storage request = lenderRequests[msg.sender][_requestIndex];
        require(!request.approved, "Request already approved");
        
        request.approved = true;
        accessGrants[msg.sender][request.lender] = true;
        
        emit AccessGranted(msg.sender, request.lender, block.timestamp);
    }
    
    /**
     * @dev Get user's encrypted credit score
     */
    function getEncryptedScore(address _user) external view 
        profileExists(_user) 
        scoreExists(_user) 
        returns (bytes32) 
    {
        require(accessGrants[_user][msg.sender] || msg.sender == _user, "Access not granted");
        return creditScores[_user].encryptedScore;
    }
    
    /**
     * @dev Get user's profile information (encrypted)
     */
    function getEncryptedProfile(address _user) external view 
        profileExists(_user) 
        returns (EncryptedProfile memory) 
    {
        require(msg.sender == _user, "Can only access own profile");
        return profiles[_user];
    }
    
    /**
     * @dev Check if user has granted access to lender
     */
    function hasAccess(address _user, address _lender) external view 
        validAddress(_user) 
        validAddress(_lender) 
        returns (bool) 
    {
        return accessGrants[_user][_lender];
    }
    
    /**
     * @dev Get pending lender requests for user
     */
    function getPendingRequests() external view returns (LenderRequest[] memory) {
        return lenderRequests[msg.sender];
    }
    
    /**
     * @dev Get user's credit score metadata
     */
    function getScoreMetadata(address _user) external view 
        profileExists(_user) 
        returns (uint256 lastUpdated, uint256 version) 
    {
        require(accessGrants[_user][msg.sender] || msg.sender == _user, "Access not granted");
        return (creditScores[_user].lastUpdated, creditScores[_user].scoreVersion);
    }
    
    /**
     * @dev Check if user has a profile
     */
    function checkProfileExists(address _user) external view returns (bool) {
        return profiles[_user].exists;
    }
    
    /**
     * @dev Get total contract statistics
     */
    function getContractStats() external view returns (uint256 profilesCount, uint256 checksCount) {
        return (totalProfiles, totalCreditChecks);
    }
    
    /**
     * @dev Force recalculate credit score (owner only for emergency cases)
     */
    function recalculateScore(address _user) external onlyOwner profileExists(_user) {
        _calculateCreditScore(_user);
    }
    
    /**
     * @dev Transfer ownership (owner only)
     */
    function transferOwnership(address _newOwner) external onlyOwner validAddress(_newOwner) {
        owner = _newOwner;
    }
}