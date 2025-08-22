import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ImageGenerator.module.css';
import default_image from '../../assets/default_image.svg';
import { ArrowLeft } from 'lucide-react';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('/');
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);         
  const [imageLoading, setImageLoading] = useState(false); 
  const navigate = useNavigate();
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

  const downloadImage = () => {
    if (imageUrl === '/' || !imageUrl) return;

    const safeName = prompt.trim().replace(/\s+/g, '_').slice(0, 30);
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${safeName || 'generated_image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imageGenerator = async () => {
    if (inputRef.current.value === '') return;

    setLoading(true);
    setImageLoading(true);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'User-Agent': 'Chrome',
      },
      body: JSON.stringify({
        prompt: `${inputRef.current.value}`,
        n: 1,
        size: '512x512',
      }),
    });

    const data = await response.json();
    const data_array = data.data;
    setImageUrl(data_array[0].url);
    setLoading(false);
    // Wait for <img> onLoad before setting imageLoading false
  };

  return (
    <div className={styles.page}>
      {/* 🔙 Back Button */}
      <button 
        className={styles.backButton} 
        onClick={() => navigate(-1)} 
        title="Go Back"
      >
        <ArrowLeft size={16} />
      </button>

      <h1 className={styles.title}>
        AI Image <span>Generator</span>
      </h1>

      <div className={styles.content}>
        {/* Input Section */}
        <div style={{ flex: 1 }}>
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a prompt to Generate Images"
            className={styles.promptBox}
          />

          <button
            onClick={imageGenerator}
            disabled={!prompt || loading}
            className={styles.button}
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>
        </div>

        {/* Output Image Section */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <img
            src={imageUrl === '/' ? default_image : imageUrl}
            alt="Generated"
            className={styles.generatedImage}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />

          {/* Orange Loader */}
          {imageLoading && (
            <>
              <div className={styles.loading}></div>
              <div className={styles['loading-bar-full']}></div>
              <div className={styles['loading-text']}>Loading...</div>
            </>
          )}

          {/* Download Button */}
          {imageUrl !== '/' && !imageLoading && (
            <button
              onClick={downloadImage}
              className={styles.button}
            >
              Download Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
