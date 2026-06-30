/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';

const ZoomableImage = ({ src, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState('50% 50%');
  const imgRef = useRef(null);

  const handleWheel = (e) => {
    e.preventDefault();
    // Zoom in or out based on scroll direction
    const newZoom = zoom + e.deltaY * -0.01;
    // Clamp the zoom level between 1 (no zoom) and 5 (max zoom)
    setZoom(Math.min(Math.max(1, newZoom), 5));
  };

  const handleMouseMove = (e) => {
    if (zoom > 1) {
      const { left, top, width, height } = imgRef.current.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      setOrigin(`${x}% ${y}%`);
    }
  };

  // Add and remove event listeners
  useEffect(() => {
    const imgElement = imgRef.current;
    imgElement.addEventListener('wheel', handleWheel, { passive: false });
    imgElement.addEventListener('mousemove', handleMouseMove);

    return () => {
      imgElement.removeEventListener('wheel', handleWheel);
      imgElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [zoom]); // Re-attach listeners if zoom changes to correctly capture state

  return (
    <div className="zoom-overlay" onClick={onClose}>
      <img
        ref={imgRef}
        src={src}
        alt="Zoomed"
        className="zoomed-image"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: origin,
        }}
        onClick={(e) => e.stopPropagation()} // Prevent overlay close when clicking image
      />
    </div>
  );
};

export default ZoomableImage;