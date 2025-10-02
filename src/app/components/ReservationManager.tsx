'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FileUpload as ImportIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useReservations } from '../../hooks/useReservations';
import { Reservation, ReservationQuery } from '../../types/reservation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reservation-tabpanel-${index}`}
      aria-labelledby={`reservation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ReservationManager() {
  const {
    reservations,
    currentReservation,
    loading,
    error,
    getReservationByCode,
    updateReservation,
    deleteReservation,
    searchReservations,
    getStats,
    clearError
  } = useReservations();

  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await getStats();
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };
    loadStats();
  }, [getStats]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      try {
        await searchReservations(searchTerm);
      } catch (err) {
        console.error('Search failed:', err);
      }
    }
  };

  const handleViewReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setViewDialogOpen(true);
  };

  const handleDeleteReservation = async () => {
    if (selectedReservation) {
      try {
        await deleteReservation(selectedReservation.id);
        setDeleteDialogOpen(false);
        setSelectedReservation(null);
      } catch (err) {
        console.error('Delete failed:', err);
      }
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reservation Manager
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Reservations
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" color="success.main">
                ${stats.totalRevenue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Search and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Search by Reservation Code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Reservations" />
            <Tab label="Active" />
            <Tab label="Completed" />
            <Tab label="Cancelled" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <ReservationTable
            reservations={reservations}
            loading={loading}
            onView={handleViewReservation}
            onDelete={(reservation) => {
              setSelectedReservation(reservation);
              setDeleteDialogOpen(true);
            }}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ReservationTable
            reservations={reservations.filter(r => r.status === 'Active')}
            loading={loading}
            onView={handleViewReservation}
            onDelete={(reservation) => {
              setSelectedReservation(reservation);
              setDeleteDialogOpen(true);
            }}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <ReservationTable
            reservations={reservations.filter(r => r.status === 'Completed')}
            loading={loading}
            onView={handleViewReservation}
            onDelete={(reservation) => {
              setSelectedReservation(reservation);
              setDeleteDialogOpen(true);
            }}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <ReservationTable
            reservations={reservations.filter(r => r.status === 'Cancelled')}
            loading={loading}
            onView={handleViewReservation}
            onDelete={(reservation) => {
              setSelectedReservation(reservation);
              setDeleteDialogOpen(true);
            }}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
          />
        </TabPanel>
      </Card>

      {/* View Reservation Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Reservation Details</DialogTitle>
        <DialogContent>
          {selectedReservation && (
            <ReservationDetails reservation={selectedReservation} formatDate={formatDate} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Reservation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete reservation {selectedReservation?.reservationCode}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteReservation} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Reservation Table Component
function ReservationTable({ 
  reservations, 
  loading, 
  onView, 
  onDelete, 
  formatDate, 
  getStatusColor 
}: {
  reservations: Reservation[];
  loading: boolean;
  onView: (reservation: Reservation) => void;
  onDelete: (reservation: Reservation) => void;
  formatDate: (timestamp: any) => string;
  getStatusColor: (status: string) => "primary" | "success" | "error" | "default";
}) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Reservation Code</TableCell>
            <TableCell>Passengers</TableCell>
            <TableCell>Total</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reservations.map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell>{reservation.reservationCode}</TableCell>
              <TableCell>{reservation.passengers.length}</TableCell>
              <TableCell>${reservation.total.toLocaleString()}</TableCell>
              <TableCell>
                <Chip 
                  label={reservation.status} 
                  color={getStatusColor(reservation.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>{formatDate(reservation.createdAt)}</TableCell>
              <TableCell>
                <IconButton onClick={() => onView(reservation)} size="small">
                  <ViewIcon />
                </IconButton>
                <IconButton onClick={() => onDelete(reservation)} size="small" color="error">
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Reservation Details Component
function ReservationDetails({ 
  reservation, 
  formatDate 
}: { 
  reservation: Reservation; 
  formatDate: (timestamp: any) => string;
}) {
  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>Reservation Information</Typography>
          <Typography><strong>Code:</strong> {reservation.reservationCode}</Typography>
          <Typography><strong>Status:</strong> {reservation.status}</Typography>
          <Typography><strong>Total:</strong> ${reservation.total.toLocaleString()}</Typography>
          <Typography><strong>Created:</strong> {formatDate(reservation.createdAt)}</Typography>
          <Typography><strong>Updated:</strong> {formatDate(reservation.updatedAt)}</Typography>
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>Passengers</Typography>
          {reservation.passengers.map((passenger) => (
            <Box key={passenger.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="subtitle2">{passenger.name}</Typography>
              <Typography variant="body2">
                Ticket: {passenger.ticket.status} - ${passenger.ticket.price}
              </Typography>
              <Typography variant="body2">
                Seat: {passenger.ancillaries.seat.status} - ${passenger.ancillaries.seat.price}
              </Typography>
              <Typography variant="body2">
                Bag: {passenger.ancillaries.bag.status} - ${passenger.ancillaries.bag.price}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
