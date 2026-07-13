import React from 'react';
import { Box } from '@mui/material';

const SplineLanding = () => {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        margin: 0,
        padding: 0,
        bgcolor: '#000000',
      }}
    >
      <iframe
        src="https://my.spline.design/particles-YTBDLEkKYDerayq5gxeww7yv/"
        frameBorder="0"
        width="100%"
        height="100%"
        title="Spline Particles"
        style={{
          border: 'none',
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </Box>
  );
};

export default SplineLanding;
