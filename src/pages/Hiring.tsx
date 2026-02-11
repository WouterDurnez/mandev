import {
  Container,
  Box,
  Title,
  Text,
  Button,
  Group,
  Stack,
  SimpleGrid,
  Card,
  Badge,
  ThemeIcon,
  TextInput,
  Code,
  rem,
} from "@mantine/core";
import {
  IconSearch,
  IconFilter,
  IconBriefcase,
  IconMail,
  IconUsers,
  IconChartBar,
  IconShieldCheck,
  IconArrowRight,
  IconTerminal2,
  IconWorld,
} from "@tabler/icons-react";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";

const RECRUITER_FEATURES = [
  {
    icon: IconSearch,
    title: "Search by Stack",
    description: "Filter developers by exact tech stack. Find someone who knows Rust AND PostgreSQL AND Kubernetes, not just one of them.",
  },
  {
    icon: IconFilter,
    title: "Availability Filter",
    description: "Only see developers who are actively open to work. No more messaging people who aren't looking.",
  },
  {
    icon: IconUsers,
    title: "Verified Profiles",
    description: "GitHub-connected profiles with real contributions, real repos, and real stars. No embellished resumes.",
  },
  {
    icon: IconChartBar,
    title: "Engagement Analytics",
    description: "See which developers are actively maintaining their profiles. Active profiles mean active candidates.",
  },
  {
    icon: IconMail,
    title: "Direct Outreach",
    description: "Send intro requests directly through the platform. Developers choose to respond — no cold email spam.",
  },
  {
    icon: IconShieldCheck,
    title: "Endorsement Data",
    description: "Read peer endorsements from real colleagues. Better signal than self-reported skills on a resume.",
  },
];

const PRICING_TIERS = [
  {
    name: "Startup",
    price: "$49",
    period: "/month",
    description: "For small teams hiring occasionally",
    features: [
      "5 developer searches/day",
      "10 intro requests/month",
      "Stack-based filtering",
      "Availability filter",
      "Email support",
    ],
  },
  {
    name: "Team",
    price: "$149",
    period: "/month",
    description: "For growing companies",
    features: [
      "Unlimited searches",
      "50 intro requests/month",
      "Advanced filters",
      "Endorsement access",
      "Analytics dashboard",
      "Team seat (3 users)",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For agencies and large teams",
    features: [
      "Everything in Team",
      "Unlimited intro requests",
      "API access",
      "ATS integration",
      "Dedicated account manager",
      "Custom contract",
    ],
  },
];

export default function Hiring() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setEmail("");
      notifications.show({
        title: "You're on the list!",
        message: "We'll reach out when recruiter access is ready.",
        color: "cyan",
      });
    }, 600);
  };

  return (
    <Box mih="100vh">
      <Navbar />

      {/* Hero */}
      <Box
        pt={rem(140)}
        pb={rem(80)}
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(0, 180, 216, 0.06) 0%, transparent 60%)",
          position: "relative",
        }}
      >
        <Container size="md">
          <Stack align="center" gap="lg">
            <Badge
              size="lg"
              variant="gradient"
              gradient={{ from: "#0096c7", to: "#00b4d8" }}
              leftSection={<IconBriefcase size={14} />}
              style={{ textTransform: "none" }}
            >
              Coming Soon
            </Badge>

            <Title
              ta="center"
              fz={{ base: rem(36), md: rem(52) }}
              fw={800}
              lh={1.1}
            >
              Hire developers who{" "}
              <Text
                span
                inherit
                variant="gradient"
                gradient={{ from: "#00b4d8", to: "#48cae4" }}
              >
                actually ship
              </Text>
            </Title>

            <Text ta="center" fz="xl" c="dimmed" maw={560} lh={1.6}>
              Search verified developer profiles by tech stack, availability,
              and peer endorsements. No more guessing from resumes.
            </Text>

            {/* Waitlist Form */}
            <Card
              padding="xl"
              radius="xl"
              mt="md"
              w="100%"
              maw={500}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <form onSubmit={handleWaitlist}>
                <Stack gap="md">
                  <Text fw={600} ta="center">
                    Get early access
                  </Text>
                  <TextInput
                    placeholder="hiring@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    type="email"
                    radius="md"
                    size="md"
                    leftSection={<IconMail size={16} />}
                    required
                  />
                  <Button
                    type="submit"
                    variant="gradient"
                    gradient={{ from: "#0096c7", to: "#00b4d8" }}
                    radius="md"
                    size="md"
                    loading={loading}
                    fullWidth
                  >
                    Join the Waitlist
                  </Button>
                  <Text fz="xs" c="dimmed" ta="center">
                    We'll notify you when recruiter access launches.
                    No spam, obviously.
                  </Text>
                </Stack>
              </form>
            </Card>
          </Stack>
        </Container>
      </Box>

      {/* Stats */}
      <Box py={rem(40)} style={{ background: "rgba(0, 0, 0, 0.2)" }}>
        <Container size="md">
          <SimpleGrid cols={{ base: 2, md: 4 }}>
            {[
              { value: "2,400+", label: "Developer Profiles" },
              { value: "850+", label: "Open to Work" },
              { value: "180+", label: "Tech Stacks" },
              { value: "4,200+", label: "Endorsements" },
            ].map((stat) => (
              <Stack key={stat.label} align="center" gap={4}>
                <Text
                  fz={rem(28)}
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

      {/* Features */}
      <Box py={rem(80)}>
        <Container size="lg">
          <Stack align="center" gap="xs" mb={rem(60)}>
            <Badge variant="light" color="cyan" size="lg">
              Features
            </Badge>
            <Title ta="center" fz={{ base: rem(28), md: rem(36) }} fw={800}>
              Better signal, less noise
            </Title>
            <Text ta="center" c="dimmed" maw={460} fz="md">
              Every profile is backed by GitHub data, real projects, and peer endorsements.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
            {RECRUITER_FEATURES.map((f) => (
              <Card
                key={f.title}
                padding="xl"
                radius="lg"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <ThemeIcon size={48} radius="md" variant="light" color="cyan" mb="md">
                  <f.icon size={24} />
                </ThemeIcon>
                <Text fw={600} fz="md" mb={8}>
                  {f.title}
                </Text>
                <Text c="dimmed" fz="sm" lh={1.6}>
                  {f.description}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Pricing Preview */}
      <Box py={rem(80)} style={{ background: "rgba(0, 0, 0, 0.2)" }}>
        <Container size="lg">
          <Stack align="center" gap="xs" mb={rem(60)}>
            <Badge variant="light" color="cyan" size="lg">
              Pricing
            </Badge>
            <Title ta="center" fz={{ base: rem(28), md: rem(36) }} fw={800}>
              Plans for every team size
            </Title>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
            {PRICING_TIERS.map((tier) => (
              <Card
                key={tier.name}
                padding="xl"
                radius="lg"
                style={{
                  background: tier.popular
                    ? "rgba(0, 180, 216, 0.04)"
                    : "rgba(255, 255, 255, 0.02)",
                  border: tier.popular
                    ? "1px solid rgba(0, 180, 216, 0.2)"
                    : "1px solid rgba(255, 255, 255, 0.06)",
                  position: "relative",
                }}
              >
                {tier.popular && (
                  <Badge
                    variant="gradient"
                    gradient={{ from: "#0096c7", to: "#00b4d8" }}
                    size="sm"
                    style={{ position: "absolute", top: -10, right: 16 }}
                  >
                    Most Popular
                  </Badge>
                )}
                <Stack gap="md">
                  <div>
                    <Text fw={700} fz="lg">
                      {tier.name}
                    </Text>
                    <Text c="dimmed" fz="sm">
                      {tier.description}
                    </Text>
                  </div>
                  <Group align="end" gap={4}>
                    <Text fz={rem(36)} fw={800} lh={1}>
                      {tier.price}
                    </Text>
                    {tier.period && (
                      <Text c="dimmed" fz="sm" mb={4}>
                        {tier.period}
                      </Text>
                    )}
                  </Group>
                  <Stack gap="xs">
                    {tier.features.map((f) => (
                      <Group key={f} gap="xs">
                        <Box w={6} h={6} style={{ borderRadius: "50%", background: "#00b4d8" }} />
                        <Text fz="sm">{f}</Text>
                      </Group>
                    ))}
                  </Stack>
                  <Button
                    variant={tier.popular ? "gradient" : "default"}
                    gradient={{ from: "#0096c7", to: "#00b4d8" }}
                    radius="md"
                    fullWidth
                    mt="sm"
                    onClick={() => {
                      const el = document.getElementById("waitlist-bottom");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Join Waitlist
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Bottom CTA */}
      <Box py={rem(80)} id="waitlist-bottom">
        <Container size="sm">
          <Card
            padding={rem(48)}
            radius="xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 180, 216, 0.08) 0%, rgba(0, 150, 199, 0.04) 100%)",
              border: "1px solid rgba(0, 180, 216, 0.15)",
              textAlign: "center",
            }}
          >
            <Stack align="center" gap="md">
              <Code fz={rem(24)} ff="monospace" bg="transparent" c="cyan" fw={800}>
                $ man --hire
              </Code>
              <Title fz={rem(28)} fw={800}>
                Stop scrolling LinkedIn
              </Title>
              <Text c="dimmed" fz="md" maw={380}>
                Get early access to the developer hiring platform built on real
                code, real contributions, and real endorsements.
              </Text>
              <form
                onSubmit={handleWaitlist}
                style={{ width: "100%", maxWidth: 400 }}
              >
                <Group gap="xs" wrap="nowrap">
                  <TextInput
                    placeholder="hiring@company.com"
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
                  >
                    Join
                  </Button>
                </Group>
              </form>
            </Stack>
          </Card>
        </Container>
      </Box>

      {/* Footer */}
      <Box py="xl" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Logo size="sm" />
            <Text c="dimmed" fz="xs" ff="monospace">
              &copy; {new Date().getFullYear()} man.dev
            </Text>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
