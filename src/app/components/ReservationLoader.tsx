'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useReservations } from '../../hooks/useReservations';
import { Reservation } from '../../types/reservation';

interface ReservationLoaderProps {
  onReservationLoaded: (reservation: Reservation) => void;
  onError?: (error: string) => void;
}

export default function ReservationLoader({ onReservationLoaded, onError }: ReservationLoaderProps) {
  const [reservationCode, setReservationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundReservation, setFoundReservation] = useState<Reservation | null>(null);

  const { getReservationByCode } = useReservations();

  const handleSearch = async () => {
    console.log('Searching for reservation:', reservationCode);
    
    if (!reservationCode.trim()) {
      setError('Please enter a reservation code');
      return;
    }

    setLoading(true);
    setError(null);
    setFoundReservation(null);

    try {
      console.log('Calling getReservationByCode with:', reservationCode.trim());
      const reservation = await getReservationByCode(reservationCode.trim());
      console.log('Reservation result:', reservation);
      
      if (reservation) {
        setFoundReservation(reservation);
        onReservationLoaded(reservation);
        console.log('Reservation loaded successfully');
      } else {
        setError('Reservation not found');
        onError?.('Reservation not found');
        console.log('Reservation not found');
      }
    } catch (err: any) {
      console.error('Error loading reservation:', err);
      const errorMessage = err.message || 'Failed to load reservation';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'primary';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Load Reservation
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Reservation Code"
            value={reservationCode}
            onChange={(e) => {
              console.log('Input changed:', e.target.value);
              setReservationCode(e.target.value);
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter reservation code (e.g., ABC123)"
            sx={{ flexGrow: 1 }}
            disabled={loading}
            autoComplete="off"
            inputProps={{
              style: { fontSize: '16px' }
            }}
            variant="outlined"
            fullWidth
          />
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            onClick={handleSearch}
            disabled={loading || !reservationCode.trim()}
            sx={{ minWidth: '120px' }}
          >
            {loading ? 'Loading...' : 'Load'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} icon={<ErrorIcon />}>
            {error}
          </Alert>
        )}

        {foundReservation && (
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckIcon />}>
            Reservation loaded successfully!
          </Alert>
        )}

        {foundReservation && (
          <Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Reservation Details
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Reservation Code
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {foundReservation.reservationCode}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip 
                  label={foundReservation.status} 
                  color={getStatusColor(foundReservation.status)}
                  size="small"
                />
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  ${foundReservation.total.toLocaleString()}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Passengers
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {foundReservation.passengers.length}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1">
                  {formatDate(foundReservation.createdAt)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {formatDate(foundReservation.updatedAt)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Passengers
            </Typography>
            
            {foundReservation.passengers.map((passenger, index) => (
              <Box key={passenger.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {passenger.name}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Ticket
                    </Typography>
                    <Typography variant="body2">
                      {passenger.ticket.status} - ${passenger.ticket.price}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Seat
                    </Typography>
                    <Typography variant="body2">
                      {passenger.ancillaries.seat.status} - ${passenger.ancillaries.seat.price}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Bag
                    </Typography>
                    <Typography variant="body2">
                      {passenger.ancillaries.bag.status} - ${passenger.ancillaries.bag.price}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
