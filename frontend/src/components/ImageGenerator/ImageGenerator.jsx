import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ImageGenerator.module.css';
import default_image from '../../assets/default_image.svg';

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('/');
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);         // For button state
  const [imageLoading, setImageLoading] = useState(false); // For image loader
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
    // Do not set imageLoading false here — wait for <img onLoad>
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', position: 'relative', minHeight: '100vh' }}>
      {/* 🔙 Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          background: 'none',
          border: 'none',
          fontSize: '2rem',
          cursor: 'pointer',
          color: '#333',
          padding: '3rem',
        }}
        aria-label="Go Back"
      >
        ←
      </button>

      <div style={{ padding: '6rem', maxWidth: '1000px', margin: 'auto' }}>
        <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>
          AI Image <span style={{ color: '#ff6b35' }}>Generator</span>
        </h1>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row-reverse',
            gap: '2rem',
            alignItems: 'flex-start',
          }}
        >
          {/* Input Section */}
          <div style={{ flex: 1 }}>
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt to Generate Images"
              style={{
                width: '100%',
                height: '390px',
                padding: '0.75rem',
                marginBottom: '1rem',
                borderRadius: '6px',
                border: '1px solid #ccc',
                fontSize: '1rem',
              }}
            />

            <button
              onClick={imageGenerator}
              disabled={!prompt || loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ff6b35',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: prompt ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Generating...' : 'Generate Image'}
            </button>
          </div>

          {/* Output Image Section */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <img
              src={imageUrl === '/' ? default_image : imageUrl}
              alt="Generated"
              className="generated-image"
              style={{ width: '100%', maxWidth: '400px', height: 'auto' }}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />

            {/* Orange Loader shown until image fully loads */}
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
                style={{
                  display: 'inline-block',
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ff6b35',
                  color: 'white',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                Download Image
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;
