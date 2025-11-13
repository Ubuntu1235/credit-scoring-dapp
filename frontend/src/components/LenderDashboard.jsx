import React, { useState } from 'react';

const LenderDashboard = ({ contract, marketplaceContract, account, network }) => {
  const [loanOffer, setLoanOffer] = useState({
    amount: '',
    minCreditScore: '',
    interestRate: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoanOffer({
      ...loanOffer,
      [name]: value
    });
  };

  const createLoanOffer = async () => {
    alert('Loan offer creation will be implemented with blockchain integration');
    console.log('Loan Offer:', loanOffer);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>🏦 Lender Portal</h2>
        <p>Create confidential loan offers and evaluate borrowers using FHE technology.</p>
      </div>

      <div className="data-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="amount">Loan Amount (ETH)</label>
            <input
              id="amount"
              type="number"
              name="amount"
              value={loanOffer.amount}
              onChange={handleInputChange}
              placeholder="e.g., 1.5"
              step="0.1"
              min="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="minCreditScore">Minimum Credit Score</label>
            <input
              id="minCreditScore"
              type="number"
              name="minCreditScore"
              value={loanOffer.minCreditScore}
              onChange={handleInputChange}
              placeholder="e.g., 650"
              min="300"
              max="850"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="interestRate">Annual Interest Rate (basis points)</label>
            <input
              id="interestRate"
              type="number"
              name="interestRate"
              value={loanOffer.interestRate}
              onChange={handleInputChange}
              placeholder="e.g., 500 for 5%"
              min="0"
              max="2000"
            />
            <small>100 basis points = 1% annual interest</small>
          </div>

          <div className="form-preview">
            <div className="preview-card">
              <h4>Offer Preview</h4>
              <div className="preview-details">
                <div className="preview-item">
                  <span>Loan Amount:</span>
                  <strong>{loanOffer.amount || '0'} ETH</strong>
                </div>
                <div className="preview-item">
                  <span>Min Credit Score:</span>
                  <strong>{loanOffer.minCreditScore || 'N/A'}</strong>
                </div>
                <div className="preview-item">
                  <span>Interest Rate:</span>
                  <strong>
                    {loanOffer.interestRate ? (loanOffer.interestRate / 100).toFixed(2) + '%' : 'N/A'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            onClick={createLoanOffer}
            className="submit-btn"
          >
            📄 Publish Loan Offer
          </button>
        </div>
      </div>
    </div>
  );
};

export default LenderDashboard;
