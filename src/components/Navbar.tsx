import { Group, Button, Container, Box, Badge } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Logo from "./Logo";

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <Box
      component="nav"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backdropFilter: "blur(16px)",
        background: "rgba(20, 21, 23, 0.85)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <Container size="lg" py="sm">
        <Group justify="space-between">
          <Link to="/" style={{ textDecoration: "none" }}>
            <Logo size="sm" />
          </Link>

          <Group gap="sm">
            {isAuthenticated ? (
              <Button
                variant="gradient"
                gradient={{ from: "#0096c7", to: "#00b4d8" }}
                onClick={() => navigate("/dashboard")}
                radius="xl"
                ff="monospace"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="subtle"
                  color="gray"
                  component={Link}
                  to="/directory"
                  radius="xl"
                >
                  Directory
                </Button>
                <Button
                  variant="subtle"
                  color="gray"
                  component={Link}
                  to="/pricing"
                  radius="xl"
                >
                  Pricing
                </Button>
                <Button
                  variant="subtle"
                  color="gray"
                  component={Link}
                  to="/hiring"
                  radius="xl"
                  rightSection={<Badge size="xs" variant="gradient" gradient={{ from: "#0096c7", to: "#00b4d8" }}>New</Badge>}
                >
                  For Recruiters
                </Button>
                <Button
                  variant="subtle"
                  color="gray"
                  component={Link}
                  to="/login"
                  radius="xl"
                  ff="monospace"
                >
                  man --login
                </Button>
                <Button
                  variant="gradient"
                  gradient={{ from: "#0096c7", to: "#00b4d8" }}
                  component={Link}
                  to="/signup"
                  radius="xl"
                  ff="monospace"
                >
                  man --init
                </Button>
              </>
            )}
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
