import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Spacer,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { FiActivity, FiHome } from "react-icons/fi";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthProvider";
import LanguageToggle from "./components/LanguageToggle";
import ProfileSwitcher from "./components/ProfileSwitcher";
import { useI18n } from "./i18n";
import AuthCallback from "./pages/AuthCallback";
import ExpertMode from "./pages/ExpertMode";
import SimpleMode from "./pages/SimpleMode";

const AppHeader = () => {
  const { isAuthenticated, user, login, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isExpert = location.pathname.startsWith("/expert");
  const { t } = useI18n();

  return (
    <Flex py={4} align="center" gap={4}>
      <Heading size="md" color="brand.700">
        pH Tracker
      </Heading>
      <Spacer />
      <LanguageToggle />
      {isAuthenticated && <ProfileSwitcher />}
      <Button
        size="sm"
        variant={isAuthenticated ? "outline" : "solid"}
        onClick={() =>
          isAuthenticated ? logout() : login({ redirectPath: location.pathname || "/" })
        }
        isLoading={isLoading}
      >
        {isAuthenticated ? user?.email || "Sign out" : "Sign in"}
      </Button>
      <HStack spacing={2}>
        <IconButton
          aria-label={t("ariaSimple")}
          icon={<FiHome />}
          variant={isExpert ? "outline" : "solid"}
          onClick={() => navigate("/")}
        />
        <IconButton
          aria-label={t("ariaExpert")}
          icon={<FiActivity />}
          variant={isExpert ? "solid" : "outline"}
          onClick={() => navigate("/expert")}
        />
      </HStack>
    </Flex>
  );
};

const App = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const location = useLocation();

  if (location.pathname === "/callback") {
    return (
      <Box minH="100vh">
        <Container maxW="container.md" py={4}>
          <AuthCallback />
        </Container>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Stack align="center" justify="center" minH="60vh" spacing={4}>
        <Spinner size="lg" />
        <Text>Loading...</Text>
      </Stack>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box minH="100vh">
        <Container maxW="container.md" py={16}>
          <Stack spacing={6} align="flex-start">
            <Heading>pH Tracker</Heading>
            <Text maxW="xl" fontSize="lg">
              Sign in to track pH logs, manage profiles, and sync data securely.
            </Text>
            <Button
              colorScheme="blue"
              size="lg"
              onClick={() => login({ redirectPath: location.pathname || "/" })}
            >
              Sign in with Cognito
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh">
      <Container maxW="container.md" py={4}>
        <AppHeader />
        <Routes>
          <Route path="/" element={<SimpleMode />} />
          <Route path="/expert" element={<ExpertMode />} />
          <Route path="*" element={<SimpleMode />} />
        </Routes>
      </Container>
    </Box>
  );
};

export default App;
