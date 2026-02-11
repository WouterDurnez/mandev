import { Box, Group, Text, Tooltip, rem } from "@mantine/core";
import { useMemo } from "react";

interface ContributionHeatmapProps {
  accentColor: string;
  textColor: string;
  weeks?: number; // default 12 for mini, 52 for full
  username?: string;
}

// Generate deterministic demo data from username
function generateDemoData(username: string, weeks: number): number[] {
  let seed = 0;
  for (let i = 0; i < username.length; i++) {
    seed = ((seed << 5) - seed + username.charCodeAt(i)) | 0;
  }
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const days = weeks * 7;
  const data: number[] = [];
  for (let i = 0; i < days; i++) {
    const r = random();
    if (r < 0.3) data.push(0);
    else if (r < 0.55) data.push(1);
    else if (r < 0.75) data.push(2);
    else if (r < 0.9) data.push(3);
    else data.push(4);
  }
  return data;
}

function getColor(level: number, accentColor: string): string {
  if (level === 0) return "rgba(255, 255, 255, 0.04)";
  const opacities = [0, 0.25, 0.45, 0.7, 1.0];
  return `${accentColor}${Math.round(opacities[level] * 255).toString(16).padStart(2, "0")}`;
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export default function ContributionHeatmap({
  accentColor,
  textColor,
  weeks = 12,
  username = "dev",
}: ContributionHeatmapProps) {
  const data = useMemo(() => generateDemoData(username, weeks), [username, weeks]);

  // Organize into weeks (columns)
  const grid: number[][] = [];
  for (let w = 0; w < weeks; w++) {
    grid.push(data.slice(w * 7, w * 7 + 7));
  }

  const cellSize = weeks > 20 ? 10 : 12;
  const cellGap = 2;

  return (
    <Box>
      <Group gap={cellGap + 2} align="flex-start" wrap="nowrap">
        {/* Day labels */}
        <Box style={{ width: 24, flexShrink: 0 }}>
          {DAY_LABELS.map((label, i) => (
            <Box key={i} h={cellSize + cellGap} style={{ display: "flex", alignItems: "center" }}>
              <Text fz={8} ff="monospace" style={{ color: textColor, opacity: 0.3 }}>
                {label}
              </Text>
            </Box>
          ))}
        </Box>

        {/* Grid */}
        <Group gap={cellGap} wrap="nowrap" style={{ overflow: "hidden" }}>
          {grid.map((week, wi) => (
            <Box key={wi} style={{ display: "flex", flexDirection: "column", gap: cellGap }}>
              {week.map((level, di) => (
                <Tooltip
                  key={di}
                  label={`${level === 0 ? "No" : level * 2 + Math.floor(Math.random() * 3)} contributions`}
                  withArrow
                  fz="xs"
                >
                  <Box
                    w={cellSize}
                    h={cellSize}
                    style={{
                      borderRadius: 2,
                      background: getColor(level, accentColor),
                      transition: "background 0.15s ease",
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          ))}
        </Group>
      </Group>

      {/* Legend */}
      <Group gap={4} mt={8} justify="flex-end">
        <Text fz={8} ff="monospace" style={{ color: textColor, opacity: 0.3 }}>
          Less
        </Text>
        {[0, 1, 2, 3, 4].map((level) => (
          <Box
            key={level}
            w={cellSize}
            h={cellSize}
            style={{
              borderRadius: 2,
              background: getColor(level, accentColor),
            }}
          />
        ))}
        <Text fz={8} ff="monospace" style={{ color: textColor, opacity: 0.3 }}>
          More
        </Text>
      </Group>
    </Box>
  );
}
