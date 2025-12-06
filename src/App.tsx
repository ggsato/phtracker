import { Box, Container, Flex, Heading, HStack, IconButton, Spacer } from "@chakra-ui/react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { FiActivity, FiHome } from "react-icons/fi";
import SimpleMode from "./pages/SimpleMode";
import ExpertMode from "./pages/ExpertMode";
import ProfileSwitcher from "./components/ProfileSwitcher";

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isExpert = location.pathname.startsWith("/expert");

  return (
    <Flex py={4} align="center" gap={4}>
      <Heading size="md" color="brand.700">
        pH Tracker
      </Heading>
      <Spacer />
      <ProfileSwitcher />
      <HStack spacing={2}>
        <IconButton
          aria-label="Simple mode"
          icon={<FiHome />}
          variant={isExpert ? "outline" : "solid"}
          onClick={() => navigate("/")}
        />
        <IconButton
          aria-label="Expert mode"
          icon={<FiActivity />}
          variant={isExpert ? "solid" : "outline"}
          onClick={() => navigate("/expert")}
        />
      </HStack>
    </Flex>
  );
};

const App = () => {
  return (
    <Box minH="100vh">
      <Container maxW="container.md" py={4}>
        <AppHeader />
        <Routes>
          <Route path="/" element={<SimpleMode />} />
          <Route path="/expert" element={<ExpertMode />} />
        </Routes>
      </Container>
    </Box>
  );
};

export default App;
