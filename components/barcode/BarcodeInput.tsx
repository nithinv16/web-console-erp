'use client'

import React, { useState } from 'react'
import {
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  TextFieldProps
} from '@mui/material'
import {
  QrCodeScanner,
  QrCode
} from '@mui/icons-material'
import BarcodeScanner from './BarcodeScanner'

interface BarcodeInputProps extends Omit<TextFieldProps, 'onChange'> {
  value: string
  onChange: (value: string) => void
  onScan?: (barcode: string) => void
  scannerTitle?: string
  showScanButton?: boolean
  supportedFormats?: string[]
}

const BarcodeInput: React.FC<BarcodeInputProps> = ({
  value,
  onChange,
  onScan,
  scannerTitle = 'Scan Barcode',
  showScanButton = true,
  supportedFormats,
  ...textFieldProps
}) => {
  const [scannerOpen, setScannerOpen] = useState(false)

  const handleScan = (barcode: string) => {
    onChange(barcode)
    if (onScan) {
      onScan(barcode)
    }
    setScannerOpen(false)
  }

  const handleOpenScanner = () => {
    setScannerOpen(true)
  }

  const handleCloseScanner = () => {
    setScannerOpen(false)
  }

  return (
    <>
      <TextField
        {...textFieldProps}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputProps={{
          ...textFieldProps.InputProps,
          startAdornment: (
            <InputAdornment position="start">
              <QrCode />
            </InputAdornment>
          ),
          endAdornment: showScanButton ? (
            <InputAdornment position="end">
              <Tooltip title="Scan barcode with camera">
                <IconButton
                  onClick={handleOpenScanner}
                  edge="end"
                  size="small"
                  sx={{
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText'
                    }
                  }}
                >
                  <QrCodeScanner />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ) : textFieldProps.InputProps?.endAdornment
        }}
      />
      
      <BarcodeScanner
        open={scannerOpen}
        onClose={handleCloseScanner}
        onScan={handleScan}
        title={scannerTitle}
        supportedFormats={supportedFormats}
      />
    </>
  )
}

export default BarcodeInput