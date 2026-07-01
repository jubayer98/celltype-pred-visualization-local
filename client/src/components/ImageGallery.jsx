// src/components/ImageGallery.jsx
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef } from 'react';
import InlineZoomImage from './InlineZoomImage.jsx';
import Legend from './Legend.jsx';

function ImageGallery({
  coreId,
  isZoomActive,
  isSegmentationActive,
  isNumberOverlayActive,
  isCtNumberOverlayActive,
  isThresholdedActive,
  onCelltypesFound,
  selectedCelltype,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderedImages, setOrderedImages] = useState([]);
  const [frozenImageSrc, setFrozenImageSrc] = useState(null);
  const [segmentationUrl, setSegmentationUrl] = useState(null);
  const [numberOverlayUrl, setNumberOverlayUrl] = useState(null);
  const [ctNumberOverlayUrl, setCtNumberOverlayUrl] = useState(null);
  const [celltypeLegend, setCelltypeLegend] = useState(null);

  // Store the latest callback to avoid making it a dependency
  const onCelltypesFoundRef = useRef(onCelltypesFound);
  useEffect(() => {
    onCelltypesFoundRef.current = onCelltypesFound;
  }, [onCelltypesFound]);

  const [zoomStyle, setZoomStyle] = useState({
    transform: 'scale(1)',
    transformOrigin: '50% 50%',
  });

  // Reset zoom and frozen state when coreId changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setZoomStyle({ transform: 'scale(1)', transformOrigin: '50% 50%' });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFrozenImageSrc(null);
  }, [coreId]);

  // Reset zoom when global zoom is turned off
  useEffect(() => {
    if (!isZoomActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setZoomStyle({ transform: 'scale(1)', transformOrigin: '50% 50%' });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFrozenImageSrc(null);
      document.body.style.overflowY = 'auto';
    }
  }, [isZoomActive]);

  // Main data fetching effect
  useEffect(() => {
    if (!coreId) return;

    const abortController = new AbortController();

    const fetchImages = async () => {
      setIsLoading(true);
      setError(null);

      // Reset overlays
      setSegmentationUrl(null);
      setNumberOverlayUrl(null);
      setCtNumberOverlayUrl(null);
      setCelltypeLegend(null);

      try {
        // 1. Fetch celltype legend
        const legendResponse = await fetch(
          `http://localhost:3000/api/images/${coreId}/csv?prefix=sp_`,
          { signal: abortController.signal }
        );
        if (legendResponse.ok) {
          const text = await legendResponse.text();
          const celltypes = [];
          const rows = text.trim().split('\n').slice(1);
          rows.forEach((row) => {
            const [id, name, color] = row.split(',');
            if (id && name && color) {
              celltypes.push({
                id: id.trim(),
                name: name.trim(),
                color: color.trim(),
              });
            }
          });
          setCelltypeLegend(celltypes);
        } else {
          console.warn(`Could not fetch celltype_info.csv for core "${coreId}".`);
        }

        // 2. Fetch image list
        const response = await fetch(
          `http://localhost:3000/api/images/${coreId}`,
          { signal: abortController.signal }
        );
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Core ID "${coreId}" not found.`);
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        const findImage = (name) => data.find((url) => url.endsWith(name)) || null;

        // 3. Extract specific overlay URLs
        const spSegmentationOverlay = findImage(`sp_${coreId}_segmentation_overlay.png`);
        const spNumberOverlay = findImage(`sp_${coreId}_celltypes_number.png`);
        const ctNumberOverlay = findImage(`ct_${coreId}_celltypes_number.png`);

        setSegmentationUrl(spSegmentationOverlay);
        setNumberOverlayUrl(spNumberOverlay);
        setCtNumberOverlayUrl(ctNumberOverlay);

        // 4. Build ordered image list (celltypes + markers)
        let primaryCelltypeImage, secondaryCelltypeImage;
        const primaryDisplayName = 'Cell Types (SP)';
        const secondaryDisplayName = 'Cell Types (CT)';

        if (selectedCelltype && selectedCelltype !== 'All') {
          primaryCelltypeImage = findImage(`sp_${coreId}_celltype_${selectedCelltype}.png`);
          secondaryCelltypeImage = findImage(`ct_${coreId}_celltype_${selectedCelltype}.png`);
        } else {
          primaryCelltypeImage = findImage(`sp_${coreId}_celltypes.png`);
          secondaryCelltypeImage = findImage(`ct_${coreId}_celltypes.png`);
        }

        const newOrderedImages = [
          { url: primaryCelltypeImage, name: primaryDisplayName, isStatic: false },
          { url: secondaryCelltypeImage, name: secondaryDisplayName, isStatic: false },
        ];

        // 5. Marker images in specified order
        const markerOrder = [
          'DAPI', 'PAX5', 'CD3', 'CD11b', 'CD11c', 'CD68', 'CD90',
          'PDN', 'CD31', 'CD34', 'CD56', 'CD57', 'CD138', 'CD15',
        ];
        const markerImages = markerOrder.map((marker) => {
          let url;
          if (marker === 'DAPI') {
            url = findImage(`sp_${coreId}_DAPI_raw.png`);
          } else {
            const suffix = isThresholdedActive ? 'thresholded' : 'raw';
            url = findImage(`sp_${coreId}_${marker}_${suffix}.png`);
          }
          return { url, name: '' };
        });

        setOrderedImages([...newOrderedImages, ...markerImages]);

        // 6. Extract celltype variations for dropdown
        const celltypeVariationImages = data.filter((url) =>
          url.includes('_celltype_')
        );
        const variations = celltypeVariationImages
          .map((url) => {
            const filename = url.split('/').pop();
            const match = filename.match(/_celltype_(.*?)\.png/);
            return match ? match[1] : null;
          })
          .filter(Boolean);

        if (onCelltypesFoundRef.current) {
          onCelltypesFoundRef.current(variations.length > 0 ? ['All', ...variations] : []);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchImages();

    return () => {
      abortController.abort();
    };
  }, [coreId, selectedCelltype, isThresholdedActive]); // onCelltypesFound is NOT a dependency

  // Helper click handler
  const handleImageClick = (src) => {
    if (!isZoomActive || !src) return;
    setFrozenImageSrc((prev) => (prev === src ? null : src));
  };

  // Render
  if (isLoading) {
    return (
      <div className="spinner-container" aria-label="Loading images">
        <div className="spinner"></div>
      </div>
    );
  }
  if (error) return <p className="error-message">{error}</p>;

  // Only show "No images" message if not loading and there are no images.
  if (orderedImages.filter(img => img.url).length === 0) {
    return <p>No images found in this set.</p>;
  }

  return (
    <>
      <Legend celltypes={celltypeLegend} />
      <div className="gallery-container">
        {orderedImages.filter(img => img.url).map((img, index) => (
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
            isCtNumberOverlayActive={isCtNumberOverlayActive}
            segmentationSrc={isSegmentationActive ? segmentationUrl : null}
            numberOverlaySrc={
              isNumberOverlayActive ? numberOverlayUrl : null
            }
            ctNumberOverlaySrc={
              isCtNumberOverlayActive ? ctNumberOverlayUrl : null
            }
            isAnyImageFrozen={!!frozenImageSrc}
            isFrozen={frozenImageSrc === img.url}
            onImageClick={() => handleImageClick(img.url)}
            zoomStyle={zoomStyle}
            setZoomStyle={setZoomStyle}
          />
        ))}
      </div>
    </>
  );
}

export default ImageGallery;