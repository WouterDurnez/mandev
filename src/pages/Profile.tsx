import {
  Container,
  Text,
  Button,
  Stack,
  Avatar,
  Box,
  Anchor,
  Badge,
  Group,
  Paper,
  Tooltip,
  ActionIcon,
  Modal,
  CopyButton,
  rem,
} from "@mantine/core";
import {
  IconExternalLink,
  IconBrandGithub,
  IconStar,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconLink,
  IconQrcode,
  IconShare,
  IconCheck,
  IconBrandYoutube,
  IconMail,
  IconBriefcase,
  IconBrandMedium,
  IconWorld,
  IconCalendar,
  IconBrandDiscord,
  IconBrandReddit,
  IconBrandStackoverflow,
  IconBrandNpm,
  IconBrandTwitch,
  IconBrandDribbble,
  IconBrandFigma,
} from "@tabler/icons-react";
import { useParams } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { QRCodeSVG } from "qrcode.react";
import { useEffect } from "react";
import ContributionHeatmap from "@/components/ContributionHeatmap";
import type { DevProfile } from "@/types";
import { DEFAULT_THEMES } from "@/types";

// Demo profiles - in production, fetched from API
const DEMO_PROFILES: Record<string, DevProfile> = {
  janedev: {
    id: "profile-1",
    userId: "demo-1",
    username: "janedev",
    displayName: "Jane Doe",
    title: "Full Stack Developer",
    bio: "Building things that matter with TypeScript and Rust. Open source enthusiast. Coffee-driven development.",
    avatarUrl: "",
    githubUsername: "janedoe",
    techStack: ["TypeScript", "React", "Rust", "PostgreSQL", "Docker", "Next.js"],
    links: [
      { id: "l1", profileId: "profile-1", title: "Portfolio", url: "https://janedoe.dev", enabled: true, clicks: 234, position: 0 },
      { id: "l2", profileId: "profile-1", title: "Blog", url: "https://blog.janedoe.dev", enabled: true, clicks: 156, position: 1 },
      { id: "l3", profileId: "profile-1", title: "GitHub", url: "https://github.com/janedoe", enabled: true, clicks: 89, position: 2 },
      { id: "l4", profileId: "profile-1", title: "Twitter / X", url: "https://x.com/janedoe", enabled: true, clicks: 45, position: 3 },
      { id: "l5", profileId: "profile-1", title: "Book a Call", url: "https://cal.com/janedoe", enabled: true, clicks: 34, position: 4 },
    ],
    projects: [
      { id: "p1", profileId: "profile-1", name: "fastql", description: "A fast GraphQL server in Rust", url: "https://github.com/janedoe/fastql", language: "Rust", stars: 342, position: 0 },
      { id: "p2", profileId: "profile-1", name: "react-terminal", description: "Terminal component for React apps", url: "https://github.com/janedoe/react-terminal", language: "TypeScript", stars: 128, position: 1 },
    ],
    endorsements: [
      { id: "e1", profileId: "profile-1", authorName: "Alex Chen", authorTitle: "Tech Lead @ Stripe", text: "Jane is one of the best engineers I've worked with. Her Rust skills are exceptional.", createdAt: "2024-01-18" },
      { id: "e2", profileId: "profile-1", authorName: "Sam Rivera", authorTitle: "CTO @ DevTools Inc", authorUsername: "sambuilds", text: "Shipped three major features in her first month. Absolute machine.", createdAt: "2024-01-19" },
    ],
    theme: DEFAULT_THEMES[0], // Terminal
    openToWork: true,
    published: true,
    views: 1247,
    clicks: 479,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
  },
  demo: {
    id: "profile-demo",
    userId: "demo-1",
    username: "demo",
    displayName: "man.dev Demo",
    title: "This Could Be You",
    bio: "This is what your man page could look like. Set up takes 60 seconds, we benchmarked it.",
    avatarUrl: "",
    githubUsername: "mandev",
    techStack: ["TypeScript", "React", "Node.js", "Cloudflare"],
    links: [
      { id: "d1", profileId: "profile-demo", title: "Create Your Page", url: "/signup", enabled: true, clicks: 0, position: 0 },
      { id: "d2", profileId: "profile-demo", title: "See Pricing", url: "/pricing", enabled: true, clicks: 0, position: 1 },
      { id: "d3", profileId: "profile-demo", title: "GitHub", url: "https://github.com", enabled: true, clicks: 0, position: 2 },
    ],
    projects: [],
    endorsements: [],
    theme: DEFAULT_THEMES[2], // Dracula
    openToWork: false,
    published: true,
    views: 0,
    clicks: 0,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
};

function getLinkIcon(url: string, title: string) {
  const lower = (url + " " + title).toLowerCase();
  if (lower.includes("github.com") || lower.includes("github")) return IconBrandGithub;
  if (lower.includes("twitter.com") || lower.includes("x.com") || lower.includes("twitter")) return IconBrandTwitter;
  if (lower.includes("linkedin.com") || lower.includes("linkedin")) return IconBrandLinkedin;
  if (lower.includes("youtube.com") || lower.includes("youtube")) return IconBrandYoutube;
  if (lower.includes("medium.com") || lower.includes("blog") || lower.includes("medium")) return IconBrandMedium;
  if (lower.includes("discord") || lower.includes("discord.gg")) return IconBrandDiscord;
  if (lower.includes("reddit.com") || lower.includes("reddit")) return IconBrandReddit;
  if (lower.includes("stackoverflow") || lower.includes("stack overflow")) return IconBrandStackoverflow;
  if (lower.includes("npmjs.com") || lower.includes("npm")) return IconBrandNpm;
  if (lower.includes("twitch.tv") || lower.includes("twitch")) return IconBrandTwitch;
  if (lower.includes("dribbble.com") || lower.includes("dribbble")) return IconBrandDribbble;
  if (lower.includes("figma.com") || lower.includes("figma")) return IconBrandFigma;
  if (lower.includes("cal.com") || lower.includes("calendly") || lower.includes("book a call") || lower.includes("schedule")) return IconCalendar;
  if (lower.includes("mailto:") || lower.includes("email") || lower.includes("contact")) return IconMail;
  if (lower.includes("portfolio") || lower.includes("resume") || lower.includes("cv")) return IconBriefcase;
  return IconWorld;
}

function useProfileMeta(profile: DevProfile | null) {
  useEffect(() => {
    if (!profile) return;
    const profileUrl = `https://man.dev/${profile.username}`;
    const description = `${profile.title} — ${profile.bio.slice(0, 120)}${profile.bio.length > 120 ? "..." : ""}`;
    const title = `${profile.displayName} | man.dev`;

    document.title = title;

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setName = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Open Graph
    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:url", profileUrl);
    setMeta("og:type", "profile");
    setMeta("og:site_name", "man.dev");

    // Twitter Card
    setName("twitter:card", "summary");
    setName("twitter:title", title);
    setName("twitter:description", description);
    setName("twitter:site", "@mandev");

    // Standard meta
    setName("description", description);

    return () => {
      document.title = "man.dev — Every developer deserves a man page";
    };
  }, [profile]);
}

function ShareBar({ profile }: { profile: DevProfile }) {
  const [qrOpened, { open: openQr, close: closeQr }] = useDisclosure(false);
  const profileUrl = `https://man.dev/${profile.username}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Check out ${profile.displayName}'s developer man page`
  )}&url=${encodeURIComponent(profileUrl)}`;

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;

  return (
    <>
      <Group gap={6}>
        <Tooltip label="Share on Twitter">
          <ActionIcon
            component="a"
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            color="gray"
            size="lg"
            radius="xl"
          >
            <IconBrandTwitter size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Share on LinkedIn">
          <ActionIcon
            component="a"
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            color="gray"
            size="lg"
            radius="xl"
          >
            <IconBrandLinkedin size={18} />
          </ActionIcon>
        </Tooltip>
        <CopyButton value={profileUrl} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? "Copied!" : "Copy link"}>
              <ActionIcon
                variant="subtle"
                color={copied ? "green" : "gray"}
                size="lg"
                radius="xl"
                onClick={copy}
              >
                {copied ? <IconCheck size={18} /> : <IconLink size={18} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
        <Tooltip label="QR Code">
          <ActionIcon variant="subtle" color="gray" size="lg" radius="xl" onClick={openQr}>
            <IconQrcode size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Modal
        opened={qrOpened}
        onClose={closeQr}
        title={
          <Group gap="xs">
            <IconQrcode size={20} />
            <Text fw={600}>Share man page</Text>
          </Group>
        }
        centered
        size="xs"
        styles={{
          content: { background: "#1a1b1e" },
          header: { background: "#1a1b1e" },
        }}
      >
        <Stack align="center" gap="md" py="md">
          <Paper p="lg" radius="md" style={{ background: "white" }}>
            <QRCodeSVG
              value={profileUrl}
              size={180}
              bgColor="#ffffff"
              fgColor="#0a0a0a"
              level="M"
            />
          </Paper>
          <Text fz="sm" c="dimmed" ta="center" ff="monospace">
            man.dev/{profile.username}
          </Text>
          <CopyButton value={profileUrl} timeout={2000}>
            {({ copied, copy }) => (
              <Button
                variant={copied ? "light" : "default"}
                color={copied ? "green" : "gray"}
                leftSection={copied ? <IconCheck size={16} /> : <IconLink size={16} />}
                onClick={copy}
                radius="md"
                fullWidth
              >
                {copied ? "Copied!" : "Copy URL"}
              </Button>
            )}
          </CopyButton>
        </Stack>
      </Modal>
    </>
  );
}

function NotFound() {
  return (
    <Box
      mih="100vh"
      style={{
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container size="xs">
        <Stack align="center" gap="md" ta="center">
          <Text ff="monospace" fz={rem(20)} c="#00ff41">
            $ man {window.location.pathname.slice(1)}
          </Text>
          <Text ff="monospace" fz="lg" c="#ff5f57">
            No manual entry for {window.location.pathname.slice(1)}
          </Text>
          <Text c="dimmed" fz="md" mt="md">
            This developer hasn't created their man page yet.
          </Text>
          <Button
            variant="gradient"
            gradient={{ from: "#0096c7", to: "#00b4d8" }}
            radius="xl"
            size="lg"
            component="a"
            href="/signup"
            mt="md"
            ff="monospace"
          >
            Claim this username
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

// Terminal-style man page rendering
function TerminalProfile({ profile }: { profile: DevProfile }) {
  const theme = profile.theme;
  const initials = profile.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  if (theme.isMonospace) {
    // Full terminal man page rendering
    return (
      <Box
        mih="100vh"
        style={{
          background: theme.background,
          fontFamily: theme.fontFamily,
        }}
      >
        <Container size="sm" py={rem(60)}>
          <Stack gap="lg">
            {/* Header */}
            <Text fz="sm" ff="monospace" style={{ color: theme.textColor, opacity: 0.4 }}>
              MAN.DEV(1)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Developer Manual&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;MAN.DEV(1)
            </Text>

            {/* NAME */}
            <div>
              <Text ff="monospace" fz="md" fw={700} style={{ color: theme.accentColor }}>
                NAME
              </Text>
              <Text ff="monospace" fz="md" pl="xl" style={{ color: theme.textColor }}>
                {profile.displayName} — {profile.title}
              </Text>
            </div>

            {/* SYNOPSIS */}
            <div>
              <Text ff="monospace" fz="md" fw={700} style={{ color: theme.accentColor }}>
                SYNOPSIS
              </Text>
              <Text ff="monospace" fz="md" pl="xl" style={{ color: theme.textColor }}>
                {profile.username} [--hire] [--collaborate] [--coffee]
              </Text>
            </div>

            {/* DESCRIPTION */}
            <div>
              <Text ff="monospace" fz="md" fw={700} style={{ color: theme.accentColor }}>
                DESCRIPTION
              </Text>
              <Text ff="monospace" fz="sm" pl="xl" lh={1.7} style={{ color: theme.textColor, opacity: 0.85 }}>
                {profile.bio}
              </Text>
            </div>

            {/* STACK */}
            {profile.techStack.length > 0 && (
              <div>
                <Text ff="monospace" fz="md" fw={700} style={{ color: theme.accentColor }}>
                  STACK
                </Text>
                <Group gap={6} pl="xl" mt={8}>
                  {profile.techStack.map((t) => (
                    <Badge
                      key={t}
                      size="md"
                      radius="sm"
                      ff="monospace"
                      style={{
                        background: `${theme.accentColor}12`,
                        color: theme.accentColor,
                        border: `1px solid ${theme.accentColor}30`,
                      }}
                    >
                      {t}
                    </Badge>
                  ))}
                </Group>
              </div>
            )}

            {/* CONTRIBUTIONS */}
            {profile.githubUsername && (
              <div>
                <Text ff="monospace" fz="md" fw={700} style={{ color: theme.accentColor }}>
                  CONTRIBUTIONS
                </Text>
                <Box pl="xl" mt={8}>
                  <ContributionHeatmap
                    accentColor={theme.accentColor}
                    textColor={theme.textColor}
                    weeks={16}
                    username={profile.githubUsername}
                  />
                </Box>
              </div>
            )}

            {/* PROJECTS */}
            {profile.projects.length > 0 && (
              <div>
                <Text ff="monospace" fz="md" fw={700} style={{ color: theme.accentColor }}>
                  PROJECTS
                </Text>
                <Stack gap="sm" pl="xl" mt={8}>
                  {profile.projects.map((proj) => (
                    <Anchor
                      key={proj.id}
                      href={proj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="never"
                    >
                      <Group gap="sm" style={{ cursor: "pointer" }}>
                        <Text ff="monospace" fz="sm" fw={600} style={{ color: theme.textColor }}>
                          {proj.name}
                        </Text>
                        {proj.language && (
                          <Badge size="xs" radius="sm" ff="monospace" variant="light" color="gray">
                            {proj.language}
                          </Badge>
                        )}
                        {proj.stars !== undefined && proj.stars > 0 && (
                          <Group gap={2}>
                            <IconStar size={12} color={theme.accentColor} fill={theme.accentColor} />
                            <Text ff="monospace" fz="xs" style={{ color: theme.accentColor }}>
                              {proj.stars}
                            </Text>
                          </Group>
                        )}
                      </Group>
                      <Text ff="monospace" fz="xs" pl="md" style={{ color: theme.textColor, opacity: 0.5 }}>
                        {proj.description}
                      </Text>
                    </Anchor>
                  ))}
                </Stack>
              </div>
            )}

            {/* LINKS */}
            {profile.links.filter((l) => l.enabled).length > 0 && (
              <div>
                <Text ff="monospace" fz="md" fw={700} style={{ color: theme.accentColor }}>
                  SEE ALSO
                </Text>
                <Stack gap={4} pl="xl" mt={8}>
                  {profile.links
                    .filter((l) => l.enabled)
                    .sort((a, b) => a.position - b.position)
                    .map((link) => (
                      <Anchor
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                      >
                        <Group gap="sm">
                          <Text ff="monospace" fz="sm" style={{ color: theme.textColor, opacity: 0.6 }} w={140}>
                            {link.title}
                          </Text>
                          <Text ff="monospace" fz="sm" style={{ color: theme.accentColor }}>
                            {link.url.replace(/^https?:\/\//, "")}
                          </Text>
                        </Group>
                      </Anchor>
                    ))}
                </Stack>
              </div>
            )}

            {/* STATUS */}
            {profile.openToWork && (
              <div>
                <Text ff="monospace" fz="md" fw={700} style={{ color: theme.accentColor }}>
                  STATUS
                </Text>
                <Stack gap={6} pl="xl" mt={8}>
                  <Group gap="xs">
                    <Badge size="md" color="green" variant="light" ff="monospace" radius="sm">
                      open to work
                    </Badge>
                    {profile.workPreference && (
                      <Badge size="md" variant="light" color="cyan" ff="monospace" radius="sm">
                        {profile.workPreference}
                      </Badge>
                    )}
                  </Group>
                  {profile.availableFrom && (
                    <Text ff="monospace" fz="sm" style={{ color: theme.textColor, opacity: 0.6 }}>
                      Available from {new Date(profile.availableFrom).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </Text>
                  )}
                </Stack>
              </div>
            )}

            {/* ENDORSEMENTS */}
            {profile.endorsements.length > 0 && (
              <div>
                <Text ff="monospace" fz="md" fw={700} style={{ color: theme.accentColor }}>
                  ENDORSEMENTS
                </Text>
                <Stack gap="sm" pl="xl" mt={8}>
                  {profile.endorsements.map((e) => (
                    <Paper key={e.id} p="sm" radius="sm" style={{
                      background: `${theme.accentColor}08`,
                      border: `1px solid ${theme.accentColor}15`,
                    }}>
                      <Text ff="monospace" fz="sm" style={{ color: theme.textColor, opacity: 0.85 }} lh={1.5}>
                        "{e.text}"
                      </Text>
                      <Group gap="xs" mt={6}>
                        <Text ff="monospace" fz="xs" fw={600} style={{ color: theme.accentColor }}>
                          — {e.authorName}
                        </Text>
                        <Text ff="monospace" fz="xs" style={{ color: theme.textColor, opacity: 0.4 }}>
                          {e.authorTitle}
                        </Text>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </div>
            )}

            {/* Share */}
            <Group mt={rem(40)} justify="space-between" align="center">
              <Anchor href="/" underline="hover">
                <Text ff="monospace" fz="xs" style={{ color: theme.textColor, opacity: 0.25 }}>
                  man.dev — Every developer deserves a man page
                </Text>
              </Anchor>
              <ShareBar profile={profile} />
            </Group>
          </Stack>
        </Container>
      </Box>
    );
  }

  // Card-style rendering for non-monospace themes
  return (
    <Box
      mih="100vh"
      style={{
        background: theme.background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Container size="xs" py={rem(60)} w="100%">
        <Stack align="center" gap="lg">
          <Avatar
            size={96}
            radius="xl"
            style={{
              border: `3px solid ${theme.accentColor}40`,
              color: theme.accentColor,
              background: `${theme.accentColor}15`,
              fontSize: rem(32),
            }}
          >
            {initials}
          </Avatar>

          <Stack gap={4} align="center">
            <Group gap="xs" align="center">
              <Text fw={800} fz={rem(24)} style={{ color: theme.textColor }}>
                {profile.displayName}
              </Text>
              {profile.openToWork && (
                <Badge size="sm" color="green" variant="light" radius="sm">
                  open to work
                </Badge>
              )}
            </Group>
            <Text fz="md" style={{ color: theme.textColor, opacity: 0.6 }}>
              {profile.title}
            </Text>
            <Text
              fz="sm"
              ta="center"
              maw={360}
              style={{ color: theme.textColor, opacity: 0.7 }}
              lh={1.6}
            >
              {profile.bio}
            </Text>
          </Stack>

          {/* Tech stack */}
          {profile.techStack.length > 0 && (
            <Group gap={6} justify="center" mt="xs">
              {profile.techStack.map((t) => (
                <Badge
                  key={t}
                  size="sm"
                  radius="sm"
                  style={{
                    background: `${theme.accentColor}12`,
                    color: theme.accentColor,
                    border: `1px solid ${theme.accentColor}25`,
                  }}
                >
                  {t}
                </Badge>
              ))}
            </Group>
          )}

          {/* Contributions */}
          {profile.githubUsername && (
            <Box w="100%" mt="md">
              <Text fz="xs" fw={700} tt="uppercase" c="dimmed" mb="xs" style={{ letterSpacing: "0.05em" }}>
                Contributions
              </Text>
              <ContributionHeatmap
                accentColor={theme.accentColor}
                textColor={theme.textColor}
                weeks={16}
                username={profile.githubUsername}
              />
            </Box>
          )}

          {/* Projects */}
          {profile.projects.length > 0 && (
            <Stack gap="xs" w="100%" mt="md">
              {profile.projects.map((proj) => (
                <Anchor
                  key={proj.id}
                  href={proj.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="never"
                  style={{ width: "100%" }}
                >
                  <Paper
                    p="sm"
                    radius={theme.borderRadius}
                    style={{
                      background: theme.cardBackground,
                      border: `1px solid ${theme.accentColor}15`,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconBrandGithub size={16} style={{ color: theme.textColor, opacity: 0.5 }} />
                        <Text fw={600} fz="sm" ff="monospace" style={{ color: theme.textColor }}>
                          {proj.name}
                        </Text>
                        {proj.language && (
                          <Badge size="xs" radius="sm" variant="light" color="gray">
                            {proj.language}
                          </Badge>
                        )}
                      </Group>
                      {proj.stars !== undefined && proj.stars > 0 && (
                        <Group gap={4}>
                          <IconStar size={12} fill={theme.accentColor} color={theme.accentColor} />
                          <Text fz="xs" style={{ color: theme.accentColor }}>{proj.stars}</Text>
                        </Group>
                      )}
                    </Group>
                    <Text fz="xs" mt={4} style={{ color: theme.textColor, opacity: 0.5 }}>
                      {proj.description}
                    </Text>
                  </Paper>
                </Anchor>
              ))}
            </Stack>
          )}

          {/* Endorsements */}
          {profile.endorsements.length > 0 && (
            <Stack gap="xs" w="100%" mt="md">
              <Text fz="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.05em" }}>
                Endorsements
              </Text>
              {profile.endorsements.map((e) => (
                <Paper key={e.id} p="sm" radius={theme.borderRadius} style={{
                  background: theme.cardBackground,
                  border: `1px solid ${theme.accentColor}15`,
                }}>
                  <Text fz="sm" style={{ color: theme.textColor, opacity: 0.85 }} lh={1.5}>
                    "{e.text}"
                  </Text>
                  <Group gap="xs" mt={6}>
                    <Text fz="xs" fw={600} style={{ color: theme.accentColor }}>
                      {e.authorName}
                    </Text>
                    <Text fz="xs" style={{ color: theme.textColor, opacity: 0.4 }}>
                      {e.authorTitle}
                    </Text>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}

          {/* Links */}
          <Stack gap="sm" w="100%" mt="md">
            {profile.links
              .filter((l) => l.enabled)
              .sort((a, b) => a.position - b.position)
              .map((link) => {
                const LinkIcon = getLinkIcon(link.url, link.title);
                return (
                  <Anchor
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="never"
                    style={{ width: "100%" }}
                  >
                    <Button
                      fullWidth
                      variant={theme.buttonStyle === "outline" ? "outline" : "filled"}
                      radius={theme.borderRadius}
                      size="lg"
                      leftSection={<LinkIcon size={18} style={{ opacity: 0.6 }} />}
                      rightSection={<IconExternalLink size={16} style={{ opacity: 0.4 }} />}
                      styles={{
                        root: {
                          background: theme.buttonStyle === "outline" ? "transparent" : theme.cardBackground,
                          borderColor: `${theme.accentColor}30`,
                          color: theme.textColor,
                          fontWeight: 600,
                          height: 52,
                          transition: "all 0.2s ease",
                        },
                        inner: { justifyContent: "center" },
                      }}
                    >
                      {link.title}
                    </Button>
                  </Anchor>
                );
              })}
          </Stack>

          <Stack align="center" gap="sm" mt={rem(40)}>
            <ShareBar profile={profile} />
            <Anchor href="/" underline="hover">
              <Text fz="xs" style={{ color: theme.textColor, opacity: 0.25 }}>
                Powered by man.dev
              </Text>
            </Anchor>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

export default function Profile() {
  const { slug } = useParams();
  const profile = slug ? DEMO_PROFILES[slug] : null;
  useProfileMeta(profile ?? null);

  if (!profile) return <NotFound />;

  return <TerminalProfile profile={profile} />;
}
