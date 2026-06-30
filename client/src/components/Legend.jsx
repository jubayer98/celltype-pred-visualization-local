// eslint-disable-next-line no-unused-vars
import React from 'react';

function Legend({ celltypes }) {
  if (!celltypes || celltypes.length === 0) {
    return null;
  }

  return (
    <div className="legend-container">
      {celltypes && celltypes.length > 0 && (
        <div className="legend-item">
          <h3>Cell Type Legend</h3>
          <div className="legend-grid">
            {celltypes.map((celltype) => (
              <div key={`${celltype.id}-${celltype.name}`} className="legend-entry">
                <span className="legend-swatch" style={{ backgroundColor: celltype.color }}>
                  {celltype.id}
                </span>
                <span>{celltype.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Legend;