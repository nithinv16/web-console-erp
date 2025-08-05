'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  CircularProgress,
  Paper
} from '@mui/material'
import {
  Close,
  CameraAlt,
  FlashOn,
  FlashOff,
  FlipCameraAndroid
} from '@mui/icons-material'
import Webcam from 'react-webcam'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

interface BarcodeScannerProps {
  open: boolean
  onClose: () => void
  onScan: (barcode: string) => void
  title?: string
  supportedFormats?: string[]
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  open,
  onClose,
  onScan,
  title = 'Scan Barcode',
  supportedFormats = ['UPC-A', 'UPC-E', 'EAN-13', 'EAN-8', 'Code-128', 'QR Code']
}) => {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [lastScanTime, setLastScanTime] = useState(0)
  
  const webcamRef = useRef<Webcam>(null)
  const codeReader = useRef<BrowserMultiFormatReader | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize code reader
  useEffect(() => {
    if (open) {
      codeReader.current = new BrowserMultiFormatReader()
      checkCameraPermission()
    }
    
    return () => {
      if (codeReader.current) {
        codeReader.current.reset()
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [open])

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setHasPermission(true)
      stream.getTracks().forEach(track => track.stop())
    } catch (err) {
      setHasPermission(false)
      setError('Camera permission denied. Please allow camera access to scan barcodes.')
    }
  }

  // Image processing helpers for better barcode detection
  const enhanceContrast = (ctx: CanvasRenderingContext2D, imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data)
    const factor = 1.5 // Contrast factor
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128))     // Red
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)) // Green
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)) // Blue
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  const convertToGrayscale = (ctx: CanvasRenderingContext2D, imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data)
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
      data[i] = gray     // Red
      data[i + 1] = gray // Green
      data[i + 2] = gray // Blue
    }
    
    return new ImageData(data, imageData.width, imageData.height)
  }

  const startScanning = useCallback(() => {
    if (!codeReader.current || !webcamRef.current) return
    
    setIsScanning(true)
    setError(null)
    
    scanIntervalRef.current = setInterval(() => {
      captureAndScan()
    }, 300) // Scan every 300ms for better responsiveness
  }, [])

  const stopScanning = useCallback(() => {
    setIsScanning(false)
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
  }, [])

  const captureAndScan = useCallback(async () => {
    if (!webcamRef.current || !codeReader.current) return
    
    try {
      // Get higher quality screenshot
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1920,
        height: 1080
      })
      if (!imageSrc) return
      
      // Convert base64 to image element
      const img = new Image()
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          
          // Apply image processing for better detection
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          
          // Try multiple detection attempts with different processing
          const attempts = [
            // Original image
            imageData,
            // Enhanced contrast
            enhanceContrast(ctx, imageData),
            // Grayscale
            convertToGrayscale(ctx, imageData)
          ]
          
          for (const processedImageData of attempts) {
            try {
              // Convert ImageData back to canvas and get data URL
              const tempCanvas = document.createElement('canvas')
              const tempCtx = tempCanvas.getContext('2d')
              if (!tempCtx) continue
              
              tempCanvas.width = processedImageData.width
              tempCanvas.height = processedImageData.height
              tempCtx.putImageData(processedImageData, 0, 0)
              
              const result = await codeReader.current!.decodeFromImage(tempCanvas.toDataURL())
              
              if (result && result.getText()) {
                const now = Date.now()
                // Prevent duplicate scans within 1.5 seconds
                if (now - lastScanTime > 1500) {
                  setLastScanTime(now)
                  stopScanning()
                  console.log('Barcode detected:', result.getText())
                  onScan(result.getText())
                  onClose()
                  return
                }
              }
            } catch (err) {
              // Continue to next attempt
              if (!(err instanceof NotFoundException)) {
                console.warn('Scan attempt error:', err)
              }
            }
          }
        } catch (err) {
          console.error('Image processing error:', err)
        }
      }
      img.src = imageSrc
    } catch (err) {
      console.error('Capture error:', err)
    }
  }, [lastScanTime, onScan, onClose, stopScanning])

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const toggleTorch = async () => {
    try {
      const stream = webcamRef.current?.stream
      if (stream) {
        const track = stream.getVideoTracks()[0]
        if (track && 'torch' in track.getCapabilities()) {
          await track.applyConstraints({
            advanced: [{ torch: !torchEnabled } as any]
          })
          setTorchEnabled(!torchEnabled)
        }
      }
    } catch (err) {
      console.error('Torch error:', err)
    }
  }

  const handleClose = () => {
    stopScanning()
    onClose()
  }

  const videoConstraints = {
    width: { ideal: 1920, min: 640 },
    height: { ideal: 1080, min: 480 },
    facingMode: facingMode,
    aspectRatio: 16/9,
    frameRate: { ideal: 30, min: 15 },
    focusMode: 'continuous',
    exposureMode: 'continuous'
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        
        {hasPermission === null && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {hasPermission === false && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CameraAlt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Camera access is required to scan barcodes.
            </Typography>
            <Button
              variant="outlined"
              onClick={checkCameraPermission}
              sx={{ mt: 2 }}
            >
              Grant Permission
            </Button>
          </Box>
        )}
        
        {hasPermission && (
          <Box sx={{ position: 'relative' }}>
            <Paper
              elevation={0}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                bgcolor: 'black',
                aspectRatio: '16/9'
              }}
            >
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onUserMedia={() => {
                  if (!isScanning) {
                    startScanning()
                  }
                }}
                onUserMediaError={(err) => {
                  setError('Failed to access camera. Please check permissions.')
                  console.error('Camera error:', err)
                }}
              />
              
              {/* Scanning overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}
              >
                <Box
                  sx={{
                    width: '80%',
                    height: '60%',
                    border: '2px solid #fff',
                    borderRadius: 2,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      right: 0,
                      height: '2px',
                      bgcolor: isScanning ? 'primary.main' : 'transparent',
                      animation: isScanning ? 'scan 2s linear infinite' : 'none',
                      '@keyframes scan': {
                        '0%': { transform: 'translateY(-100px)' },
                        '100%': { transform: 'translateY(100px)' }
                      }
                    }
                  }}
                />
              </Box>
              
              {/* Camera controls */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  right: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <IconButton
                  onClick={toggleTorch}
                  sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                >
                  {torchEnabled ? <FlashOff /> : <FlashOn />}
                </IconButton>
                
                <Box sx={{ textAlign: 'center' }}>
                  {isScanning && (
                    <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                      Scanning...
                    </Typography>
                  )}
                  <Typography variant="caption" sx={{ color: 'white' }}>
                    Hold steady • Ensure good lighting • Position barcode clearly
                  </Typography>
                </Box>
                
                <IconButton
                  onClick={toggleCamera}
                  sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                >
                  <FlipCameraAndroid />
                </IconButton>
              </Box>
            </Paper>
          </Box>
        )}
        
        {/* Supported formats */}
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Supported formats: {supportedFormats.join(', ')}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BarcodeScanner