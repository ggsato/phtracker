import { Alert, AlertIcon, AlertTitle, Box, Spinner, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const AuthCallback = () => {
  const { handleRedirectCallback } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if (!code) {
      setError("Missing authorization code in callback");
      return;
    }

    const redirectPath = sessionStorage.getItem("phtracker.auth.post_login_path") || "/";
    sessionStorage.removeItem("phtracker.auth.post_login_path");

    handleRedirectCallback(code)
      .then(() => navigate(redirectPath, { replace: true }))
      .catch((err) => {
        console.error("Auth callback failed", err);
        setError((err as Error).message);
      });
  }, [handleRedirectCallback, location.search, navigate]);

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <Box>
          <AlertTitle>Sign-in failed</AlertTitle>
          <Text fontSize="sm">{error}</Text>
        </Box>
      </Alert>
    );
  }

  return (
    <Stack align="center" spacing={4} py={12}>
      <Spinner size="lg" />
      <Text>Signing you in...</Text>
    </Stack>
  );
};

export default AuthCallback;
