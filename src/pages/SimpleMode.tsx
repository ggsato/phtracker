import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useProfiles } from "../hooks/useProfiles";
import { usePhLogs } from "../hooks/usePhLogs";

const SimpleMode = () => {
  const toast = useToast();
  const { currentProfileId, currentProfile } = useProfiles();
  const { latestLog, savePhLog } = usePhLogs(currentProfileId);

  const [value, setValue] = useState(6.8);

  useEffect(() => {
    if (latestLog?.ph) {
      setValue(latestLog.ph);
    }
  }, [latestLog?.ph]);

  const handleSave = async (reason?: string) => {
    await savePhLog({ ph: value, note: reason });
    toast({
      title: "Saved",
      description: `${currentProfile?.displayName ?? "Profile"} pH logged`,
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Stack spacing={6}>
      <Card shadow="md" bg="white">
        <CardHeader>
          <Stack spacing={2}>
            <Text color="brand.700" fontWeight="600">
              Simple mode
            </Text>
            <Heading size="lg" lineHeight="short">
              Enter today&apos;s pH
            </Heading>
            <Text color="gray.600">
              Big controls, quick save. Ideal for family members who just need to log a value.
            </Text>
          </Stack>
        </CardHeader>
        <CardBody>
          <Stack spacing={8}>
            <Box>
              <Flex align="baseline" justify="space-between">
                <Heading size="4xl" color="brand.700">
                  {value.toFixed(1)}
                </Heading>
                <Text color="gray.600" fontWeight="600">
                  pH units
                </Text>
              </Flex>
              <Box pt={6} pb={2}>
                <Slider
                  aria-label="pH value"
                  min={4.5}
                  max={8.5}
                  step={0.1}
                  value={value}
                  onChange={setValue}
                  focusThumbOnChange={false}
                >
                  <SliderTrack bg="gray.200" h="10px" borderRadius="full">
                    <SliderFilledTrack bg="brand.500" />
                  </SliderTrack>
                  <SliderThumb
                    boxSize={8}
                    bg="white"
                    border="3px solid"
                    borderColor="brand.600"
                    shadow="md"
                  />
                </Slider>
                <Flex justify="space-between" mt={2}>
                  <Text fontWeight="600" color="gray.600">
                    Acidic 4.5
                  </Text>
                  <Text fontWeight="600" color="gray.600">
                    Basic 8.5
                  </Text>
                </Flex>
              </Box>
            </Box>
            <HStack spacing={4} flexWrap="wrap">
              <Button size="lg" flex="1" onClick={() => handleSave()}>
                Save reading
              </Button>
              <Button size="lg" variant="outline" flex="1" onClick={() => handleSave("Same as usual")}>
                Same as usual
              </Button>
              <Button size="lg" variant="outline" flex="1" onClick={() => handleSave("Not feeling well")}>
                Not feeling well
              </Button>
            </HStack>
            {latestLog ? (
              <Box bg="gray.50" p={4} borderRadius="lg" border="1px solid" borderColor="gray.100">
                <Text fontWeight="700" color="brand.700">
                  Last saved
                </Text>
                <Text color="gray.700">
                  {latestLog.ph.toFixed(1)} on {latestLog.date.toLocaleDateString()}{" "}
                  {latestLog.note ? `(${latestLog.note})` : ""}
                </Text>
              </Box>
            ) : (
              <Box bg="gray.50" p={4} borderRadius="lg" border="1px solid" borderColor="gray.100">
                <Text color="gray.700">No entries yet. First save will show here.</Text>
              </Box>
            )}
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
};

export default SimpleMode;
