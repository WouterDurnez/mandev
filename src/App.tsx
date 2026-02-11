import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "@/context/AuthContext";
import { Box, Loader, Stack, Text } from "@mantine/core";

// Eager load landing (most common entry point)
import Landing from "@/pages/Landing";

// Lazy load everything else
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Editor = lazy(() => import("@/pages/Editor"));
const Profile = lazy(() => import("@/pages/Profile"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Directory = lazy(() => import("@/pages/Directory"));
const Settings = lazy(() => import("@/pages/Settings"));
const Hiring = lazy(() => import("@/pages/Hiring"));

function LoadingFallback() {
  return (
    <Box mih="100vh" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Stack align="center" gap="sm">
        <Loader color="cyan" size="sm" type="dots" />
        <Text fz="xs" c="dimmed" ff="monospace">
          Loading...
        </Text>
      </Stack>
    </Box>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/hiring" element={<Hiring />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:pageId"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics/:profileId"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="/:slug" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}
