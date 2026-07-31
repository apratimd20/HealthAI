// src/components/feed/CreatePost.jsx
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  IoCameraOutline,
  IoCloseOutline,
  IoCloudUploadOutline,
  IoNutritionOutline,
} from 'react-icons/io5';
import { useFeed } from '../../context/FeedContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import toast from 'react-hot-toast';

export default function CreatePost({ onPostCreated }) {
  const { createPost } = useFeed();
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [foodName, setFoodName] = useState('');
  const [nutrition, setNutrition] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event) => event.preventDefault();

  const handleSubmit = async () => {
    if (!image) {
      toast.error('Please select an image');
      return;
    }
    if (!foodName.trim()) {
      toast.error('Please enter the food name');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('foodName', foodName);
    formData.append('caption', caption);

    if (nutrition.calories || nutrition.protein || nutrition.carbs || nutrition.fat) {
      formData.append('nutrition', JSON.stringify({
        calories: parseFloat(nutrition.calories) || 0,
        protein: parseFloat(nutrition.protein) || 0,
        carbohydrates: parseFloat(nutrition.carbs) || 0,
        fat: parseFloat(nutrition.fat) || 0,
      }));
    }

    try {
      const result = await createPost(formData);
      if (result) {
        // Reset form
        setImage(null);
        setPreviewUrl(null);
        setCaption('');
        setFoodName('');
        setNutrition({ calories: '', protein: '', carbs: '', fat: '' });
        setShowNutrition(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onPostCreated) onPostCreated();
        toast.success('🍽️ Post created successfully!');
      }
    } catch (error) {
      console.error('Create post error:', error);
      toast.error('Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6" glow>
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-full bg-brand/20 p-2 text-brand">
          <IoCameraOutline size={24} />
        </div>
        <div>
          <h3 className="font-bold text-fg">Share Your Meal</h3>
          <p className="text-sm text-fg-muted">What are you eating today?</p>
        </div>
      </div>

      {!previewUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-border-default bg-surface-muted/30 p-8 text-center transition hover:border-brand hover:bg-brand/5"
        >
          <div className="flex flex-col items-center gap-3">
            <IoCloudUploadOutline size={40} className="text-brand/60" />
            <div>
              <p className="text-sm font-medium text-fg">Drop your food photo here</p>
              <p className="text-xs text-fg-muted">or click to browse</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-surface-muted">
            <img
              src={previewUrl}
              alt="Preview"
              className="mx-auto max-h-64 w-auto object-contain"
            />
            <button
              onClick={() => {
                setPreviewUrl(null);
                setImage(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
            >
              <IoCloseOutline size={18} />
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="What food is this? *"
              className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none"
            />

            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none"
            />

            <button
              onClick={() => setShowNutrition(!showNutrition)}
              className="flex items-center gap-2 text-sm text-brand hover:text-brand/80"
            >
              <IoNutritionOutline size={18} />
              {showNutrition ? 'Hide' : 'Add'} nutrition info
            </button>

            {showNutrition && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-3"
              >
                <input
                  type="number"
                  value={nutrition.calories}
                  onChange={(e) => setNutrition(prev => ({ ...prev, calories: e.target.value }))}
                  placeholder="Calories"
                  className="rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none"
                />
                <input
                  type="number"
                  value={nutrition.protein}
                  onChange={(e) => setNutrition(prev => ({ ...prev, protein: e.target.value }))}
                  placeholder="Protein (g)"
                  className="rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none"
                />
                <input
                  type="number"
                  value={nutrition.carbs}
                  onChange={(e) => setNutrition(prev => ({ ...prev, carbs: e.target.value }))}
                  placeholder="Carbs (g)"
                  className="rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none"
                />
                <input
                  type="number"
                  value={nutrition.fat}
                  onChange={(e) => setNutrition(prev => ({ ...prev, fat: e.target.value }))}
                  placeholder="Fat (g)"
                  className="rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none"
                />
              </motion.div>
            )}

            <Button
              onClick={handleSubmit}
              loading={isLoading}
              className="w-full"
              disabled={!image || !foodName.trim()}
            >
              {isLoading ? 'Posting...' : '📤 Post'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
