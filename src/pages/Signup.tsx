import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Anchor,
  Divider,
  Group,
  Box,
  Code,
  rem,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconBrandGoogle, IconBrandGithub } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";

export default function Signup() {
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
    },
    validate: {
      name: (v) => (v.length < 2 ? "Min 2 characters" : null),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : "Invalid email"),
      password: (v) => (v.length < 8 ? "Min 8 characters" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    await signup(values.name, values.email, values.password);
    navigate("/dashboard");
  };

  return (
    <Box
      mih="100vh"
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(0, 180, 216, 0.04) 0%, transparent 50%)",
      }}
    >
      <Navbar />
      <Container size={420} pt={rem(140)} pb={rem(60)}>
        <Stack align="center" mb="xl">
          <Logo />
          <Code fz="lg" ff="monospace" bg="transparent" c="cyan" fw={700}>
            man --init
          </Code>
          <Text c="dimmed" fz="sm" ta="center">
            Already have a man page?{" "}
            <Anchor component={Link} to="/login" c="cyan">
              man --login
            </Anchor>
          </Text>
        </Stack>

        <Paper
          radius="lg"
          p="xl"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Group grow>
                <Button
                  variant="default"
                  leftSection={<IconBrandGithub size={18} />}
                  radius="md"
                >
                  GitHub
                </Button>
                <Button
                  variant="default"
                  leftSection={<IconBrandGoogle size={18} />}
                  radius="md"
                >
                  Google
                </Button>
              </Group>

              <Divider label="or continue with email" labelPosition="center" color="dark.4" />

              <TextInput
                label="Name"
                placeholder="Ada Lovelace"
                radius="md"
                {...form.getInputProps("name")}
              />

              <TextInput
                label="Email"
                placeholder="dev@example.com"
                radius="md"
                {...form.getInputProps("email")}
              />

              <PasswordInput
                label="Password"
                placeholder="Min. 8 characters"
                radius="md"
                {...form.getInputProps("password")}
              />

              <Button
                type="submit"
                variant="gradient"
                gradient={{ from: "#0096c7", to: "#00b4d8" }}
                radius="md"
                size="md"
                fullWidth
                loading={isLoading}
              >
                Create Man Page
              </Button>

              <Text c="dimmed" fz="xs" ta="center">
                By signing up, you agree to our Terms of Service.
                We promise not to <Code fz="xs">rm -rf</Code> your data.
              </Text>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
