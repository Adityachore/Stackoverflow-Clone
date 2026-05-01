# 🎨 Frontend Integration Guide

## Overview
All 11 backend features are complete. This guide explains how to integrate them into the Next.js frontend.

---

## 1. Socket.IO Real-Time Integration

### Setup Socket.IO Client

**File:** `stack/src/lib/socket.js` (CREATE NEW)
```javascript
import io from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://stackoverflow-clone-6cll.onrender.com';

let socket = null;

export const initializeSocket = (userId) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('token'),
      },
    });
  }
  
  // Register user to receive personal notifications
  socket.emit('register', userId);
  
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

### Hook for Socket Listeners

**File:** `stack/src/hooks/useSocketNotifications.ts` (CREATE NEW)
```typescript
import { useEffect, useCallback } from 'react';
import { initializeSocket, getSocket } from '../lib/socket';
import { useAuth } from '../lib/AuthContext';

export const useSocketNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const socket = initializeSocket(user.id);

    // Listen for friend request
    socket.on('friend_request_received', (data) => {
      console.log('Friend request received:', data);
      // Show toast notification
      // Update UI
    });

    // Listen for friend request acceptance
    socket.on('friend_request_accepted', (data) => {
      console.log('Friend request accepted:', data);
      // Show toast notification
      // Add to friends list
    });

    // Listen for friend request rejection
    socket.on('friend_request_rejected', (data) => {
      console.log('Friend request rejected:', data);
      // Show toast notification
    });

    return () => {
      socket.off('friend_request_received');
      socket.off('friend_request_accepted');
      socket.off('friend_request_rejected');
    };
  }, [user?.id]);
};
```

### Use in Components

**File:** `stack/src/components/FriendsPage.tsx` (UPDATE)
```typescript
import { useSocketNotifications } from '../hooks/useSocketNotifications';

export default function FriendsPage() {
  useSocketNotifications(); // Activate socket listeners
  
  return (
    // Your friends page UI
  );
}
```

---

## 2. Friend Request UI

### Pending Requests Component

**File:** `stack/src/components/PendingFriendRequests.tsx` (CREATE NEW)
```typescript
import { useState, useEffect } from 'react';
import axios from '../lib/axiosinstance';

export default function PendingFriendRequests() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const { data } = await axios.get('/friend/pending-requests');
      setPendingRequests(data.pendingRequests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (friendshipId) => {
    try {
      await axios.put(`/friend/accept-request/${friendshipId}`);
      // Socket event will handle UI update
      setPendingRequests(prev => prev.filter(r => r._id !== friendshipId));
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleReject = async (friendshipId) => {
    try {
      await axios.put(`/friend/reject-request/${friendshipId}`);
      setPendingRequests(prev => prev.filter(r => r._id !== friendshipId));
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (pendingRequests.length === 0) {
    return <div className="text-gray-500">No pending friend requests</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-bold">Pending Friend Requests</h3>
      {pendingRequests.map((request) => (
        <div key={request._id} className="flex items-center justify-between p-2 border rounded">
          <span>{request.requester?.name}</span>
          <div className="space-x-2">
            <button
              onClick={() => handleAccept(request._id)}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              Accept
            </button>
            <button
              onClick={() => handleReject(request._id)}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 3. Subscription/Question Posting

### Handle Question Limit Response

**File:** `stack/src/pages/ask/index.tsx` (UPDATE)
```typescript
const handleAskQuestion = async (questionData) => {
  try {
    const response = await axios.post('/question/ask', {
      postquestiondata: questionData,
    });
    
    // Success
    router.push(`/questions/${response.data.id}`);
  } catch (error) {
    // Handle 403 - Subscription limit exceeded
    if (error.response?.status === 403) {
      const { message, plan, limit, posted_today } = error.response.data;
      alert(
        `${message}\n\n` +
        `Current Plan: ${plan}\n` +
        `Daily Limit: ${limit}\n` +
        `Posted Today: ${posted_today}`
      );
      
      // Show upgrade CTA if on free plan
      if (plan === 'free') {
        // Show upgrade modal
      }
    }
  }
};
```

---

## 4. Subscription Payment UI

### Payment Window Display

**File:** `stack/src/components/SubscriptionCard.tsx` (UPDATE)
```typescript
import { useEffect, useState } from 'react';
import moment from 'moment-timezone';

export default function SubscriptionCard({ plan, price }) {
  const [isPaymentWindow, setIsPaymentWindow] = useState(false);
  const [nextWindow, setNextWindow] = useState('');

  useEffect(() => {
    const checkPaymentWindow = () => {
      const istTime = moment().tz('Asia/Kolkata');
      const hour = istTime.hour();
      
      if (hour === 10) {
        setIsPaymentWindow(true);
        setNextWindow('');
      } else {
        setIsPaymentWindow(false);
        const nextWindow = istTime.clone().add(1, 'day').hour(10).minute(0);
        setNextWindow(nextWindow.format('MMM DD, YYYY [at] hh:mm A'));
      }
    };

    checkPaymentWindow();
    const interval = setInterval(checkPaymentWindow, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async () => {
    if (!isPaymentWindow) {
      alert(`Payments only available 10:00 AM - 11:00 AM IST.\nNext window: ${nextWindow}`);
      return;
    }

    try {
      const response = await axios.post('/subscription/create-order', { plan });
      // Process Razorpay payment
    } catch (error) {
      alert(error.response?.data?.message || 'Payment failed');
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3>{plan} Plan</h3>
      <p>₹{price}/month</p>
      
      <button
        onClick={handleSubscribe}
        disabled={!isPaymentWindow}
        className={`mt-4 px-4 py-2 rounded ${
          isPaymentWindow
            ? 'bg-blue-500 text-white cursor-pointer'
            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
        }`}
      >
        {isPaymentWindow ? 'Subscribe Now' : 'Subscribe (10 AM - 11 AM IST)'}
      </button>

      {!isPaymentWindow && nextWindow && (
        <p className="text-sm text-gray-500 mt-2">Next available: {nextWindow}</p>
      )}
    </div>
  );
}
```

---

## 5. Login Page Updates

### Browser Detection Message

**File:** `stack/src/pages/auth/login.tsx` (UPDATE)
```typescript
import { useEffect, useState } from 'react';
import { UAParser } from 'ua-parser-js';

export default function LoginPage() {
  const [browserInfo, setBrowserInfo] = useState(null);

  useEffect(() => {
    const parser = new UAParser();
    const result = parser.getResult();
    setBrowserInfo({
      name: result.browser.name,
      requiresOTP: result.browser.name?.toLowerCase().includes('chrome'),
    });
  }, []);

  return (
    <div>
      {browserInfo?.requiresOTP && (
        <div className="bg-yellow-100 border border-yellow-400 p-3 mb-4 rounded">
          📱 {browserInfo.name} requires OTP verification for security
        </div>
      )}
      
      {/* Login form */}
    </div>
  );
}
```

---

## 6. Mobile Access Restriction

### Handle Mobile Time Restriction

**File:** `stack/src/lib/AuthContext.js` (UPDATE)
```javascript
const handleLogin = async (credentials) => {
  try {
    const response = await axiosinstance.post('/auth/login', credentials);
    
    if (response.status === 403 && response.data.error_code === 'MOBILE_TIME_RESTRICTED') {
      const { next_access_window } = response.data;
      alert(
        `Mobile devices can only access between 10:00 AM - 1:00 PM IST\n` +
        `Next access window: ${next_access_window}`
      );
      return;
    }

    // Handle successful login
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
  } catch (error) {
    handleAuthError(error);
  }
};
```

---

## 7. Login History Viewer

**File:** `stack/src/components/LoginHistory.tsx` (CREATE NEW)
```typescript
import { useEffect, useState } from 'react';
import axios from '../lib/axiosinstance';

export default function LoginHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const fetchLoginHistory = async () => {
    try {
      const { data } = await axios.get('/user/profile');
      setHistory(data.user.loginHistory || []);
    } catch (error) {
      console.error('Error fetching login history:', error);
    }
  };

  return (
    <div className="p-4">
      <h3 className="font-bold mb-4">Login History</h3>
      <div className="space-y-2">
        {history.map((login, idx) => (
          <div key={idx} className="border p-2 rounded text-sm">
            <p>🌐 {login.browser} on {login.os}</p>
            <p>📱 {login.device} | IP: {login.ip}</p>
            <p className="text-gray-500">{new Date(login.loginAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 8. Points Transfer UI

**File:** `stack/src/components/TransferPoints.tsx` (CREATE NEW)
```typescript
import { useState } from 'react';
import axios from '../lib/axiosinstance';

export default function TransferPoints() {
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/user/transfer-points', {
        recipientId,
        amount: parseInt(amount),
      });

      alert('Points transferred successfully!');
      setRecipientId('');
      setAmount('');
    } catch (error) {
      if (error.response?.status === 400) {
        alert(error.response.data.message); // "You need more than 10 points..."
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleTransfer} className="p-4 border rounded max-w-md">
      <h3 className="font-bold mb-4">Transfer Points</h3>
      
      <input
        type="text"
        placeholder="Recipient User ID"
        value={recipientId}
        onChange={(e) => setRecipientId(e.target.value)}
        required
        className="w-full p-2 border rounded mb-2"
      />

      <input
        type="number"
        placeholder="Amount (min 1, keep 10 after)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        className="w-full p-2 border rounded mb-4"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Transferring...' : 'Transfer Points'}
      </button>
    </form>
  );
}
```

---

## 9. Language Switcher with OTP

**File:** `stack/src/components/LanguageSwitcher.tsx` (UPDATE)
```typescript
import { useState } from 'react';
import axios from '../lib/axiosinstance';

export default function LanguageSwitcher() {
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLanguageChange = async () => {
    try {
      setLoading(true);
      await axios.post('/auth/initiate-language-change', {
        language: selectedLanguage,
      });

      // Show message based on language
      const isFrench = selectedLanguage === 'French';
      alert(
        isFrench
          ? 'OTP sent to your email'
          : 'OTP sent to your phone number'
      );
      
      setShowOTPInput(true);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    try {
      setLoading(true);
      await axios.post('/auth/verify-language-otp', {
        otp,
        language: selectedLanguage,
      });

      alert('Language changed successfully!');
      setShowOTPInput(false);
      setOtp('');
      // Update UI language
    } catch (error) {
      alert('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <select
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value)}
        className="p-2 border rounded"
      >
        <option>English</option>
        <option>Spanish</option>
        <option>Hindi</option>
        <option>Portuguese</option>
        <option>Chinese</option>
        <option>French</option>
      </select>

      <button
        onClick={handleLanguageChange}
        disabled={loading || showOTPInput}
        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Change Language
      </button>

      {showOTPInput && (
        <div className="mt-4 space-x-2">
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength="6"
            className="p-2 border rounded"
          />
          <button
            onClick={handleOTPSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Verify
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 10. Environment Variables

**File:** `stack/.env.local` (ADD/UPDATE)
```env
NEXT_PUBLIC_SOCKET_URL=https://stackoverflow-clone-6cll.onrender.com
```

---

## 11. Install Socket.IO Client

```bash
cd stack
npm install socket.io-client
```

---

## Testing Checklist

- [ ] Socket.IO connects after login
- [ ] Friend request sends real-time notification
- [ ] Friend request acceptance shows in UI
- [ ] Subscription question limit enforced
- [ ] Payment time window displays correctly
- [ ] Mobile device login blocked outside 10 AM - 1 PM
- [ ] Chrome browser shows OTP requirement
- [ ] Language switch works with correct OTP delivery method
- [ ] Login history displays browser/OS/device info
- [ ] Points transfer validates 10-point minimum

---

**Status:** Ready for integration  
**Complexity:** Moderate (mostly connecting existing APIs to UI)  
**Estimated Time:** 4-6 hours
