// third-party
import { merge } from 'lodash-es';
import { Theme } from '@mui/material/styles';

// We'll need to create these files for component overrides
// For now, let's create a simplified version

// ==============================|| OVERRIDES - MAIN ||============================== //

export default function ComponentsOverrides(theme: Theme) {
  return merge(
    // Basic overrides for commonly used components
    {
      MuiButton: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: '4px'
          }
        }
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none'
          },
          rounded: {
            borderRadius: `${theme.shape.borderRadius}px`
          }
        }
      },
      MuiCardHeader: {
        styleOverrides: {
          root: {
            color: theme.palette.text.primary,
            padding: '24px'
          },
          title: {
            fontSize: '1.125rem'
          }
        }
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: '24px'
          }
        }
      },
      MuiCardActions: {
        styleOverrides: {
          root: {
            padding: '24px'
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            color: theme.palette.text.primary,
            paddingTop: '10px',
            paddingBottom: '10px',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.primary.lighter,
              '&:hover': {
                backgroundColor: theme.palette.primary.lighter
              },
              '& .MuiListItemIcon-root': {
                color: theme.palette.primary.main
              }
            },
            '&:hover': {
              backgroundColor: theme.palette.primary.lighter,
              color: theme.palette.primary.main,
              '& .MuiListItemIcon-root': {
                color: theme.palette.primary.main
              }
            }
          }
        }
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            color: theme.palette.text.primary,
            minWidth: '36px'
          }
        }
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: theme.palette.text.primary
          }
        }
      },
      MuiInputBase: {
        styleOverrides: {
          input: {
            color: theme.palette.text.primary,
            '&::placeholder': {
              color: theme.palette.text.secondary,
              fontSize: '0.875rem'
            }
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            background: theme.palette.background.paper,
            borderRadius: `${theme.shape.borderRadius}px`,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.grey[400]
            },
            '&:hover $notchedOutline': {
              borderColor: theme.palette.primary.light
            },
            '&.MuiInputBase-adornedStart': {
              paddingLeft: 14
            },
            '&.MuiInputBase-adornedEnd': {
              paddingRight: 14
            }
          },
          notchedOutline: {
            borderRadius: `${theme.shape.borderRadius}px`
          }
        }
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            '&.Mui-disabled': {
              color: theme.palette.grey[300]
            }
          },
          mark: {
            backgroundColor: theme.palette.background.paper,
            width: '4px'
          },
          valueLabel: {
            color: theme.palette.primary.main
          }
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: theme.palette.divider,
            opacity: 1
          }
        }
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            color: theme.palette.background.paper,
            background: theme.palette.primary.light
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            '&.MuiChip-deletable .MuiChip-deleteIcon': {
              color: 'inherit'
            }
          }
        }
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            color: theme.palette.background.paper,
            background: theme.palette.text.primary
          }
        }
      }
    }
    // Add more component overrides as needed
  );
} 