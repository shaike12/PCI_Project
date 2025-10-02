"use client";

import { Box, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

interface ActionButtonsProps {
  confirmDisabled?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function ActionButtons({ confirmDisabled, onConfirm, onCancel }: ActionButtonsProps) {
  return (
    <Box sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
      <Button
        fullWidth
        variant="contained"
        size="large"
        startIcon={<CheckCircleIcon />}
        sx={{ 
          mb: 2,
          bgcolor: 'primary.main',
          '&:hover': { bgcolor: 'primary.dark' },
          fontWeight: 600,
          py: 1.5
        }}
        disabled={!!confirmDisabled}
        onClick={onConfirm}
      >
        Confirm Payment
      </Button>
      
      <Button
        fullWidth
        variant="outlined"
        size="large"
        startIcon={<CloseIcon />}
        sx={{ 
          borderColor: 'grey.300', 
          color: 'text.secondary',
          fontWeight: 500,
          py: 1.5
        }}
        onClick={onCancel}
      >
        Cancel
      </Button>
    </Box>
  );
}


