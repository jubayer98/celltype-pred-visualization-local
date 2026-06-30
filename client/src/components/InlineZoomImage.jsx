/* eslint-disable no-unused-vars */
import React, { useState, useRef } from 'react';

const InlineZoomImage = ({ src, alt, displayName, zoomStyle, setZoomStyle, isStatic = false, isZoomActive, isSegmentationActive, segmentationSrc, isNumberOverlayActive, numberOverlaySrc, isAnyImageFrozen, isFrozen, onImageClick }) => {
  const imgRef = useRef(null);

  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Stop the event from bubbling up
    const scaleMatch = zoomStyle.transform.match(/scale\(([^)]+)\)/);
    const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

    // Slower zoom speed
    const newScale = Math.min(Math.max(1, currentScale - e.deltaY * 0.005), 10);

    setZoomStyle((prev) => ({ ...prev, transform: `scale(${newScale})` }));
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle((prev) => ({ ...prev, transformOrigin: `${x}% ${y}%` }));
  };

  const handleMouseEnter = () => {
    // Disable page scrolling only if zoom is active and NO image is frozen.
    if (isZoomActive && !isAnyImageFrozen) {
      document.body.style.overflowY = 'hidden';
    }
  };

  const handleMouseLeave = () => {
    // Always re-enable page scrolling when leaving an item.
    document.body.style.overflowY = 'auto';
    // Only reset zoom if no image is frozen.
    if (!isAnyImageFrozen) {
      setZoomStyle({ transform: 'scale(1)', transformOrigin: '50% 50%' });
    }
  };

  // Use displayName if provided, otherwise parse from src
  const getImageName = (sourceUrl) => {
    if (!sourceUrl) return '';
    const fileName = src.split('/').pop() || '';
    const namePart = fileName.split('_raw')[0];
    const mainName = namePart.split('_').slice(1).join('_');
    if (!mainName) return '';
    return `${mainName} (raw)`;
  };
  const title = displayName || getImageName(src);

  return (
    <div
      className="gallery-item"
      onMouseEnter={!isStatic ? handleMouseEnter : undefined}
      onMouseLeave={!isStatic ? handleMouseLeave : undefined}
    >
      <div className="image-title-container">
        <p className="image-title">{title}</p>
      </div>
      <div
        className="image-zoom-wrapper"
        onMouseMove={isZoomActive && !isStatic && !isAnyImageFrozen ? handleMouseMove : undefined}
        onWheel={isZoomActive && !isStatic && !isAnyImageFrozen ? handleWheel : undefined}
        onClick={onImageClick}
      >
        {src ? (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            style={isZoomActive && !isStatic ? zoomStyle : {}}
            className={`${isStatic ? 'static-image' : ''} ${isZoomActive && !isStatic ? 'zoomable' : ''}`}
            loading="lazy"
          />
        ) : (
          <div className="placeholder">{displayName}</div>
        )}
        {isSegmentationActive && !isStatic && segmentationSrc && (
          <img
            src={segmentationSrc}
            alt="Segmentation Overlay"
            className="segmentation-overlay"
            style={isZoomActive ? zoomStyle : {}}
          />
        )}
        {isNumberOverlayActive && !isStatic && numberOverlaySrc && (
          <img
            src={numberOverlaySrc}
            alt="Number Overlay"
            className="number-overlay"
            style={isZoomActive ? zoomStyle : {}}
          />
        )}
        {isZoomActive && !isStatic && (
          <div className="zoom-indicator" style={{ opacity: isFrozen ? 0.8 : undefined }}>
            +
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineZoomImage;