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
  TextInput,
  MultiSelect,
  Switch,
  Paper,
  Anchor,
  rem,
} from "@mantine/core";
import {
  IconSearch,
  IconBrandGithub,
  IconExternalLink,
  IconBriefcase,
  IconFilter,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { TECH_STACK_OPTIONS } from "@/types";

interface DirectoryDev {
  username: string;
  displayName: string;
  title: string;
  bio: string;
  techStack: string[];
  openToWork: boolean;
  views: number;
  githubUsername: string;
}

// Demo directory data
const DIRECTORY_DEVS: DirectoryDev[] = [
  {
    username: "janedev",
    displayName: "Jane Doe",
    title: "Full Stack Developer",
    bio: "Building things that matter with TypeScript and Rust.",
    techStack: ["TypeScript", "React", "Rust", "PostgreSQL", "Docker"],
    openToWork: true,
    views: 1247,
    githubUsername: "janedoe",
  },
  {
    username: "alexcodes",
    displayName: "Alex Chen",
    title: "Senior Frontend Engineer",
    bio: "Design systems, accessibility, and React performance.",
    techStack: ["React", "TypeScript", "Next.js", "Tailwind", "Figma"],
    openToWork: false,
    views: 892,
    githubUsername: "alexchen",
  },
  {
    username: "sambuilds",
    displayName: "Sam Rivera",
    title: "Backend Engineer",
    bio: "Distributed systems and database optimization enthusiast.",
    techStack: ["Go", "PostgreSQL", "Kubernetes", "Redis", "gRPC"],
    openToWork: true,
    views: 634,
    githubUsername: "samrivera",
  },
  {
    username: "jordandev",
    displayName: "Jordan Patel",
    title: "DevOps Engineer",
    bio: "Infrastructure as code. Making deploys boring since 2019.",
    techStack: ["Terraform", "AWS", "Docker", "Kubernetes", "Python"],
    openToWork: false,
    views: 521,
    githubUsername: "jordanpatel",
  },
  {
    username: "morganrust",
    displayName: "Morgan Lee",
    title: "Systems Programmer",
    bio: "Rust evangelist. Zero-cost abstractions are my love language.",
    techStack: ["Rust", "C++", "Linux", "WebAssembly", "Zig"],
    openToWork: true,
    views: 445,
    githubUsername: "morganlee",
  },
  {
    username: "taylorml",
    displayName: "Taylor Kim",
    title: "ML Engineer",
    bio: "Making machines learn things. Sometimes they even learn the right things.",
    techStack: ["Python", "PyTorch", "Docker", "PostgreSQL", "FastAPI"],
    openToWork: false,
    views: 389,
    githubUsername: "taylorkim",
  },
  {
    username: "caseyios",
    displayName: "Casey Nguyen",
    title: "iOS Developer",
    bio: "SwiftUI enthusiast. Pixel-perfect or bust.",
    techStack: ["Swift", "iOS", "SwiftUI", "Firebase", "Figma"],
    openToWork: true,
    views: 312,
    githubUsername: "caseynguyen",
  },
  {
    username: "rileyapi",
    displayName: "Riley Thompson",
    title: "API Engineer",
    bio: "REST is best but GraphQL has its moments. Building developer tools.",
    techStack: ["Node.js", "TypeScript", "GraphQL", "PostgreSQL", "Redis"],
    openToWork: false,
    views: 278,
    githubUsername: "rileythompson",
  },
];

function DevCard({ dev }: { dev: DirectoryDev }) {
  const initials = dev.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <Card
      padding="lg"
      radius="lg"
      component={Link}
      to={`/${dev.username}`}
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(0, 180, 216, 0.2)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <Group mb="sm">
        <Avatar color="cyan" radius="xl" size="md">
          {initials}
        </Avatar>
        <div style={{ flex: 1 }}>
          <Group gap="xs">
            <Text fw={600} fz="md">
              {dev.displayName}
            </Text>
            {dev.openToWork && (
              <Badge size="xs" color="green" variant="light">
                open to work
              </Badge>
            )}
          </Group>
          <Text c="dimmed" fz="xs">
            {dev.title}
          </Text>
        </div>
        <IconExternalLink size={16} color="var(--mantine-color-dimmed)" />
      </Group>

      <Text c="dimmed" fz="sm" lh={1.5} mb="sm" lineClamp={2}>
        {dev.bio}
      </Text>

      <Group gap={4}>
        {dev.techStack.slice(0, 4).map((t) => (
          <Badge key={t} size="xs" variant="light" color="cyan" radius="sm" ff="monospace">
            {t}
          </Badge>
        ))}
        {dev.techStack.length > 4 && (
          <Badge size="xs" variant="default" radius="sm">
            +{dev.techStack.length - 4}
          </Badge>
        )}
      </Group>

      <Text c="dimmed" fz="xs" mt="sm" ff="monospace">
        man.dev/{dev.username}
      </Text>
    </Card>
  );
}

export default function Directory() {
  const [search, setSearch] = useState("");
  const [techFilter, setTechFilter] = useState<string[]>([]);
  const [openToWorkOnly, setOpenToWorkOnly] = useState(false);

  const filteredDevs = useMemo(() => {
    return DIRECTORY_DEVS.filter((dev) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch =
          dev.displayName.toLowerCase().includes(q) ||
          dev.title.toLowerCase().includes(q) ||
          dev.bio.toLowerCase().includes(q) ||
          dev.username.toLowerCase().includes(q) ||
          dev.techStack.some((t) => t.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Tech stack filter
      if (techFilter.length > 0) {
        const hasTech = techFilter.some((t) => dev.techStack.includes(t));
        if (!hasTech) return false;
      }

      // Open to work filter
      if (openToWorkOnly && !dev.openToWork) return false;

      return true;
    });
  }, [search, techFilter, openToWorkOnly]);

  return (
    <Box mih="100vh">
      <Navbar />

      <Box
        pt={rem(120)}
        pb={rem(60)}
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(0, 180, 216, 0.04) 0%, transparent 50%)",
        }}
      >
        <Container size="lg">
          <Stack align="center" gap="md" mb={rem(40)}>
            <Badge variant="light" color="cyan" size="lg">
              Developer Directory
            </Badge>
            <Title ta="center" fz={{ base: rem(32), md: rem(42) }} fw={800}>
              Find developers who{" "}
              <Text span inherit c="cyan">
                ship
              </Text>
            </Title>
            <Text ta="center" c="dimmed" maw={480} fz="lg">
              Browse developer profiles by stack, skills, and availability.
              Every profile is a man page worth reading.
            </Text>
          </Stack>

          {/* Filters */}
          <Card
            padding="lg"
            radius="lg"
            mb="xl"
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <Group align="end" gap="md" wrap="wrap">
              <TextInput
                placeholder="Search developers, skills, titles..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                radius="md"
                style={{ flex: 1, minWidth: 200 }}
              />
              <MultiSelect
                data={TECH_STACK_OPTIONS.slice(0, 30)}
                value={techFilter}
                onChange={setTechFilter}
                placeholder="Filter by stack"
                searchable
                radius="md"
                w={280}
                maxValues={5}
                leftSection={<IconFilter size={16} />}
              />
              <Switch
                label="Open to work"
                checked={openToWorkOnly}
                onChange={(e) => setOpenToWorkOnly(e.target.checked)}
                color="green"
              />
            </Group>
          </Card>

          {/* Results */}
          <Group justify="space-between" mb="md">
            <Text c="dimmed" fz="sm">
              {filteredDevs.length} developer{filteredDevs.length !== 1 ? "s" : ""} found
            </Text>
          </Group>

          {filteredDevs.length === 0 ? (
            <Paper
              p={rem(60)}
              radius="lg"
              ta="center"
              style={{
                background: "rgba(0, 180, 216, 0.02)",
                border: "1px dashed rgba(0, 180, 216, 0.15)",
              }}
            >
              <Stack align="center" gap="sm">
                <Text ff="monospace" fz="lg" c="dimmed">
                  grep: no matches found
                </Text>
                <Text c="dimmed" fz="sm">
                  No developers match your filters. Try broadening your search.
                </Text>
              </Stack>
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {filteredDevs.map((dev) => (
                <DevCard key={dev.username} dev={dev} />
              ))}
            </SimpleGrid>
          )}

          {/* CTA */}
          <Card
            padding="xl"
            radius="xl"
            mt={rem(60)}
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 180, 216, 0.06) 0%, rgba(0, 150, 199, 0.03) 100%)",
              border: "1px solid rgba(0, 180, 216, 0.12)",
              textAlign: "center",
            }}
          >
            <Stack align="center" gap="sm">
              <Text fw={700} fz="lg">
                Want to be listed here?
              </Text>
              <Text c="dimmed" fz="sm">
                Create your man page and join the developer directory.
              </Text>
              <Button
                variant="gradient"
                gradient={{ from: "#0096c7", to: "#00b4d8" }}
                radius="xl"
                component={Link}
                to="/signup"
                ff="monospace"
                mt="xs"
              >
                man --init
              </Button>
            </Stack>
          </Card>
        </Container>
      </Box>
    </Box>
  );
}
