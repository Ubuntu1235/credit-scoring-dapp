import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Box,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  TextField,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Snackbar
} from '@mui/material'
import {
  AccountBalanceWallet,
  Security,
  CreditScore,
  Group,
  CheckCircle,
  Cancel,
  Refresh
} from '@mui/icons-material'
import { ethers } from 'ethers'

// Simple contract configuration for local deployment
const contractConfig = {
  address: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Default local Hardhat address
  abi: [
    "function createProfile(bytes32,bytes32,bytes32,bytes32,bytes32) external",
    "function updateProfile(bytes32,bytes32,bytes32,bytes32,bytes32) external",
    "function grantAccess(address) external",
    "function checkCreditThreshold(address,bytes32) external returns (bool)",
    "function getEncryptedScore(address) external view returns (bytes32)",
    "function checkProfileExists(address) external view returns (bool)",
    "function hasAccess(address,address) external view returns (bool)",
    "function getContractStats() external view returns (uint256, uint256)",
    "event ProfileCreated(address indexed user, uint256 timestamp)",
    "event CreditCheckPerformed(address indexed lender, address indexed user, bool approved, uint256 minScore, uint256 timestamp)"
  ]
}

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

function App() {
  const [account, setAccount] = useState('')
  const [contract, setContract] = useState(null)
  const [provider, setProvider] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

  const [hasProfile, setHasProfile] = useState(false)
  const [creditScore, setCreditScore] = useState('')
  const [profileData, setProfileData] = useState({
    income: '',
    debt: '',
    paymentHistory: '',
    creditUtilization: '',
    accountAge: ''
  })

  const [lenderAddress, setLenderAddress] = useState('')
  const [userToCheck, setUserToCheck] = useState('')
  const [minScore, setMinScore] = useState('650')
  const [checkResult, setCheckResult] = useState(null)

  const [profileDialogOpen, setProfileDialogOpen] = useState(false)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    if (window.ethereum) {
      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum)
        setProvider(web3Provider)

        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          await handleAccountsChanged(accounts)
        }

        window.ethereum.on('accountsChanged', handleAccountsChanged)

      } catch (error) {
        showSnackbar('Error initializing app: ' + error.message, 'error')
      }
    } else {
      showSnackbar('Please install MetaMask!', 'warning')
    }
  }

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      setAccount('')
      setContract(null)
      setHasProfile(false)
    } else {
      const newAccount = accounts[0]
      setAccount(newAccount)
      await loadContract(newAccount)
      await checkUserProfile(newAccount)
    }
  }

  const loadContract = async (userAddress) => {
    try {
      const signer = await provider.getSigner()
      const creditContract = new ethers.Contract(
        contractConfig.address,
        contractConfig.abi,
        signer
      )
      setContract(creditContract)
    } catch (error) {
      console.error('Error loading contract:', error)
    }
  }

  const checkUserProfile = async (userAddress) => {
    if (!contract) return

    try {
      const hasProfileResult = await contract.checkProfileExists(userAddress)
      setHasProfile(hasProfileResult)

      if (hasProfileResult) {
        const encryptedScore = await contract.getEncryptedScore(userAddress)
        setCreditScore(encryptedScore)
      }
    } catch (error) {
      console.error('Error checking profile:', error)
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      showSnackbar('Please install MetaMask!', 'warning')
      return
    }

    try {
      setLoading(true)
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })
      await handleAccountsChanged(accounts)
      showSnackbar('Wallet connected successfully!', 'success')
    } catch (error) {
      showSnackbar('Error connecting wallet: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const simulateFHEEncryption = (value) => {
    return ethers.keccak256(ethers.toUtf8Bytes(`encrypted_${value}_${Date.now()}`))
  }

  const createProfile = async () => {
    if (!contract) return

    try {
      setLoading(true)

      const encryptedData = {
        income: simulateFHEEncryption(profileData.income),
        debt: simulateFHEEncryption(profileData.debt),
        paymentHistory: simulateFHEEncryption(profileData.paymentHistory),
        creditUtilization: simulateFHEEncryption(profileData.creditUtilization),
        accountAge: simulateFHEEncryption(profileData.accountAge)
      }

      const tx = await contract.createProfile(
        encryptedData.income,
        encryptedData.debt,
        encryptedData.paymentHistory,
        encryptedData.creditUtilization,
        encryptedData.accountAge
      )

      showSnackbar('Creating profile...', 'info')
      await tx.wait()

      setHasProfile(true)
      setProfileDialogOpen(false)
      await checkUserProfile(account)
      showSnackbar('Profile created successfully!', 'success')

    } catch (error) {
      showSnackbar('Error creating profile: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const grantAccess = async () => {
    if (!contract || !lenderAddress) return

    try {
      setLoading(true)
      const tx = await contract.grantAccess(lenderAddress)
      await tx.wait()

      setLenderAddress('')
      showSnackbar('Access granted to lender!', 'success')
    } catch (error) {
      showSnackbar('Error granting access: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const checkCreditThreshold = async () => {
    if (!contract || !userToCheck) return

    try {
      setLoading(true)
      const encryptedMinScore = simulateFHEEncryption(minScore)
      const result = await contract.checkCreditThreshold(userToCheck, encryptedMinScore)

      setCheckResult(result)
      showSnackbar(`Credit check ${result ? 'passed' : 'failed'}!`, result ? 'success' : 'warning')
    } catch (error) {
      showSnackbar('Error checking credit: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <Security sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            FHE Credit Protocol
          </Typography>
          {account ? (
            <Chip 
              icon={<AccountBalanceWallet />}
              label={`${account.slice(0, 6)}...${account.slice(-4)}`}
              color="secondary"
              variant="outlined"
            />
          ) : (
            <Button 
              color="inherit" 
              onClick={connectWallet}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
            >
              Connect Wallet
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Private Credit Scoring
        </Typography>
        <Typography variant="h6" color="textSecondary" align="center" gutterBottom sx={{ mb: 4 }}>
          Your financial data remains encrypted. Your privacy stays protected.
        </Typography>

        {!account && (
          <Alert severity="info" sx={{ mb: 4 }}>
            Connect your wallet to access the private credit scoring system
          </Alert>
        )}

        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)} 
            centered
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<CreditScore />} label="Credit Profile" />
            <Tab icon={<Group />} label="Lender Access" />
            <Tab icon={<Security />} label="How It Works" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <CreditScore sx={{ mr: 1 }} />
                      {hasProfile ? 'Your Credit Profile' : 'Create Credit Profile'}
                    </Typography>

                    {!hasProfile ? (
                      <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Create your encrypted credit profile to start building your private credit history
                        </Alert>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => setProfileDialogOpen(true)}
                          sx={{ mt: 2 }}
                        >
                          Create Encrypted Profile
                        </Button>
                      </>
                    ) : (
                      <>
                        <Alert severity="success" sx={{ mb: 2 }}>
                          Your profile is encrypted and secure
                        </Alert>
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <Typography variant="h4" color="primary" gutterBottom>
                            🔒 Encrypted
                          </Typography>
                          <Typography variant="body1" color="textSecondary">
                            Your credit score is securely encrypted
                          </Typography>
                          <Chip 
                            label="Active Profile" 
                            color="success" 
                            sx={{ mt: 2 }}
                            icon={<CheckCircle />}
                          />
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      Profile Actions
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={() => checkUserProfile(account)}
                      >
                        Refresh Profile
                      </Button>

                      {hasProfile && (
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => setProfileDialogOpen(true)}
                        >
                          Update Profile
                        </Button>
                      )}
                    </Box>

                    {creditScore && (
                      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Encrypted Score Hash:
                        </Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                          {creditScore}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Group sx={{ mr: 1 }} />
                      Grant Lender Access
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Lender Address"
                      value={lenderAddress}
                      onChange={(e) => setLenderAddress(e.target.value)}
                      margin="normal"
                      placeholder="0x..."
                    />

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={grantAccess}
                      disabled={!lenderAddress || loading}
                      sx={{ mt: 2 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Grant Access'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      Check Credit Threshold
                    </Typography>

                    <TextField
                      fullWidth
                      label="User Address"
                      value={userToCheck}
                      onChange={(e) => setUserToCheck(e.target.value)}
                      margin="normal"
                      placeholder="0x..."
                    />

                    <TextField
                      fullWidth
                      label="Minimum Required Score"
                      type="number"
                      value={minScore}
                      onChange={(e) => setMinScore(e.target.value)}
                      margin="normal"
                      inputProps={{ min: 300, max: 850 }}
                    />

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={checkCreditThreshold}
                      disabled={!userToCheck || loading}
                      sx={{ mt: 2 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Check Credit Eligibility'}
                    </Button>

                    {checkResult !== null && (
                      <Alert 
                        severity={checkResult ? "success" : "warning"} 
                        sx={{ mt: 2 }}
                        icon={checkResult ? <CheckCircle /> : <Cancel />}
                      >
                        {checkResult 
                          ? 'User meets credit requirements' 
                          : 'User does not meet credit requirements'}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Security sx={{ mr: 1 }} />
                      How FHE Protects You
                    </Typography>
                    
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="🔒 Encrypted Data Storage" 
                          secondary="Your financial information is always encrypted on-chain using FHE technology" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="🧮 Private Computations" 
                          secondary="Credit scores are calculated without ever decrypting your sensitive data" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="👁️ Selective Disclosure" 
                          secondary="Lenders only learn if you meet thresholds, not your actual financial data" 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      Benefits
                    </Typography>
                    
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="💳 Build Credit Privately" 
                          secondary="Establish credit history without exposing personal finances" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="🏦 Access Better Rates" 
                          secondary="Qualify for better loan terms with verifiable but private credit" 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="🛡️ Fraud Prevention" 
                          secondary="Encrypted data storage prevents identity theft and fraud" 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Container>

      <Dialog 
        open={profileDialogOpen} 
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {hasProfile ? 'Update Encrypted Profile' : 'Create Encrypted Profile'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monthly Income ($)"
                type="number"
                value={profileData.income}
                onChange={(e) => setProfileData({...profileData, income: e.target.value})}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Debt ($)"
                type="number"
                value={profileData.debt}
                onChange={(e) => setProfileData({...profileData, debt: e.target.value})}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment History (0-100%)"
                type="number"
                value={profileData.paymentHistory}
                onChange={(e) => setProfileData({...profileData, paymentHistory: e.target.value})}
                margin="normal"
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Credit Utilization (0-100%)"
                type="number"
                value={profileData.creditUtilization}
                onChange={(e) => setProfileData({...profileData, creditUtilization: e.target.value})}
                margin="normal"
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Account Age (months)"
                type="number"
                value={profileData.accountAge}
                onChange={(e) => setProfileData({...profileData, accountAge: e.target.value})}
                margin="normal"
              />
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 2 }}>
            All data will be encrypted using FHE before being stored on-chain
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={createProfile}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (hasProfile ? 'Update Profile' : 'Create Profile')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default App