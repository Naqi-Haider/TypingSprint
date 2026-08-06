import React, { useState, useEffect, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_URL } from '../config';
import { supabase } from '../supabaseClient';
import '../styles/VerifyEmail.css';

const VerifyEmail = memo(() => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email...');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      // 1. Check if Supabase session or hash is present
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', session.user.id)
              .single();

            setStatus('success');
            setMessage('Your email has been successfully verified with Supabase!');
            setUsername(profile?.username || session.user.user_metadata?.username || '');
            return;
          }

          if (error) {
            setStatus('error');
            setMessage(error.message || 'Supabase verification failed.');
            return;
          }
        } catch (err) {
          console.error('Supabase verification error:', err);
        }
      }

      // 2. Fallback to Express token endpoint if token URL param is present
      if (!token) {
        // If no token and no session, set error or instructions
        setStatus('error');
        setMessage('Invalid or missing verification link.');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/verify-email/${token}`);
        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message);
          setUsername(data.username || '');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [token]);

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="verify-spinner">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" opacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          </div>
        );
      case 'success':
        return (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case 'error':
        return (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="verify-email-container">
      <motion.div
        className="verify-email-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={`verify-icon ${status}`}>
          {getStatusIcon()}
        </div>

        <h1 className="verify-title">
          {status === 'verifying' && 'Verifying Email'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p className="verify-message">{message}</p>

        {status === 'success' && username && (
          <p className="verify-welcome">Welcome to Typing Sprint, {username}!</p>
        )}

        {status !== 'verifying' && (
          <button
            className="verify-btn"
            onClick={() => navigate('/')}
          >
            {status === 'success' ? 'Go to Typing Sprint' : 'Go Home'}
          </button>
        )}
      </motion.div>
    </div>
  );
});

VerifyEmail.displayName = 'VerifyEmail';

export default VerifyEmail;
