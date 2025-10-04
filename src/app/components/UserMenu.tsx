'use client';

import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Divider
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  CloudUpload,
  CloudDownload,
  Settings,
  Login
} from '@mui/icons-material';
import { useFirebase } from '../../hooks/useFirebase';

interface UserMenuProps {
  onSyncToCloud?: () => void;
  onSyncFromCloud?: () => void;
  onShowAuthModal?: () => void;
}

export default function UserMenu({ onSyncToCloud, onSyncFromCloud, onShowAuthModal }: UserMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useFirebase();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleMenuClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSyncToCloud = () => {
    onSyncToCloud?.();
    handleMenuClose();
  };

  const handleSyncFromCloud = () => {
    onSyncFromCloud?.();
    handleMenuClose();
  };

  const handleLogin = () => {
    onShowAuthModal?.();
    handleMenuClose();
  };

  if (!user) {
    return (
      <IconButton
        size="large"
        aria-label="login"
        onClick={handleLogin}
        color="inherit"
      >
        <Login />
      </IconButton>
    );
  }

  return (
    <>
      <IconButton
        size="large"
        aria-label="account of current user"
        aria-controls="user-menu"
        aria-haspopup="true"
        onClick={handleMenuOpen}
        color="inherit"
      >
        <Avatar sx={{ width: 32, height: 32 }}>
          {user.email?.charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>
      
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" sx={{ color: '#1B358F' }}>
            Signed in as
          </Typography>
          <Typography variant="body2" noWrap>
            {user.email}
          </Typography>
        </Box>
        
        <Divider />
        
        <MenuItem onClick={handleSyncToCloud}>
          <ListItemIcon>
            <CloudUpload fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sync to Cloud</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleSyncFromCloud}>
          <ListItemIcon>
            <CloudDownload fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sync from Cloud</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
