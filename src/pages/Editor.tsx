import {
  Container,
  Text,
  Button,
  Group,
  Stack,
  Card,
  TextInput,
  Textarea,
  Switch,
  ActionIcon,
  Box,
  Paper,
  Avatar,
  SimpleGrid,
  Tooltip,
  Modal,
  Badge,
  MultiSelect,
  Code,
  CopyButton,
  Anchor,
  Progress,
  ColorSwatch,
  ColorInput,
  Select,
  rem,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconPlus,
  IconGripVertical,
  IconTrash,
  IconDeviceMobile,
  IconCopy,
  IconCheck,
  IconEye,
  IconBrandGithub,
  IconBriefcase,
  IconCode,
  IconWorld,
  IconLock,
  IconMessage,
  IconLink,
  IconShare,
} from "@tabler/icons-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import type { DevProfile, DevTheme, ProfileLink, Project, Endorsement } from "@/types";
import { DEFAULT_THEMES, TECH_STACK_OPTIONS } from "@/types";

const EMPTY_PROFILE: DevProfile = {
  id: "new",
  userId: "demo-1",
  username: "",
  displayName: "",
  title: "",
  bio: "",
  avatarUrl: "",
  githubUsername: "",
  techStack: [],
  links: [],
  projects: [],
  endorsements: [],
  theme: DEFAULT_THEMES[0],
  openToWork: false,
  published: false,
  views: 0,
  clicks: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEMO_PROFILE: DevProfile = {
  id: "profile-1",
  userId: "demo-1",
  username: "janedev",
  displayName: "Jane Doe",
  title: "Full Stack Developer",
  bio: "Building things that matter with TypeScript and Rust. Open source enthusiast. Coffee-driven development.",
  avatarUrl: "",
  githubUsername: "janedoe",
  techStack: ["TypeScript", "React", "Rust", "PostgreSQL", "Docker"],
  links: [
    { id: "l1", profileId: "profile-1", title: "Portfolio", url: "https://janedoe.dev", enabled: true, clicks: 234, position: 0 },
    { id: "l2", profileId: "profile-1", title: "Blog", url: "https://blog.janedoe.dev", enabled: true, clicks: 156, position: 1 },
    { id: "l3", profileId: "profile-1", title: "GitHub", url: "https://github.com/janedoe", enabled: true, clicks: 89, position: 2 },
    { id: "l4", profileId: "profile-1", title: "Twitter / X", url: "https://x.com/janedoe", enabled: true, clicks: 45, position: 3 },
  ],
  projects: [
    { id: "p1", profileId: "profile-1", name: "fastql", description: "A fast GraphQL server in Rust", url: "https://github.com/janedoe/fastql", language: "Rust", stars: 342, position: 0 },
    { id: "p2", profileId: "profile-1", name: "react-terminal", description: "Terminal component for React apps", url: "https://github.com/janedoe/react-terminal", language: "TypeScript", stars: 128, position: 1 },
  ],
  endorsements: [
    { id: "e1", profileId: "profile-1", authorName: "Alex Chen", authorTitle: "Tech Lead @ Stripe", text: "Jane is one of the best engineers I've worked with. Her Rust skills are exceptional.", createdAt: "2024-01-18" },
    { id: "e2", profileId: "profile-1", authorName: "Sam Rivera", authorTitle: "CTO @ DevTools Inc", authorUsername: "sambuilds", text: "Shipped three major features in her first month. Absolute machine.", createdAt: "2024-01-19" },
  ],
  theme: DEFAULT_THEMES[0],
  openToWork: true,
  published: true,
  views: 1247,
  clicks: 479,
  createdAt: "2024-01-15",
  updatedAt: "2024-01-20",
};

// ── Terminal Preview ─────────────────────────────────────────────────
function TerminalPreview({ profile }: { profile: DevProfile }) {
  const theme = profile.theme;
  const initials = profile.displayName
    ? profile.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <Box style={{ position: "sticky", top: 80 }}>
      <Text fw={600} fz="sm" mb="sm" ta="center" c="dimmed">
        <IconDeviceMobile size={14} style={{ verticalAlign: "middle" }} /> Live Preview
      </Text>
      <Paper
        shadow="xl"
        radius="lg"
        style={{
          background: theme.background,
          border: `1px solid ${theme.accentColor}22`,
          width: 360,
          minHeight: 500,
          margin: "0 auto",
          overflow: "hidden",
          fontFamily: theme.fontFamily,
        }}
      >
        {/* Terminal title bar */}
        {theme.isMonospace && (
          <Group
            px="md"
            py={6}
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              borderBottom: `1px solid ${theme.accentColor}15`,
            }}
          >
            <Group gap={6}>
              <Box w={10} h={10} style={{ borderRadius: "50%", background: "#ff5f57" }} />
              <Box w={10} h={10} style={{ borderRadius: "50%", background: "#febc2e" }} />
              <Box w={10} h={10} style={{ borderRadius: "50%", background: "#28c840" }} />
            </Group>
            <Text fz="xs" ff="monospace" style={{ color: theme.textColor, opacity: 0.4, flex: 1, textAlign: "center" }}>
              man.dev/{profile.username || "you"}
            </Text>
          </Group>
        )}

        <Box p="lg">
          {theme.isMonospace ? (
            // Terminal-style rendering
            <Stack gap="sm">
              <Text fz="xs" ff="monospace" style={{ color: theme.textColor, opacity: 0.4 }}>
                MAN.DEV(1)
              </Text>
              <div>
                <Text ff="monospace" fz="xs" fw={700} style={{ color: theme.accentColor }}>NAME</Text>
                <Text ff="monospace" fz="xs" pl="md" style={{ color: theme.textColor }}>
                  {profile.displayName || "Your Name"} — {profile.title || "Developer"}
                </Text>
              </div>
              {profile.bio && (
                <div>
                  <Text ff="monospace" fz="xs" fw={700} style={{ color: theme.accentColor }}>DESCRIPTION</Text>
                  <Text ff="monospace" fz="xs" pl="md" style={{ color: theme.textColor, opacity: 0.8 }} lh={1.5}>
                    {profile.bio}
                  </Text>
                </div>
              )}
              {profile.techStack.length > 0 && (
                <div>
                  <Text ff="monospace" fz="xs" fw={700} style={{ color: theme.accentColor }}>STACK</Text>
                  <Group gap={4} pl="md" mt={2}>
                    {profile.techStack.map((t) => (
                      <Badge key={t} size="xs" radius="sm" ff="monospace"
                        style={{ background: `${theme.accentColor}15`, color: theme.accentColor, border: `1px solid ${theme.accentColor}30` }}>
                        {t}
                      </Badge>
                    ))}
                  </Group>
                </div>
              )}
              {profile.links.filter((l) => l.enabled).length > 0 && (
                <div>
                  <Text ff="monospace" fz="xs" fw={700} style={{ color: theme.accentColor }}>LINKS</Text>
                  <Stack gap={1} pl="md" mt={2}>
                    {profile.links.filter((l) => l.enabled).map((link) => (
                      <Text key={link.id} ff="monospace" fz="xs" style={{ color: theme.textColor }}>
                        {link.title}
                      </Text>
                    ))}
                  </Stack>
                </div>
              )}
              {profile.openToWork && (
                <Badge size="xs" color="green" variant="light" ff="monospace" radius="sm" mt="xs">
                  open to work
                </Badge>
              )}
            </Stack>
          ) : (
            // Card-style rendering
            <Stack align="center" gap="md" pt="md">
              <Avatar size={64} radius="xl" style={{ border: `2px solid ${theme.accentColor}40`, color: theme.accentColor, background: `${theme.accentColor}15` }}>
                {initials}
              </Avatar>
              <Stack gap={2} align="center">
                <Text fw={700} fz="md" style={{ color: theme.textColor }}>
                  {profile.displayName || "Your Name"}
                </Text>
                <Text fz="xs" style={{ color: theme.textColor, opacity: 0.6 }}>
                  {profile.title || "Developer"}
                </Text>
              </Stack>
              {profile.techStack.length > 0 && (
                <Group gap={4} justify="center">
                  {profile.techStack.slice(0, 4).map((t) => (
                    <Badge key={t} size="xs" radius="sm"
                      style={{ background: `${theme.accentColor}15`, color: theme.accentColor }}>
                      {t}
                    </Badge>
                  ))}
                </Group>
              )}
              <Stack gap="xs" w="100%">
                {profile.links.filter((l) => l.enabled).map((link) => (
                  <Button key={link.id} fullWidth
                    variant={theme.buttonStyle === "outline" ? "outline" : "filled"}
                    radius={theme.borderRadius} size="sm"
                    styles={{ root: {
                      background: theme.buttonStyle === "outline" ? "transparent" : theme.cardBackground,
                      borderColor: `${theme.accentColor}40`,
                      color: theme.textColor,
                    } }}>
                    {link.title}
                  </Button>
                ))}
              </Stack>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

// ── Link Editor Item ─────────────────────────────────────────────────
function LinkEditorItem({
  link, onUpdate, onDelete,
}: {
  link: ProfileLink;
  onUpdate: (id: string, updates: Partial<ProfileLink>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card padding="md" radius="md" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
      <Group align="flex-start" wrap="nowrap">
        <ActionIcon variant="subtle" color="gray" mt={6} style={{ cursor: "grab" }}>
          <IconGripVertical size={16} />
        </ActionIcon>
        <Stack gap="xs" style={{ flex: 1 }}>
          <TextInput placeholder="Link title" value={link.title}
            onChange={(e) => onUpdate(link.id, { title: e.target.value })}
            size="sm" radius="md" styles={{ input: { fontWeight: 600 } }} />
          <TextInput placeholder="https://your-url.com" value={link.url}
            onChange={(e) => onUpdate(link.id, { url: e.target.value })}
            size="sm" radius="md" />
        </Stack>
        <Stack gap="xs" align="center" mt={6}>
          <Switch checked={link.enabled}
            onChange={(e) => onUpdate(link.id, { enabled: e.target.checked })}
            size="sm" color="cyan" />
          <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onDelete(link.id)}>
            <IconTrash size={14} />
          </ActionIcon>
        </Stack>
      </Group>
    </Card>
  );
}

// ── Theme Selector ───────────────────────────────────────────────────
const ACCENT_PRESETS = ["#00ff41", "#569cd6", "#bd93f9", "#88c0d0", "#58a6ff", "#b58900", "#ff6b6b", "#ffd43b", "#69db7c", "#e599f7", "#ff922b", "#22b8cf"];

function ThemeSelector({ current, onSelect, isPro, onAccentChange }: {
  current: DevTheme;
  onSelect: (t: DevTheme) => void;
  isPro: boolean;
  onAccentChange: (color: string) => void;
}) {
  return (
    <Stack gap="md">
      <div>
        <Text fw={600} fz="sm" mb="xs">Theme</Text>
        <SimpleGrid cols={3} spacing="xs">
          {DEFAULT_THEMES.map((theme) => (
            <Tooltip key={theme.id} label={theme.name}>
              <Paper h={56} radius="md" style={{
                background: theme.background,
                cursor: "pointer",
                border: current.id === theme.id ? `2px solid ${theme.accentColor}` : "2px solid transparent",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }} onClick={() => onSelect(theme)}>
                {current.id === theme.id ? (
                  <IconCheck size={18} color={theme.accentColor} />
                ) : (
                  <Text ff="monospace" fz="xs" style={{ color: theme.accentColor, opacity: 0.6 }}>
                    {theme.isMonospace ? "$_" : "Aa"}
                  </Text>
                )}
              </Paper>
            </Tooltip>
          ))}
        </SimpleGrid>
      </div>

      {/* Custom Accent Color */}
      <div>
        <Group justify="space-between" mb="xs">
          <Text fw={600} fz="sm">Accent Color</Text>
          {!isPro && <Badge variant="light" color="cyan" size="xs">Pro</Badge>}
        </Group>
        {isPro ? (
          <Stack gap="xs">
            <Group gap={6}>
              {ACCENT_PRESETS.map((color) => (
                <Tooltip key={color} label={color}>
                  <ColorSwatch
                    color={color}
                    size={24}
                    style={{
                      cursor: "pointer",
                      border: current.accentColor === color ? "2px solid white" : "2px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                    onClick={() => onAccentChange(color)}
                  />
                </Tooltip>
              ))}
            </Group>
            <ColorInput
              value={current.accentColor}
              onChange={onAccentChange}
              format="hex"
              size="sm"
              radius="md"
              swatches={ACCENT_PRESETS}
            />
          </Stack>
        ) : (
          <Paper p="sm" radius="md" style={{
            background: "rgba(0, 180, 216, 0.03)",
            border: "1px solid rgba(0, 180, 216, 0.1)",
          }}>
            <Group gap="xs">
              <Group gap={4}>
                {ACCENT_PRESETS.slice(0, 6).map((color) => (
                  <ColorSwatch key={color} color={color} size={16} style={{ opacity: 0.4 }} />
                ))}
              </Group>
              <Text fz="xs" c="dimmed" style={{ flex: 1 }}>
                Upgrade to Pro to customize accent colors
              </Text>
            </Group>
          </Paper>
        )}
      </div>
    </Stack>
  );
}

// ── Project Editor Item ──────────────────────────────────────────────
function ProjectEditorItem({
  project, onUpdate, onDelete,
}: {
  project: Project;
  onUpdate: (id: string, updates: Partial<Project>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card padding="md" radius="md" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
      <Group align="flex-start" wrap="nowrap">
        <Stack gap="xs" style={{ flex: 1 }}>
          <TextInput placeholder="Project name" value={project.name}
            onChange={(e) => onUpdate(project.id, { name: e.target.value })}
            size="sm" radius="md" styles={{ input: { fontWeight: 600, fontFamily: "monospace" } }} />
          <TextInput placeholder="Short description" value={project.description}
            onChange={(e) => onUpdate(project.id, { description: e.target.value })}
            size="sm" radius="md" />
          <Group gap="xs">
            <TextInput placeholder="https://github.com/..." value={project.url}
              onChange={(e) => onUpdate(project.id, { url: e.target.value })}
              size="sm" radius="md" style={{ flex: 1 }} />
            <TextInput placeholder="Language" value={project.language || ""}
              onChange={(e) => onUpdate(project.id, { language: e.target.value })}
              size="sm" radius="md" w={120} />
          </Group>
        </Stack>
        <ActionIcon variant="subtle" color="red" size="sm" mt={6} onClick={() => onDelete(project.id)}>
          <IconTrash size={14} />
        </ActionIcon>
      </Group>
    </Card>
  );
}

// ── Profile Completeness ─────────────────────────────────────────────
function getCompleteness(profile: DevProfile) {
  const checks = [
    { label: "Display name", done: !!profile.displayName },
    { label: "Title", done: !!profile.title },
    { label: "Username", done: !!profile.username },
    { label: "Bio", done: profile.bio.length >= 20 },
    { label: "GitHub username", done: !!profile.githubUsername },
    { label: "Tech stack (3+)", done: profile.techStack.length >= 3 },
    { label: "At least 1 link", done: profile.links.length >= 1 },
    { label: "At least 1 project", done: profile.projects.length >= 1 },
  ];
  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);
  return { checks, done, total: checks.length, pct };
}

function CompletenessBar({ profile }: { profile: DevProfile }) {
  const { checks, done, total, pct } = getCompleteness(profile);
  if (pct === 100) return null;

  const nextStep = checks.find((c) => !c.done);

  return (
    <Card padding="md" radius="lg" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
      <Group justify="space-between" mb={8}>
        <Text fz="sm" fw={600}>
          Profile completeness
        </Text>
        <Badge variant="light" color={pct >= 80 ? "green" : pct >= 50 ? "yellow" : "red"} size="sm">
          {done}/{total}
        </Badge>
      </Group>
      <Progress value={pct} size="sm" radius="xl" color={pct >= 80 ? "green" : pct >= 50 ? "yellow" : "cyan"} />
      {nextStep && (
        <Text fz="xs" c="dimmed" mt={6}>
          Next: {nextStep.label}
        </Text>
      )}
    </Card>
  );
}

// ── Editor Page ──────────────────────────────────────────────────────
export default function Editor() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addLinkOpened, { open: openAddLink, close: closeAddLink }] = useDisclosure(false);
  const [copied, setCopied] = useState(false);

  const [profile, setProfile] = useState<DevProfile>(
    pageId === "new" ? EMPTY_PROFILE : DEMO_PROFILE
  );

  const [newLink, setNewLink] = useState({ title: "", url: "" });

  const updateProfile = useCallback((updates: Partial<DevProfile>) => {
    setProfile((p) => ({ ...p, ...updates }));
  }, []);

  const updateLink = useCallback((linkId: string, updates: Partial<ProfileLink>) => {
    setProfile((p) => ({ ...p, links: p.links.map((l) => (l.id === linkId ? { ...l, ...updates } : l)) }));
  }, []);

  const deleteLink = useCallback((linkId: string) => {
    setProfile((p) => ({ ...p, links: p.links.filter((l) => l.id !== linkId) }));
  }, []);

  const addLink = useCallback(() => {
    if (!newLink.title || !newLink.url) return;
    const link: ProfileLink = {
      id: `l-${Date.now()}`,
      profileId: profile.id,
      title: newLink.title,
      url: newLink.url.startsWith("http") ? newLink.url : `https://${newLink.url}`,
      enabled: true,
      clicks: 0,
      position: profile.links.length,
    };
    setProfile((p) => ({ ...p, links: [...p.links, link] }));
    setNewLink({ title: "", url: "" });
    closeAddLink();
  }, [newLink, profile.id, profile.links.length, closeAddLink]);

  const updateProject = useCallback((projId: string, updates: Partial<Project>) => {
    setProfile((p) => ({ ...p, projects: p.projects.map((pr) => (pr.id === projId ? { ...pr, ...updates } : pr)) }));
  }, []);

  const deleteProject = useCallback((projId: string) => {
    setProfile((p) => ({ ...p, projects: p.projects.filter((pr) => pr.id !== projId) }));
  }, []);

  const addProject = useCallback(() => {
    const proj: Project = {
      id: `p-${Date.now()}`,
      profileId: profile.id,
      name: "",
      description: "",
      url: "",
      position: profile.projects.length,
    };
    setProfile((p) => ({ ...p, projects: [...p.projects, proj] }));
  }, [profile.id, profile.projects.length]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`man.dev/${profile.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    notifications.show({ title: "Copied!", message: "Share your man page with the world.", color: "cyan" });
  };

  const handleSave = () => {
    notifications.show({ title: "Saved!", message: "Changes committed.", color: "green" });
  };

  const handlePublish = () => {
    updateProfile({ published: !profile.published });
    notifications.show({
      title: profile.published ? "Unpublished" : "Published!",
      message: profile.published ? "Your man page is now hidden." : "Your man page is live!",
      color: profile.published ? "gray" : "green",
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if (mod && e.shiftKey && e.key === "p") {
        e.preventDefault();
        handlePublish();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <Box mih="100vh">
      {/* Editor Navbar */}
      <Box py="sm" px="md" style={{
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        background: "rgba(20, 21, 23, 0.95)",
        backdropFilter: "blur(16px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <Container size="xl">
          <Group justify="space-between">
            <Group>
              <ActionIcon variant="subtle" color="gray" onClick={() => navigate("/dashboard")}>
                <IconArrowLeft size={20} />
              </ActionIcon>
              <Logo size="sm" />
            </Group>
            <Group gap="sm">
              {profile.username && (
                <Tooltip label={copied ? "Copied!" : "Copy URL"}>
                  <Button variant="subtle" color="gray" size="xs" ff="monospace"
                    leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    onClick={handleCopyUrl}>
                    man.dev/{profile.username}
                  </Button>
                </Tooltip>
              )}
              <Button variant="default" size="sm" radius="md"
                leftSection={<IconEye size={16} />}
                component={Link} to={`/${profile.username}`} target="_blank">
                Preview
              </Button>
              <Tooltip label="⌘+Shift+P">
                <Button
                  variant={profile.published ? "light" : "gradient"}
                  gradient={{ from: "#0096c7", to: "#00b4d8" }}
                  color={profile.published ? "gray" : undefined}
                  size="sm" radius="md" onClick={handlePublish}>
                  {profile.published ? "Unpublish" : "Publish"}
                </Button>
              </Tooltip>
              <Tooltip label="⌘+S">
                <Button variant="gradient" gradient={{ from: "#0096c7", to: "#00b4d8" }}
                  size="sm" radius="md" onClick={handleSave}>
                  Save
                </Button>
              </Tooltip>
            </Group>
          </Group>
        </Container>
      </Box>

      <Container size="xl" py="xl">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" style={{ alignItems: "start" }}>
          {/* Left: Editor Panel */}
          <Stack gap="xl">
            {/* Completeness */}
            <CompletenessBar profile={profile} />

            {/* Profile Details */}
            <Card padding="lg" radius="lg" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <Stack gap="md">
                <Text fw={600}>Profile Details</Text>
                <SimpleGrid cols={2}>
                  <TextInput label="Display Name" placeholder="Jane Doe" value={profile.displayName}
                    onChange={(e) => updateProfile({ displayName: e.target.value })} radius="md" />
                  <TextInput label="Title" placeholder="Full Stack Developer" value={profile.title}
                    onChange={(e) => updateProfile({ title: e.target.value })} radius="md" />
                </SimpleGrid>
                <TextInput label="Username" placeholder="janedev" value={profile.username}
                  onChange={(e) => updateProfile({ username: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  radius="md" leftSection={<Text fz="xs" c="dimmed" ff="monospace">man.dev/</Text>} leftSectionWidth={80} />
                <Textarea label="Bio" placeholder="What you build, what you care about" value={profile.bio}
                  onChange={(e) => updateProfile({ bio: e.target.value })}
                  radius="md" autosize minRows={2} maxRows={4} />
                <TextInput label="GitHub Username" placeholder="janedoe" value={profile.githubUsername}
                  onChange={(e) => updateProfile({ githubUsername: e.target.value })}
                  radius="md" leftSection={<IconBrandGithub size={16} />} />
                <Switch label="Open to Work" description="Let recruiters know you're available"
                  checked={profile.openToWork}
                  onChange={(e) => updateProfile({ openToWork: e.target.checked })}
                  color="green" />
                {profile.openToWork && (
                  <SimpleGrid cols={2}>
                    <Select
                      label="Work Preference"
                      data={[
                        { value: "full-time", label: "Full-time" },
                        { value: "part-time", label: "Part-time" },
                        { value: "freelance", label: "Freelance" },
                        { value: "contract", label: "Contract" },
                      ]}
                      value={profile.workPreference || null}
                      onChange={(v) => updateProfile({ workPreference: (v as DevProfile["workPreference"]) || undefined })}
                      radius="md"
                      placeholder="Select type"
                      clearable
                    />
                    <TextInput
                      label="Available From"
                      type="date"
                      value={profile.availableFrom || ""}
                      onChange={(e) => updateProfile({ availableFrom: e.target.value || undefined })}
                      radius="md"
                    />
                  </SimpleGrid>
                )}
              </Stack>
            </Card>

            {/* Tech Stack */}
            <Card padding="lg" radius="lg" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <Stack gap="md">
                <Text fw={600}>Tech Stack</Text>
                <MultiSelect
                  data={TECH_STACK_OPTIONS}
                  value={profile.techStack}
                  onChange={(techStack) => updateProfile({ techStack })}
                  placeholder="Search and select your tools..."
                  searchable
                  radius="md"
                  maxValues={20}
                />
              </Stack>
            </Card>

            {/* Theme */}
            <Card padding="lg" radius="lg" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <ThemeSelector current={profile.theme}
                onSelect={(theme) => updateProfile({ theme })}
                isPro={user?.plan === "pro"}
                onAccentChange={(color) => updateProfile({ theme: { ...profile.theme, accentColor: color } })} />
            </Card>

            {/* Links */}
            <Card padding="lg" radius="lg" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <Group justify="space-between" mb="md">
                <Group>
                  <Text fw={600}>Links</Text>
                  <Badge variant="light" color="cyan" size="sm">{profile.links.length}</Badge>
                </Group>
                <Button variant="light" color="cyan" size="xs" radius="md"
                  leftSection={<IconPlus size={14} />} onClick={openAddLink}>
                  Add Link
                </Button>
              </Group>
              <Stack gap="sm">
                {profile.links.length === 0 ? (
                  <Paper p="xl" radius="md" ta="center" style={{ background: "rgba(0, 180, 216, 0.02)", border: "1px dashed rgba(0, 180, 216, 0.15)" }}>
                    <Stack align="center" gap="xs">
                      <Text c="dimmed" fz="sm" ff="monospace">// no links yet</Text>
                      <Button variant="light" color="cyan" size="sm" radius="md" onClick={openAddLink}>
                        Add Your First Link
                      </Button>
                    </Stack>
                  </Paper>
                ) : (
                  profile.links.sort((a, b) => a.position - b.position).map((link) => (
                    <LinkEditorItem key={link.id} link={link} onUpdate={updateLink} onDelete={deleteLink} />
                  ))
                )}
              </Stack>
            </Card>

            {/* Projects */}
            <Card padding="lg" radius="lg" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <Group justify="space-between" mb="md">
                <Group>
                  <Text fw={600}>Projects</Text>
                  <Badge variant="light" color="cyan" size="sm">{profile.projects.length}</Badge>
                </Group>
                <Button variant="light" color="cyan" size="xs" radius="md"
                  leftSection={<IconPlus size={14} />} onClick={addProject}>
                  Add Project
                </Button>
              </Group>
              <Stack gap="sm">
                {profile.projects.length === 0 ? (
                  <Paper p="xl" radius="md" ta="center" style={{ background: "rgba(0, 180, 216, 0.02)", border: "1px dashed rgba(0, 180, 216, 0.15)" }}>
                    <Stack align="center" gap="xs">
                      <Text c="dimmed" fz="sm" ff="monospace">// no projects yet</Text>
                      <Button variant="light" color="cyan" size="sm" radius="md" onClick={addProject}>
                        Showcase Your Work
                      </Button>
                    </Stack>
                  </Paper>
                ) : (
                  profile.projects.map((proj) => (
                    <ProjectEditorItem key={proj.id} project={proj} onUpdate={updateProject} onDelete={deleteProject} />
                  ))
                )}
              </Stack>
            </Card>
            {/* Endorsements */}
            <Card padding="lg" radius="lg" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <Group justify="space-between" mb="md">
                <Group>
                  <IconMessage size={18} />
                  <Text fw={600}>Endorsements</Text>
                  <Badge variant="light" color="cyan" size="sm">{profile.endorsements.length}</Badge>
                </Group>
                <Badge variant="light" color="cyan" size="sm">Pro</Badge>
              </Group>

              {user?.plan === "pro" ? (
                <Stack gap="md">
                  <Text fz="sm" c="dimmed">
                    Share your endorsement link so colleagues can vouch for you.
                  </Text>

                  {/* Shareable endorsement link */}
                  <Paper p="sm" radius="md" style={{ background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <Group justify="space-between">
                      <Text fz="xs" ff="monospace" c="dimmed">
                        man.dev/{profile.username || "you"}/endorse
                      </Text>
                      <CopyButton value={`https://man.dev/${profile.username || "you"}/endorse`} timeout={2000}>
                        {({ copied: c, copy }) => (
                          <Button variant="light" color={c ? "green" : "cyan"} size="xs" radius="md"
                            leftSection={c ? <IconCheck size={14} /> : <IconShare size={14} />}
                            onClick={copy}>
                            {c ? "Copied!" : "Copy Link"}
                          </Button>
                        )}
                      </CopyButton>
                    </Group>
                  </Paper>

                  {/* Existing endorsements */}
                  {profile.endorsements.length > 0 ? (
                    <Stack gap="xs">
                      {profile.endorsements.map((e) => (
                        <Card key={e.id} padding="sm" radius="md" style={{
                          background: "rgba(0, 180, 216, 0.03)",
                          border: "1px solid rgba(0, 180, 216, 0.1)",
                        }}>
                          <Group justify="space-between" mb={4}>
                            <div>
                              <Text fz="sm" fw={600}>{e.authorName}</Text>
                              <Text fz="xs" c="dimmed">{e.authorTitle}</Text>
                            </div>
                            <ActionIcon variant="subtle" color="red" size="sm"
                              onClick={() => setProfile((p) => ({
                                ...p,
                                endorsements: p.endorsements.filter((en) => en.id !== e.id),
                              }))}>
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Group>
                          <Text fz="sm" c="dimmed" style={{ fontStyle: "italic" }}>
                            "{e.text}"
                          </Text>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    <Paper p="xl" radius="md" ta="center" style={{ background: "rgba(0, 180, 216, 0.02)", border: "1px dashed rgba(0, 180, 216, 0.15)" }}>
                      <Stack align="center" gap="xs">
                        <Text c="dimmed" fz="sm" ff="monospace">// no endorsements yet</Text>
                        <Text c="dimmed" fz="xs">Share your endorsement link to get started</Text>
                      </Stack>
                    </Paper>
                  )}
                </Stack>
              ) : (
                <Paper p="lg" radius="md" ta="center" style={{
                  background: "linear-gradient(135deg, rgba(0, 180, 216, 0.06) 0%, rgba(0, 150, 199, 0.02) 100%)",
                  border: "1px solid rgba(0, 180, 216, 0.12)",
                }}>
                  <Stack align="center" gap="xs">
                    <IconLock size={24} color="var(--mantine-color-dimmed)" />
                    <Text fz="sm" fw={600}>Collect endorsements</Text>
                    <Text fz="xs" c="dimmed" maw={280}>
                      Upgrade to Pro to let colleagues endorse your work. Social proof that actually means something.
                    </Text>
                    <Button variant="gradient" gradient={{ from: "#0096c7", to: "#00b4d8" }}
                      size="sm" radius="md" mt="xs" ff="monospace">
                      sudo upgrade
                    </Button>
                  </Stack>
                </Paper>
              )}
            </Card>

            {/* Share & Embed */}
            <Card padding="lg" radius="lg" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <Stack gap="md">
                <Group>
                  <IconCode size={18} />
                  <Text fw={600}>Share & Embed</Text>
                </Group>
                <Text fz="sm" c="dimmed">
                  Add a badge to your GitHub README to drive traffic to your man page.
                </Text>

                {/* Markdown badge */}
                <div>
                  <Text fz="xs" fw={600} mb={4}>Markdown Badge</Text>
                  <Paper p="sm" radius="md" style={{ background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <Code fz="xs" ff="monospace" bg="transparent" c="dimmed" style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}>
                      {`[![man.dev](https://img.shields.io/badge/man.dev-${profile.username || "you"}-00b4d8?style=for-the-badge&logo=terminal&logoColor=white)](https://man.dev/${profile.username || "you"})`}
                    </Code>
                  </Paper>
                  <CopyButton
                    value={`[![man.dev](https://img.shields.io/badge/man.dev-${profile.username || "you"}-00b4d8?style=for-the-badge&logo=terminal&logoColor=white)](https://man.dev/${profile.username || "you"})`}
                    timeout={2000}
                  >
                    {({ copied: c, copy }) => (
                      <Button variant="light" color={c ? "green" : "cyan"} size="xs" radius="md" mt="xs"
                        leftSection={c ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        onClick={copy}>
                        {c ? "Copied!" : "Copy Markdown"}
                      </Button>
                    )}
                  </CopyButton>
                </div>

                {/* HTML embed */}
                <div>
                  <Text fz="xs" fw={600} mb={4}>HTML Badge</Text>
                  <Paper p="sm" radius="md" style={{ background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    <Code fz="xs" ff="monospace" bg="transparent" c="dimmed" style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}>
                      {`<a href="https://man.dev/${profile.username || "you"}"><img src="https://img.shields.io/badge/man.dev-${profile.username || "you"}-00b4d8?style=for-the-badge&logo=terminal&logoColor=white" alt="man.dev profile" /></a>`}
                    </Code>
                  </Paper>
                  <CopyButton
                    value={`<a href="https://man.dev/${profile.username || "you"}"><img src="https://img.shields.io/badge/man.dev-${profile.username || "you"}-00b4d8?style=for-the-badge&logo=terminal&logoColor=white" alt="man.dev profile" /></a>`}
                    timeout={2000}
                  >
                    {({ copied: c, copy }) => (
                      <Button variant="light" color={c ? "green" : "cyan"} size="xs" radius="md" mt="xs"
                        leftSection={c ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        onClick={copy}>
                        {c ? "Copied!" : "Copy HTML"}
                      </Button>
                    )}
                  </CopyButton>
                </div>

                {/* Preview */}
                {profile.username && (
                  <div>
                    <Text fz="xs" fw={600} mb={4}>Preview</Text>
                    <img
                      src={`https://img.shields.io/badge/man.dev-${profile.username}-00b4d8?style=for-the-badge&logo=terminal&logoColor=white`}
                      alt="man.dev badge preview"
                      style={{ display: "block" }}
                    />
                  </div>
                )}
              </Stack>
            </Card>

            {/* Custom Domain */}
            <Card padding="lg" radius="lg" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <Stack gap="md">
                <Group justify="space-between">
                  <Group>
                    <IconWorld size={18} />
                    <Text fw={600}>Custom Domain</Text>
                  </Group>
                  <Badge variant="light" color="cyan" size="sm">Pro</Badge>
                </Group>

                {user?.plan === "pro" ? (
                  <Stack gap="sm">
                    <Text fz="sm" c="dimmed">
                      Point your own domain to this profile. Add a CNAME record pointing to <Code fz="xs">profiles.man.dev</Code>.
                    </Text>
                    <TextInput
                      placeholder="janedoe.dev"
                      radius="md"
                      leftSection={<IconWorld size={16} />}
                      description="Enter your custom domain"
                    />
                    <Group gap="xs">
                      <Badge variant="light" color="yellow" size="sm">DNS pending</Badge>
                      <Text fz="xs" c="dimmed">
                        Verification can take up to 24 hours.
                      </Text>
                    </Group>
                    <Button variant="default" radius="md" size="sm">
                      Verify Domain
                    </Button>
                  </Stack>
                ) : (
                  <Paper p="lg" radius="md" ta="center" style={{
                    background: "linear-gradient(135deg, rgba(0, 180, 216, 0.06) 0%, rgba(0, 150, 199, 0.02) 100%)",
                    border: "1px solid rgba(0, 180, 216, 0.12)",
                  }}>
                    <Stack align="center" gap="xs">
                      <IconLock size={24} color="var(--mantine-color-dimmed)" />
                      <Text fz="sm" fw={600}>Use your own domain</Text>
                      <Text fz="xs" c="dimmed" maw={280}>
                        Upgrade to Pro to use a custom domain like janedoe.dev instead of man.dev/janedoe.
                      </Text>
                      <Button
                        variant="gradient"
                        gradient={{ from: "#0096c7", to: "#00b4d8" }}
                        size="sm" radius="md" mt="xs" ff="monospace"
                      >
                        sudo upgrade
                      </Button>
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Card>
          </Stack>

          {/* Right: Preview */}
          <TerminalPreview profile={profile} />
        </SimpleGrid>
      </Container>

      {/* Add Link Modal */}
      <Modal opened={addLinkOpened} onClose={closeAddLink}
        title={<Text fw={700}>Add a link</Text>} radius="lg" centered>
        <Stack gap="md">
          <TextInput label="Title" placeholder="Portfolio, Blog, GitHub..." value={newLink.title}
            onChange={(e) => setNewLink((s) => ({ ...s, title: e.target.value }))} radius="md" data-autofocus />
          <TextInput label="URL" placeholder="https://..." value={newLink.url}
            onChange={(e) => setNewLink((s) => ({ ...s, url: e.target.value }))} radius="md" />
          <Group justify="flex-end">
            <Button variant="default" radius="md" onClick={closeAddLink}>Cancel</Button>
            <Button variant="gradient" gradient={{ from: "#0096c7", to: "#00b4d8" }} radius="md"
              onClick={addLink} disabled={!newLink.title || !newLink.url}>
              Add Link
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
