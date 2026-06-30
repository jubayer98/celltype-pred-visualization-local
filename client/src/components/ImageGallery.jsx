// src/components/ImageGallery.jsx
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import InlineZoomImage from './InlineZoomImage.jsx';
import Legend from './Legend.jsx';

function ImageGallery({ coreId, isZoomActive, isSegmentationActive, isNumberOverlayActive, isThresholdedActive, onCelltypesFound, selectedCelltype }) {
  // eslint-disable-next-line no-unused-vars
  const [imageUrls, setImageUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // State to hold the ordered images for the new layout
  const [orderedImages, setOrderedImages] = useState([]);
  // State to track which image is "frozen"
  const [frozenImageSrc, setFrozenImageSrc] = useState(null);
  // State for the segmentation overlay URL
  const [segmentationUrl, setSegmentationUrl] = useState(null);
  // State for the number overlay URL
  const [numberOverlayUrl, setNumberOverlayUrl] = useState(null);
  // State for celltype legend data
  const [celltypeLegend, setCelltypeLegend] = useState(null);

  // Shared zoom state for all images
  const [zoomStyle, setZoomStyle] = useState({
    transform: 'scale(1)',
    transformOrigin: '50% 50%',
  });

  useEffect(() => {
    // Reset zoom and frozen state when the image set changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoomStyle({ transform: 'scale(1)', transformOrigin: '50% 50%' });
    setFrozenImageSrc(null);
    setSegmentationUrl(null);
    setNumberOverlayUrl(null);
    setCelltypeLegend(null);

    // Do nothing if the imageSet is not provided
    if (!coreId) return;

    const fetchImages = async () => {
      setIsLoading(true);
      setError(null);
      
      // --- Fetch and Parse Celltype Legend Data ---
      try {
        const legendResponse = await fetch(`http://localhost:3000/api/images/${coreId}/csv`);
        if (legendResponse.ok) {
          const text = await legendResponse.text();
          const celltypes = [];
          // Split by newline and skip the header row
          const rows = text.trim().split('\n').slice(1);

          rows.forEach(row => {
            const [id, type, cc] = row.split(',');
            if (id && type && cc) {
              celltypes.push({
                id: id.trim(),
                name: type.trim(),
                color: cc.trim(),
              });
            }
          });
          setCelltypeLegend(celltypes);
        } else {
          console.warn(`Could not fetch celltype_info.csv for core "${coreId}".`);
        }
      } catch (legendError) {
        console.error(`Error fetching or parsing celltype_info.csv for core "${coreId}":`, legendError);
      }

      try {
        // Fetch images from your Express backend API
        // Make sure your backend is running on localhost:3000
        const response = await fetch(`http://localhost:3000/api/images/${coreId}`);

        if (!response.ok) {
          // The backend returns a 404 if the directory is not found
          if (response.status === 404) {
            throw new Error(`Core ID "${coreId}" not found.`);
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        // Decide whether to show raw or thresholded images
        const imagesToShow = isThresholdedActive
          ? data.filter(url => url.includes('_thresholded.png'))
          : data.filter(url => url.includes('_raw'));
        setImageUrls(imagesToShow);

        // --- New layout logic ---
        const findImage = (name) => data.find(url => url.endsWith(name)) || null;

        const celltypesImage = findImage(`${coreId}_celltypes.png`);
        const segmentationOverlayImage = findImage(`${coreId}_segmentation_overlay.png`);
        const numberOverlayImage = findImage(`${coreId}_celltypes_number.png`);

        setSegmentationUrl(segmentationOverlayImage);
        setNumberOverlayUrl(numberOverlayImage);

        // --- Find and set celltype variations for the new dropdown ---
        const celltypeVariationImages = data.filter(url => url.includes('_celltype_'));
        const variations = celltypeVariationImages.map(url => {
          const filename = url.split('/').pop();
          const match = filename.match(/_celltype_(.*?)\.png/);
          return match ? match[1] : null;
        }).filter(Boolean);

        if (onCelltypesFound) {
          if (variations.length > 0) {
            onCelltypesFound(['All', ...variations]);
          } else {
            onCelltypesFound([]);
          }
        }

        // Determine which celltype image to show in the second slot.
        // The logic is now to show the base celltype image first, and the selected one second.
        let primaryCelltypeImage;
        let secondaryCelltypeImage;
        let primaryDisplayName;
        let secondaryDisplayName;

        if (selectedCelltype && selectedCelltype !== 'All') {
          const specificCelltypeImage = findImage(`${coreId}_celltype_${selectedCelltype}.png`);
          primaryCelltypeImage = specificCelltypeImage;
          secondaryCelltypeImage = specificCelltypeImage;
          primaryDisplayName = selectedCelltype;
          secondaryDisplayName = selectedCelltype;
        } else {
          primaryCelltypeImage = celltypesImage;
          secondaryCelltypeImage = celltypesImage;
          primaryDisplayName = 'Cell Types';
          secondaryDisplayName = 'Cell Types';
        }

        const newOrderedImages = [
          { url: primaryCelltypeImage, name: primaryDisplayName, isStatic: false },
          { url: secondaryCelltypeImage, name: secondaryDisplayName, isStatic: false },
        ];

        // --- New marker ordering and DAPI logic ---
        const markerOrder = ['DAPI', 'PAX5', 'CD3', 'CD11b', 'CD11c', 'CD68', 'CD90', 'PDN', 'CD31', 'CD34', 'CD56', 'CD57', 'CD138', 'CD15'];
        const otherImages = markerOrder.map(marker => {
          let imageUrl;
          if (marker === 'DAPI') {
            // Always show the raw DAPI image
            imageUrl = findImage(`${coreId}_${marker}_raw.png`);
          } else {
            // For other markers, respect the threshold toggle
            const suffix = isThresholdedActive ? 'thresholded' : 'raw';
            imageUrl = findImage(`${coreId}_${marker}_${suffix}.png`);
          }
          return { url: imageUrl, name: '' }; // name is derived in InlineZoomImage
        });

        setOrderedImages([...newOrderedImages, ...otherImages]);
      } catch (err) {
        setError(err.message); // Set error state to display it in the UI
        setImageUrls([]); // Clear previous images on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [coreId, selectedCelltype, onCelltypesFound, isThresholdedActive]); // Re-run when coreId or selectedCelltype changes

  // Reset zoom when the global toggle is turned off
  useEffect(() => {
    if (!isZoomActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setZoomStyle({ transform: 'scale(1)', transformOrigin: '50% 50%' });
      setFrozenImageSrc(null);
      document.body.style.overflowY = 'auto';
    }
  }, [isZoomActive]);

  const handleImageClick = (src) => {
    if (!isZoomActive || !src) return;
    setFrozenImageSrc(prev => (prev === src ? null : src));
  };

  if (isLoading) {
    return <p>Loading images...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <>
      <Legend celltypes={celltypeLegend} />
      <div
        className="gallery-container"
      >
        {orderedImages.length > 0 ? (
          orderedImages.map((img, index) => (
            <InlineZoomImage
              key={`${img.url}-${index}`}
              src={img.url}
              alt={img.name || `Image ${index + 1}`}
              displayName={img.name}
              isStatic={img.isStatic}
              isZoomActive={isZoomActive}
              isThresholdedActive={isThresholdedActive}
              isSegmentationActive={isSegmentationActive}
              isNumberOverlayActive={isNumberOverlayActive}
              segmentationSrc={segmentationUrl}
              numberOverlaySrc={numberOverlayUrl}
              isAnyImageFrozen={!!frozenImageSrc}
              isFrozen={frozenImageSrc === img.url}
              onImageClick={() => handleImageClick(img.url)}
              zoomStyle={zoomStyle}
              setZoomStyle={setZoomStyle}
            />
          ))
        ) : (
          // Show this message if the fetch was successful but returned no images
          !isLoading && <p>No images found in this set.</p>
        )}
      </div>
    </>
  );
}

export default ImageGallery;
