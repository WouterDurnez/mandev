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
  Divider,
  Code,
  ThemeIcon,
  Accordion,
  rem,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconTerminal2,
  IconArrowRight,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";

const COMPARISON = [
  { feature: "Profile pages", free: "1", pro: "Unlimited" },
  { feature: "Links per profile", free: "5", pro: "Unlimited" },
  { feature: "GitHub integration", free: true, pro: true },
  { feature: "Tech stack badges", free: true, pro: true },
  { feature: "Dev themes", free: "6 themes", pro: "All + custom colors" },
  { feature: "Profile analytics", free: false, pro: true },
  { feature: "Custom domain", free: false, pro: true },
  { feature: "Project showcase", free: false, pro: true },
  { feature: "Endorsements", free: false, pro: true },
  { feature: "Open to Work badge", free: true, pro: true },
  { feature: "QR code sharing", free: true, pro: true },
  { feature: "README badge embed", free: true, pro: true },
  { feature: "Remove man.dev branding", free: false, pro: true },
  { feature: "Priority support", free: false, pro: true },
  { feature: "Blog feed integration", free: false, pro: true },
];

const FAQ = [
  {
    q: "Can I really use man.dev for free?",
    a: "Yes. The free plan is free forever — no trial, no credit card. You get a profile page, 5 links, GitHub integration, and all 6 dev themes. It's everything you need to get started.",
  },
  {
    q: "What happens to my profile if I downgrade from Pro?",
    a: "Your data stays safe. If you have multiple profiles, only the first one stays published. Extra links beyond 5 get hidden (not deleted). You can always upgrade again to restore everything.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes, with the Pro plan. Just add a CNAME record pointing to profiles.man.dev, and we handle the rest — SSL, routing, everything. Your custom domain works within minutes.",
  },
  {
    q: "How does the GitHub integration work?",
    a: "Connect your GitHub account and we auto-import your pinned repositories, star counts, and contribution data. It stays synced automatically. No manual updates needed.",
  },
  {
    q: "Is there a team or company plan?",
    a: "Not yet, but we're building a recruiter/hiring layer. If you're interested in bulk profiles for your team or hiring access, reach out — we'd love to talk.",
  },
  {
    q: "What's the refund policy?",
    a: "We offer a full refund within the first 14 days, no questions asked. After that, you can cancel anytime and your Pro features remain active until the end of your billing period.",
  },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <IconCheck size={18} color="#00b4d8" />
    ) : (
      <IconX size={18} color="var(--mantine-color-dimmed)" style={{ opacity: 0.3 }} />
    );
  }
  return <Text fz="sm">{value}</Text>;
}

export default function Pricing() {
  return (
    <Box mih="100vh">
      <Navbar />

      <Container size="md" pt={rem(120)} pb={rem(80)}>
        <Stack align="center" gap="xs" mb={rem(60)}>
          <Badge variant="light" color="cyan" size="lg" leftSection={<IconTerminal2 size={14} />}>
            Pricing
          </Badge>
          <Title ta="center" fz={{ base: rem(36), md: rem(52) }} fw={800}>
            Simple as{" "}
            <Code fz={{ base: rem(32), md: rem(48) }} ff="monospace" bg="transparent" c="cyan" fw={800}>
              --help
            </Code>
          </Title>
          <Text ta="center" c="dimmed" maw={440} fz="lg">
            Start free. Upgrade when you need more flags.
            No hidden fees. No surprise charges.
          </Text>
        </Stack>

        {/* Pricing Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" mb={rem(80)}>
          {/* Free Tier */}
          <Card padding="xl" radius="lg" style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}>
            <Stack gap="md">
              <div>
                <Code fz="xl" ff="monospace" bg="transparent" c="white" fw={700}>man</Code>
                <Text c="dimmed" fz="sm">The essentials</Text>
              </div>
              <div>
                <Text fz={rem(56)} fw={800} lh={1}>$0</Text>
                <Text c="dimmed" fz="sm">forever</Text>
              </div>
              <Divider color="dark.4" />
              <Stack gap="xs">
                {[
                  "1 profile page",
                  "5 links",
                  "GitHub integration",
                  "6 dev themes",
                  "Tech stack badges",
                  "Open to Work badge",
                  "QR code sharing",
                  "man.dev/you branding",
                ].map((f) => (
                  <Group key={f} gap="xs">
                    <IconCheck size={16} color="#00b4d8" />
                    <Text fz="sm">{f}</Text>
                  </Group>
                ))}
              </Stack>
              <Button variant="default" size="lg" radius="xl" fullWidth
                component={Link} to="/signup" mt="sm" ff="monospace">
                man --init
              </Button>
            </Stack>
          </Card>

          {/* Pro Tier */}
          <Card padding="xl" radius="lg" style={{
            background: "rgba(0, 180, 216, 0.04)",
            border: "1px solid rgba(0, 180, 216, 0.2)",
            position: "relative",
            overflow: "visible",
          }}>
            <Badge variant="gradient" gradient={{ from: "#0096c7", to: "#00b4d8" }}
              size="lg" leftSection={<IconTerminal2 size={14} />}
              style={{ position: "absolute", top: -12, right: 20, textTransform: "none" }}>
              sudo mode
            </Badge>
            <Stack gap="md">
              <div>
                <Code fz="xl" ff="monospace" bg="transparent" c="cyan" fw={700}>man -v</Code>
                <Text c="dimmed" fz="sm">Verbose mode — everything unlocked</Text>
              </div>
              <div>
                <Group align="end" gap={4}>
                  <Text fz={rem(56)} fw={800} lh={1}>$7</Text>
                  <Text c="dimmed" fz="md" mb={6}>/month</Text>
                </Group>
                <Text c="dimmed" fz="sm">or $69/year (nice.)</Text>
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
                  "Endorsements",
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
              <Button variant="gradient" gradient={{ from: "#0096c7", to: "#00b4d8" }}
                size="lg" radius="xl" fullWidth component={Link} to="/signup"
                mt="sm" ff="monospace"
                style={{ boxShadow: "0 4px 20px rgba(0, 180, 216, 0.15)" }}>
                sudo man --init
              </Button>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Feature Comparison Table */}
        <Stack gap="xl" mb={rem(80)}>
          <Title ta="center" fz={rem(28)} fw={800}>
            Feature Comparison
          </Title>

          <Card radius="lg" padding={0} style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            overflow: "hidden",
          }}>
            {/* Header */}
            <Group px="lg" py="md" style={{
              background: "rgba(255, 255, 255, 0.03)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            }}>
              <Text fw={600} fz="sm" style={{ flex: 1 }}>Feature</Text>
              <Text fw={600} fz="sm" ta="center" w={120}>
                <Code ff="monospace" bg="transparent" c="white" fw={600}>man</Code>
              </Text>
              <Text fw={600} fz="sm" ta="center" w={120}>
                <Code ff="monospace" bg="transparent" c="cyan" fw={600}>man -v</Code>
              </Text>
            </Group>

            {/* Rows */}
            {COMPARISON.map((row, i) => (
              <Group key={row.feature} px="lg" py="sm" style={{
                borderBottom: i < COMPARISON.length - 1 ? "1px solid rgba(255, 255, 255, 0.03)" : undefined,
              }}>
                <Text fz="sm" style={{ flex: 1 }}>{row.feature}</Text>
                <Box w={120} ta="center" style={{ display: "flex", justifyContent: "center" }}>
                  <FeatureCell value={row.free} />
                </Box>
                <Box w={120} ta="center" style={{ display: "flex", justifyContent: "center" }}>
                  <FeatureCell value={row.pro} />
                </Box>
              </Group>
            ))}
          </Card>
        </Stack>

        {/* FAQ */}
        <Stack gap="xl" mb={rem(60)}>
          <Stack align="center" gap="xs">
            <Badge variant="light" color="cyan" size="lg">FAQ</Badge>
            <Title ta="center" fz={rem(28)} fw={800}>
              Frequently Asked Questions
            </Title>
          </Stack>

          <Accordion
            variant="separated"
            radius="lg"
            styles={{
              item: {
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              },
            }}
          >
            {FAQ.map((item) => (
              <Accordion.Item key={item.q} value={item.q}>
                <Accordion.Control>
                  <Text fw={600} fz="sm">{item.q}</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text fz="sm" c="dimmed" lh={1.7}>{item.a}</Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Stack>

        {/* Bottom CTA */}
        <Card padding={rem(48)} radius="xl" style={{
          background: "linear-gradient(135deg, rgba(0, 180, 216, 0.08) 0%, rgba(0, 150, 199, 0.04) 100%)",
          border: "1px solid rgba(0, 180, 216, 0.15)",
          textAlign: "center",
        }}>
          <Stack align="center" gap="md">
            <Code fz={rem(28)} ff="monospace" bg="transparent" c="cyan" fw={800}>
              $ man --init
            </Code>
            <Text c="dimmed" fz="md" maw={360}>
              Start building your developer man page today. Free forever, upgrade anytime.
            </Text>
            <Button size="lg" variant="gradient" gradient={{ from: "#0096c7", to: "#00b4d8" }}
              radius="xl" rightSection={<IconArrowRight size={20} />}
              component={Link} to="/signup" ff="monospace"
              style={{ boxShadow: "0 8px 32px rgba(0, 180, 216, 0.2)" }}>
              Get Started Free
            </Button>
          </Stack>
        </Card>
      </Container>

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
