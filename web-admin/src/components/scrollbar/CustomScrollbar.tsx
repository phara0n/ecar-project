import { forwardRef, ReactNode, CSSProperties } from 'react';
import SimpleBarReact from 'simplebar-react';
import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';

import 'simplebar-react/dist/simplebar.min.css';

// ----------------------------------------------------------------------

interface Props extends SimpleBarReact.Props {
  children: ReactNode;
  sx?: CSSProperties;
}

// ----------------------------------------------------------------------

const StyledRootScrollbar = styled('div')(({ theme }) => ({
  flexGrow: 1,
  height: '100%',
  overflow: 'hidden',
}));

const StyledScrollbar = styled(SimpleBarReact)(({ theme }) => ({
  maxHeight: '100%',
  '& .simplebar-scrollbar': {
    '&:before': {
      backgroundColor: alpha(theme.palette.grey[600], 0.48),
    },
    '&.simplebar-visible:before': {
      opacity: 1,
    },
  },
  '& .simplebar-content-wrapper': {
    height: '100%',
  },
  '& .simplebar-track.simplebar-vertical': {
    width: 10,
  },
  '& .simplebar-track.simplebar-horizontal .simplebar-scrollbar': {
    height: 6,
  },
  '& .simplebar-mask': {
    zIndex: 'inherit',
  },
}));

// ----------------------------------------------------------------------

const CustomScrollbar = forwardRef<HTMLDivElement, Props>(({ children, sx, ...other }, ref) => (
  <StyledRootScrollbar>
    <StyledScrollbar
      timeout={500}
      clickOnTrack={false}
      scrollableNodeProps={{
        ref,
      }}
      sx={sx}
      {...other}
    >
      <Box sx={{ height: '100%' }}>{children}</Box>
    </StyledScrollbar>
  </StyledRootScrollbar>
));

export default CustomScrollbar; 