import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { clientService, companyService, invoiceService } from './services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`dashboard-layout ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="header-top">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "Collapse Menu" : "Expand Menu"}>
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
          {sidebarOpen && (
            <>
              <h2>M.R.GRAY BOARDS</h2>
              <p>Invoice Management</p>
            </>
          )}
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className="nav-item">
            <span className="nav-icon">📊</span>
            {sidebarOpen && <span>Dashboard</span>}
          </Link>
          <Link to="/invoice/new" className="nav-item">
            <span className="nav-icon">➕</span>
            {sidebarOpen && <span>Create Invoice</span>}
          </Link>
          <Link to="/clients" className="nav-item">
            <span className="nav-icon">👥</span>
            {sidebarOpen && <span>Clients</span>}
          </Link>
          <Link to="/companies" className="nav-item">
            <span className="nav-icon">🏢</span>
            {sidebarOpen && <span>Companies</span>}
          </Link>
        </nav>
        <div className="sidebar-footer">
          {sidebarOpen ? (
            <LogoutButton />
          ) : (
            <button onClick={() => {
              if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('admin');
                window.location.href = '/login';
              }
            }} className="btn btn-sm btn-logout-mini" title="Logout">
              ⏻
            </button>
          )}
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('admin', JSON.stringify(data));
        navigate('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>M.R.GRAY BOARDS</h1>
          <p>Admin Login</p>
        </div>
        <form onSubmit={handleLogin}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>
          <div className="form-group password-field">
            <label>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
            <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </span>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="login-footer">
          <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
}

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('OTP sent to your email!');
        setStep(2);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Connection error. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('OTP verified!');
        setStep(3);
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Password reset successfully!');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Reset Password</h1>
          <p>
            {step === 1 && 'Enter your email'}
            {step === 2 && 'Enter OTP'}
            {step === 3 && 'Set new password'}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button type="button" className="btn btn-secondary btn-full" onClick={() => setStep(1)}>
              Back
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" className="btn btn-secondary btn-full" onClick={() => setStep(2)}>
              Back
            </button>
          </form>
        )}

        <div className="login-footer">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const admin = localStorage.getItem('admin');
  const navigate = useNavigate();

  useEffect(() => {
    if (!admin) {
      navigate('/login');
    }
  }, [admin, navigate]);

  if (!admin) return null;
  return children;
}

function LogoutButton() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('admin');
    navigate('/login');
  };
  return <button onClick={handleLogout} className="btn btn-sm btn-logout">Logout</button>;
}

function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await invoiceService.getAll();
      setInvoices(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError('Failed to load invoices. Is the backend running?');
      setInvoices([]);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await invoiceService.delete(id);
      loadInvoices();
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const invDate = inv.invoiceDate;
    const matchesDateFrom = !dateFrom || (invDate && invDate >= dateFrom);
    const matchesDateTo = !dateTo || (invDate && invDate <= dateTo);
    
    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const stats = {
    totalInvoices: filteredInvoices.length,
    totalSales: filteredInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0),
    pending: filteredInvoices.filter(inv => inv.status === 'PENDING').reduce((sum, inv) => sum + (inv.total || 0), 0),
    paid: filteredInvoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + (inv.total || 0), 0),
    totalCGST: filteredInvoices.reduce((sum, inv) => sum + (inv.cgstAmount || 0), 0),
    totalSGST: filteredInvoices.reduce((sum, inv) => sum + (inv.sgstAmount || 0), 0),
    totalTax: filteredInvoices.reduce((sum, inv) => sum + (inv.totalTax || 0), 0),
  };

  const viewInvoiceDetails = async (invoice) => {
    try {
      const fullInvoice = await invoiceService.getById(invoice.id);
      setSelectedInvoice(fullInvoice);
      setShowModal(true);
    } catch (err) {
      alert('Error loading invoice details');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedInvoice(null);
  };

  const printInvoice = (invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print');
      return;
    }
    
    const company = invoice.company || {};
    const client = invoice.client || {};
    const items = invoice.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const cgstTotal = items.reduce((sum, item) => sum + ((item.amount || 0) * (item.cgstRate || 0) / 100), 0);
    const sgstTotal = items.reduce((sum, item) => sum + ((item.amount || 0) * (item.sgstRate || 0) / 100), 0);
    const totalAmount = subtotal + cgstTotal + sgstTotal;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; padding: 15px; background: #fff; }
          .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #2c3e50; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #2980b9 0%, #2c3e50 100%); color: white; padding: 25px; display: flex; justify-content: space-between; }
          .header-left h1 { font-size: 22px; margin-bottom: 5px; letter-spacing: 1px; }
          .header-left p { font-size: 11px; opacity: 0.9; }
          .header-right { text-align: right; }
          .header-right h2 { font-size: 24px; margin-bottom: 10px; font-weight: bold; }
          .header-right p { font-size: 11px; margin: 3px 0; }
          .info-section { display: grid; grid-template-columns: 1fr 1fr; background: #ecf0f1; }
          .info-box { padding: 15px; }
          .info-box:first-child { border-right: 1px solid #bdc3c7; }
          .info-box h3 { color: #2c3e50; font-size: 13px; margin-bottom: 8px; border-bottom: 2px solid #2980b9; padding-bottom: 5px; }
          .info-box p { margin: 4px 0; font-size: 11px; color: #34495e; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #2c3e50; color: white; padding: 10px 6px; font-size: 10px; text-transform: uppercase; }
          td { border: 1px solid #ddd; padding: 8px 6px; font-size: 10px; }
          tr:nth-child(even) { background: #f8f9fa; }
          .text-right { text-align: right; }
          .summary-section { display: grid; grid-template-columns: 2fr 1fr; gap: 0; background: #ecf0f1; }
          .summary-left { padding: 15px; }
          .summary-left p { font-size: 11px; margin: 5px 0; }
          .summary-right { background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 20px; }
          .summary-right .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 12px; }
          .summary-right .total { border-top: 2px solid #3498db; padding-top: 10px; margin-top: 10px; font-size: 18px; font-weight: bold; color: #2ecc71; }
          .terms-section { padding: 15px; background: #f8f9fa; border-top: 1px solid #ddd; }
          .terms-section h4 { color: #2c3e50; font-size: 12px; margin-bottom: 8px; }
          .terms-section p { font-size: 10px; color: #7f8c8d; margin: 3px 0; }
          .signature-section { padding: 30px 15px 15px; display: flex; justify-content: flex-end; }
          .signature-box { text-align: center; min-width: 200px; }
          .signature-box p { font-size: 11px; margin: 5px 0; }
          .footer { text-align: center; padding: 15px; background: #2c3e50; color: white; font-size: 10px; }
          @media print { body { padding: 0; } }
          @page { margin: 10mm; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div class="header-left">
              <h1>${company.name || 'M.R.GRAY BOARDS'}</h1>
              <p>${company.address || ''}</p>
              <p>${company.city || ''}, ${company.state || ''} ${company.zipCode || ''}</p>
              <p>GSTIN: ${company.gstin || '-'}</p>
              <p>Email: ${company.email || '-'} | Ph: ${company.phone || '-'}</p>
            </div>
            <div class="header-right">
              <h2>TAX INVOICE</h2>
              <p>Invoice No: <strong>${invoice.invoiceNumber}</strong></p>
              <p>Date: ${invoice.invoiceDate}</p>
              <p>Due Date: ${invoice.dueDate}</p>
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-box">
              <h3>Bill To</h3>
              <p><strong>${client.name || '-'}</strong></p>
              <p>${client.address || ''}</p>
              <p>${client.city || ''}, ${client.state || ''}</p>
              <p>GSTIN: ${client.gstin || '-'}</p>
              <p>Place of Supply: ${client.placeOfSupply || '-'}</p>
            </div>
            <div class="info-box">
              <h3>Transport Details</h3>
              <p>Transport Mode: ${invoice.transportMode || '-'}</p>
              <p>Vehicle No: ${invoice.vehicleNumber || '-'}</p>
              <p>Date of Supply: ${invoice.dateOfSupply || '-'}</p>
              <p>Place of Supply: ${invoice.placeOfSupply || '-'}</p>
              <p>Reverse Charge: ${invoice.reverseCharge === 'Y' ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width:5%">S.No</th>
                <th style="width:25%">Description</th>
                <th style="width:10%">HSN</th>
                <th style="width:8%">UOM</th>
                <th style="width:7%">Qty</th>
                <th style="width:10%">Rate</th>
                <th style="width:12%">Taxable Value</th>
                <th style="width:5%">CGST%</th>
                <th style="width:8%">CGST Amt</th>
                <th style="width:5%">SGST%</th>
                <th style="width:8%">SGST Amt</th>
                <th style="width:10%">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, i) => {
                const amt = item.amount || 0;
                const cgstAmt = amt * (item.cgstRate || 0) / 100;
                const sgstAmt = amt * (item.sgstRate || 0) / 100;
                return `<tr>
                  <td style="text-align:center">${i + 1}</td>
                  <td>${item.description || ''}</td>
                  <td style="text-align:center">${item.hsnCode || '-'}</td>
                  <td style="text-align:center">${item.uom || 'NOS'}</td>
                  <td style="text-align:center">${item.quantity}</td>
                  <td class="text-right">${(item.unitPrice || 0).toFixed(2)}</td>
                  <td class="text-right">${amt.toFixed(2)}</td>
                  <td style="text-align:center">${item.cgstRate || 0}%</td>
                  <td class="text-right">${cgstAmt.toFixed(2)}</td>
                  <td style="text-align:center">${item.sgstRate || 0}%</td>
                  <td class="text-right">${sgstAmt.toFixed(2)}</td>
                  <td class="text-right"><strong>${(amt + cgstAmt + sgstAmt).toFixed(2)}</strong></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
          
          <div class="summary-section">
            <div class="summary-left">
              <p><strong>GST Payable on Reverse Charge:</strong> ${invoice.reverseCharge === 'Y' ? 'Yes' : 'N/A'}</p>
              ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
            </div>
            <div class="summary-right">
              <div class="row"><span>Taxable Value:</span><span>Rs. ${subtotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
              <div class="row"><span>CGST:</span><span>Rs. ${cgstTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
              <div class="row"><span>SGST:</span><span>Rs. ${sgstTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
              <div class="row total"><span>TOTAL:</span><span>Rs. ${totalAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
            </div>
          </div>
          
          <div class="terms-section">
            <h4>Terms & Conditions</h4>
            <p>1. Payment to be made within due date.</p>
            <p>2. Interest @ 18% p.a. on overdue payments.</p>
            <p>3. Goods once sold will not be taken back.</p>
            <p>4. Dispute subject to local jurisdiction.</p>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <p>For ${company.name || 'M.R.GRAY BOARDS'}</p>
              <br><br><br>
              <p>Authorized Signatory</p>
            </div>
          </div>
          
          <div class="footer">
            <p>This is a computer generated Tax Invoice.</p>
          </div>
        </div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const generatePDF = (invoice) => {
    try {
      console.log('Generating PDF for invoice:', invoice);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = 210;
      const marginLeft = 10;
      const marginRight = 10;
      
      const company = invoice.company || {};
      const client = invoice.client || {};
      const items = invoice.items || [];
      
      if (items.length === 0) {
        alert('No items found in invoice. Please reload the invoice list.');
        return;
      }

      const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
          'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const scales = ['', 'Thousand', 'Lakh', 'Crore'];
        
        if (num === 0) return 'Zero';
        
        const convertChunk = (n) => {
          if (n < 20) return ones[n];
          if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
          return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertChunk(n % 100) : '');
        };
        
        let result = '';
        let chunkCount = 0;
        while (num > 0) {
          if (num % 1000 !== 0) {
            result = convertChunk(num % 1000) + (scales[chunkCount] ? ' ' + scales[chunkCount] : '') + (result ? ' ' + result : '');
          }
          num = Math.floor(num / 1000);
          chunkCount++;
        }
        return result.trim();
      };

      let y = 10;

      const primaryColor = [41, 128, 185];
      const darkColor = [44, 62, 80];
      const lightGray = [236, 240, 241];

      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(company.name || 'M.R.GRAY BOARDS', marginLeft, 15);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      let companyInfo = [];
      if (company.address) companyInfo.push(company.address);
      if (company.city || company.state) companyInfo.push(`${company.city || ''}, ${company.state || ''}`);
      if (company.gstin) companyInfo.push(`GSTIN: ${company.gstin}`);
      if (company.phone) companyInfo.push(`Ph: ${company.phone}`);
      if (company.email) companyInfo.push(`Email: ${company.email}`);
      
      companyInfo.forEach((line, i) => {
        doc.text(line, marginLeft, 22 + (i * 4));
      });
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('TAX INVOICE', pageWidth - marginRight, 13, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: ${invoice.invoiceNumber || '-'}`, pageWidth - marginRight, 21, { align: 'right' });
      doc.text(`Date: ${invoice.invoiceDate || '-'}`, pageWidth - marginRight, 26, { align: 'right' });
      doc.text(`Due Date: ${invoice.dueDate || '-'}`, pageWidth - marginRight, 31, { align: 'right' });

      y = 42;

      doc.setFillColor(...lightGray);
      doc.rect(marginLeft, y, 90, 40, 'F');
      doc.rect(pageWidth - marginRight - 90, y, 90, 40, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', marginLeft + 3, y + 6);
      doc.text('Transport Details:', pageWidth - marginRight - 87, y + 6);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(client.name || '-', marginLeft + 3, y + 14);
      doc.setFont('helvetica', 'normal');
      
      let clientY = y + 20;
      if (client.address) { doc.text(client.address, marginLeft + 3, clientY); clientY += 4; }
      if (client.city || client.state) { doc.text(`${client.city || ''}, ${client.state || ''}`, marginLeft + 3, clientY); clientY += 4; }
      if (client.gstin) { doc.text(`GSTIN: ${client.gstin}`, marginLeft + 3, clientY); clientY += 4; }
      if (client.placeOfSupply) { doc.text(`Place: ${client.placeOfSupply}`, marginLeft + 3, clientY); }
      
      let transportY = y + 20;
      doc.setFontSize(8);
      if (invoice.transportMode) { doc.text(`Mode: ${invoice.transportMode}`, pageWidth - marginRight - 87, transportY); transportY += 5; }
      if (invoice.vehicleNumber) { doc.text(`Vehicle: ${invoice.vehicleNumber}`, pageWidth - marginRight - 87, transportY); transportY += 5; }
      if (invoice.dateOfSupply) { doc.text(`Date: ${invoice.dateOfSupply}`, pageWidth - marginRight - 87, transportY); transportY += 5; }
      if (invoice.placeOfSupply) { doc.text(`Place: ${invoice.placeOfSupply}`, pageWidth - marginRight - 87, transportY); transportY += 5; }
      doc.text(`Reverse Charge: ${invoice.reverseCharge === 'Y' ? 'Yes' : 'No'}`, pageWidth - marginRight - 87, transportY);

      y = 88;

      const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
      const cgstTotal = items.reduce((sum, item) => sum + ((item.amount || 0) * (item.cgstRate || 0) / 100), 0);
      const sgstTotal = items.reduce((sum, item) => sum + ((item.amount || 0) * (item.sgstRate || 0) / 100), 0);
      const totalTax = cgstTotal + sgstTotal;
      const totalAmount = subtotal + totalTax;

      const tableData = items.map((item, index) => {
        const amount = (item.amount || 0);
        const cgstAmt = amount * (item.cgstRate || 0) / 100;
        const sgstAmt = amount * (item.sgstRate || 0) / 100;
        const itemTotal = amount + cgstAmt + sgstAmt;
        return [
          index + 1,
          item.description || '',
          item.hsnCode || '-',
          item.uom || 'NOS',
          item.quantity || 0,
          (item.unitPrice || 0).toFixed(2),
          amount.toFixed(2),
          `${item.cgstRate || 0}%`,
          cgstAmt.toFixed(2),
          `${item.sgstRate || 0}%`,
          sgstAmt.toFixed(2),
          itemTotal.toFixed(2)
        ];
      });
      
      autoTable(doc, {
        startY: y,
        head: [[
          'S.No', 'Description', 'HSN Code', 'UOM', 'Qty', 'Rate (Rs.)', 
          'Taxable Value', 'CGST%', 'CGST (Rs.)', 'SGST%', 'SGST (Rs.)', 'Total (Rs.)'
        ]],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 2, halign: 'center' },
        headStyles: { 
          fontSize: 7, 
          fillColor: darkColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left', cellWidth: 35 },
          2: { halign: 'center', cellWidth: 18 },
          3: { halign: 'center', cellWidth: 12 },
          4: { halign: 'center', cellWidth: 10 },
          5: { halign: 'right', cellWidth: 18 },
          6: { halign: 'right', cellWidth: 20 },
          7: { halign: 'center', cellWidth: 12 },
          8: { halign: 'right', cellWidth: 18 },
          9: { halign: 'center', cellWidth: 12 },
          10: { halign: 'right', cellWidth: 18 },
          11: { halign: 'right', cellWidth: 20 }
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        margin: { left: marginLeft, right: marginRight },
        theme: 'grid'
      });

      const finalY = doc.lastAutoTable.finalY + 5;

      doc.setFillColor(...lightGray);
      doc.rect(marginLeft, finalY, 110, 50, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Amount in Words:', marginLeft + 3, finalY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const amountInWords = numberToWords(Math.floor(totalAmount));
      doc.text(`${amountInWords} Rupees Only`, marginLeft + 3, finalY + 15);
      
      doc.setFontSize(7);
      doc.text('GST Payable on Reverse Charge:', marginLeft + 3, finalY + 24);
      doc.text(invoice.reverseCharge === 'Y' ? 'Yes' : 'N/A', marginLeft + 50, finalY + 24);
      
      if (invoice.notes) {
        doc.setFontSize(7);
        doc.text('Notes:', marginLeft + 3, finalY + 34);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.notes.substring(0, 80), marginLeft + 3, finalY + 41);
        if (invoice.notes.length > 80) {
          doc.text(invoice.notes.substring(80, 160), marginLeft + 3, finalY + 47);
        }
      }

      doc.setFillColor(...darkColor);
      doc.rect(125, finalY, 75, 50, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      
      doc.text('Summary', 162.5, finalY + 8, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      doc.text('Taxable Value:', 128, finalY + 18);
      doc.text(`Rs. ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 197, finalY + 18, { align: 'right' });
      
      doc.text('CGST:', 128, finalY + 26);
      doc.text(`Rs. ${cgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 197, finalY + 26, { align: 'right' });
      
      doc.text('SGST:', 128, finalY + 34);
      doc.text(`Rs. ${sgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 197, finalY + 34, { align: 'right' });
      
      doc.setDrawColor(255, 255, 255);
      doc.line(128, finalY + 38, 197, finalY + 38);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL:', 128, finalY + 46);
      doc.text(`Rs. ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 197, finalY + 46, { align: 'right' });

      const termsY = finalY + 58;
      doc.setDrawColor(0, 0, 0);
      doc.setFillColor(245, 245, 245);
      doc.rect(marginLeft, termsY, pageWidth - marginLeft - marginRight, 20, 'FD');
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions:', marginLeft + 3, termsY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text('1. Payment within due date.', marginLeft + 3, termsY + 10);
      doc.text('2. Interest @ 18% p.a. on overdue.', marginLeft + 3, termsY + 15);
      doc.text('3. Goods once sold - no return.', 110, termsY + 10);
      doc.text('4. Dispute - local jurisdiction.', 110, termsY + 15);

      const sigY = 270;
      doc.setDrawColor(0, 0, 0);
      doc.line(marginLeft, sigY, pageWidth - marginRight, sigY);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('For ' + (company.name || 'M.R.GRAY BOARDS'), pageWidth - marginRight, sigY + 8, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text('Authorized Signatory', pageWidth - marginRight, sigY + 16, { align: 'right' });
      doc.text('(Signature)', pageWidth - marginRight, sigY + 28, { align: 'right' });

      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text('This is a computer generated Tax Invoice.', pageWidth / 2, 285, { align: 'center' });

      doc.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      alert('Error generating PDF: ' + error.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total-invoices">
          <div className="card-icon">📋</div>
          <div className="card-content">
            <span className="card-label">Total Invoices</span>
            <span className="card-value">{stats.totalInvoices}</span>
          </div>
        </div>
        <div className="summary-card total-sales">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <span className="card-label">Total Sales</span>
            <span className="card-value">Rs. {stats.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="summary-card pending">
          <div className="card-icon">⏳</div>
          <div className="card-content">
            <span className="card-label">Pending</span>
            <span className="card-value">Rs. {stats.pending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="summary-card paid">
          <div className="card-icon">✅</div>
          <div className="card-content">
            <span className="card-label">Paid</span>
            <span className="card-value">Rs. {stats.paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="summary-card cgst">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <span className="card-label">CGST</span>
            <span className="card-value">Rs. {stats.totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="summary-card sgst">
          <div className="card-icon">📉</div>
          <div className="card-content">
            <span className="card-label">SGST</span>
            <span className="card-value">Rs. {stats.totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search by Invoice # or Client Name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="date-filters">
          <div className="date-filter-group">
            <label>From:</label>
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="date-filter-group">
            <label>To:</label>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="btn btn-sm btn-clear">
              Clear
            </button>
          )}
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="invoice-list">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Date</th>
              <th>Taxable Value</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map(invoice => (
              <tr key={invoice.id}>
                <td><span className="invoice-link" onClick={() => viewInvoiceDetails(invoice)}>{invoice.invoiceNumber}</span></td>
                <td>{invoice.client?.name || 'N/A'}</td>
                <td>{invoice.invoiceDate}</td>
                <td>Rs. {(invoice.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>Rs. {(invoice.cgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>Rs. {(invoice.sgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="total-cell">Rs. {(invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td><span className={`status status-${invoice.status?.toLowerCase()}`}>{invoice.status}</span></td>
                <td className="actions">
                  <Link to={`/invoice/${invoice.id}`} className="btn btn-sm">Edit</Link>
                  <button onClick={() => generatePDF(invoice)} className="btn btn-sm btn-success" title="Download PDF">PDF</button>
                  <button onClick={() => printInvoice(invoice)} className="btn btn-sm btn-print" title="Print Invoice">Print</button>
                  <button onClick={() => handleDelete(invoice.id)} className="btn btn-sm btn-danger" title="Delete">X</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredInvoices.length === 0 && <p className="no-data">No invoices found. Create your first invoice!</p>}
      </div>

      {/* Invoice Detail Modal */}
      {showModal && selectedInvoice && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invoice Details - {selectedInvoice.invoiceNumber}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="invoice-detail-grid">
                <div className="detail-section">
                  <h3>Invoice Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Invoice Number:</span>
                    <span className="detail-value">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Invoice Date:</span>
                    <span className="detail-value">{selectedInvoice.invoiceDate}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Due Date:</span>
                    <span className="detail-value">{selectedInvoice.dueDate}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className={`status status-${selectedInvoice.status?.toLowerCase()}`}>{selectedInvoice.status}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Client Details</h3>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedInvoice.client?.name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{selectedInvoice.client?.address || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">GSTIN:</span>
                    <span className="detail-value">{selectedInvoice.client?.gstin || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Place of Supply:</span>
                    <span className="detail-value">{selectedInvoice.client?.placeOfSupply || 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Transport Details</h3>
                  <div className="detail-row">
                    <span className="detail-label">Transport Mode:</span>
                    <span className="detail-value">{selectedInvoice.transportMode || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Vehicle Number:</span>
                    <span className="detail-value">{selectedInvoice.vehicleNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date of Supply:</span>
                    <span className="detail-value">{selectedInvoice.dateOfSupply || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Place of Supply:</span>
                    <span className="detail-value">{selectedInvoice.placeOfSupply || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="items-table-modal">
                <h3>Invoice Items</h3>
                <table>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Description</th>
                      <th>HSN</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Taxable</th>
                      <th>CGST%</th>
                      <th>CGST Amt</th>
                      <th>SGST%</th>
                      <th>SGST Amt</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((item, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{item.description}</td>
                        <td>{item.hsnCode || '-'}</td>
                        <td>{item.quantity} {item.uom}</td>
                        <td>Rs. {item.unitPrice?.toFixed(2)}</td>
                        <td>Rs. {item.amount?.toFixed(2)}</td>
                        <td>{item.cgstRate}%</td>
                        <td>Rs. {((item.amount || 0) * (item.cgstRate || 0) / 100).toFixed(2)}</td>
                        <td>{item.sgstRate}%</td>
                        <td>Rs. {((item.amount || 0) * (item.sgstRate || 0) / 100).toFixed(2)}</td>
                        <td>Rs. {((item.amount || 0) + 
                          ((item.amount || 0) * (item.cgstRate || 0) / 100) + 
                          ((item.amount || 0) * (item.sgstRate || 0) / 100)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="totals-summary">
                <div className="totals-row">
                  <span>Total Taxable Value:</span>
                  <span>Rs. {(selectedInvoice.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="totals-row">
                  <span>CGST:</span>
                  <span>Rs. {(selectedInvoice.cgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="totals-row">
                  <span>SGST:</span>
                  <span>Rs. {(selectedInvoice.sgstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="totals-row grand-total">
                  <span>Grand Total:</span>
                  <span>Rs. {(selectedInvoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="notes-section">
                  <h3>Notes</h3>
                  <p>{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => { closeModal(); generatePDF(selectedInvoice); }} className="btn btn-success">Download PDF</button>
              <button onClick={() => { closeModal(); printInvoice(selectedInvoice); }} className="btn btn-print-modal">Print Invoice</button>
              <Link to={`/invoice/${selectedInvoice.id}`} className="btn btn-primary" onClick={closeModal}>Edit Invoice</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientList() {
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', country: '', gstin: '', placeOfSupply: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const data = await clientService.getAll();
    setClients(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await clientService.update(editingClient.id, formData);
      } else {
        await clientService.create(formData);
      }
      setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', country: '', gstin: '', placeOfSupply: '' });
      setShowForm(false);
      setEditingClient(null);
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error saving client: ' + (error.message || 'Unknown error'));
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData(client);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this client?')) {
      await clientService.delete(id);
      loadClients();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Manage Clients</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingClient(null); setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', country: '', gstin: '', placeOfSupply: '' }); }} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Add Client'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-section">
          <h3>{editingClient ? 'Edit Client' : 'New Client'}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Address</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="form-group">
              <label>City</label>
              <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
            </div>
            <div className="form-group">
              <label>State</label>
              <input type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>PIN Code</label>
              <input type="text" value={formData.zipCode} onChange={(e) => setFormData({...formData, zipCode: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input type="text" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>GSTIN</label>
              <input type="text" value={formData.gstin || ''} onChange={(e) => setFormData({...formData, gstin: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Place of Supply</label>
              <input type="text" value={formData.placeOfSupply || ''} onChange={(e) => setFormData({...formData, placeOfSupply: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">{editingClient ? 'Update' : 'Create'} Client</button>
        </form>
      )}

      <div className="invoice-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td>{client.email}</td>
                <td>{client.phone}</td>
                <td>{client.address}, {client.city}</td>
                <td className="actions">
                  <button onClick={() => handleEdit(client)} className="btn btn-sm">Edit</button>
                  <button onClick={() => handleDelete(client.id)} className="btn btn-sm btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && <p className="no-data">No clients found. Add your first client!</p>}
      </div>
    </div>
  );
}

function CompanyList() {
  const [companies, setCompanies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', country: '', taxNumber: '', logoUrl: '', gstin: '', placeOfSupply: '', gstin: '', placeOfSupply: ''
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const data = await companyService.getAll();
    setCompanies(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await companyService.update(editingCompany.id, formData);
      } else {
        await companyService.create(formData);
      }
      setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', country: '', taxNumber: '', logoUrl: '', gstin: '', placeOfSupply: '' });
      setShowForm(false);
      setEditingCompany(null);
      loadCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Error saving company: ' + (error.message || 'Unknown error'));
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData(company);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this company?')) {
      await companyService.delete(id);
      loadCompanies();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Manage Companies</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingCompany(null); setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', country: '', taxNumber: '', logoUrl: '', gstin: '', placeOfSupply: '' }); }} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Add Company'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-section">
          <h3>{editingCompany ? 'Edit Company' : 'New Company'}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Company Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Address</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="form-group">
              <label>City</label>
              <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
            </div>
            <div className="form-group">
              <label>State</label>
              <input type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>PIN Code</label>
              <input type="text" value={formData.zipCode} onChange={(e) => setFormData({...formData, zipCode: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input type="text" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Tax Number</label>
              <input type="text" value={formData.taxNumber} onChange={(e) => setFormData({...formData, taxNumber: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>GSTIN</label>
              <input type="text" value={formData.gstin || ''} onChange={(e) => setFormData({...formData, gstin: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">{editingCompany ? 'Update' : 'Create'} Company</button>
        </form>
      )}

      <div className="invoice-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Tax Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.email}</td>
                <td>{company.phone}</td>
                <td>{company.taxNumber}</td>
                <td className="actions">
                  <button onClick={() => handleEdit(company)} className="btn btn-sm">Edit</button>
                  <button onClick={() => handleDelete(company.id)} className="btn btn-sm btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {companies.length === 0 && <p className="no-data">No companies found. Add your first company!</p>}
      </div>
    </div>
  );
}

function InvoiceForm() {
  const { id } = useParams();
  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [invoice, setInvoice] = useState({
    clientId: '',
    companyId: 1,
    invoiceDate: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    notes: '',
    transportMode: '',
    vehicleNumber: '',
    placeOfSupply: '',
    reverseCharge: 'N',
    dateOfSupply: '',
    items: [{ description: '', hsnCode: '4802', uom: 'NOS', quantity: 1, unitPrice: 0, amount: 0, cgstRate: 5, sgstRate: 5, igstRate: 0 }]
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadData();
    if (id) {
      loadInvoice(id);
    }
  }, [id]);

  const loadData = async () => {
    const [clientsData, companiesData] = await Promise.all([
      clientService.getAll(),
      companyService.getAll()
    ]);
    setClients(clientsData);
    setCompanies(companiesData);
    if (companiesData.length > 0) {
      setInvoice(prev => ({ ...prev, companyId: companiesData[0].id }));
    }
  };

  const loadInvoice = async (id) => {
    try {
      const data = await invoiceService.getById(id);
      console.log('Loaded invoice data:', data);
      setInvoice({
        invoiceNumber: data.invoiceNumber || '',
        clientId: data.client?.id || '',
        companyId: data.company?.id || 1,
        invoiceDate: data.invoiceDate || '',
        status: data.status || 'PENDING',
        notes: data.notes || '',
        transportMode: data.transportMode || '',
        vehicleNumber: data.vehicleNumber || '',
        placeOfSupply: data.placeOfSupply || '',
        reverseCharge: data.reverseCharge || 'N',
        dateOfSupply: data.dateOfSupply || '',
        items: data.items?.length > 0 ? data.items.map(item => ({
          id: item.id,
          description: item.description || '',
          hsnCode: item.hsnCode || '4802',
          uom: item.uom || 'NOS',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          amount: item.amount || 0,
          cgstRate: item.cgstRate || 5,
          sgstRate: item.sgstRate || 5,
          igstRate: item.igstRate || 0
        })) : [{ description: '', hsnCode: '4802', uom: 'NOS', quantity: 1, unitPrice: 0, amount: 0, cgstRate: 5, sgstRate: 5, igstRate: 0 }]
      });
      setIsEditing(true);
      setEditingId(id);
    } catch (err) {
      console.error('Error loading invoice:', err);
      alert('Error loading invoice: ' + (err.message || 'Unknown error'));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...invoice.items];
    newItems[index][field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
      newItems[index].taxableValue = newItems[index].amount;
      const cgst = newItems[index].amount * (newItems[index].cgstRate || 0) / 100;
      const sgst = newItems[index].amount * (newItems[index].sgstRate || 0) / 100;
      const igst = newItems[index].amount * (newItems[index].igstRate || 0) / 100;
      newItems[index].cgstAmount = cgst;
      newItems[index].sgstAmount = sgst;
      newItems[index].igstAmount = igst;
    }
    setInvoice({ ...invoice, items: newItems });
  };

  const addItem = () => {
    setInvoice({ 
      ...invoice, 
      items: [...invoice.items, { description: '', hsnCode: '4802', uom: 'NOS', quantity: 1, unitPrice: 0, amount: 0, cgstRate: 5, sgstRate: 5, igstRate: 0 }] 
    });
  };

  const removeItem = (index) => {
    const newItems = invoice.items.filter((_, i) => i !== index);
    setInvoice({ ...invoice, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const cgstAmount = invoice.items.reduce((sum, item) => sum + ((item.amount || 0) * (item.cgstRate || 0) / 100), 0);
    const sgstAmount = invoice.items.reduce((sum, item) => sum + ((item.amount || 0) * (item.sgstRate || 0) / 100), 0);
    const igstAmount = invoice.items.reduce((sum, item) => sum + ((item.amount || 0) * (item.igstRate || 0) / 100), 0);
    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const total = subtotal + totalTax;
    return { subtotal, cgstAmount, sgstAmount, igstAmount, totalTax, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { subtotal, cgstAmount, sgstAmount, igstAmount, totalTax, total } = calculateTotals();
    
    const { dueDate, ...invoiceWithoutDueDate } = invoice;
    
    const invoiceData = {
      ...invoiceWithoutDueDate,
      items: invoice.items.map(item => ({
        ...item,
        amount: item.quantity * item.unitPrice,
        taxableValue: item.quantity * item.unitPrice,
        cgstAmount: (item.quantity * item.unitPrice) * (item.cgstRate || 0) / 100,
        sgstAmount: (item.quantity * item.unitPrice) * (item.sgstRate || 0) / 100,
        igstAmount: (item.quantity * item.unitPrice) * (item.igstRate || 0) / 100
      })),
      subtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      total
    };

    if (isEditing) {
      await invoiceService.update(editingId, invoiceData);
      window.location.href = '/';
    } else {
      await invoiceService.create(invoiceData);
      const ewayBillConfirmed = window.confirm('Invoice created successfully!\n\nClick OK to open E-Way Bill Portal (https://ewaybillgst.gov.in/)');
      if (ewayBillConfirmed) {
        window.open('https://ewaybillgst.gov.in/', '_blank');
      }
      window.location.href = '/';
    }
  };

  const { subtotal, cgstAmount, sgstAmount, igstAmount, totalTax, total } = calculateTotals();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{isEditing ? 'Edit Invoice' : 'Create Invoice'}</h1>
        <button type="button" onClick={() => window.location.href = '/'} className="btn btn-cancel">
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Invoice Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Client</label>
              <select value={invoice.clientId} onChange={(e) => setInvoice({...invoice, clientId: Number(e.target.value)})} required>
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Invoice Date</label>
              <input type="date" value={invoice.invoiceDate} onChange={(e) => setInvoice({...invoice, invoiceDate: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={invoice.status} onChange={(e) => setInvoice({...invoice, status: e.target.value})}>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Transport Mode</label>
              <input type="text" value={invoice.transportMode || ''} onChange={(e) => setInvoice({...invoice, transportMode: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Vehicle Number</label>
              <input type="text" value={invoice.vehicleNumber || ''} onChange={(e) => setInvoice({...invoice, vehicleNumber: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Place of Supply</label>
              <input type="text" value={invoice.placeOfSupply || ''} onChange={(e) => setInvoice({...invoice, placeOfSupply: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Reverse Charge</label>
              <select value={invoice.reverseCharge || 'N'} onChange={(e) => setInvoice({...invoice, reverseCharge: e.target.value})}>
                <option value="N">N</option>
                <option value="Y">Y</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date of Supply</label>
              <input type="date" value={invoice.dateOfSupply || ''} onChange={(e) => setInvoice({...invoice, dateOfSupply: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Invoice Items</h3>
          <table className="items-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Description</th>
                <th>HSN</th>
                <th>UOM</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Taxable Value</th>
                <th colSpan="2">CGST</th>
                <th colSpan="2">SGST</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
              <tr className="sub-header">
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Rate</th>
                <th>Amount</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => {
                const cgstAmt = (item.amount || 0) * (item.cgstRate || 0) / 100;
                const sgstAmt = (item.amount || 0) * (item.sgstRate || 0) / 100;
                const itemTotal = (item.amount || 0) + cgstAmt + sgstAmt;
                return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td><input type="text" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required /></td>
                  <td><span style={{padding: '4px 8px', background: '#e8f4f8', borderRadius: '4px', fontWeight: 'bold'}}>4802</span></td>
                  <td><input type="text" value={item.uom || 'NOS'} onChange={(e) => handleItemChange(index, 'uom', e.target.value)} style={{width: '60px'}} /></td>
                  <td><input type="number" min="1" placeholder="0" value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)} style={{width: '60px'}} required /></td>
                  <td><input type="number" step="0.01" placeholder="0" value={item.unitPrice || ''} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} style={{width: '80px'}} required /></td>
                  <td>Rs. {item.amount?.toFixed(2) || '0.00'}</td>
                  <td>Rs. {item.amount?.toFixed(2) || '0.00'}</td>
                  <td><input type="number" step="0.01" value={item.cgstRate || 0} onChange={(e) => handleItemChange(index, 'cgstRate', parseFloat(e.target.value) || 0)} style={{width: '50px'}} /></td>
                  <td>Rs. {cgstAmt.toFixed(2)}</td>
                  <td><input type="number" step="0.01" value={item.sgstRate || 0} onChange={(e) => handleItemChange(index, 'sgstRate', parseFloat(e.target.value) || 0)} style={{width: '50px'}} /></td>
                  <td>Rs. {sgstAmt.toFixed(2)}</td>
                  <td>Rs. {itemTotal.toFixed(2)}</td>
                  <td><button type="button" onClick={() => removeItem(index)} className="btn btn-sm btn-danger" disabled={invoice.items.length === 1}>X</button></td>
                </tr>
              )})}
            </tbody>
          </table>
          
          <div className="invoice-totals">
            <table>
              <tbody>
                <tr>
                  <td>Total amount of Before Tax</td>
                  <td>Rs. {invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>CGST</td>
                  <td>Rs. {invoice.items.reduce((sum, item) => sum + ((item.amount || 0) * (item.cgstRate || 0) / 100), 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>SGST</td>
                  <td>Rs. {invoice.items.reduce((sum, item) => sum + ((item.amount || 0) * (item.sgstRate || 0) / 100), 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Tax Amount (GST)</td>
                  <td>Rs. {(invoice.items.reduce((sum, item) => sum + ((item.amount || 0) * (item.cgstRate || 0) / 100), 0) + invoice.items.reduce((sum, item) => sum + ((item.amount || 0) * (item.sgstRate || 0) / 100), 0)).toFixed(2)}</td>
                </tr>
                <tr className="grand-total">
                  <td>Total Amount of A or Tax</td>
                  <td>Rs. {invoice.items.reduce((sum, item) => {
                    const cgst = ((item.amount || 0) * (item.cgstRate || 0) / 100);
                    const sgst = ((item.amount || 0) * (item.sgstRate || 0) / 100);
                    return sum + (item.amount || 0) + cgst + sgst;
                  }, 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>GST Payable of Reverse Charge</td>
                  <td>NA</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <button type="button" onClick={addItem} className="btn btn-add-item">+ Add Item</button>
          <div style={{clear: 'both'}}></div>
        </div>

        <div className="form-section">
          <h3>Notes</h3>
          <textarea value={invoice.notes} onChange={(e) => setInvoice({...invoice, notes: e.target.value})} rows="3" placeholder="Enter any additional notes..." />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{isEditing ? 'Update Invoice' : 'Create Invoice'}</button>
        </div>
      </form>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><Layout><ClientList /></Layout></ProtectedRoute>} />
          <Route path="/companies" element={<ProtectedRoute><Layout><CompanyList /></Layout></ProtectedRoute>} />
          <Route path="/invoice/new" element={<ProtectedRoute><Layout><InvoiceForm /></Layout></ProtectedRoute>} />
          <Route path="/invoice/:id" element={<ProtectedRoute><Layout><InvoiceForm /></Layout></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
