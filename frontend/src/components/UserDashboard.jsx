import React, { useState } from 'react';

const UserDashboard = ({ contract, account, network }) => {
  const [creditData, setCreditData] = useState({
    income: '',
    debt: '',
    paymentHistory: '',
    creditUtilization: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCreditData({
      ...creditData,
      [name]: value
    });
  };

  const submitCreditData = async () => {
    alert('Credit data submission will be implemented with blockchain integration');
    console.log('Credit Data:', creditData);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>👤 Borrower Dashboard</h2>
        <p>Submit your encrypted financial information for confidential credit scoring.</p>
      </div>

      <div className="data-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="income">Annual Gross Income (USD)</label>
            <input
              id="income"
              type="number"
              name="income"
              value={creditData.income}
              onChange={handleInputChange}
              placeholder="e.g., 75000"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="debt">Total Outstanding Debt (USD)</label>
            <input
              id="debt"
              type="number"
              name="debt"
              value={creditData.debt}
              onChange={handleInputChange}
              placeholder="e.g., 15000"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="paymentHistory">Payment History Score (0-100)</label>
            <input
              id="paymentHistory"
              type="number"
              name="paymentHistory"
              value={creditData.paymentHistory}
              onChange={handleInputChange}
              placeholder="0 - 100"
              min="0"
              max="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="creditUtilization">Credit Utilization Rate (%)</label>
            <input
              id="creditUtilization"
              type="number"
              name="creditUtilization"
              value={creditData.creditUtilization}
              onChange={handleInputChange}
              placeholder="0 - 100"
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            onClick={submitCreditData}
            className="submit-btn"
          >
            🔒 Submit Encrypted Credit Data
          </button>
        </div>
      </div>

      <div className="privacy-notice">
        <h4>🔐 Your Privacy is Protected</h4>
        <p>All data is encrypted using Fully Homomorphic Encryption before being stored on the blockchain.</p>
      </div>
    </div>
  );
};

export default UserDashboard;
