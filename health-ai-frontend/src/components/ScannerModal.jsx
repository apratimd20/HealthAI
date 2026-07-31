import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  IoCameraOutline,
  IoCloseOutline,
  IoScanOutline,
  IoAlertCircleOutline,
  IoCameraReverseOutline,
  IoImagesOutline,
} from 'react-icons/io5';
import { foodScannerService } from '../services/foodScannerService';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';

export default function ScannerModal({ isOpen, onClose, onScanComplete }) {
  const [mode, setMode] = useState('menu'); // 'menu' | 'camera' | 'preview' | 'captured' | 'analyzing' | 'result'
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const uploadInputRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      resetScanner();
    }
    return () => stopCamera();
  }, [isOpen, stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMode('camera');
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permissions or use upload.'
          : 'Camera not available. Use upload instead.'
      );
    }
  };

  const toggleCamera = () => {
    stopCamera();
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  useEffect(() => {
    if (mode === 'camera' && facingMode && !streamRef.current) {
      startCamera();
    }
  }, [mode, facingMode]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], 'captured-food.jpg', { type: 'image/jpeg' });
      setSelectedImage(file);
      setPreviewUrl(canvas.toDataURL('image/jpeg'));
      stopCamera();
      setMode('captured');
    }, 'image/jpeg', 0.92);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
      setResult(null);
      setMode('preview');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
      setResult(null);
      setMode('preview');
    }
  };

  const handleDragOver = (event) => event.preventDefault();

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setStatusMessage('');
    setMode('analyzing');

    try {
      await foodScannerService.analyzeFoodStream(
        selectedImage,
        (data) => setStatusMessage(data.message || 'Analyzing...'),
        () => {},
        (data) => {
          if (data.success) {
            setResult(data.data);
            toast.success('Analysis complete!');
            if (onScanComplete) onScanComplete(data.data);
            setMode('result');
          } else {
            toast.error('Failed to analyze food');
            setMode('preview');
          }
          setIsLoading(false);
        },
        (error) => {
          toast.error(error.message || 'Analysis failed');
          setIsLoading(false);
          setMode('preview');
        }
      );
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze food image');
      setIsLoading(false);
      setMode('preview');
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setStatusMessage('');
    setCameraError(null);
    setMode('menu');
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  const goBack = () => {
    stopCamera();
    resetScanner();
  };

  const formatNutritionValue = (value) => {
    return value !== undefined && value !== null ? Number(value).toFixed(1) : '0';
  };

  if (!isOpen) return null;

  const renderMenu = () => (
    <div className="space-y-4">
      <div
        onClick={startCamera}
        className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border-default bg-surface-muted/30 p-10 text-center transition hover:border-brand hover:bg-brand/5"
      >
        <div className="rounded-full bg-brand/20 p-4 text-brand">
          <IoCameraOutline size={36} />
        </div>
        <div>
          <p className="text-lg font-medium text-fg">Take a Photo</p>
          <p className="text-sm text-fg-muted">Use your camera to capture your meal</p>
        </div>
        <Button size="sm" variant="primary">Open Camera</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border-default" />
        <span className="text-xs text-fg-muted">OR</span>
        <div className="h-px flex-1 bg-border-default" />
      </div>

      <div
        onClick={() => uploadInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border-default bg-surface-muted/30 p-8 text-center transition hover:border-brand hover:bg-brand/5"
      >
        <div className="rounded-full bg-surface-muted p-3 text-fg-muted">
          <IoImagesOutline size={28} />
        </div>
        <div>
          <p className="text-base font-medium text-fg">Upload from Gallery</p>
          <p className="text-xs text-fg-muted">Drag & drop or click to browse (JPG, PNG, WEBP)</p>
        </div>
        <Button size="sm" variant="secondary">Choose File</Button>
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );

  const renderCamera = () => (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} autoPlay playsInline className="h-full max-h-[55vh] w-full object-contain" />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {cameraError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          <IoAlertCircleOutline size={18} />
          {cameraError}
        </div>
      )}

      <div className="flex items-center justify-center gap-6">
        <Button variant="text" onClick={goBack}>Cancel</Button>
        <button
          onClick={capturePhoto}
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 transition hover:bg-white/30"
        >
          <div className="h-12 w-12 rounded-full bg-white"></div>
        </button>
        <Button variant="text" onClick={toggleCamera}>
          <IoCameraReverseOutline size={20} />
        </Button>
      </div>
    </div>
  );

  const renderCaptured = () => (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-surface-muted">
        <img src={previewUrl} alt="Captured" className="mx-auto max-h-64 w-auto object-contain" />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={goBack}>Cancel</Button>
        <Button variant="outline" onClick={startCamera}>Retake</Button>
        <Button onClick={handleAnalyze} loading={isLoading} className="flex-1">
          <IoScanOutline size={18} />
          Analyze Food
        </Button>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl bg-surface-muted">
        <img src={previewUrl} alt="Food preview" className="mx-auto max-h-64 w-auto object-contain" />
        <button
          onClick={resetScanner}
          className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
        >
          <IoCloseOutline size={18} />
        </button>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={resetScanner} disabled={isLoading}>
          Change Image
        </Button>
        <Button onClick={handleAnalyze} loading={isLoading} className="flex-1" disabled={isLoading}>
          {isLoading ? 'Analyzing...' : <><IoScanOutline size={18} /> Analyze Food</>}
        </Button>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-brand/10 px-4 py-2 text-sm text-brand">
          <div className="h-2 w-2 animate-pulse rounded-full bg-brand"></div>
          {statusMessage}
        </div>
      )}
    </div>
  );

  const renderAnalyzing = () => (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
      <p className="text-lg font-medium text-fg">Analyzing your meal...</p>
      {statusMessage && (
        <p className="text-sm text-fg-muted">{statusMessage}</p>
      )}
      <div className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full animate-pulse rounded-full bg-brand" style={{ width: '60%' }} />
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="space-y-4">
      <div className="rounded-xl bg-surface-muted p-4">
        <h3 className="text-lg font-bold text-fg">{result.foodName || 'Unknown Food'}</h3>
        {result.description && <p className="mt-1 text-sm text-fg-muted">{result.description}</p>}
        {result.portionSize && <p className="mt-1 text-xs text-fg-subtle">Portion: {result.portionSize}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-surface-muted p-3 text-center">
          <div className="text-xl font-bold text-calories">{formatNutritionValue(result.calories)}</div>
          <div className="text-xs text-fg-muted">Calories</div>
        </div>
        <div className="rounded-xl bg-surface-muted p-3 text-center">
          <div className="text-xl font-bold text-protein">{formatNutritionValue(result.protein)}g</div>
          <div className="text-xs text-fg-muted">Protein</div>
        </div>
        <div className="rounded-xl bg-surface-muted p-3 text-center">
          <div className="text-xl font-bold text-carbs">{formatNutritionValue(result.carbohydrates)}g</div>
          <div className="text-xs text-fg-muted">Carbs</div>
        </div>
        <div className="rounded-xl bg-surface-muted p-3 text-center">
          <div className="text-xl font-bold text-fat">{formatNutritionValue(result.fat)}g</div>
          <div className="text-xs text-fg-muted">Fat</div>
        </div>
      </div>

      {(result.fiber || result.sugar) && (
        <div className="grid grid-cols-2 gap-3">
          {result.fiber && (
            <div className="rounded-xl bg-surface-muted p-3 text-center">
              <div className="text-lg font-bold text-fiber">{formatNutritionValue(result.fiber)}g</div>
              <div className="text-xs text-fg-muted">Fiber</div>
            </div>
          )}
          {result.sugar && (
            <div className="rounded-xl bg-surface-muted p-3 text-center">
              <div className="text-lg font-bold text-sugar">{formatNutritionValue(result.sugar)}g</div>
              <div className="text-xs text-fg-muted">Sugar</div>
            </div>
          )}
        </div>
      )}

      {result.healthyScore && (
        <div className="rounded-xl bg-surface-muted p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-muted">Health Score</span>
            <span className="text-lg font-bold text-brand">{result.healthyScore}/10</span>
          </div>
        </div>
      )}

      <Button onClick={resetScanner} className="w-full">
        <IoCameraOutline size={18} />
        Scan Another Food
      </Button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="glass-panel relative" glow>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-md p-1 text-fg-muted hover:bg-surface-muted hover:text-fg"
          >
            <IoCloseOutline size={24} />
          </button>

          <div className="mb-6 pr-10">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-brand/20 p-2 text-brand">
                <IoCameraOutline size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-fg">Food Scanner</h2>
                <p className="text-sm text-fg-muted">
                  {mode === 'camera' ? 'Point at your meal and tap capture' : 'Take or upload a photo of your meal for AI analysis'}
                </p>
              </div>
            </div>
          </div>

          {mode === 'menu' && renderMenu()}
          {mode === 'camera' && renderCamera()}
          {mode === 'captured' && renderCaptured()}
          {mode === 'preview' && renderPreview()}
          {mode === 'analyzing' && renderAnalyzing()}
          {mode === 'result' && renderResult()}
        </Card>
      </motion.div>
    </div>
  );
}