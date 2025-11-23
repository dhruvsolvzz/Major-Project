import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = ({ label, name, onChange, accept = "image/*,application/pdf", required = true }) => {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
      
      onChange(e);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = { target: { files: [file] } };
      handleFileChange(event);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <label className="block text-slate-700 font-semibold mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <motion.div 
        whileHover={{ scale: 1.01 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          isDragging 
            ? 'border-do-blue-500 bg-do-blue-50' 
            : preview 
              ? 'border-green-400 bg-green-50' 
              : 'border-slate-300 hover:border-do-blue-400 hover:bg-slate-50'
        }`}
      >
        <input
          type="file"
          name={name}
          accept={accept}
          onChange={handleFileChange}
          required={required}
          className="hidden"
          id={name}
        />
        <label htmlFor={name} className="cursor-pointer">
          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <img src={preview} alt="Preview" className="max-h-40 mx-auto mb-2 rounded-lg shadow-md" />
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-slate-400 mb-2"
              >
                <motion.svg 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 mx-auto" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </motion.svg>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-sm text-slate-700 font-medium">
            {fileName || (isDragging ? '📂 Drop file here' : '📁 Click to upload or drag and drop')}
          </p>
          <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG, HEIC, WebP (Max 10MB)</p>
        </label>
      </motion.div>
    </motion.div>
  );
};

export default FileUpload;
