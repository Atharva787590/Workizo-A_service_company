import React from 'react';
import { Box } from '@mui/material';

const SplineLanding = () => {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        bgcolor: 'transparent',
        zIndex: 9999,
      }}
    >
      <iframe
        src="https://my.spline.design/particles-YTBDLEkKYDerayq5gxeww7yv/"
        frameBorder="0"
        width="100%"
        height="100%"
        title="Spline Particles"
        allow="autoplay; fullscreen"
        style={{
          border: 'none',
          width: '100%',
          height: '100%',
          display: 'block',
          background: 'transparent',
        }}
      />
    </Box>
  );
};

export default SplineLanding;
