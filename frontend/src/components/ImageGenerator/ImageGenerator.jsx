  import React, { useRef, useState } from 'react';
  import styles from './ImageGenerator.module.css';
  import default_image from '../../assets/default_image.svg';


  const ImageGenerator = () => {
    const [prompt, setPrompt] = useState('');
    const [imageUrl, setImageUrl] = useState("/");
    let inputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    // const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY; // ✅ This works in Vite


  //   const downloadImage = async () => {
  //   try {
  //     const response = await fetch(imageUrl, { mode: 'cors' });
  //     const blob = await response.blob();
  //     const blobUrl = window.URL.createObjectURL(blob);

  //     const link = document.createElement('a');
  //     link.href = blobUrl;
  //     link.download = 'generated_image.png';
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(blobUrl);
  //   } catch (error) {
  //     console.error("Failed to download image", error);
  //   }
  // };

//   const downloadImage = () => {
//   if (imageUrl === "/" || !imageUrl) return;

//   const link = document.createElement('a');
//   link.href = imageUrl;
//   link.setAttribute('download', 'generated_image.png');
//   link.setAttribute('target', '_blank'); // optional: open in new tab for preview
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// };


const downloadImage = () => {
  if (imageUrl === "/" || !imageUrl) return;

  const safeName = prompt.trim().replace(/\s+/g, "_").slice(0, 30);
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `${safeName || "generated_image"}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};



    const imageGenerator = async () =>{
      if(inputRef.current.value===""){
        return 0;
      }
      setLoading(true);

      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json",
            // Authorization:
            // `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "User-Agent":"Chrome",
          },
          body:JSON.stringify({
            prompt:`${inputRef.current.value}`,
            n:1,
            size:"512x512",
          }),
        }
      );

      let data = await response.json();
      let data_array = data.data;
      setImageUrl(data_array[0].url);
      setLoading(false);
    }

    return (
      <div style={{backgroundColor:'#f8f9fa'}}>
      <div style={{ padding: '6rem', maxWidth: '1000px', margin: 'auto' }}>
    <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>
      AI Image <span style={{ color: 'orange' }}>Generator</span>
    </h1>

    <div style={{ display: 'flex',flexDirection: 'row-reverse', gap: '2rem', alignItems: 'flex-start' }}>
      
    
      <div style={{ flex: 1 }}>
        <textarea
          type="text"
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a prompt to Generate Images"
          style={{
            width: '100%',
            height:'390px',
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '6px',
            border: '1px solid #ccc',
            fontSize: '1rem'
          }}
        />

        <button
          onClick={imageGenerator}
          disabled={!prompt || loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'orange',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: prompt ? 'pointer' : 'not-allowed'
          }}
        >
          {loading ? 'Generating...' : 'Generate Image'}
        </button>
      </div>

    
      <div style={{ flex: 1, textAlign: 'center'  }}>
    
          <img
            src={imageUrl === "/" ? default_image : imageUrl}
            alt="Generated"
            className="generated-image"
            style={{ width: '100%', maxWidth: '400px', height: 'auto' }}
          />
          <div className={styles.loading}></div>
  <div className={loading ? styles['loading-bar-full'] : styles['loading-bar']}></div>
  <div className={loading ? styles['loading-text'] : styles['display-none']}>Loading...</div>
  
  {/* Download Button */}
      {imageUrl !== "/" && !loading && (
      <button
    onClick={downloadImage}
    style={{
      display: 'inline-block',
      marginTop: '1rem',
      padding: '0.75rem 1.5rem',
      backgroundColor: 'orange',
      color: 'white',
      borderRadius: '6px',
      fontWeight: 'bold',
      fontSize: '1rem',
      cursor: 'pointer',
      border: 'none'
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
