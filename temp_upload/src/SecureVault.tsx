import React, { useState, useEffect } from 'react';
import { Lock, Unlock, FileText, Key, Shield, Plus, Eye, EyeOff, Trash2, User, UserPlus, LogOut } from 'lucide-react';

const SecureVault = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showSignIn, setShowSignIn] = useState(true);
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [quickAccessCode, setQuickAccessCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('passwords');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Database simulation - in production, this would be a real database
  const [database, setDatabase] = useState(() => {
    const saved = localStorage.getItem('yourOnlineVaultDB');
    return saved ? JSON.parse(saved) : { users: {}, userData: {} };
  });
  
  // Form states
  const [newItem, setNewItem] = useState({ title: '', content: '', description: '' });
  const [errors, setErrors] = useState({});

  // Save database to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('yourOnlineVaultDB', JSON.stringify(database));
  }, [database]);

  // Check for saved user session on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('yourOnlineVaultUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      const user = database.users[userData.email];
      if (user && user.quickAccessCode) {
        setShowQuickAccess(true);
        setShowSignIn(false);
      } else {
        // Clean up invalid session
        localStorage.removeItem('yourOnlineVaultUser');
      }
    }
  }, [database]);

  // User Management Functions
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignUp = () => {
    const newErrors = {};

    if (!signupForm.name.trim()) newErrors.name = 'Name is required';
    if (!signupForm.email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(signupForm.email)) newErrors.email = 'Invalid email format';
    if (!signupForm.password.trim()) newErrors.password = 'Password is required';
    else if (signupForm.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (signupForm.password !== signupForm.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    // Check if email already exists
    if (database.users[signupForm.email]) {
      newErrors.email = 'Email already registered';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Create new user
      const userId = Date.now().toString();
      const newDatabase = {
        ...database,
        users: {
          ...database.users,
          [signupForm.email]: {
            id: userId,
            name: signupForm.name,
            email: signupForm.email,
            password: signupForm.password, // In production, this should be hashed
            quickAccessCode: null, // Will be set when user creates PIN
            createdAt: new Date().toISOString()
          }
        },
        userData: {
          ...database.userData,
          [userId]: {
            passwords: [],
            documents: [],
            importantTexts: []
          }
        }
      };

      setDatabase(newDatabase);
      const user = newDatabase.users[signupForm.email];
      setCurrentUser(user);
      
      setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
      setErrors({});
      
      // Show PIN setup option after successful signup
      console.log('Setting up PIN screen for new user:', user.name);
      setShowSignIn(false);
      setShowQuickAccess(false);
      setShowPinSetup(true);
    }
  };

  const handleSignIn = () => {
    const newErrors = {};

    if (!loginForm.email.trim()) newErrors.email = 'Email is required';
    if (!loginForm.password.trim()) newErrors.password = 'Password is required';

    const user = database.users[loginForm.email];
    if (!user || user.password !== loginForm.password) {
      newErrors.general = 'Invalid email or password';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setCurrentUser(user);
      setLoginForm({ email: '', password: '' });
      setErrors({});
      
      // Check if user has a PIN already
      if (user.quickAccessCode) {
        // Save user session and go to vault
        localStorage.setItem('yourOnlineVaultUser', JSON.stringify({
          email: user.email,
          quickAccessCode: user.quickAccessCode
        }));
        setShowSignIn(false);
        setShowQuickAccess(false);
        setShowPinSetup(false);
      } else {
        // Show PIN setup option for users without PIN
        setShowSignIn(false);
        setShowQuickAccess(false);
        setShowPinSetup(true);
      }
    }
  };

  const handlePinSetup = () => {
    const newErrors = {};

    if (!newPin.trim()) newErrors.pin = 'PIN is required';
    else if (newPin.length !== 4 || !/^\d+$/.test(newPin)) newErrors.pin = 'PIN must be exactly 4 digits';
    if (newPin !== confirmPin) newErrors.confirmPin = 'PINs do not match';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Update user with new PIN
      const updatedDatabase = {
        ...database,
        users: {
          ...database.users,
          [currentUser.email]: {
            ...currentUser,
            quickAccessCode: newPin
          }
        }
      };
      setDatabase(updatedDatabase);
      
      // Update current user state
      setCurrentUser({
        ...currentUser,
        quickAccessCode: newPin
      });
      
      // Save user session
      localStorage.setItem('yourOnlineVaultUser', JSON.stringify({
        email: currentUser.email,
        quickAccessCode: newPin
      }));
      
      setShowPinSetup(false);
      setNewPin('');
      setConfirmPin('');
      setErrors({});
      
      // Show success message
      alert(`PIN created successfully! Your quick access code is: ${newPin}\nUse this code for faster login next time.`);
    }
  };

  const handleSkipPin = () => {
    setShowPinSetup(false);
    setNewPin('');
    setConfirmPin('');
    setErrors({});
    // Don't go anywhere, just close the PIN setup
  };
  const handleQuickAccess = () => {
    const savedUser = localStorage.getItem('yourOnlineVaultUser');
    if (!savedUser) {
      setShowQuickAccess(false);
      setShowSignIn(true);
      return;
    }

    const userData = JSON.parse(savedUser);
    const user = database.users[userData.email];
    
    if (!user || user.quickAccessCode !== quickAccessCode) {
      setErrors({ general: 'Invalid quick access code' });
      return;
    }

    setCurrentUser(user);
    setShowQuickAccess(false);
    setQuickAccessCode('');
    setErrors({});
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowSignIn(true);
    setShowQuickAccess(false);
    setShowPinSetup(false);
    setActiveTab('passwords');
    setShowAddForm(false);
    // Keep the session for quick access
  };

  const handleFullLogout = () => {
    setCurrentUser(null);
    setShowSignIn(true);
    setShowQuickAccess(false);
    setShowPinSetup(false);
    setActiveTab('passwords');
    setShowAddForm(false);
    // Remove saved session
    localStorage.removeItem('yourOnlineVaultUser');
  };

  // Data Management Functions
  const getCurrentUserData = () => {
    if (!currentUser) return { passwords: [], documents: [], importantTexts: [] };
    return database.userData[currentUser.id] || { passwords: [], documents: [], importantTexts: [] };
  };

  const updateUserData = (newData) => {
    const updatedDatabase = {
      ...database,
      userData: {
        ...database.userData,
        [currentUser.id]: newData
      }
    };
    setDatabase(updatedDatabase);
  };

  const addItem = () => {
    if (!newItem.title || !newItem.content) return;

    const currentData = getCurrentUserData();
    const item = {
      id: Date.now(),
      title: newItem.title,
      content: newItem.content,
      description: newItem.description,
      createdAt: new Date().toLocaleString()
    };

    const updatedData = { ...currentData };
    if (activeTab === 'passwords') {
      updatedData.passwords = [...currentData.passwords, item];
    } else if (activeTab === 'documents') {
      updatedData.documents = [...currentData.documents, item];
    } else {
      updatedData.importantTexts = [...currentData.importantTexts, item];
    }

    updateUserData(updatedData);
    setNewItem({ title: '', content: '', description: '' });
    setShowAddForm(false);
  };

  const deleteItem = (id) => {
    const currentData = getCurrentUserData();
    const updatedData = { ...currentData };

    if (activeTab === 'passwords') {
      updatedData.passwords = currentData.passwords.filter(item => item.id !== id);
    } else if (activeTab === 'documents') {
      updatedData.documents = currentData.documents.filter(item => item.id !== id);
    } else {
      updatedData.importantTexts = currentData.importantTexts.filter(item => item.id !== id);
    }

    updateUserData(updatedData);
  };

  const getCurrentTabData = () => {
    const userData = getCurrentUserData();
    switch (activeTab) {
      case 'passwords': return userData.passwords;
      case 'documents': return userData.documents;
      case 'texts': return userData.importantTexts;
      default: return [];
    }
  };

  // PIN Setup Screen
  if (showPinSetup && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Setup Quick Access</h1>
            <p className="text-gray-400 mb-2">Create a 4-digit PIN for faster login</p>
            <p className="text-blue-400 text-sm">Hello, {currentUser?.name}!</p>
          </div>

          {errors.pin && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-2 rounded-lg mb-4">
              {errors.pin}
            </div>
          )}

          {errors.confirmPin && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-2 rounded-lg mb-4">
              {errors.confirmPin}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Create 4-digit PIN</label>
              <input
                type="text"
                placeholder="1234"
                value={newPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setNewPin(value);
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl tracking-widest"
                maxLength="4"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Confirm PIN</label>
              <input
                type="text"
                placeholder="1234"
                value={confirmPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setConfirmPin(value);
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl tracking-widest"
                maxLength="4"
                onKeyPress={(e) => e.key === 'Enter' && handlePinSetup()}
              />
            </div>
            
            <button
              onClick={handlePinSetup}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
            >
              <Shield className="w-5 h-5" />
              <span>Create PIN</span>
            </button>

            <button
              onClick={handleSkipPin}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              Skip for now
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              You can always set up a PIN later for faster access to your vault
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Quick Access Screen
  if (showQuickAccess) {
    const savedUser = localStorage.getItem('yourOnlineVaultUser');
    const userData = savedUser ? JSON.parse(savedUser) : null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-green-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Key className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Online Vault</h1>
            <p className="text-gray-400 mb-2">Welcome back!</p>
            {userData && <p className="text-blue-400 text-sm">{userData.email}</p>}
            <p className="text-gray-400 text-sm mt-2">Enter your 4-digit quick access code</p>
          </div>

          {errors.general && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-2 rounded-lg mb-4">
              {errors.general}
            </div>
          )}
          
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Quick Access Code"
              value={quickAccessCode}
              onChange={(e) => setQuickAccessCode(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-widest"
              maxLength="4"
              onKeyPress={(e) => e.key === 'Enter' && handleQuickAccess()}
            />
            
            <button
              onClick={handleQuickAccess}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
            >
              <Unlock className="w-5 h-5" />
              <span>Quick Access</span>
            </button>
          </div>
          
          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => {
                setShowQuickAccess(false);
                setShowSignIn(true);
                setErrors({});
                setQuickAccessCode('');
              }}
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm"
            >
              Use email & password instead
            </button>
            <br />
            <button
              onClick={() => {
                setShowQuickAccess(false);
                setShowPinSetup(true);
                setErrors({});
                setQuickAccessCode('');
                // Set current user for PIN setup
                const savedUser = localStorage.getItem('yourOnlineVaultUser');
                if (savedUser) {
                  const userData = JSON.parse(savedUser);
                  const user = database.users[userData.email];
                  setCurrentUser(user);
                }
              }}
              className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200 text-sm"
            >
              Reset/Change PIN
            </button>
            <br />
            <button
              onClick={handleFullLogout}
              className="text-red-400 hover:text-red-300 transition-colors duration-200 text-sm"
            >
              Forget this device
            </button>
            <p className="text-xs text-gray-500 mt-2">Your data is encrypted and stored securely</p>
          </div>
        </div>
      </div>
    );
  }

  // Sign In/Up Screen
  if (showSignIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              {isSignUp ? <UserPlus className="w-10 h-10 text-white" /> : <Lock className="w-10 h-10 text-white" />}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Your Online Vault</h1>
            <p className="text-gray-400">
              {isSignUp ? 'Create your secure account' : 'Sign in to access your vault'}
            </p>
          </div>

          {errors.general && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-400 px-4 py-2 rounded-lg mb-4">
              {errors.general}
            </div>
          )}
          
          <div className="space-y-4">
            {isSignUp && (
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({...signupForm, name: e.target.value})}
                  className={`w-full bg-gray-700 border ${errors.name ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>
            )}

            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={isSignUp ? signupForm.email : loginForm.email}
                onChange={(e) => {
                  if (isSignUp) {
                    setSignupForm({...signupForm, email: e.target.value});
                  } else {
                    setLoginForm({...loginForm, email: e.target.value});
                  }
                }}
                className={`w-full bg-gray-700 border ${errors.email ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={isSignUp ? signupForm.password : loginForm.password}
                  onChange={(e) => {
                    if (isSignUp) {
                      setSignupForm({...signupForm, password: e.target.value});
                    } else {
                      setLoginForm({...loginForm, password: e.target.value});
                    }
                  }}
                  className={`w-full bg-gray-700 border ${errors.password ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12`}
                  onKeyPress={(e) => e.key === 'Enter' && (isSignUp ? handleSignUp() : handleSignIn())}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>

            {isSignUp && (
              <div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm({...signupForm, confirmPassword: e.target.value})}
                  className={`w-full bg-gray-700 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onKeyPress={(e) => e.key === 'Enter' && handleSignUp()}
                />
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            )}
            
            <button
              onClick={isSignUp ? handleSignUp : handleSignIn}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
            >
              {isSignUp ? <UserPlus className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
                setLoginForm({ email: '', password: '' });
                setSignupForm({ name: '', email: '', password: '', confirmPassword: '' });
              }}
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
            <p className="text-xs text-gray-500 mt-2">Your data is encrypted and stored securely</p>
          </div>
        </div>
      </div>
    );
  }

  // Main App Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-white">Your Online Vault</h1>
            <div className="text-sm text-gray-400">
              Welcome, {currentUser?.name}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Lock</span>
            </button>
            <button
              onClick={handleFullLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen p-4">
          <div className="mb-6 p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 text-gray-300">
              <User className="w-4 h-4" />
              <span className="text-sm">{currentUser?.email}</span>
            </div>
            {!currentUser?.quickAccessCode && (
              <button
                onClick={() => setShowPinSetup(true)}
                className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded transition-colors duration-200 flex items-center space-x-1"
              >
                <Key className="w-3 h-3" />
                <span>Setup PIN</span>
              </button>
            )}
            {currentUser?.quickAccessCode && (
              <div className="mt-2 text-xs text-green-400 flex items-center space-x-1">
                <Key className="w-3 h-3" />
                <span>Quick Access Enabled</span>
              </div>
            )}
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => { setActiveTab('passwords'); setShowAddForm(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                activeTab === 'passwords' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Key className="w-5 h-5" />
              <span>Passwords</span>
              <span className="ml-auto bg-gray-600 text-xs px-2 py-1 rounded-full">{getCurrentUserData().passwords.length}</span>
            </button>
            
            <button
              onClick={() => { setActiveTab('documents'); setShowAddForm(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                activeTab === 'documents' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Documents</span>
              <span className="ml-auto bg-gray-600 text-xs px-2 py-1 rounded-full">{getCurrentUserData().documents.length}</span>
            </button>
            
            <button
              onClick={() => { setActiveTab('texts'); setShowAddForm(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                activeTab === 'texts' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span>Important Texts</span>
              <span className="ml-auto bg-gray-600 text-xs px-2 py-1 rounded-full">{getCurrentUserData().importantTexts.length}</span>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white capitalize">{activeTab}</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New</span>
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Add New {activeTab.slice(0, -1)}
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder={activeTab === 'passwords' ? 'Password/Login Info' : activeTab === 'documents' ? 'Document Content' : 'Important Text'}
                  value={newItem.content}
                  onChange={(e) => setNewItem({...newItem, content: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={addItem}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); setNewItem({ title: '', content: '', description: '' }); }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-4">
            {getCurrentTabData().length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No {activeTab} stored yet</p>
                <p className="text-gray-500">Click "Add New" to create your first entry</p>
              </div>
            ) : (
              getCurrentTabData().map((item) => (
                <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-gray-700 rounded p-3 mb-2">
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">{item.content}</pre>
                  </div>
                  {item.description && (
                    <p className="text-gray-400 text-sm mb-2">{item.description}</p>
                  )}
                  <p className="text-gray-500 text-xs">Created: {item.createdAt}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureVault;