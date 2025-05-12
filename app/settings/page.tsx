'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Header from '../components/Header';

import { stablecoins } from '../data/stablecoins';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'payment', 'security', 'notifications'

  // Use wagmi for wallet connection state (consistent with rest of app)
  const { address, isConnected } = useAccount();
  const [account, setAccount] = useState('');

  // Form states
  const [businessName, setBusinessName] = useState('Neda Merchant Store');
  const [businessEmail, setBusinessEmail] = useState('merchant@example.com');
  const [businessPhone, setBusinessPhone] = useState('+255 123 456 789');
  const [businessCategory, setBusinessCategory] = useState('retail');
  const [businessDescription, setBusinessDescription] = useState('We sell a variety of products and accept TSHC and other local stablecoins.');
  
  // Payment settings
  const [autoSettlement, setAutoSettlement] = useState(true);
  const [settlementThreshold, setSettlementThreshold] = useState('1000');
  const [settlementCurrency, setSettlementCurrency] = useState('TSHC');
  const [paymentExpiry, setPaymentExpiry] = useState('60'); // minutes
  
  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [withdrawalConfirmation, setWithdrawalConfirmation] = useState(true);
  const [transactionNotifications, setTransactionNotifications] = useState(true);
  
  useEffect(() => {
    setMounted(true);
    if (address) {
      setAccount(address);
    }
  }, [address]);

  // Redirect to dashboard only after mounted and not connected
  useEffect(() => {
    if (mounted && !isConnected) {
      window.location.href = '/dashboard';
    }
  }, [mounted, isConnected]);

  const saveSettings = () => {
    // TODO: Integrate with backend API for real persistence
    const settings = {
      businessName,
      businessEmail,
      businessPhone,
      businessCategory,
      businessDescription,
      autoSettlement,
      settlementThreshold,
      settlementCurrency,
      paymentExpiry,
      twoFactorEnabled,
      withdrawalConfirmation,
      transactionNotifications,
    };
    localStorage.setItem(`merchant_settings_${account}`, JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  if (!mounted) return null;
  
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
        <Header />
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 gradient-text">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your merchant account settings
            </p>
          </div>

          {/* Wallet Connection Prompt */}
        {!isConnected && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8 text-center">
            <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-2">Connect Your Wallet</h2>
            <p className="text-blue-600 dark:text-blue-400 mb-4">Connect your wallet to access your merchant settings</p>
          </div>
        )}
        {isConnected && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Settings Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg h-fit">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Settings</h2>
              </div>
              
              <div className="p-4">
                <nav className="space-y-1">
                  <button
                    className={`w-full text-left px-4 py-2 rounded-lg ${
                      activeTab === 'profile'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                    onClick={() => setActiveTab('profile')}
                  >
                    Business Profile
                  </button>
                  
                  <button
                    className={`w-full text-left px-4 py-2 rounded-lg ${
                      activeTab === 'payment'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                    onClick={() => setActiveTab('payment')}
                  >
                    Payment Settings
                  </button>
                  
                  <button
                    className={`w-full text-left px-4 py-2 rounded-lg ${
                      activeTab === 'security'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                    onClick={() => setActiveTab('security')}
                  >
                    Security
                  </button>
                  
                  <button
                    className={`w-full text-left px-4 py-2 rounded-lg ${
                      activeTab === 'notifications'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    Notifications
                  </button>
                  
                  <button
                    className={`w-full text-left px-4 py-2 rounded-lg ${
                      activeTab === 'api'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                    }`}
                    onClick={() => setActiveTab('api')}
                  >
                    API Keys
                  </button>
                </nav>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-750">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Connected Wallet</div>
                <div className="font-mono text-sm text-gray-800 dark:text-white break-all">
                  {account}
                </div>
              </div>
            </div>
            
            {/* Settings Content */}
            <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              {/* Business Profile */}
              {activeTab === 'profile' && (
                <>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Business Profile</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Manage your business information
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Business Name</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Business Email</label>
                        <input
                          type="email"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          value={businessEmail}
                          onChange={(e) => setBusinessEmail(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Business Phone</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          value={businessPhone}
                          onChange={(e) => setBusinessPhone(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Business Category</label>
                        <select
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          value={businessCategory}
                          onChange={(e) => setBusinessCategory(e.target.value)}
                        >
                          <option value="retail">Retail</option>
                          <option value="food">Food & Beverage</option>
                          <option value="services">Services</option>
                          <option value="technology">Technology</option>
                          <option value="education">Education</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Business Description</label>
                        <textarea
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          rows={4}
                          value={businessDescription}
                          onChange={(e) => setBusinessDescription(e.target.value)}
                        />
                      </div>
                      
                      <div className="pt-4">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                          onClick={saveSettings}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Payment Settings</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Configure how you receive and manage payments
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={autoSettlement}
                            onChange={(e) => setAutoSettlement(e.target.checked)}
                          />
                          <span className="ml-2 text-gray-700 dark:text-gray-300">Enable automatic settlement</span>
                        </label>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-6">
                          Automatically settle payments to your wallet when they reach the threshold
                        </p>
                      </div>
                      
                      {autoSettlement && (
                        <div>
                          <label className="block text-gray-700 dark:text-gray-300 mb-2">Settlement Threshold</label>
                          <div className="flex">
                            <input
                              type="text"
                              className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                              value={settlementThreshold}
                              onChange={(e) => setSettlementThreshold(e.target.value)}
                            />
                            <select
                              className="p-2 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                              value={settlementCurrency}
                              onChange={(e) => setSettlementCurrency(e.target.value)}
                            >
                              {stablecoins.map((coin) => (
                                <option key={coin.baseToken} value={coin.baseToken}>
                                  {coin.baseToken} - {coin.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Payment Link Expiry</label>
                        <div className="flex">
                          <input
                            type="text"
                            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                            value={paymentExpiry}
                            onChange={(e) => setPaymentExpiry(e.target.value)}
                          />
                          <span className="p-2 border border-gray-300 dark:border-gray-600 border-l-0 rounded-r-lg bg-gray-50 dark:bg-gray-750 text-gray-800 dark:text-white">
                            minutes
                          </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          Payment links will expire after this duration
                        </p>
                      </div>
                      
                      <div className="pt-4">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                          onClick={saveSettings}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Security Settings */}
              {activeTab === 'security' && (
                <>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Security Settings</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Manage security options for your merchant account
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={twoFactorEnabled}
                            onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                          />
                          <span className="ml-2 text-gray-700 dark:text-gray-300">Enable Two-Factor Authentication</span>
                        </label>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-6">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      
                      {twoFactorEnabled && (
                        <div className="ml-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <p className="text-blue-700 dark:text-blue-300 font-medium mb-2">Two-Factor Authentication Setup</p>
                          <p className="text-blue-600 dark:text-blue-400 text-sm mb-4">
                            Scan the QR code with your authenticator app to set up 2FA
                          </p>
                          <div className="flex justify-center mb-4">
                            <div className="w-40 h-40 bg-white p-2 rounded-lg flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-4xl mb-2">🔐</div>
                                <div className="text-gray-800 text-sm">QR Code Placeholder</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-center">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm">
                              Verify Setup
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={withdrawalConfirmation}
                            onChange={(e) => setWithdrawalConfirmation(e.target.checked)}
                          />
                          <span className="ml-2 text-gray-700 dark:text-gray-300">Require confirmation for withdrawals</span>
                        </label>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-6">
                          Send email confirmation for all withdrawal requests
                        </p>
                      </div>
                      
                      <div className="pt-4">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                          onClick={saveSettings}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Notification Settings</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Configure how you receive notifications
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            checked={transactionNotifications}
                            onChange={(e) => setTransactionNotifications(e.target.checked)}
                          />
                          <span className="ml-2 text-gray-700 dark:text-gray-300">Transaction Notifications</span>
                        </label>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-6">
                          Receive notifications for all incoming payments
                        </p>
                      </div>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            defaultChecked={true}
                          />
                          <span className="ml-2 text-gray-700 dark:text-gray-300">Settlement Notifications</span>
                        </label>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-6">
                          Receive notifications when funds are settled to your wallet
                        </p>
                      </div>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            defaultChecked={true}
                          />
                          <span className="ml-2 text-gray-700 dark:text-gray-300">Security Alerts</span>
                        </label>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-6">
                          Receive notifications about security events
                        </p>
                      </div>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            defaultChecked={false}
                          />
                          <span className="ml-2 text-gray-700 dark:text-gray-300">Marketing Updates</span>
                        </label>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 ml-6">
                          Receive updates about new features and promotions
                        </p>
                      </div>
                      
                      <div className="pt-4">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                          onClick={saveSettings}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* API Keys */}
              {activeTab === 'api' && (
                <>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">API Keys</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Manage API keys for integrating with your systems
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h3 className="font-medium text-gray-800 dark:text-white">Live API Key</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Use for production environment</p>
                          </div>
                          <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                            Regenerate
                          </button>
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-2 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm break-all">
                          sk_live_51NxYz2CZ6qKUzXjE2WdH8TvMnFJk3L7mR9pQs5oTg6bVcXwZ1yA
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h3 className="font-medium text-gray-800 dark:text-white">Test API Key</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Use for testing environment</p>
                          </div>
                          <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                            Regenerate
                          </button>
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-2 rounded border border-gray-300 dark:border-gray-600 font-mono text-sm break-all">
                          sk_test_51NxYz2CZ6qKUzXjE2WdH8TvMnFJk3L7mR9pQs5oTg6bVcXwZ1yA
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-white mb-2">Webhook URL</h3>
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          placeholder="https://your-website.com/nedapay-webhook"
                        />
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          We'll send payment notifications to this URL
                        </p>
                      </div>
                      
                      <div className="pt-4">
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
                          onClick={saveSettings}
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

    </>
  );
}
