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



// // src/components/feed/CreatePost.jsx
// import React, { useState, useRef, useCallback } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   IoCameraOutline,
//   IoCloseOutline,
//   IoCloudUploadOutline,
//   IoNutritionOutline,
//   IoImageOutline,
//   IoCheckmarkCircleOutline,
//   IoAlertCircleOutline,
//   IoTextOutline,
// } from 'react-icons/io5';
// import { useFeed } from '../../context/FeedContext';
// import Button from '../ui/Button';
// import Card from '../ui/Card';
// import toast from 'react-hot-toast';

// export default function CreatePost({ onPostCreated }) {
//   const { createPost } = useFeed();
//   const [image, setImage] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [caption, setCaption] = useState('');
//   const [foodName, setFoodName] = useState('');
//   const [nutrition, setNutrition] = useState({
//     calories: '',
//     protein: '',
//     carbs: '',
//     fat: '',
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [showNutrition, setShowNutrition] = useState(false);
//   const [isDragging, setIsDragging] = useState(false);
//   const [imageError, setImageError] = useState(null);
//   const [postType, setPostType] = useState('image'); // 'image' | 'text'
//   const fileInputRef = useRef(null);

//   // ============ IMAGE COMPRESSION ============
//   const compressImage = useCallback((file) => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.readAsDataURL(file);
//       reader.onload = (event) => {
//         const img = new Image();
//         img.src = event.target.result;
//         img.onload = () => {
//           const canvas = document.createElement('canvas');
//           const MAX_WIDTH = 1200;
//           const MAX_HEIGHT = 1200;
//           let width = img.width;
//           let height = img.height;

//           if (width > height) {
//             if (width > MAX_WIDTH) {
//               height *= MAX_WIDTH / width;
//               width = MAX_WIDTH;
//             }
//           } else {
//             if (height > MAX_HEIGHT) {
//               width *= MAX_HEIGHT / height;
//               height = MAX_HEIGHT;
//             }
//           }

//           canvas.width = width;
//           canvas.height = height;
//           const ctx = canvas.getContext('2d');
//           ctx.imageSmoothingEnabled = true;
//           ctx.imageSmoothingQuality = 'high';
//           ctx.drawImage(img, 0, 0, width, height);

//           const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
//           resolve(compressedDataUrl);
//         };
//         img.onerror = reject;
//       };
//       reader.onerror = reject;
//     });
//   }, []);

//   // ============ HANDLE IMAGE SELECT ============
//   const handleImageSelect = async (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       await processImage(file);
//     }
//   };

//   const handleDrop = async (event) => {
//     event.preventDefault();
//     setIsDragging(false);
//     const file = event.dataTransfer.files[0];
//     if (file && file.type.startsWith('image/')) {
//       await processImage(file);
//     }
//   };

//   const processImage = async (file) => {
//     setImageError(null);
    
//     if (file.size > 15 * 1024 * 1024) {
//       setImageError('Image size should be less than 15MB');
//       toast.error('Image size should be less than 15MB');
//       return;
//     }

//     const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
//     if (!validTypes.includes(file.type)) {
//       setImageError('Please select a valid image (JPG, PNG, WEBP, GIF)');
//       toast.error('Please select a valid image (JPG, PNG, WEBP, GIF)');
//       return;
//     }

//     try {
//       const compressedDataUrl = await compressImage(file);
//       const response = await fetch(compressedDataUrl);
//       const blob = await response.blob();
//       const compressedFile = new File([blob], file.name, { 
//         type: 'image/jpeg',
//         lastModified: Date.now(),
//       });

//       setImage(compressedFile);
//       setPreviewUrl(compressedDataUrl);
//       setPostType('image');
//       toast.success('Image uploaded successfully!');
//     } catch (error) {
//       console.error('Image processing error:', error);
//       setImageError('Failed to process image');
//       toast.error('Failed to process image');
//     }
//   };

//   // ============ HANDLE DRAG EVENTS ============
//   const handleDragEnter = (e) => {
//     e.preventDefault();
//     setIsDragging(true);
//   };

//   const handleDragLeave = (e) => {
//     e.preventDefault();
//     setIsDragging(false);
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//     setIsDragging(true);
//   };

//   // ============ REMOVE IMAGE ============
//   const removeImage = () => {
//     setImage(null);
//     setPreviewUrl(null);
//     setImageError(null);
//     setPostType('text');
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   // ============ SUBMIT POST ============
//   const handleSubmit = async () => {
//     // ✅ Allow text-only posts (no image required)
//     if (!foodName.trim() && !caption.trim()) {
//       toast.error('Please enter a food name or a caption');
//       return;
//     }

//     setIsLoading(true);
//     const formData = new FormData();
    
//     // ✅ Only append image if it exists
//     if (image) {
//       formData.append('image', image);
//     }
//     formData.append('foodName', foodName.trim() || 'Untitled Meal');
//     formData.append('caption', caption.trim());

//     if (nutrition.calories || nutrition.protein || nutrition.carbs || nutrition.fat) {
//       formData.append('nutrition', JSON.stringify({
//         calories: parseFloat(nutrition.calories) || 0,
//         protein: parseFloat(nutrition.protein) || 0,
//         carbohydrates: parseFloat(nutrition.carbs) || 0,
//         fat: parseFloat(nutrition.fat) || 0,
//       }));
//     }

//     try {
//       const result = await createPost(formData);
//       if (result) {
//         // Reset form
//         removeImage();
//         setCaption('');
//         setFoodName('');
//         setNutrition({ calories: '', protein: '', carbs: '', fat: '' });
//         setShowNutrition(false);
//         setPostType('text');
//         if (onPostCreated) onPostCreated();
//         toast.success('🍽️ Post created successfully!');
//       }
//     } catch (error) {
//       console.error('Create post error:', error);
//       toast.error(error.response?.data?.message || 'Failed to create post');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ============ RESET FORM ============
//   const resetForm = () => {
//     removeImage();
//     setCaption('');
//     setFoodName('');
//     setNutrition({ calories: '', protein: '', carbs: '', fat: '' });
//     setShowNutrition(false);
//     setImageError(null);
//     setPostType('text');
//   };

//   // ============ TOGGLE POST TYPE ============
//   const togglePostType = () => {
//     if (postType === 'image' && !image) {
//       setPostType('text');
//     } else if (postType === 'text') {
//       setPostType('image');
//     }
//   };

//   return (
//     <Card className="mb-6" glow>
//       {/* Header */}
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex items-center gap-3">
//           <div className="rounded-full bg-brand/20 p-2 text-brand">
//             {postType === 'image' ? <IoCameraOutline size={24} /> : <IoTextOutline size={24} />}
//           </div>
//           <div>
//             <h3 className="font-bold text-fg">Share Your Meal</h3>
//             <p className="text-sm text-fg-muted">
//               {postType === 'image' ? 'Add a photo to your post' : 'Share your thoughts'}
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2">
//           {/* ✅ Toggle between image and text post */}
//           <button
//             onClick={togglePostType}
//             className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
//               postType === 'image'
//                 ? 'bg-brand/20 text-brand'
//                 : 'bg-surface-muted text-fg-muted hover:text-fg'
//             }`}
//           >
//             <IoImageOutline className="inline mr-1" size={14} />
//             {postType === 'image' ? 'With Image' : 'Text Only'}
//           </button>
//           {previewUrl && (
//             <button
//               onClick={resetForm}
//               className="text-sm text-fg-muted hover:text-danger transition-colors"
//             >
//               Clear all
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Image Upload Area - Only show if postType is 'image' */}
//       {postType === 'image' && !previewUrl && (
//         <div
//           onDrop={handleDrop}
//           onDragOver={handleDragOver}
//           onDragEnter={handleDragEnter}
//           onDragLeave={handleDragLeave}
//           onClick={() => fileInputRef.current?.click()}
//           className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
//             isDragging
//               ? 'border-brand bg-brand/10'
//               : 'border-border-default bg-surface-muted/30 hover:border-brand hover:bg-brand/5'
//           }`}
//         >
//           <div className="flex flex-col items-center gap-3">
//             <div className={`rounded-full p-4 ${
//               isDragging ? 'bg-brand/20 text-brand' : 'bg-brand/10 text-brand/60'
//             }`}>
//               <IoCloudUploadOutline size={40} />
//             </div>
//             <div>
//               <p className="text-sm font-medium text-fg">
//                 {isDragging ? 'Drop your food photo here' : 'Drop your food photo here'}
//               </p>
//               <p className="text-xs text-fg-muted">or click to browse</p>
//               <p className="mt-1 text-xs text-fg-subtle">JPG, PNG, WEBP • Max 15MB</p>
//               <p className="mt-1 text-xs text-fg-subtle">Optional - you can post without an image</p>
//             </div>
//           </div>
//           <input
//             ref={fileInputRef}
//             type="file"
//             accept="image/*"
//             onChange={handleImageSelect}
//             className="hidden"
//           />
//         </div>
//       )}

//       {/* Image Preview */}
//       {previewUrl && (
//         <div className="space-y-4">
//           <div className="relative rounded-xl overflow-hidden bg-surface-muted border border-border-default">
//             <img
//               src={previewUrl}
//               alt="Preview"
//               className="mx-auto max-h-64 w-auto object-contain"
//             />
//             <div className="absolute top-2 right-2 flex gap-2">
//               <button
//                 onClick={removeImage}
//                 className="rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
//                 title="Remove image"
//               >
//                 <IoCloseOutline size={18} />
//               </button>
//             </div>
//             <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
//               <IoCheckmarkCircleOutline size={14} className="text-green-400" />
//               Image uploaded
//             </div>
//           </div>
//         </div>
//       )}

//       {imageError && (
//         <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
//           <IoAlertCircleOutline size={18} />
//           {imageError}
//         </div>
//       )}

//       {/* Form Fields */}
//       <div className="space-y-3 mt-4">
//         <input
//           type="text"
//           value={foodName}
//           onChange={(e) => setFoodName(e.target.value)}
//           placeholder="What food is this? (optional)"
//           className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20"
//         />

//         <textarea
//           value={caption}
//           onChange={(e) => setCaption(e.target.value)}
//           placeholder="Share your thoughts..."
//           rows={2}
//           className="w-full rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 resize-none"
//         />

//         <button
//           onClick={() => setShowNutrition(!showNutrition)}
//           className="flex items-center gap-2 text-sm text-brand hover:text-brand/80 transition-colors"
//         >
//           <IoNutritionOutline size={18} />
//           {showNutrition ? 'Hide' : 'Add'} nutrition info
//         </button>

//         <AnimatePresence>
//           {showNutrition && (
//             <motion.div
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: 'auto' }}
//               exit={{ opacity: 0, height: 0 }}
//               className="grid grid-cols-2 gap-3 pt-1"
//             >
//               <input
//                 type="number"
//                 value={nutrition.calories}
//                 onChange={(e) => setNutrition(prev => ({ ...prev, calories: e.target.value }))}
//                 placeholder="Calories"
//                 className="rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none"
//               />
//               <input
//                 type="number"
//                 value={nutrition.protein}
//                 onChange={(e) => setNutrition(prev => ({ ...prev, protein: e.target.value }))}
//                 placeholder="Protein (g)"
//                 className="rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none"
//               />
//               <input
//                 type="number"
//                 value={nutrition.carbs}
//                 onChange={(e) => setNutrition(prev => ({ ...prev, carbs: e.target.value }))}
//                 placeholder="Carbs (g)"
//                 className="rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none"
//               />
//               <input
//                 type="number"
//                 value={nutrition.fat}
//                 onChange={(e) => setNutrition(prev => ({ ...prev, fat: e.target.value }))}
//                 placeholder="Fat (g)"
//                 className="rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none"
//               />
//             </motion.div>
//           )}
//         </AnimatePresence>

//         <Button
//           onClick={handleSubmit}
//           loading={isLoading}
//           className="w-full"
//           disabled={(!foodName.trim() && !caption.trim()) || isLoading}
//         >
//           {isLoading ? 'Posting...' : 'Post'}
//         </Button>

//         {/* ✅ Helper text for text-only posts */}
//         {!foodName.trim() && !caption.trim() && (
//           <p className="text-xs text-fg-subtle text-center">
//             Enter a food name or caption to post
//           </p>
//         )}
//       </div>
//     </Card>
//   );
// }