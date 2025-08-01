// Untitled UI Dark Theme Colors
type ColorShades = {
  25: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950?: string;
};

type Colors = {
  gray: ColorShades;
  primary: Omit<ColorShades, '950'>;
  error: Omit<ColorShades, '950'>;
  success: Omit<ColorShades, '950'>;
};

export const colors: Colors = {
  gray: {
    25: '#FCFCFD',
    50: '#F9FAFB',
    100: '#F2F4F7',
    200: '#EAECF0',
    300: '#D0D5DD',
    400: '#98A2B3',
    500: '#667085',
    600: '#475467',
    700: '#344054',
    800: '#1D2939',
    900: '#101828',
    950: '#0C111D',
  },
  primary: {
    25: '#F5F8FF',
    50: '#EFF4FF',
    100: '#D1E0FF',
    200: '#B2CCFF',
    300: '#84ADFF',
    400: '#528BFF',
    500: '#2970FF',
    600: '#155EEF',
    700: '#004EEB',
    800: '#0040C1',
    900: '#00359E',
  },
  error: {
    25: '#FFFBFA',
    50: '#FEF3F2',
    100: '#FEE4E2',
    200: '#FECDCA',
    300: '#FDA29B',
    400: '#F97066',
    500: '#F04438',
    600: '#D92D20',
    700: '#B42318',
    800: '#912018',
    900: '#7A271A',
  },
  success: {
    25: '#F6FEF9',
    50: '#ECFDF3',
    100: '#D1FADF',
    200: '#A6F4C5',
    300: '#6CE9A6',
    400: '#32D583',
    500: '#12B76A',
    600: '#039855',
    700: '#027A48',
    800: '#05603A',
    900: '#054F31',
  }
};

type Spacing = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  xxxl: string;
};

export const spacing: Spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px',
};

type Typography = {
  fontFamily: string;
  fontFamilyMono: string;
};

export const typography: Typography = {
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontFamilyMono: "'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace",
};