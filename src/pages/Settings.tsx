import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  Badge,
  Box,
  TextInput,
  PasswordInput,
  Divider,
  Code,
  ActionIcon,
  ThemeIcon,
  Paper,
  rem,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCheck,
  IconTerminal2,
  IconCrown,
  IconTrash,
  IconDownload,
  IconKey,
  IconMail,
  IconUser,
} from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { notifications } from "@mantine/notifications";
import Logo from "@/components/Logo";

function PlanCard({ isPro }: { isPro: boolean }) {
  if (isPro) {
    return (
      <Card
        padding="xl"
        radius="lg"
        style={{
          background: "rgba(0, 180, 216, 0.04)",
          border: "1px solid rgba(0, 180, 216, 0.2)",
        }}
      >
        <Group justify="space-between" mb="md">
          <Group>
            <ThemeIcon
              size={40}
              radius="md"
              variant="gradient"
              gradient={{ from: "#0096c7", to: "#00b4d8" }}
            >
              <IconTerminal2 size={20} />
            </ThemeIcon>
            <div>
              <Group gap="xs">
                <Code ff="monospace" bg="transparent" c="cyan" fw={700} fz="lg">
                  man -v
                </Code>
                <Badge variant="light" color="cyan" size="sm">
                  Active
                </Badge>
              </Group>
              <Text c="dimmed" fz="sm">
                Pro plan · $7/month
              </Text>
            </div>
          </Group>
          <Button variant="default" size="sm" radius="md">
            Manage Billing
          </Button>
        </Group>
        <Stack gap="xs">
          {[
            "Unlimited profiles & links",
            "Advanced analytics",
            "Custom domain support",
            "All themes + custom colors",
            "Project showcase",
            "No man.dev branding",
          ].map((f) => (
            <Group key={f} gap="xs">
              <IconCheck size={14} color="#00b4d8" />
              <Text fz="sm">{f}</Text>
            </Group>
          ))}
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      padding="xl"
      radius="lg"
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <Group justify="space-between" mb="md">
        <div>
          <Group gap="xs">
            <Code ff="monospace" bg="transparent" c="white" fw={700} fz="lg">
              man
            </Code>
            <Badge variant="default" size="sm">
              Free
            </Badge>
          </Group>
          <Text c="dimmed" fz="sm">
            1 profile · 5 links · Basic themes
          </Text>
        </div>
      </Group>

      <Card
        padding="lg"
        radius="md"
        mt="md"
        style={{
          background:
            "linear-gradient(135deg, rgba(0, 180, 216, 0.08) 0%, rgba(0, 150, 199, 0.04) 100%)",
          border: "1px solid rgba(0, 180, 216, 0.15)",
        }}
      >
        <Group justify="space-between">
          <div>
            <Text fw={700} fz="md">
              Upgrade to Pro
            </Text>
            <Text c="dimmed" fz="sm">
              Unlimited everything + analytics + custom domains
            </Text>
          </div>
          <div style={{ textAlign: "right" }}>
            <Text fw={800} fz={rem(24)}>
              $7
              <Text span fz="sm" fw={400} c="dimmed">
                /mo
              </Text>
            </Text>
            <Text c="dimmed" fz="xs">
              or $69/year
            </Text>
          </div>
        </Group>
        <Button
          variant="gradient"
          gradient={{ from: "#0096c7", to: "#00b4d8" }}
          radius="md"
          fullWidth
          mt="md"
          ff="monospace"
          size="md"
        >
          sudo upgrade
        </Button>
      </Card>
    </Card>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isPro = user?.plan === "pro";

  const handleSave = () => {
    notifications.show({
      title: "Settings saved",
      message: "Your changes have been applied.",
      color: "green",
    });
  };

  const handleExport = () => {
    notifications.show({
      title: "Export started",
      message: "Your data export will be ready shortly.",
      color: "cyan",
    });
  };

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
        <Container size="sm">
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
          </Group>
        </Container>
      </Box>

      <Container size="sm" py="xl">
        <Stack gap="xl">
          <Code fz={rem(24)} ff="monospace" bg="transparent" c="white" fw={800}>
            man --config
          </Code>

          {/* Plan */}
          <div>
            <Text fw={600} mb="md">
              Plan
            </Text>
            <PlanCard isPro={isPro} />
          </div>

          {/* Account */}
          <div>
            <Text fw={600} mb="md">
              Account
            </Text>
            <Card
              padding="lg"
              radius="lg"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <Stack gap="md">
                <TextInput
                  label="Name"
                  defaultValue={user?.name || ""}
                  leftSection={<IconUser size={16} />}
                  radius="md"
                />
                <TextInput
                  label="Email"
                  defaultValue={user?.email || ""}
                  leftSection={<IconMail size={16} />}
                  radius="md"
                />
                <Divider color="dark.4" />
                <PasswordInput
                  label="New Password"
                  placeholder="Leave blank to keep current"
                  leftSection={<IconKey size={16} />}
                  radius="md"
                />
                <PasswordInput
                  label="Confirm New Password"
                  placeholder="Repeat new password"
                  leftSection={<IconKey size={16} />}
                  radius="md"
                />
                <Button
                  variant="gradient"
                  gradient={{ from: "#0096c7", to: "#00b4d8" }}
                  radius="md"
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </Stack>
            </Card>
          </div>

          {/* Data */}
          <div>
            <Text fw={600} mb="md">
              Data
            </Text>
            <Card
              padding="lg"
              radius="lg"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Export Your Data</Text>
                  <Text c="dimmed" fz="sm">
                    Download all your profiles, links, and analytics as JSON.
                  </Text>
                </div>
                <Button
                  variant="default"
                  leftSection={<IconDownload size={16} />}
                  radius="md"
                  onClick={handleExport}
                >
                  Export
                </Button>
              </Group>
            </Card>
          </div>

          {/* Danger Zone */}
          <div>
            <Text fw={600} mb="md" c="red">
              Danger Zone
            </Text>
            <Card
              padding="lg"
              radius="lg"
              style={{
                background: "rgba(255, 0, 0, 0.02)",
                border: "1px solid rgba(255, 0, 0, 0.15)",
              }}
            >
              <Group justify="space-between">
                <div>
                  <Text fw={500}>Delete Account</Text>
                  <Text c="dimmed" fz="sm">
                    Permanently delete your account and all data. This is irreversible.
                    <br />
                    <Text span ff="monospace" fz="xs" c="red">
                      rm -rf /account --no-preserve-root
                    </Text>
                  </Text>
                </div>
                <Button
                  variant="outline"
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  radius="md"
                >
                  Delete Account
                </Button>
              </Group>
            </Card>
          </div>
        </Stack>
      </Container>
    </Box>
  );
}
