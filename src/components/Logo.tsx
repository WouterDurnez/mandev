import { Group, Text, Code } from "@mantine/core";
import { IconTerminal2 } from "@tabler/icons-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { icon: 20, text: 18 },
  md: { icon: 28, text: 24 },
  lg: { icon: 36, text: 32 },
};

export default function Logo({ size = "md" }: LogoProps) {
  const s = sizes[size];
  return (
    <Group gap={6} align="center">
      <IconTerminal2
        size={s.icon}
        style={{
          color: "#00b4d8",
          filter: "drop-shadow(0 0 8px rgba(0, 180, 216, 0.4))",
        }}
        stroke={2.5}
      />
      <Text
        fw={800}
        fz={s.text}
        ff="monospace"
        style={{ letterSpacing: "-0.02em", lineHeight: 1 }}
      >
        <Text span inherit c="white">
          man
        </Text>
        <Text span inherit c="cyan">
          .dev
        </Text>
      </Text>
    </Group>
  );
}
