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
  Avatar,
  ActionIcon,
  Menu,
  Paper,
  ThemeIcon,
  Code,
  rem,
} from "@mantine/core";
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconExternalLink,
  IconEye,
  IconClick,
  IconChartBar,
  IconTerminal2,
  IconLogout,
  IconSettings,
  IconLink,
  IconBrandGithub,
  IconBriefcase,
} from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import { useState } from "react";
import type { DevProfile } from "@/types";
import { DEFAULT_THEMES } from "@/types";

// Demo data
const DEMO_PROFILES: DevProfile[] = [
  {
    id: "profile-1",
    userId: "demo-1",
    username: "janedev",
    displayName: "Jane Doe",
    title: "Full Stack Developer",
    bio: "Building things that matter with TypeScript and Rust. Open source enthusiast.",
    avatarUrl: "",
    githubUsername: "janedoe",
    techStack: ["TypeScript", "React", "Rust", "PostgreSQL", "Docker"],
    links: [
      { id: "l1", profileId: "profile-1", title: "Portfolio", url: "https://janedoe.dev", enabled: true, clicks: 234, position: 0 },
      { id: "l2", profileId: "profile-1", title: "Blog", url: "https://blog.janedoe.dev", enabled: true, clicks: 156, position: 1 },
      { id: "l3", profileId: "profile-1", title: "GitHub", url: "https://github.com/janedoe", enabled: true, clicks: 89, position: 2 },
    ],
    projects: [
      { id: "p1", profileId: "profile-1", name: "fastql", description: "A fast GraphQL server in Rust", url: "https://github.com/janedoe/fastql", language: "Rust", stars: 342, position: 0 },
    ],
    endorsements: [],
    theme: DEFAULT_THEMES[0],
    openToWork: true,
    published: true,
    views: 1247,
    clicks: 479,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
  },
];

function StatCard({ icon: Icon, label, value, color }: { icon: typeof IconEye; label: string; value: string; color: string }) {
  return (
    <Paper
      p="md"
      radius="lg"
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <Group>
        <ThemeIcon size={40} radius="md" variant="light" color={color}>
          <Icon size={20} />
        </ThemeIcon>
        <div>
          <Text fz={rem(24)} fw={800} lh={1}>
            {value}
          </Text>
          <Text c="dimmed" fz="xs">
            {label}
          </Text>
        </div>
      </Group>
    </Paper>
  );
}

function ProfileCard({ profile }: { profile: DevProfile }) {
  const navigate = useNavigate();

  return (
    <Card
      padding="lg"
      radius="lg"
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(0, 180, 216, 0.2)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
      onClick={() => navigate(`/editor/${profile.id}`)}
    >
      <Group justify="space-between" mb="md">
        <Group>
          <Avatar color="cyan" radius="xl" size="md">
            {profile.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </Avatar>
          <div>
            <Group gap="xs">
              <Text fw={600}>{profile.displayName}</Text>
              {profile.openToWork && (
                <Badge size="xs" color="green" variant="light">
                  open to work
                </Badge>
              )}
            </Group>
            <Text c="dimmed" fz="xs" ff="monospace">
              man.dev/{profile.username}
            </Text>
          </div>
        </Group>
        <Group gap="xs">
          <Badge
            variant={profile.published ? "light" : "default"}
            color={profile.published ? "green" : "gray"}
            size="sm"
          >
            {profile.published ? "Live" : "Draft"}
          </Badge>
          <Menu position="bottom-end" withArrow>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={(e) => e.stopPropagation()}
              >
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/editor/${profile.id}`);
                }}
              >
                Edit
              </Menu.Item>
              <Menu.Item leftSection={<IconExternalLink size={14} />}>
                View Live
              </Menu.Item>
              <Menu.Item
                leftSection={<IconChartBar size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/analytics/${profile.id}`);
                }}
              >
                Analytics
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconTrash size={14} />} color="red">
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Tech stack badges */}
      <Group gap={6} mb="md">
        {profile.techStack.slice(0, 5).map((tech) => (
          <Badge key={tech} size="xs" variant="light" color="cyan" radius="sm" ff="monospace">
            {tech}
          </Badge>
        ))}
        {profile.techStack.length > 5 && (
          <Badge size="xs" variant="default" radius="sm">
            +{profile.techStack.length - 5}
          </Badge>
        )}
      </Group>

      <Group gap="xl">
        <Group gap={4}>
          <IconEye size={14} color="var(--mantine-color-dimmed)" />
          <Text fz="sm" c="dimmed">
            {profile.views.toLocaleString()} views
          </Text>
        </Group>
        <Group gap={4}>
          <IconClick size={14} color="var(--mantine-color-dimmed)" />
          <Text fz="sm" c="dimmed">
            {profile.clicks.toLocaleString()} clicks
          </Text>
        </Group>
        <Group gap={4}>
          <IconLink size={14} color="var(--mantine-color-dimmed)" />
          <Text fz="sm" c="dimmed">
            {profile.links.length} links
          </Text>
        </Group>
      </Group>
    </Card>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profiles] = useState(DEMO_PROFILES);

  const totalViews = profiles.reduce((sum, p) => sum + p.views, 0);
  const totalClicks = profiles.reduce((sum, p) => sum + p.clicks, 0);
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0";

  return (
    <Box
      mih="100vh"
      style={{
        background:
          "radial-gradient(ellipse at top right, rgba(0, 180, 216, 0.02) 0%, transparent 50%)",
      }}
    >
      {/* Dashboard Navbar */}
      <Box
        py="sm"
        px="md"
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          background: "rgba(20, 21, 23, 0.9)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container size="lg">
          <Group justify="space-between">
            <Link to="/" style={{ textDecoration: "none" }}>
              <Logo size="sm" />
            </Link>
            <Group gap="sm">
              {user?.plan === "free" && (
                <Button
                  variant="gradient"
                  gradient={{ from: "#0096c7", to: "#00b4d8" }}
                  size="xs"
                  radius="xl"
                  leftSection={<IconTerminal2 size={14} />}
                  ff="monospace"
                >
                  sudo upgrade
                </Button>
              )}
              <Menu position="bottom-end" withArrow>
                <Menu.Target>
                  <Avatar
                    color="cyan"
                    radius="xl"
                    size="sm"
                    style={{ cursor: "pointer" }}
                  >
                    {user?.name?.[0] || "U"}
                  </Avatar>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{user?.email}</Menu.Label>
                  <Menu.Item leftSection={<IconSettings size={14} />}>
                    Settings
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    leftSection={<IconLogout size={14} />}
                    color="red"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                  >
                    Log out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Container>
      </Box>

      <Container size="lg" py="xl">
        {/* Header */}
        <Group justify="space-between" mb="xl">
          <div>
            <Code fz={rem(28)} ff="monospace" bg="transparent" c="white" fw={800}>
              man --list
            </Code>
            <Text c="dimmed" mt={4}>
              Manage your developer profiles.
            </Text>
          </div>
          <Button
            variant="gradient"
            gradient={{ from: "#0096c7", to: "#00b4d8" }}
            radius="xl"
            leftSection={<IconPlus size={18} />}
            onClick={() => navigate("/editor/new")}
            ff="monospace"
          >
            man --new
          </Button>
        </Group>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
          <StatCard icon={IconEye} label="Total Views" value={totalViews.toLocaleString()} color="blue" />
          <StatCard icon={IconClick} label="Total Clicks" value={totalClicks.toLocaleString()} color="cyan" />
          <StatCard icon={IconChartBar} label="Click-through Rate" value={`${ctr}%`} color="green" />
        </SimpleGrid>

        {/* Profiles */}
        <Stack gap="md">
          <Text fw={600} fz="lg">
            Your Man Pages ({profiles.length})
          </Text>
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
