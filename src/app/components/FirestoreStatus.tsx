'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface FirestoreStatusProps {
  onStatusChange?: (isConnected: boolean) => void;
}

export default function FirestoreStatus({ onStatusChange }: FirestoreStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'warning'>('checking');
  const [message, setMessage] = useState('');
  const [reservationCount, setReservationCount] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkFirestoreConnection = useCallback(async () => {
    setStatus('checking');
    setMessage('Checking Firestore connection...');
    setLastChecked(new Date());

    try {
      // Test basic connection by trying to read from reservations collection
      const reservationsRef = collection(db, 'reservations');
      const snapshot = await getDocs(reservationsRef);
      
      setReservationCount(snapshot.size);
      
      if (snapshot.size > 0) {
        setStatus('connected');
        setMessage(`✅ Firestore connected successfully! Found ${snapshot.size} reservation(s).`);
        onStatusChange?.(true);
      } else {
        setStatus('warning');
        setMessage('⚠️ Firestore connected but no reservations found. Run the sample data script to add test data.');
        onStatusChange?.(true);
      }
    } catch (error: any) {
      setStatus('error');
      setReservationCount(null);
      
      if (error.code === 'permission-denied') {
        setMessage('❌ Permission denied. Please enable Firestore Database in Firebase Console and set up proper security rules.');
      } else if (error.code === 'unavailable') {
        setMessage('❌ Firestore service unavailable. Please check your internet connection and Firebase project status.');
      } else {
        setMessage(`❌ Connection failed: ${error.message}`);
      }
      
      onStatusChange?.(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    checkFirestoreConnection();
  }, [checkFirestoreConnection]);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <CircularProgress size={20} />;
      case 'connected':
        return <CheckIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'default';
      case 'connected':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
    }
  };

  const getAlertSeverity = () => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Firestore Database Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getStatusIcon()}
            <Chip 
              label={status.toUpperCase()} 
              color={getStatusColor()}
              size="small"
            />
          </Box>
        </Box>

        <Alert severity={getAlertSeverity()} sx={{ mb: 2 }}>
          {message}
        </Alert>

        {reservationCount !== null && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            📊 Reservations in database: {reservationCount}
          </Typography>
        )}

        {lastChecked && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Last checked: {lastChecked.toLocaleTimeString()}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={checkFirestoreConnection}
            disabled={status === 'checking'}
            size="small"
          >
            Refresh
          </Button>

          {status === 'error' && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
            >
              Open Firebase Console
            </Button>
          )}

          {status === 'warning' && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                // This would run the sample data script
                alert('Run: npm run add-sample-data');
              }}
            >
              Add Sample Data
            </Button>
          )}
        </Box>

        {status === 'error' && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              🔧 Quick Fix:
            </Typography>
            <Typography variant="body2" component="div">
              1. Go to <strong>Firebase Console</strong><br/>
              2. Select project: <strong>pci-payment-portal</strong><br/>
              3. Enable <strong>Firestore Database</strong><br/>
              4. Choose <strong>&quot;Start in test mode&quot;</strong><br/>
              5. Refresh this status
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
