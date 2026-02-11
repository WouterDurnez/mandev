import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Badge,
  SimpleGrid,
  Box,
  Paper,
  ThemeIcon,
  ActionIcon,
  Select,
  Code,
  Tooltip,
  Progress,
  rem,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconEye,
  IconClick,
  IconChartBar,
  IconDeviceMobile,
  IconDeviceDesktop,
  IconWorld,
  IconArrowUpRight,
  IconArrowDownRight,
  IconLock,
  IconTerminal2,
  IconBrandGithub,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconSearch,
} from "@tabler/icons-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";

// Demo analytics data
const DAILY_VIEWS = [
  { date: "Jan 14", views: 23, clicks: 8 },
  { date: "Jan 15", views: 45, clicks: 18 },
  { date: "Jan 16", views: 38, clicks: 12 },
  { date: "Jan 17", views: 67, clicks: 29 },
  { date: "Jan 18", views: 89, clicks: 41 },
  { date: "Jan 19", views: 112, clicks: 52 },
  { date: "Jan 20", views: 98, clicks: 38 },
  { date: "Jan 21", views: 134, clicks: 61 },
  { date: "Jan 22", views: 156, clicks: 72 },
  { date: "Jan 23", views: 143, clicks: 58 },
  { date: "Jan 24", views: 178, clicks: 84 },
  { date: "Jan 25", views: 165, clicks: 69 },
  { date: "Jan 26", views: 189, clicks: 91 },
  { date: "Jan 27", views: 201, clicks: 95 },
];

const LINK_STATS = [
  { title: "Portfolio", clicks: 234, pct: 38 },
  { title: "Blog", clicks: 156, pct: 25 },
  { title: "GitHub", clicks: 89, pct: 15 },
  { title: "Twitter / X", clicks: 67, pct: 11 },
  { title: "Book a Call", clicks: 45, pct: 7 },
  { title: "Newsletter", clicks: 24, pct: 4 },
];

const REFERRERS = [
  { source: "twitter.com", visits: 389, pct: 31 },
  { source: "github.com", visits: 267, pct: 21 },
  { source: "linkedin.com", visits: 198, pct: 16 },
  { source: "google.com", visits: 156, pct: 12 },
  { source: "Direct", visits: 134, pct: 11 },
  { source: "Other", visits: 103, pct: 9 },
];

const COUNTRIES = [
  { country: "United States", visits: 412, pct: 33, flag: "🇺🇸" },
  { country: "United Kingdom", visits: 178, pct: 14, flag: "🇬🇧" },
  { country: "Germany", visits: 134, pct: 11, flag: "🇩🇪" },
  { country: "India", visits: 112, pct: 9, flag: "🇮🇳" },
  { country: "Canada", visits: 98, pct: 8, flag: "🇨🇦" },
  { country: "Other", visits: 313, pct: 25, flag: "🌍" },
];

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeLabel,
  color,
}: {
  icon: typeof IconEye;
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  color: string;
}) {
  const isPositive = change >= 0;
  return (
    <Paper
      p="lg"
      radius="lg"
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <Group justify="space-between" mb="xs">
        <ThemeIcon size={36} radius="md" variant="light" color={color}>
          <Icon size={18} />
        </ThemeIcon>
        <Badge
          size="sm"
          variant="light"
          color={isPositive ? "green" : "red"}
          leftSection={
            isPositive ? (
              <IconArrowUpRight size={12} />
            ) : (
              <IconArrowDownRight size={12} />
            )
          }
        >
          {isPositive ? "+" : ""}
          {change}%
        </Badge>
      </Group>
      <Text fz={rem(32)} fw={800} lh={1} mt="sm">
        {value}
      </Text>
      <Text c="dimmed" fz="xs" mt={4}>
        {label} · {changeLabel}
      </Text>
    </Paper>
  );
}

// Simple bar chart using CSS
function MiniChart({ data }: { data: typeof DAILY_VIEWS }) {
  const maxViews = Math.max(...data.map((d) => d.views));

  return (
    <Card
      padding="lg"
      radius="lg"
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <Group justify="space-between" mb="lg">
        <Text fw={600}>Views & Clicks</Text>
        <Group gap="md">
          <Group gap={4}>
            <Box w={12} h={12} style={{ borderRadius: 2, background: "#0096c7" }} />
            <Text fz="xs" c="dimmed">
              Views
            </Text>
          </Group>
          <Group gap={4}>
            <Box w={12} h={12} style={{ borderRadius: 2, background: "#48cae4" }} />
            <Text fz="xs" c="dimmed">
              Clicks
            </Text>
          </Group>
        </Group>
      </Group>

      <Group gap={4} align="end" style={{ height: 160 }}>
        {data.map((d) => (
          <Tooltip key={d.date} label={`${d.date}: ${d.views} views, ${d.clicks} clicks`}>
            <Stack
              gap={2}
              align="center"
              style={{ flex: 1, cursor: "default" }}
            >
              <Box
                style={{
                  width: "100%",
                  maxWidth: 32,
                  height: `${(d.views / maxViews) * 140}px`,
                  background: "linear-gradient(to top, #0096c7, #48cae4)",
                  borderRadius: "4px 4px 0 0",
                  position: "relative",
                  minHeight: 4,
                }}
              >
                <Box
                  style={{
                    width: "100%",
                    height: `${(d.clicks / d.views) * 100}%`,
                    background: "#48cae4",
                    borderRadius: "4px 4px 0 0",
                    position: "absolute",
                    bottom: 0,
                    opacity: 0.6,
                  }}
                />
              </Box>
            </Stack>
          </Tooltip>
        ))}
      </Group>
      <Group gap={4} mt="xs">
        {data
          .filter((_, i) => i % 3 === 0)
          .map((d) => (
            <Text
              key={d.date}
              fz="xs"
              c="dimmed"
              style={{ flex: 3, textAlign: "center" }}
            >
              {d.date}
            </Text>
          ))}
      </Group>
    </Card>
  );
}

function RankingList({
  title,
  items,
  color,
}: {
  title: string;
  items: { label: string; value: number; pct: number; prefix?: string }[];
  color: string;
}) {
  return (
    <Card
      padding="lg"
      radius="lg"
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <Text fw={600} mb="md">
        {title}
      </Text>
      <Stack gap="sm">
        {items.map((item) => (
          <div key={item.label}>
            <Group justify="space-between" mb={4}>
              <Text fz="sm">
                {item.prefix || ""}
                {item.label}
              </Text>
              <Text fz="sm" fw={600}>
                {item.value.toLocaleString()}
              </Text>
            </Group>
            <Progress
              value={item.pct}
              size="sm"
              radius="xl"
              color={color}
              styles={{
                root: { background: "rgba(255, 255, 255, 0.04)" },
              }}
            />
          </div>
        ))}
      </Stack>
    </Card>
  );
}

function ProGate() {
  const navigate = useNavigate();
  return (
    <Box
      mih="60vh"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        padding={rem(48)}
        radius="xl"
        maw={480}
        mx="auto"
        style={{
          background:
            "linear-gradient(135deg, rgba(0, 180, 216, 0.06) 0%, rgba(0, 150, 199, 0.03) 100%)",
          border: "1px solid rgba(0, 180, 216, 0.15)",
          textAlign: "center",
        }}
      >
        <Stack align="center" gap="md">
          <ThemeIcon size={64} radius="xl" variant="light" color="cyan">
            <IconLock size={32} />
          </ThemeIcon>
          <Title fz={rem(28)} fw={800}>
            Unlock Analytics
          </Title>
          <Text c="dimmed" fz="md" maw={360}>
            See who's viewing your man page, which links get clicked, where
            your traffic comes from, and more. Upgrade to Pro to access
            detailed analytics.
          </Text>
          <Button
            variant="gradient"
            gradient={{ from: "#0096c7", to: "#00b4d8" }}
            radius="xl"
            size="lg"
            leftSection={<IconTerminal2 size={18} />}
            ff="monospace"
            mt="sm"
            onClick={() => navigate("/settings")}
          >
            sudo upgrade
          </Button>
          <Text c="dimmed" fz="xs">
            $7/month · Cancel anytime · Your data, your insights
          </Text>
        </Stack>
      </Card>
    </Box>
  );
}

export default function Analytics() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<string | null>("14d");

  const isPro = user?.plan === "pro";

  return (
    <Box mih="100vh">
      {/* Navbar */}
      <Box
        py="sm"
        px="md"
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          background: "rgba(20, 21, 23, 0.95)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container size="lg">
          <Group justify="space-between">
            <Group>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => navigate("/dashboard")}
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Logo size="sm" />
            </Group>
            <Select
              data={[
                { value: "7d", label: "Last 7 days" },
                { value: "14d", label: "Last 14 days" },
                { value: "30d", label: "Last 30 days" },
                { value: "90d", label: "Last 90 days" },
              ]}
              value={period}
              onChange={setPeriod}
              size="xs"
              radius="md"
              w={150}
            />
          </Group>
        </Container>
      </Box>

      <Container size="lg" py="xl">
        {!isPro ? (
          <ProGate />
        ) : (
          <Stack gap="xl">
            {/* Header */}
            <div>
              <Code
                fz={rem(24)}
                ff="monospace"
                bg="transparent"
                c="white"
                fw={800}
              >
                man --stats janedev
              </Code>
              <Text c="dimmed" mt={4}>
                Profile analytics for the last{" "}
                {period === "7d"
                  ? "7 days"
                  : period === "14d"
                    ? "14 days"
                    : period === "30d"
                      ? "30 days"
                      : "90 days"}
                .
              </Text>
            </div>

            {/* Key Metrics */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <StatCard
                icon={IconEye}
                label="Page Views"
                value="1,847"
                change={23}
                changeLabel="vs previous period"
                color="blue"
              />
              <StatCard
                icon={IconClick}
                label="Link Clicks"
                value="728"
                change={18}
                changeLabel="vs previous period"
                color="cyan"
              />
              <StatCard
                icon={IconChartBar}
                label="Click Rate"
                value="39.4%"
                change={-2}
                changeLabel="vs previous period"
                color="green"
              />
              <StatCard
                icon={IconWorld}
                label="Unique Visitors"
                value="1,203"
                change={31}
                changeLabel="vs previous period"
                color="violet"
              />
            </SimpleGrid>

            {/* Chart */}
            <MiniChart data={DAILY_VIEWS} />

            {/* Detailed breakdowns */}
            <SimpleGrid cols={{ base: 1, md: 2 }}>
              <RankingList
                title="Top Links"
                color="cyan"
                items={LINK_STATS.map((l) => ({
                  label: l.title,
                  value: l.clicks,
                  pct: l.pct,
                }))}
              />
              <RankingList
                title="Referral Sources"
                color="blue"
                items={REFERRERS.map((r) => ({
                  label: r.source,
                  value: r.visits,
                  pct: r.pct,
                }))}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }}>
              <RankingList
                title="Top Countries"
                color="green"
                items={COUNTRIES.map((c) => ({
                  label: c.country,
                  value: c.visits,
                  pct: c.pct,
                  prefix: c.flag + " ",
                }))}
              />

              {/* Device breakdown */}
              <Card
                padding="lg"
                radius="lg"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <Text fw={600} mb="md">
                  Devices
                </Text>
                <SimpleGrid cols={2} spacing="md">
                  <Paper
                    p="md"
                    radius="md"
                    ta="center"
                    style={{
                      background: "rgba(0, 180, 216, 0.04)",
                      border: "1px solid rgba(0, 180, 216, 0.1)",
                    }}
                  >
                    <IconDeviceMobile
                      size={28}
                      color="#00b4d8"
                      style={{ margin: "0 auto 8px" }}
                    />
                    <Text fz={rem(24)} fw={800}>
                      68%
                    </Text>
                    <Text c="dimmed" fz="xs">
                      Mobile
                    </Text>
                  </Paper>
                  <Paper
                    p="md"
                    radius="md"
                    ta="center"
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <IconDeviceDesktop
                      size={28}
                      color="var(--mantine-color-dimmed)"
                      style={{ margin: "0 auto 8px" }}
                    />
                    <Text fz={rem(24)} fw={800}>
                      32%
                    </Text>
                    <Text c="dimmed" fz="xs">
                      Desktop
                    </Text>
                  </Paper>
                </SimpleGrid>
              </Card>
            </SimpleGrid>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
