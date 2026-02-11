import { createTheme, MantineColorsTuple } from "@mantine/core";

const cyan: MantineColorsTuple = [
  "#e0f7ff",
  "#b3ecff",
  "#80dfff",
  "#4dd2ff",
  "#1ac5ff",
  "#00b4d8",
  "#0096c7",
  "#0077b6",
  "#005f8a",
  "#004766",
];

export const theme = createTheme({
  primaryColor: "cyan",
  colors: {
    cyan,
    dark: [
      "#C1C2C5",
      "#A6A7AB",
      "#909296",
      "#5c5f66",
      "#373A40",
      "#2C2E33",
      "#25262b",
      "#1A1B1E",
      "#141517",
      "#101113",
    ],
  },
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontFamilyMonospace: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  headings: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: "700",
  },
  defaultRadius: "md",
  cursorType: "pointer",
});
