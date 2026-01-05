// index.js - Main Express application
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Constants
const ATLANTIC_API_URL = 'https://atlantich2h.com';
const PTERODACTYL_API_URL = 'https://panel.yourdomain.com/api'; // Change this
const PORT = process.env.PORT || 3000;

// File paths
const CONFIG_FILE = path.join(process.cwd(), 'config.json');

// In-memory storage for Vercel compatibility
const ordersStore = new Map();

// Initialize config file if it doesn't exist
async function initializeFiles() {
  try {
    const fs = require('fs');
    await fs.promises.access(CONFIG_FILE);
  } catch {
    const defaultConfig = {
      atlanticApiKey: process.env.ATLANTIC_API_KEY || '',
      pterodactylApiKey: process.env.PTERODACTYL_API_KEY || '',
      pterodactylPanelUrl: 'https://panel.yourdomain.com',
      qrisCallbackUrl: 'https://yourdomain.com/api/webhook',
      locationId: 1,
      eggId: 15,
      packages: [
        { id: 1, name: '1GB Starter', ram: 1024, price: 15000 },
        { id: 2, name: '2GB Basic', ram: 2048, price: 25000 },
        { id: 3, name: '4GB Pro', ram: 4096, price: 45000 },
        { id: 4, name: '8GB Advanced', ram: 8192, price: 85000 },
        { id: 5, name: '16GB Premium', ram: 16384, price: 165000 }
      ]
    };
    const fs = require('fs');
    await fs.promises.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
  }
}

// Order management - using in-memory storage for Vercel
function saveOrder(order) {
  ordersStore.set(order.reff_id, order);
  return order;
}

function updateOrder(reffId, updates) {
  const existingOrder = ordersStore.get(reffId);
  if (!existingOrder) return null;
  
  const updatedOrder = { ...existingOrder, ...updates };
  ordersStore.set(reffId, updatedOrder);
  return updatedOrder;
}

function getOrder(reffId) {
  return ordersStore.get(reffId) || null;
}

// Load config helper
async function loadConfig() {
  const fs = require('fs');
  const configData = await fs.promises.readFile(CONFIG_FILE, 'utf8');
  return JSON.parse(configData);
}

// Generate unique reference ID
function generateReffId() {
  return `WEB_SYAFA_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// Main routes
app.get('/', async (req, res) => {
  const config = await loadConfig();
  
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WEB SYAFA STORE - Pterodactyl Server Hosting</title>
    <style>
      :root {
        --primary: #6366f1;
        --primary-dark: #4f46e5;
        --secondary: #1e293b;
        --background: #0f172a;
        --card: #1e293b;
        --text: #f1f5f9;
        --text-muted: #94a3b8;
        --success: #10b981;
        --warning: #f59e0b;
        --danger: #ef4444;
        --border: #334155;
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        background: var(--background);
        color: var(--text);
        line-height: 1.6;
        min-height: 100vh;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      
      header {
        text-align: center;
        padding: 2rem 0;
        border-bottom: 1px solid var(--border);
        margin-bottom: 2rem;
      }
      
      .logo {
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
      }
      
      .tagline {
        color: var(--text-muted);
        font-size: 1.1rem;
      }
      
      .main-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }
      
      @media (max-width: 768px) {
        .main-layout {
          grid-template-columns: 1fr;
        }
      }
      
      .section {
        background: var(--card);
        border-radius: 12px;
        padding: 2rem;
        border: 1px solid var(--border);
      }
      
      .section-title {
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
        color: var(--text);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .section-title svg {
        width: 24px;
        height: 24px;
      }
      
      .packages-grid {
        display: grid;
        gap: 1rem;
      }
      
      .package-card {
        background: rgba(30, 41, 59, 0.5);
        border: 2px solid transparent;
        border-radius: 8px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .package-card:hover {
        border-color: var(--primary);
        transform: translateY(-2px);
      }
      
      .package-card.selected {
        border-color: var(--primary);
        background: rgba(99, 102, 241, 0.1);
      }
      
      .package-name {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }
      
      .package-specs {
        color: var(--text-muted);
        font-size: 0.9rem;
        margin-bottom: 1rem;
      }
      
      .package-price {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary);
      }
      
      .form-group {
        margin-bottom: 1.5rem;
      }
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--text-muted);
        font-weight: 500;
      }
      
      input, select {
        width: 100%;
        padding: 0.75rem 1rem;
        background: rgba(15, 23, 42, 0.5);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text);
        font-size: 1rem;
        transition: border-color 0.3s ease;
      }
      
      input:focus, select:focus {
        outline: none;
        border-color: var(--primary);
      }
      
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
      }
      
      .btn:hover {
        background: var(--primary-dark);
        transform: translateY(-1px);
      }
      
      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      .btn-secondary {
        background: transparent;
        border: 1px solid var(--border);
      }
      
      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      
      .hidden {
        display: none !important;
      }
      
      .payment-section {
        text-align: center;
      }
      
      .qris-container {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        display: inline-block;
        margin: 1rem 0;
      }
      
      #qrisImage {
        max-width: 300px;
        height: auto;
      }
      
      .payment-info {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid var(--success);
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
      }
      
      .credentials-box {
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid var(--primary);
        border-radius: 8px;
        padding: 1.5rem;
        margin: 1rem 0;
      }
      
      .credential-item {
        margin: 0.5rem 0;
        font-family: monospace;
        background: rgba(0, 0, 0, 0.3);
        padding: 0.5rem;
        border-radius: 4px;
      }
      
      .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0.5rem 0;
      }
      
      .status-pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
      .status-processing { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
      .status-success { background: rgba(16, 185, 129, 0.2); color: #10b981; }
      .status-failed { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
      
      .loading {
        text-align: center;
        padding: 2rem;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(99, 102, 241, 0.3);
        border-radius: 50%;
        border-top-color: var(--primary);
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .error-message {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid var(--danger);
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
        color: var(--danger);
      }
      
      .step-indicator {
        display: flex;
        justify-content: space-between;
        margin: 2rem 0;
        position: relative;
      }
      
      .step-indicator::before {
        content: '';
        position: absolute;
        top: 20px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--border);
        z-index: 1;
      }
      
      .step {
        position: relative;
        z-index: 2;
        text-align: center;
        flex: 1;
      }
      
      .step-number {
        width: 40px;
        height: 40px;
        background: var(--card);
        border: 2px solid var(--border);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 0.5rem;
        font-weight: 600;
        transition: all 0.3s ease;
      }
      
      .step.active .step-number {
        background: var(--primary);
        border-color: var(--primary);
        color: white;
      }
      
      .step-label {
        font-size: 0.875rem;
        color: var(--text-muted);
      }
      
      .step.active .step-label {
        color: var(--text);
      }
      
      .footer {
        text-align: center;
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid var(--border);
        color: var(--text-muted);
        font-size: 0.875rem;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <div class="logo">WEB SYAFA STORE</div>
        <div class="tagline">Premium Pterodactyl Server Hosting</div>
      </header>
      
      <div class="step-indicator">
        <div class="step active" id="step1">
          <div class="step-number">1</div>
          <div class="step-label">Select Package</div>
        </div>
        <div class="step" id="step2">
          <div class="step-number">2</div>
          <div class="step-label">Payment</div>
        </div>
        <div class="step" id="step3">
          <div class="step-number">3</div>
          <div class="step-label">Server Ready</div>
        </div>
      </div>
      
      <div class="main-layout">
        <!-- Left Column: Package Selection & Form -->
        <div class="section" id="selectionSection">
          <h2 class="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Select Your Package
          </h2>
          
          <div class="packages-grid" id="packagesContainer">
            <!-- Packages will be loaded here -->
          </div>
          
          <form id="orderForm">
            <div class="form-group">
              <label for="panelUsername">Panel Username</label>
              <input type="text" id="panelUsername" name="panelUsername" required placeholder="Enter your desired username">
            </div>
            
            <div class="form-group">
              <label for="customerEmail">Email Address (Optional)</label>
              <input type="email" id="customerEmail" name="customerEmail" placeholder="For notifications">
            </div>
            
            <button type="submit" class="btn" id="submitOrderBtn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Continue to Payment
            </button>
          </form>
        </div>
        
        <!-- Right Column: Payment & Results -->
        <div class="section" id="paymentSection" style="display: none;">
          <h2 class="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Complete Your Payment
          </h2>
          
          <div id="paymentContent">
            <!-- Payment content will be loaded here -->
          </div>
          
          <button class="btn btn-secondary" id="backToSelectionBtn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            Back to Package Selection
          </button>
        </div>
      </div>
      
      <div class="footer">
        <p>© 2024 WEB SYAFA STORE. All rights reserved.</p>
        <p>Need help? Contact our support team</p>
      </div>
    </div>
    
    <script>
      let selectedPackage = null;
      let currentOrderId = null;
      let checkInterval = null;
      
      // Load packages
      async function loadPackages() {
        const response = await fetch('/api/packages');
        const packages = await response.json();
        
        const container = document.getElementById('packagesContainer');
        container.innerHTML = '';
        
        packages.forEach(pkg => {
          const card = document.createElement('div');
          card.className = 'package-card';
          card.innerHTML = \`
            <div class="package-name">\${pkg.name}</div>
            <div class="package-specs">
              RAM: \${pkg.ram}MB | Disk: \${pkg.ram}MB | CPU: \${Math.round(pkg.ram / 512)} Cores
            </div>
            <div class="package-price">Rp \${pkg.price.toLocaleString('id-ID')}</div>
          \`;
          
          card.addEventListener('click', () => {
            document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedPackage = pkg;
          });
          
          container.appendChild(card);
        });
      }
      
      // Submit order
      document.getElementById('orderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedPackage) {
          alert('Please select a package first');
          return;
        }
        
        const username = document.getElementById('panelUsername').value.trim();
        const email = document.getElementById('customerEmail').value.trim();
        
        if (!username) {
          alert('Please enter a panel username');
          return;
        }
        
        const submitBtn = document.getElementById('submitOrderBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div> Processing...';
        
        try {
          const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packageId: selectedPackage.id,
              panelUsername: username,
              customerEmail: email
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            currentOrderId = result.order.reff_id;
            showPaymentSection(result);
            updateStep(2);
          } else {
            alert(result.error || 'Failed to create order');
          }
        } catch (error) {
          alert('Network error. Please try again.');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = \`
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            Continue to Payment
          \`;
        }
      });
      
      // Show payment section
      function showPaymentSection(data) {
        document.getElementById('selectionSection').style.display = 'none';
        document.getElementById('paymentSection').style.display = 'block';
        
        const content = document.getElementById('paymentContent');
        
        if (data.qrisUrl) {
          content.innerHTML = \`
            <div class="payment-info">
              <h3>Scan QRIS to Pay</h3>
              <p>Order ID: \${currentOrderId}</p>
              <p>Amount: <strong>Rp \${data.amount.toLocaleString('id-ID')}</strong></p>
              <p>Status: <span class="status-badge status-pending">Pending</span></p>
              <p>Complete payment within 15 minutes</p>
            </div>
            
            <div class="qris-container">
              <img id="qrisImage" src="\${data.qrisUrl}" alt="QRIS Code">
            </div>
            
            <div class="loading" id="paymentLoading">
              <div class="spinner"></div>
              <p>Waiting for payment confirmation...</p>
            </div>
            
            <div id="paymentResult" style="display: none;"></div>
          \`;
          
          // Start checking payment status
          startPaymentCheck();
        } else {
          content.innerHTML = \`
            <div class="error-message">
              Failed to generate payment. Please try again.
            </div>
          \`;
        }
      }
      
      // Check payment status
      async function checkPaymentStatus() {
        try {
          const response = await fetch(\`/api/order-status/\${currentOrderId}\`);
          const result = await response.json();
          
          if (result.success) {
            const order = result.order;
            
            if (order.status === 'success') {
              showPaymentSuccess(order);
              stopPaymentCheck();
            } else if (order.status === 'processing') {
              showProcessingStatus();
            } else if (order.status === 'failed') {
              showPaymentFailed(order.error || 'Payment failed');
              stopPaymentCheck();
            }
          }
        } catch (error) {
          console.error('Error checking payment:', error);
        }
      }
      
      function startPaymentCheck() {
        checkInterval = setInterval(checkPaymentStatus, 5000); // Check every 5 seconds
      }
      
      function stopPaymentCheck() {
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
      }
      
      function showProcessingStatus() {
        const loading = document.getElementById('paymentLoading');
        if (loading) {
          loading.innerHTML = \`
            <div class="spinner"></div>
            <p>Payment received! Creating your server...</p>
            <p><span class="status-badge status-processing">Processing</span></p>
          \`;
        }
      }
      
      function showPaymentSuccess(order) {
        const content = document.getElementById('paymentContent');
        content.innerHTML = \`
          <div class="payment-info">
            <h3>✅ Payment Successful!</h3>
            <p>Your server is now ready to use.</p>
          </div>
          
          <div class="credentials-box">
            <h4>Server Credentials</h4>
            <div class="credential-item">
              <strong>Panel URL:</strong><br>
              <a href="\${order.panel_domain}" target="_blank">\${order.panel_domain}</a>
            </div>
            <div class="credential-item">
              <strong>Username:</strong><br>
              \${order.panel_username}
            </div>
            <div class="credential-item">
              <strong>Password:</strong><br>
              \${order.panel_password}
            </div>
            <div class="credential-item">
              <strong>Server Specs:</strong><br>
              RAM: \${order.ram}MB | Disk: \${order.disk}MB | CPU: \${order.cpu} Cores
            </div>
          </div>
          
          <div class="payment-info">
            <p><strong>Important:</strong> Save these credentials securely. They won't be shown again.</p>
            <button class="btn" onclick="window.location.reload()">Buy Another Server</button>
          </div>
        \`;
        
        updateStep(3);
      }
      
      function showPaymentFailed(error) {
        const content = document.getElementById('paymentContent');
        content.innerHTML = \`
          <div class="error-message">
            <h3>❌ Payment Failed</h3>
            <p>\${error}</p>
            <button class="btn" onclick="window.location.reload()">Try Again</button>
          </div>
        \`;
      }
      
      // Navigation
      document.getElementById('backToSelectionBtn').addEventListener('click', () => {
        document.getElementById('selectionSection').style.display = 'block';
        document.getElementById('paymentSection').style.display = 'none';
        stopPaymentCheck();
        updateStep(1);
      });
      
      function updateStep(stepNumber) {
        document.querySelectorAll('.step').forEach((step, index) => {
          if (index + 1 === stepNumber) {
            step.classList.add('active');
          } else {
            step.classList.remove('active');
          }
        });
      }
      
      // Initialize
      document.addEventListener('DOMContentLoaded', () => {
        loadPackages();
        updateStep(1);
      });
    </script>
  </body>
  </html>
  `;
  
  res.send(html);
});

// API Routes
app.get('/api/packages', async (req, res) => {
  try {
    const config = await loadConfig();
    res.json(config.packages);
  } catch (error) {
    console.error('Error loading packages:', error);
    res.status(500).json({ error: 'Failed to load packages' });
  }
});

app.post('/api/create-order', async (req, res) => {
  try {
    const { packageId, panelUsername, customerEmail } = req.body;
    
    // Load config and packages
    const config = await loadConfig();
    const selectedPackage = config.packages.find(p => p.id === parseInt(packageId));
    
    if (!selectedPackage) {
      return res.status(400).json({ error: 'Invalid package selected' });
    }
    
    // Generate unique reference ID
    const reffId = generateReffId();
    
    // Create order object
    const order = {
      reff_id: reffId,
      package_id: selectedPackage.id,
      package_name: selectedPackage.name,
      ram: selectedPackage.ram,
      disk: selectedPackage.ram, // Same as RAM
      cpu: Math.round(selectedPackage.ram / 512), // Proportional CPU
      price: selectedPackage.price,
      panel_username: panelUsername,
      customer_email: customerEmail || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payment_method: 'qris',
      panel_domain: '',
      panel_password: '',
      error_message: ''
    };
    
    // Create Atlantic H2H deposit using form-urlencoded format
    const atlanticResponse = await axios.post(
      `${ATLANTIC_API_URL}/deposit/create`,
      new URLSearchParams({
        api_key: config.atlanticApiKey,
        reff_id: reffId,
        nominal: selectedPackage.price.toString(),
        type: 'ewallet',
        method: 'qris'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (atlanticResponse.data.status === true) {
      // Use correct field names from Atlantic H2H API
      order.qris_url = atlanticResponse.data.data.qr_image;
      order.qris_content = atlanticResponse.data.data.qr_string;
      order.atlantic_transaction_id = atlanticResponse.data.data.id;
      
      saveOrder(order);
      
      res.json({
        success: true,
        order: order,
        qrisUrl: order.qris_url,
        amount: selectedPackage.price
      });
    } else {
      throw new Error('Failed to create Atlantic deposit');
    }
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.message || error.message || 'Failed to create order' 
    });
  }
});

app.get('/api/order-status/:reffId', async (req, res) => {
  try {
    const order = await getOrder(req.params.reffId);
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order status' });
  }
});

// Webhook endpoint
app.post('/api/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;
    
    // Verify it's a deposit event
    if (event !== 'deposit') {
      return res.status(400).json({ success: false, error: 'Invalid event type' });
    }
    
    // Verify payment success
    if (data.status !== 'success') {
      console.log('Payment not successful:', data.status);
      return res.json({ success: false, error: 'Payment not successful' });
    }
    
    const reffId = data.reff_id;
    
    // Check if order already processed
    const existingOrder = await getOrder(reffId);
    if (!existingOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    if (existingOrder.status === 'success' || existingOrder.status === 'processing') {
      return res.json({ success: false, error: 'Order already processed' });
    }
    
    // Update order to processing
    await updateOrder(reffId, {
      status: 'processing',
      updated_at: new Date().toISOString(),
      atlantic_transaction_id: data.transaction_id
    });
    
    try {
      // Create Pterodactyl user
      const config = await loadConfig();
      const password = crypto.randomBytes(8).toString('hex');
      
      const userResponse = await axios.post(
        `${PTERODACTYL_API_URL}/application/users`,
        {
          username: existingOrder.panel_username,
          email: existingOrder.customer_email || `${existingOrder.panel_username}@web-syafa-store.com`,
          first_name: existingOrder.panel_username,
          last_name: 'Customer',
          password: password
        },
        {
          headers: {
            'Authorization': `Bearer ${config.pterodactylApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      const userId = userResponse.data.attributes.id;
      
      // Create server
      const serverResponse = await axios.post(
        `${PTERODACTYL_API_URL}/application/servers`,
        {
          name: `${existingOrder.panel_username}-${existingOrder.package_name}`,
          user: userId,
          egg: config.eggId,
          docker_image: 'ghcr.io/pterodactyl/yolks:nodejs_18',
          startup: 'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} != "0" ]]; then git pull; fi; if [[ ! -z {{NODE_PACKAGES}} ]]; then /usr/local/bin/npm install {{NODE_PACKAGES}}; fi; if [[ ! -z {{NODE_PACKAGES}} ]]; then /usr/local/bin/npm install {{NODE_PACKAGES}}; fi; /usr/local/bin/node {{NODE_JS_FILE}}',
          environment: {
            AUTO_UPDATE: '0',
            NODE_PACKAGES: '',
            NODE_JS_FILE: 'index.js'
          },
          limits: {
            memory: existingOrder.ram,
            swap: 0,
            disk: existingOrder.disk,
            io: 500,
            cpu: existingOrder.cpu * 100
          },
          feature_limits: {
            databases: 5,
            backups: 2,
            allocations: 1
          },
          allocation: {
            default: config.locationId
          },
          deploy: {
            locations: [config.locationId],
            dedicated_ip: false,
            port_range: []
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${config.pterodactylApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      // Update order with success details
      await updateOrder(reffId, {
        status: 'success',
        panel_domain: config.pterodactylPanelUrl,
        panel_password: password,
        user_id: userId,
        server_id: serverResponse.data.attributes.id,
        updated_at: new Date().toISOString()
      });
      
    } catch (panelError) {
      console.error('Pterodactyl error:', panelError);
      
      // Update order with failure
      await updateOrder(reffId, {
        status: 'failed',
        error_message: panelError.response?.data?.errors?.[0]?.detail || 'Failed to create server',
        updated_at: new Date().toISOString()
      });
      
      return res.status(500).json({ 
        success: false, 
        error: 'Panel creation failed' 
      });
    }
    
    res.json({ success: true, message: 'Payment processed successfully' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
  await initializeFiles();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('WEB SYAFA STORE Payment Gateway');
    console.log('Configure your API keys in config.json or environment variables');
  });
}

startServer();

// Export for Vercel
module.exports = app;