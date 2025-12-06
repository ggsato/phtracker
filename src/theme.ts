import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  fonts: {
    heading: "Manrope, 'Segoe UI', system-ui, -apple-system, sans-serif",
    body: "Manrope, 'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  colors: {
    brand: {
      50: "#e8f5f1",
      100: "#c7e5da",
      200: "#a6d5c3",
      300: "#85c5ad",
      400: "#64b596",
      500: "#4b9c7d",
      600: "#3a7a63",
      700: "#295749",
      800: "#18352f",
      900: "#071316",
    },
  },
  styles: {
    global: {
      body: {
        bg: "linear-gradient(180deg, #f8fbfa 0%, #f1f6f4 50%, #e7f1ed 100%)",
        color: "#0f1c16",
        fontSize: "16px",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: "12px",
        fontWeight: 700,
      },
      sizes: {
        lg: {
          h: "56px",
          fontSize: "18px",
          px: "20px",
        },
      },
      variants: {
        solid: {
          bg: "brand.600",
          color: "white",
          _hover: { bg: "brand.700" },
          _active: { bg: "brand.800" },
        },
        outline: {
          borderColor: "brand.600",
          color: "brand.700",
          _hover: { bg: "brand.50" },
        },
      },
    },
    Container: {
      baseStyle: {
        px: { base: 4, md: 6 },
      },
    },
  },
});
