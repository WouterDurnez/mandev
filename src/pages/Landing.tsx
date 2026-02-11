import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Card,
  Badge,
  Box,
  ThemeIcon,
  Divider,
  Anchor,
  Avatar,
  Paper,
  Code,
  TextInput,
  rem,
} from "@mantine/core";
import {
  IconBrandGithub,
  IconChartBar,
  IconPalette,
  IconRocket,
  IconShieldCheck,
  IconDeviceMobile,
  IconBrandTwitter,
  IconArrowRight,
  IconCheck,
  IconStar,
  IconCode,
  IconTerminal2,
  IconWorld,
  IconBriefcase,
  IconStack2,
  IconBrandLinkedin,
} from "@tabler/icons-react";
import { IconMail } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";
import { useState } from "react";

// ── Terminal Hero ─────────────────────────────────────────────────────
function Hero() {
  return (
    <Box
      pt={rem(140)}
      pb={rem(100)}
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(0, 180, 216, 0.06) 0%, transparent 60%), " +
          "radial-gradient(ellipse at bottom right, rgba(0, 150, 199, 0.04) 0%, transparent 50%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid pattern overlay */}
      <Box
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <Container size="md" style={{ position: "relative", zIndex: 1 }}>
        <Stack align="center" gap="lg">
          <Badge
            size="lg"
            variant="light"
            color="cyan"
            leftSection={<IconTerminal2 size={14} />}
            style={{ textTransform: "none", fontWeight: 500 }}
          >
            Now in public beta
          </Badge>

          <Title
            ta="center"
            fz={{ base: rem(40), sm: rem(56), md: rem(68) }}
            fw={800}
            lh={1.1}
            style={{ letterSpacing: "-0.03em" }}
          >
            Every developer{" "}
            <Text
              span
              inherit
              variant="gradient"
              gradient={{ from: "#00b4d8", to: "#48cae4", deg: 135 }}
            >
              deserves a man page
            </Text>
          </Title>

          <Text
            ta="center"
            fz={{ base: "lg", md: "xl" }}
            c="dimmed"
            maw={580}
            lh={1.6}
          >
            Your developer profile, your rules. GitHub stats, tech stack,
            projects, and links — all on one beautiful page. Set up in 60
            seconds, not 60 hours.
          </Text>

          <Group mt="md" gap="md">
            <Button
              size="xl"
              variant="gradient"
              gradient={{ from: "#0096c7", to: "#00b4d8" }}
              radius="xl"
              rightSection={<IconArrowRight size={20} />}
              component={Link}
              to="/signup"
              ff="monospace"
              style={{
                boxShadow: "0 8px 32px rgba(0, 180, 216, 0.2)",
                fontSize: rem(18),
              }}
            >
              man --init
            </Button>
            <Button
              size="xl"
              variant="default"
              radius="xl"
              component={Link}
              to="/demo"
              style={{ fontSize: rem(18) }}
            >
              See Demo
            </Button>
          </Group>

          <Text c="dimmed" fz="sm" mt="xs">
            Free forever. No sudo required.
          </Text>
        </Stack>

        {/* Terminal-style preview */}
        <Box mt={rem(60)} mx="auto" maw={480}>
          <Paper
            shadow="xl"
            radius="lg"
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              overflow: "hidden",
            }}
          >
            {/* Terminal title bar */}
            <Group
              px="md"
              py={8}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <Group gap={6}>
                <Box w={12} h={12} style={{ borderRadius: "50%", background: "#ff5f57" }} />
                <Box w={12} h={12} style={{ borderRadius: "50%", background: "#febc2e" }} />
                <Box w={12} h={12} style={{ borderRadius: "50%", background: "#28c840" }} />
              </Group>
              <Text fz="xs" c="dimmed" ff="monospace" style={{ flex: 1, textAlign: "center" }}>
                man.dev/janedev
              </Text>
            </Group>

            {/* Terminal content */}
            <Box p="lg" ff="monospace" fz="sm">
              <Text c="dimmed" fz="xs" mb="md" ff="monospace">
                MAN.DEV(1)&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Developer Manual&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;MAN.DEV(1)
              </Text>

              <Stack gap="md">
                <div>
                  <Text c="#00b4d8" fw={700} fz="sm" ff="monospace">NAME</Text>
                  <Text c="#e6edf3" fz="sm" ff="monospace" pl="md">
                    Jane Doe — Full Stack Developer
                  </Text>
                </div>

                <div>
                  <Text c="#00b4d8" fw={700} fz="sm" ff="monospace">SYNOPSIS</Text>
                  <Text c="#e6edf3" fz="sm" ff="monospace" pl="md">
                    jane [--hire] [--collaborate] [--coffee]
                  </Text>
                </div>

                <div>
                  <Text c="#00b4d8" fw={700} fz="sm" ff="monospace">DESCRIPTION</Text>
                  <Text c="#a0a0a0" fz="sm" ff="monospace" pl="md" lh={1.6}>
                    Building things that matter with TypeScript and Rust.
                    Open source enthusiast. Coffee-driven development.
                  </Text>
                </div>

                <div>
                  <Text c="#00b4d8" fw={700} fz="sm" ff="monospace">STACK</Text>
                  <Group gap={6} pl="md" mt={4}>
                    {["TypeScript", "React", "Rust", "PostgreSQL", "Docker"].map((t) => (
                      <Badge
                        key={t}
                        size="sm"
                        variant="light"
                        color="cyan"
                        radius="sm"
                        ff="monospace"
                      >
                        {t}
                      </Badge>
                    ))}
                  </Group>
                </div>

                <div>
                  <Text c="#00b4d8" fw={700} fz="sm" ff="monospace">LINKS</Text>
                  <Stack gap={2} pl="md" mt={4}>
                    {[
                      ["Portfolio", "janedoe.dev"],
                      ["GitHub", "github.com/janedoe"],
                      ["Blog", "blog.janedoe.dev"],
                    ].map(([label, url]) => (
                      <Group key={label} gap="xs">
                        <Text c="#a0a0a0" fz="sm" ff="monospace" w={100}>
                          {label}
                        </Text>
                        <Text c="#48cae4" fz="sm" ff="monospace">
                          {url}
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </div>

                <Group gap={6} mt="xs">
                  <Badge size="sm" color="green" variant="light" ff="monospace" radius="sm">
                    open to work
                  </Badge>
                  <Badge size="sm" color="gray" variant="light" ff="monospace" radius="sm">
                    142 views this week
                  </Badge>
                </Group>
              </Stack>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

// ── Features Section ──────────────────────────────────────────────────
const FEATURES = [
  {
    icon: IconBrandGithub,
    title: "GitHub Integration",
    description:
      "Connect your GitHub and auto-import pinned repos, contribution stats, and star counts. Your code speaks for itself.",
  },
  {
    icon: IconStack2,
    title: "Tech Stack Display",
    description:
      "Visual badges for every language, framework, and tool in your arsenal. Let recruiters grep your skills.",
  },
  {
    icon: IconPalette,
    title: "Dev Themes",
    description:
      "Terminal, VS Code Dark, Dracula, Nord, GitHub Dark, Solarized — themes devs actually want to look at.",
  },
  {
    icon: IconBriefcase,
    title: "Open to Work",
    description:
      "Toggle your availability. Get discovered by companies who actually read man pages before hiring.",
  },
  {
    icon: IconChartBar,
    title: "Profile Analytics",
    description:
      "Know who's viewing your page. Track clicks, views, and referral sources. Data-driven career moves.",
  },
  {
    icon: IconRocket,
    title: "Edge Deployed",
    description:
      "Globally distributed via Cloudflare. Your man page loads faster than your terminal prompt.",
  },
];

function Features() {
  return (
    <Box py={rem(100)} style={{ background: "rgba(0, 0, 0, 0.2)" }}>
      <Container size="lg">
        <Stack align="center" gap="xs" mb={rem(60)}>
          <Badge variant="light" color="cyan" size="lg">
            Features
          </Badge>
          <Title ta="center" fz={{ base: rem(32), md: rem(42) }} fw={800}>
            Built by devs,{" "}
            <Text span inherit c="cyan">
              for devs
            </Text>
          </Title>
          <Text ta="center" c="dimmed" maw={500} fz="lg">
            No bloat, no drag-and-drop page builders. Just the tools you need
            to present yourself like a pro.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              padding="xl"
              radius="lg"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                transition: "all 0.2s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 180, 216, 0.04)";
                e.currentTarget.style.borderColor = "rgba(0, 180, 216, 0.15)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <ThemeIcon
                size={48}
                radius="md"
                variant="light"
                color="cyan"
                mb="md"
              >
                <feature.icon size={24} />
              </ThemeIcon>
              <Text fw={600} fz="lg" mb={8}>
                {feature.title}
              </Text>
              <Text c="dimmed" fz="sm" lh={1.6}>
                {feature.description}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

// ── Social Proof ──────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Alex Chen",
    handle: "@alexcodes",
    role: "Senior Engineer @ Vercel",
    avatar: "AC",
    text: "Set up my man page in 2 minutes. Got three recruiter messages the same week. The terminal theme is *chef's kiss*.",
  },
  {
    name: "Sam Rivera",
    handle: "@sambuilds",
    role: "Freelance Full Stack Dev",
    avatar: "SR",
    text: "I've been meaning to build a portfolio site for years. man.dev did it in 60 seconds and it looks better than anything I'd have built.",
  },
  {
    name: "Jordan Patel",
    handle: "@jordandev",
    role: "Open Source Maintainer",
    avatar: "JP",
    text: "The GitHub integration auto-pulled my repos and stats. My man page is now the first link in every PR I submit.",
  },
];

function SocialProof() {
  return (
    <Box py={rem(100)}>
      <Container size="lg">
        <Stack align="center" gap="xs" mb={rem(60)}>
          <Badge variant="light" color="cyan" size="lg">
            Testimonials
          </Badge>
          <Title ta="center" fz={{ base: rem(32), md: rem(42) }} fw={800}>
            Devs who{" "}
            <Text span inherit c="cyan">
              RTFM
            </Text>
            'd
          </Title>
          <Text ta="center" c="dimmed" fz="md">
            (Read Their Fantastic Man page)
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
          {TESTIMONIALS.map((t) => (
            <Card
              key={t.handle}
              padding="xl"
              radius="lg"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <Group mb="md">
                {[1, 2, 3, 4, 5].map((i) => (
                  <IconStar key={i} size={16} fill="#00b4d8" color="#00b4d8" />
                ))}
              </Group>
              <Text c="dimmed" fz="sm" lh={1.7} mb="lg" style={{ fontStyle: "italic" }}>
                "{t.text}"
              </Text>
              <Group>
                <Avatar color="cyan" radius="xl">
                  {t.avatar}
                </Avatar>
                <div>
                  <Text fw={600} fz="sm">
                    {t.name}
                  </Text>
                  <Text c="dimmed" fz="xs">
                    {t.role}
                  </Text>
                </div>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

// ── Pricing Section ───────────────────────────────────────────────────
function PricingSection() {
  return (
    <Box py={rem(100)} style={{ background: "rgba(0, 0, 0, 0.2)" }}>
      <Container size="sm">
        <Stack align="center" gap="xs" mb={rem(60)}>
          <Badge variant="light" color="cyan" size="lg">
            Pricing
          </Badge>
          <Title ta="center" fz={{ base: rem(32), md: rem(42) }} fw={800}>
            Simple as{" "}
            <Code fz={{ base: rem(28), md: rem(38) }} ff="monospace" bg="transparent" c="cyan" fw={800}>
              --help
            </Code>
          </Title>
          <Text ta="center" c="dimmed" maw={400} fz="lg">
            Start free. Upgrade when you need more flags.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
          {/* Free Tier */}
          <Card
            padding="xl"
            radius="lg"
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <Stack gap="md">
              <div>
                <Code fz="lg" ff="monospace" bg="transparent" c="white" fw={700}>
                  man
                </Code>
                <Text c="dimmed" fz="sm">
                  The essentials
                </Text>
              </div>
              <div>
                <Text fz={rem(48)} fw={800} lh={1}>
                  $0
                </Text>
                <Text c="dimmed" fz="sm">
                  forever
                </Text>
              </div>
              <Divider color="dark.4" />
              <Stack gap="xs">
                {[
                  "1 profile page",
                  "5 links",
                  "GitHub integration",
                  "6 dev themes",
                  "Tech stack badges",
                  "man.dev/you branding",
                ].map((f) => (
                  <Group key={f} gap="xs">
                    <IconCheck size={16} color="#00b4d8" />
                    <Text fz="sm">{f}</Text>
                  </Group>
                ))}
              </Stack>
              <Button
                variant="default"
                size="lg"
                radius="xl"
                fullWidth
                component={Link}
                to="/signup"
                mt="sm"
                ff="monospace"
              >
                man --init
              </Button>
            </Stack>
          </Card>

          {/* Pro Tier */}
          <Card
            padding="xl"
            radius="lg"
            style={{
              background: "rgba(0, 180, 216, 0.04)",
              border: "1px solid rgba(0, 180, 216, 0.2)",
              position: "relative",
              overflow: "visible",
            }}
          >
            <Badge
              variant="gradient"
              gradient={{ from: "#0096c7", to: "#00b4d8" }}
              size="lg"
              leftSection={<IconTerminal2 size={14} />}
              style={{
                position: "absolute",
                top: -12,
                right: 20,
                textTransform: "none",
              }}
            >
              sudo mode
            </Badge>
            <Stack gap="md">
              <div>
                <Code fz="lg" ff="monospace" bg="transparent" c="cyan" fw={700}>
                  man -v
                </Code>
                <Text c="dimmed" fz="sm">
                  Verbose mode — everything unlocked
                </Text>
              </div>
              <div>
                <Group align="end" gap={4}>
                  <Text fz={rem(48)} fw={800} lh={1}>
                    $7
                  </Text>
                  <Text c="dimmed" fz="sm" mb={4}>
                    /month
                  </Text>
                </Group>
                <Text c="dimmed" fz="sm">
                  or $69/year (nice.)
                </Text>
              </div>
              <Divider color="dark.4" />
              <Stack gap="xs">
                {[
                  "Unlimited profiles",
                  "Unlimited links",
                  "All themes + custom colors",
                  "Advanced analytics",
                  "Custom domain support",
                  "Project showcase",
                  "Open to Work badge",
                  "Blog feed integration",
                  "No man.dev branding",
                  "Priority support",
                ].map((f) => (
                  <Group key={f} gap="xs">
                    <IconCheck size={16} color="#00b4d8" />
                    <Text fz="sm">{f}</Text>
                  </Group>
                ))}
              </Stack>
              <Button
                variant="gradient"
                gradient={{ from: "#0096c7", to: "#00b4d8" }}
                size="lg"
                radius="xl"
                fullWidth
                component={Link}
                to="/signup"
                mt="sm"
                ff="monospace"
                style={{ boxShadow: "0 4px 20px rgba(0, 180, 216, 0.15)" }}
              >
                sudo man --init
              </Button>
            </Stack>
          </Card>
        </SimpleGrid>
      </Container>
    </Box>
  );
}

// ── CTA Section ───────────────────────────────────────────────────────
function CTA() {
  return (
    <Box py={rem(100)}>
      <Container size="sm">
        <Card
          padding={rem(60)}
          radius="xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(0, 180, 216, 0.08) 0%, rgba(0, 150, 199, 0.04) 100%)",
            border: "1px solid rgba(0, 180, 216, 0.15)",
            textAlign: "center",
          }}
        >
          <Stack align="center" gap="md">
            <Code fz={rem(36)} ff="monospace" bg="transparent" c="cyan" fw={800}>
              $ man you
            </Code>
            <Title fz={{ base: rem(28), md: rem(36) }} fw={800}>
              Your page is waiting
            </Title>
            <Text c="dimmed" fz="lg" maw={400}>
              Join developers who stopped procrastinating on their portfolio
              and shipped a man page instead.
            </Text>
            <Button
              size="xl"
              variant="gradient"
              gradient={{ from: "#0096c7", to: "#00b4d8" }}
              radius="xl"
              rightSection={<IconArrowRight size={20} />}
              component={Link}
              to="/signup"
              mt="sm"
              ff="monospace"
              style={{ boxShadow: "0 8px 32px rgba(0, 180, 216, 0.2)" }}
            >
              man --init
            </Button>
            <Text c="dimmed" fz="xs">
              Takes 60 seconds. We benchmarked it.
            </Text>
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}

// ── Footer ────────────────────────────────────────────────────────────
function Footer() {
  return (
    <Box
      py="xl"
      style={{
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        background: "rgba(0, 0, 0, 0.3)",
      }}
    >
      <Container size="lg">
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Logo size="sm" />
            <Text c="dimmed" fz="xs">
              Built with excessive caffeine and unreasonable attention to detail.
            </Text>
          </Stack>
          <Group gap="xs">
            <Anchor c="dimmed" href="#" aria-label="Twitter">
              <IconBrandTwitter size={20} />
            </Anchor>
            <Anchor c="dimmed" href="#" aria-label="GitHub">
              <IconBrandGithub size={20} />
            </Anchor>
            <Anchor c="dimmed" href="#" aria-label="LinkedIn">
              <IconBrandLinkedin size={20} />
            </Anchor>
          </Group>
        </Group>
        <Text c="dimmed" fz="xs" ta="center" mt="xl" ff="monospace">
          &copy; {new Date().getFullYear()} man.dev — No segfaults were harmed in the making of this product.
        </Text>
      </Container>
    </Box>
  );
}

// ── Numbers Section ───────────────────────────────────────────────────
function Numbers() {
  const stats = [
    { value: "2,400+", label: "Developer Profiles" },
    { value: "180K+", label: "Profile Views" },
    { value: "89K+", label: "Link Clicks" },
    { value: "<50ms", label: "Avg Load Time" },
  ];

  return (
    <Box py={rem(60)} style={{ background: "rgba(0, 0, 0, 0.2)" }}>
      <Container size="md">
        <SimpleGrid cols={{ base: 2, md: 4 }}>
          {stats.map((stat) => (
            <Stack key={stat.label} align="center" gap={4}>
              <Text
                fz={{ base: rem(28), md: rem(36) }}
                fw={800}
                variant="gradient"
                gradient={{ from: "#00b4d8", to: "#48cae4" }}
              >
                {stat.value}
              </Text>
              <Text c="dimmed" fz="sm">
                {stat.label}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

// ── Directory CTA ────────────────────────────────────────────────────
function DirectoryCTA() {
  return (
    <Box py={rem(60)}>
      <Container size="sm" ta="center">
        <Stack align="center" gap="md">
          <Badge variant="light" color="cyan" size="lg">
            Developer Directory
          </Badge>
          <Title fz={{ base: rem(24), md: rem(32) }} fw={800}>
            Browse the community
          </Title>
          <Text c="dimmed" maw={400}>
            Discover developers by tech stack, availability, and expertise.
            Your next collaborator (or hire) is one search away.
          </Text>
          <Button
            variant="default"
            radius="xl"
            size="lg"
            component={Link}
            to="/directory"
            rightSection={<IconArrowRight size={18} />}
          >
            Browse Directory
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

// ── Email Waitlist ───────────────────────────────────────────────────
function EmailWaitlist() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // In production, POST to /api/waitlist
    setTimeout(() => {
      setLoading(false);
      setEmail("");
      notifications.show({
        title: "You're on the list!",
        message: "We'll notify you when new features drop. No spam, pinky promise.",
        color: "cyan",
      });
    }, 600);
  };

  return (
    <Box py={rem(60)} style={{ background: "rgba(0, 0, 0, 0.2)" }}>
      <Container size="xs" ta="center">
        <Stack align="center" gap="md">
          <ThemeIcon size={48} radius="xl" variant="light" color="cyan">
            <IconMail size={24} />
          </ThemeIcon>
          <Title fz={rem(24)} fw={800}>
            Stay in the loop
          </Title>
          <Text c="dimmed" fz="sm" maw={360}>
            Get notified about new themes, integrations, and features.
            We email less than your CI pipeline.
          </Text>
          <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 400 }}>
            <Group gap="xs" wrap="nowrap">
              <TextInput
                placeholder="dev@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                type="email"
                radius="xl"
                size="md"
                style={{ flex: 1 }}
                leftSection={<IconMail size={16} />}
                required
              />
              <Button
                type="submit"
                variant="gradient"
                gradient={{ from: "#0096c7", to: "#00b4d8" }}
                radius="xl"
                size="md"
                loading={loading}
                ff="monospace"
              >
                subscribe
              </Button>
            </Group>
          </form>
          <Text c="dimmed" fz="xs" ff="monospace">
            Unsubscribe anytime. We respect your /dev/null.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────
export default function Landing() {
  return (
    <Box>
      <Navbar />
      <Hero />
      <Features />
      <Numbers />
      <SocialProof />
      <DirectoryCTA />
      <PricingSection />
      <CTA />
      <EmailWaitlist />
      <Footer />
    </Box>
  );
}
