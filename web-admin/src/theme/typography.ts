/**
 * Typography configuration for the theme
 * Based on Minimal UI Kit standards
 */

// Font families
const PRIMARY_FONT = 'DM Sans, sans-serif'; // Primary font
const SECONDARY_FONT = 'Barlow, sans-serif'; // Secondary font for headers

// Responsive font sizes
const pxToRem = (value: number) => `${value / 16}rem`;

// Font weights
const fontWeightRegular = 400;
const fontWeightMedium = 600;
const fontWeightSemiBold = 700;
const fontWeightBold = 800;

// Line heights
const lineHeightSmall = 1.25;
const lineHeightMedium = 1.5;
const lineHeightLarge = 1.75;

// Letter spacing
const letterSpacingTighter = -0.5;
const letterSpacingTight = -0.25;
const letterSpacingNormal = 0;
const letterSpacingWide = 0.25;
const letterSpacingWider = 0.5;

// Typography configuration
const typography = {
  fontFamily: PRIMARY_FONT,
  fontWeightRegular,
  fontWeightMedium,
  fontWeightSemiBold,
  fontWeightBold,
  
  h1: {
    fontFamily: SECONDARY_FONT,
    fontWeight: fontWeightSemiBold,
    lineHeight: lineHeightSmall,
    fontSize: pxToRem(40),
    letterSpacing: letterSpacingTighter,
  },
  
  h2: {
    fontFamily: SECONDARY_FONT,
    fontWeight: fontWeightSemiBold,
    lineHeight: lineHeightSmall,
    fontSize: pxToRem(32),
    letterSpacing: letterSpacingTight,
  },
  
  h3: {
    fontFamily: SECONDARY_FONT,
    fontWeight: fontWeightSemiBold,
    lineHeight: lineHeightMedium,
    fontSize: pxToRem(24),
    letterSpacing: letterSpacingNormal,
  },
  
  h4: {
    fontFamily: SECONDARY_FONT,
    fontWeight: fontWeightSemiBold,
    lineHeight: lineHeightMedium,
    fontSize: pxToRem(20),
    letterSpacing: letterSpacingNormal,
  },
  
  h5: {
    fontFamily: SECONDARY_FONT,
    fontWeight: fontWeightSemiBold,
    lineHeight: lineHeightMedium,
    fontSize: pxToRem(18),
    letterSpacing: letterSpacingNormal,
  },
  
  h6: {
    fontFamily: SECONDARY_FONT,
    fontWeight: fontWeightSemiBold,
    lineHeight: lineHeightMedium,
    fontSize: pxToRem(16),
    letterSpacing: letterSpacingNormal,
  },
  
  subtitle1: {
    fontWeight: fontWeightMedium,
    lineHeight: lineHeightMedium,
    fontSize: pxToRem(16),
    letterSpacing: letterSpacingNormal,
  },
  
  subtitle2: {
    fontWeight: fontWeightMedium,
    lineHeight: lineHeightMedium,
    fontSize: pxToRem(14),
    letterSpacing: letterSpacingNormal,
  },
  
  body1: {
    lineHeight: lineHeightLarge,
    fontSize: pxToRem(16),
    letterSpacing: letterSpacingNormal,
  },
  
  body2: {
    lineHeight: lineHeightLarge,
    fontSize: pxToRem(14),
    letterSpacing: letterSpacingNormal,
  },
  
  caption: {
    lineHeight: lineHeightLarge,
    fontSize: pxToRem(12),
    letterSpacing: letterSpacingWide,
  },
  
  overline: {
    fontWeight: fontWeightMedium,
    lineHeight: lineHeightLarge,
    fontSize: pxToRem(12),
    textTransform: 'uppercase' as const,
    letterSpacing: letterSpacingWider,
  },
  
  button: {
    fontWeight: fontWeightMedium,
    lineHeight: lineHeightMedium,
    fontSize: pxToRem(14),
    textTransform: 'capitalize' as const,
    letterSpacing: letterSpacingNormal,
  },
};

export default typography; 