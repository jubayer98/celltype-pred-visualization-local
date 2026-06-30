// src/App.jsx
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import ImageGallery from './components/ImageGallery';
import './App.css';
import { TbReportSearch } from "react-icons/tb";
import { BiZoomIn } from "react-icons/bi";
import { PiMaskHappyBold } from "react-icons/pi";
import { MdOutlineGrid4X4 } from "react-icons/md";


function App() {
  // State to hold the list of available image sets
  const [coreIds, setCoreIds] = useState([]);

  // State to hold the value from the input box
  const [coreIdInput, setCoreIdInput] = useState('');
  
  // State to hold the submitted image set name, which triggers the fetch
  const [activeCoreId, setActiveCoreId] = useState('');

  // New state to control global zoom activation
  const [isZoomActive, setIsZoomActive] = useState(false);

  // New state for segmentation overlay
  const [isSegmentationActive, setIsSegmentationActive] = useState(false);

  // New state for number overlay
  const [isNumberOverlayActive, setIsNumberOverlayActive] = useState(false);

  useEffect(() => {
    const fetchCoreIds = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/image-sets');
        if (response.ok) {
          const data = await response.json();
          setCoreIds(data);
          if (data.length > 0) {
            setCoreIdInput(data[0]); // Pre-select the first item
          }
        }
      } catch (error) {
        console.error("Failed to fetch core IDs:", error);
      }
    };
    fetchCoreIds();
  }, []);

  const handleInputChange = (event) => {
    setCoreIdInput(event.target.value);
  };

  const handleGetReport = () => {
    setActiveCoreId(coreIdInput);
  };

  const toggleZoom = () => {
    setIsZoomActive(prev => !prev);
  };

  const toggleSegmentation = () => {
    setIsSegmentationActive(prev => !prev);
  };

  const toggleNumberOverlay = () => {
    setIsNumberOverlayActive(prev => !prev);
  };

  return (
    <>
      <div className="input-form">
        <select
          value={coreIdInput}
          onChange={handleInputChange}
          aria-label="Select core ID"
        >
          <option value="" disabled>Select a core ID</option>
          {coreIds.map(set => (
            <option key={set} value={set}>{set}</option>
          ))}
        </select>
        <button onClick={handleGetReport} title="Generate images">
          <TbReportSearch />
        </button>
        <button
          onClick={toggleZoom}
          className={`zoom-toggle-btn ${isZoomActive ? 'active' : ''}`}
          title={isZoomActive ? 'Disable zoom' : 'Enable zoom'}
        >
          <BiZoomIn />
        </button>
        <button
          onClick={toggleSegmentation}
          className={`segmentation-toggle-btn ${isSegmentationActive ? 'active' : ''}`}
          title={isSegmentationActive ? 'Hide segmentation' : 'Show segmentation'}
        >
          <PiMaskHappyBold />
        </button>
        <button
          onClick={toggleNumberOverlay}
          className={`number-overlay-toggle-btn ${isNumberOverlayActive ? 'active' : ''}`}
          title={isNumberOverlayActive ? 'Hide Ids' : 'Show Ids'}
        >
          <MdOutlineGrid4X4 />
        </button>
      </div>

      {/* Conditionally render the ImageGallery only when a set is active */}
      {activeCoreId && <ImageGallery coreId={activeCoreId} isZoomActive={isZoomActive} isSegmentationActive={isSegmentationActive} isNumberOverlayActive={isNumberOverlayActive} />}
    </>
  );
}

export default App;
