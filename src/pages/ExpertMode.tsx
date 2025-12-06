import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { useProfiles } from "../hooks/useProfiles";
import { usePhLogs } from "../hooks/usePhLogs";

const ExpertMode = () => {
  const { currentProfileId } = useProfiles();
  const { latestLog } = usePhLogs(currentProfileId);

  const stats = useMemo(
    () => [
      { label: "Latest pH", value: latestLog ? latestLog.ph.toFixed(1) : "—" },
      { label: "Trend", value: latestLog ? "Steady" : "No data" },
      { label: "Entries this week", value: latestLog ? "3" : "0" },
      { label: "PRAL quick check", value: "Cached" },
    ],
    [latestLog],
  );

  return (
    <Stack spacing={6}>
      <Card shadow="md" bg="white">
        <CardHeader>
          <Stack spacing={2}>
            <Text color="brand.700" fontWeight="600">
              Expert mode
            </Text>
            <Heading size="lg">Deeper insights</Heading>
            <Text color="gray.600">
              Placeholder charts and filters. Hook these up to your analytics and PRAL calculations.
            </Text>
          </Stack>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {stats.map((item) => (
              <Box
                key={item.label}
                p={4}
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.100"
                bg="gray.50"
              >
                <Text color="gray.600" fontWeight="600">
                  {item.label}
                </Text>
                <Heading size="lg" color="brand.700" mt={1}>
                  {item.value}
                </Heading>
              </Box>
            ))}
          </SimpleGrid>

          <Divider my={6} />

          <Stack spacing={4}>
            <Box>
              <Heading size="md" mb={2}>
                Charts placeholder
              </Heading>
              <Text color="gray.600">
                Insert time-series pH chart, moving averages, urinary PRAL comparison, etc. Lazy load heavy
                components so simple mode stays fast.
              </Text>
            </Box>

            <Box>
              <Heading size="md" mb={2}>
                Filters placeholder
              </Heading>
              <Text color="gray.600">
                Date range, profile switch, and symptom tags can live here. Keep advanced controls tucked away
                from simple users.
              </Text>
            </Box>

            <Button alignSelf="start" variant="outline">
              Export CSV (stub)
            </Button>
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
};

export default ExpertMode;
