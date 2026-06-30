// src/App.jsx
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import ImageGallery from './components/ImageGallery';
import './App.css';
import { TbReportSearch, TbReload } from "react-icons/tb";
import { BiZoomIn } from "react-icons/bi";
import { PiMaskHappyBold } from "react-icons/pi";
import { MdOutlineGrid4X4 } from "react-icons/md";
import { TbFilter } from "react-icons/tb";


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

  // New state for CT number overlay
  const [isCtNumberOverlayActive, setIsCtNumberOverlayActive] = useState(false);

  // New state for thresholded overlay
  const [isThresholdedActive, setIsThresholdedActive] = useState(false);

  // State for the celltype variations dropdown
  const [celltypeVariations, setCelltypeVariations] = useState([]);
  const [selectedCelltype, setSelectedCelltype] = useState('');

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
    if (activeCoreId === coreIdInput) {
      return; // Do nothing if the same core ID is already active
    }
    setActiveCoreId(coreIdInput);
    // Reset celltype selections when a new report is generated
    setCelltypeVariations([]);
    setSelectedCelltype('');
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

  const toggleCtNumberOverlay = () => {
    setIsCtNumberOverlayActive(prev => !prev);
  };

  const toggleThresholded = () => {
    setIsThresholdedActive(prev => !prev);
  };

  const handleCelltypeChange = (event) => {
    const value = event.target.value;
    // When "All" is selected, we might want to treat it as the default/empty state
    // depending on the desired UX. For now, we'll set it directly.
    // If "Select a cell type view" is chosen, we reset to a default state.
    setSelectedCelltype(value);
  };

  const needsRefetch = activeCoreId && coreIdInput !== activeCoreId;
  
  return (
    <>
      <div className="input-form">
        <select
          value={coreIdInput}
          onChange={handleInputChange}
          aria-label="Select core ID"
          style={{ width: '200px' }}
        >
          <option value="" disabled>Select a core ID</option>
          {coreIds.map(set => (
            <option key={set} value={set}>{set}</option>
          ))}
        </select>
        {celltypeVariations.length > 0 && (
          <select
            value={selectedCelltype}
            onChange={handleCelltypeChange}
            aria-label="Select cell type view"
            style={{ width: '200px' }}
          >
            {celltypeVariations.map(variation => <option key={variation} value={variation}>{variation}</option>)}
          </select>
        )}
        <button
          onClick={handleGetReport}
          title={needsRefetch ? "Reload to view this core" : "Generate images"}
          disabled={activeCoreId && !needsRefetch}
          style={needsRefetch ? { backgroundColor: '#ff9800', color: 'white' } : {}}
        >
          {needsRefetch ? <TbReload /> : <TbReportSearch />}
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
          title={isNumberOverlayActive ? 'Hide SP Ids' : 'Show SP Ids'}
        >
          <MdOutlineGrid4X4 /> SP
        </button>
        <button
          onClick={toggleCtNumberOverlay}
          className={`number-overlay-toggle-btn ${isCtNumberOverlayActive ? 'active' : ''}`}
          title={isCtNumberOverlayActive ? 'Hide CT Ids' : 'Show CT Ids'}
        >
          <MdOutlineGrid4X4 /> CT
        </button>
        <button
          onClick={toggleThresholded}
          className={`thresholded-toggle-btn ${isThresholdedActive ? "active" : ""}`}
          style={isThresholdedActive ? { backgroundColor: 'red' } : {}}
          title={isThresholdedActive ? 'Show raw images' : 'Show thresholded images'}
        >
          <TbFilter />
        </button>
      </div>

      {/* Conditionally render the ImageGallery only when a set is active */}
      {activeCoreId && (
        <ImageGallery
          coreId={activeCoreId}
          isZoomActive={isZoomActive}
          isSegmentationActive={isSegmentationActive}
          isNumberOverlayActive={isNumberOverlayActive}
          isCtNumberOverlayActive={isCtNumberOverlayActive}
          isThresholdedActive={isThresholdedActive}
          onCelltypesFound={setCelltypeVariations}
          selectedCelltype={selectedCelltype}
        />
      )}
    </>
  );
}

export default App;
