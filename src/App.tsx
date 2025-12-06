import { Box, Container, Flex, Heading, HStack, IconButton, Spacer } from "@chakra-ui/react";
import { FiActivity, FiHome } from "react-icons/fi";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import LanguageToggle from "./components/LanguageToggle";
import ProfileSwitcher from "./components/ProfileSwitcher";
import { useI18n } from "./i18n";
import ExpertMode from "./pages/ExpertMode";
import SimpleMode from "./pages/SimpleMode";

const AppHeader = () => {
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
      <ProfileSwitcher />
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
