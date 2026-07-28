// src/components/ui/ScannerModal.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoCameraOutline,
  IoCloseOutline,
  IoCloudUploadOutline,
  IoScanOutline,
  IoNutritionOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
} from 'react-icons/io5';
import { foodScannerService } from '../services/foodScannerService';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';

export default function ScannerModal({ isOpen, onClose, onScanComplete }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setStatusMessage('');

    try {
      await foodScannerService.analyzeFoodStream(
        selectedImage,
        // On status
        (data) => {
          setStatusMessage(data.message || 'Analyzing...');
        },
        // On chunk
        (data) => {
          // We're using the complete event for final result
        },
        // On complete
        (data) => {
          if (data.success) {
            setResult(data.data);
            toast.success('✅ Food analysis complete!');
            if (onScanComplete) {
              onScanComplete(data.data);
            }
          } else {
            toast.error('Failed to analyze food');
          }
          setIsLoading(false);
        },
        // On error
        (error) => {
          toast.error(error.message || 'Analysis failed');
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze food image');
      setIsLoading(false);
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setStatusMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatNutritionValue = (value) => {
    return value !== undefined && value !== null ? Number(value).toFixed(1) : '0';
  };

  if (!isOpen) return null;

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
                  Upload or take a photo of your meal for AI analysis
                </p>
              </div>
            </div>
          </div>

          {!result ? (
            <div>
              {/* Upload Area */}
              {!previewUrl ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-border-default bg-surface-muted/30 p-12 text-center transition hover:border-brand hover:bg-brand/5"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="rounded-full bg-brand/20 p-4 text-brand">
                      <IoCloudUploadOutline size={40} />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-fg">
                        Drop your food image here
                      </p>
                      <p className="text-sm text-fg-muted">
                        or click to browse (JPG, PNG, WEBP)
                      </p>
                    </div>
                    <Button size="sm" variant="secondary">
                      Choose Image
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-surface-muted">
                    <img
                      src={previewUrl}
                      alt="Food preview"
                      className="mx-auto max-h-64 w-auto object-contain"
                    />
                    <button
                      onClick={resetScanner}
                      className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                    >
                      <IoCloseOutline size={18} />
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={resetScanner}
                      disabled={isLoading}
                    >
                      Change Image
                    </Button>
                    <Button
                      onClick={handleAnalyze}
                      loading={isLoading}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        'Analyzing...'
                      ) : (
                        <>
                          <IoScanOutline size={18} />
                          Analyze Food
                        </>
                      )}
                    </Button>
                  </div>

                  {statusMessage && (
                    <div className="flex items-center gap-2 rounded-lg bg-brand/10 px-4 py-2 text-sm text-brand">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-brand"></div>
                      {statusMessage}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Result */}
              <div className="rounded-xl bg-surface-muted p-4">
                <h3 className="text-lg font-bold text-fg">
                  {result.foodName || 'Unknown Food'}
                </h3>
                {result.description && (
                  <p className="mt-1 text-sm text-fg-muted">{result.description}</p>
                )}
                {result.portionSize && (
                  <p className="mt-1 text-xs text-fg-subtle">
                    Portion: {result.portionSize}
                  </p>
                )}
              </div>

              {/* Nutrition Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-surface-muted p-3 text-center">
                  <div className="text-xl font-bold text-calories">
                    {formatNutritionValue(result.calories)}
                  </div>
                  <div className="text-xs text-fg-muted">Calories</div>
                </div>
                <div className="rounded-xl bg-surface-muted p-3 text-center">
                  <div className="text-xl font-bold text-protein">
                    {formatNutritionValue(result.protein)}g
                  </div>
                  <div className="text-xs text-fg-muted">Protein</div>
                </div>
                <div className="rounded-xl bg-surface-muted p-3 text-center">
                  <div className="text-xl font-bold text-carbs">
                    {formatNutritionValue(result.carbohydrates)}g
                  </div>
                  <div className="text-xs text-fg-muted">Carbs</div>
                </div>
                <div className="rounded-xl bg-surface-muted p-3 text-center">
                  <div className="text-xl font-bold text-fat">
                    {formatNutritionValue(result.fat)}g
                  </div>
                  <div className="text-xs text-fg-muted">Fat</div>
                </div>
              </div>

              {/* Additional Nutrition */}
              {(result.fiber || result.sugar) && (
                <div className="grid grid-cols-2 gap-3">
                  {result.fiber && (
                    <div className="rounded-xl bg-surface-muted p-3 text-center">
                      <div className="text-lg font-bold text-fiber">
                        {formatNutritionValue(result.fiber)}g
                      </div>
                      <div className="text-xs text-fg-muted">Fiber</div>
                    </div>
                  )}
                  {result.sugar && (
                    <div className="rounded-xl bg-surface-muted p-3 text-center">
                      <div className="text-lg font-bold text-sugar">
                        {formatNutritionValue(result.sugar)}g
                      </div>
                      <div className="text-xs text-fg-muted">Sugar</div>
                    </div>
                  )}
                </div>
              )}

              {/* Healthy Score */}
              {result.healthyScore && (
                <div className="rounded-xl bg-surface-muted p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-fg-muted">Health Score</span>
                    <span className="text-lg font-bold text-brand">
                      {result.healthyScore}/10
                    </span>
                  </div>
                </div>
              )}

              <Button onClick={resetScanner} className="w-full">
                <IoCameraOutline size={18} />
                Scan Another Food
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}