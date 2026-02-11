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

export default function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : "Invalid email"),
      password: (v) => (v.length < 6 ? "Min 6 characters" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    await login(values.email, values.password);
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
            man --login
          </Code>
          <Text c="dimmed" fz="sm" ta="center">
            Don't have an account?{" "}
            <Anchor component={Link} to="/signup" c="cyan">
              man --init
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
                label="Email"
                placeholder="dev@example.com"
                radius="md"
                {...form.getInputProps("email")}
              />

              <PasswordInput
                label="Password"
                placeholder="••••••••"
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
                Log In
              </Button>
            </Stack>
          </form>
        </Paper>

        <Text c="dimmed" fz="xs" ta="center" mt="lg">
          Forgot your password? Happens to the best of us.{" "}
          <Anchor c="cyan" href="#">
            Reset it
          </Anchor>
          .
        </Text>
      </Container>
    </Box>
  );
}
