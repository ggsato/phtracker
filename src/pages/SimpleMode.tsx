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
import { usePhLogs } from "../hooks/usePhLogs";
import { useProfiles } from "../hooks/useProfiles";
import { useI18n } from "../i18n";

const SimpleMode = () => {
  const toast = useToast();
  const { currentProfileId, currentProfile } = useProfiles();
  const { latestLog, savePhLog, loading, error } = usePhLogs(currentProfileId);
  const { t } = useI18n();

  const [value, setValue] = useState(6.8);

  useEffect(() => {
    if (latestLog?.ph) {
      setValue(latestLog.ph);
    }
  }, [latestLog?.ph]);

  const handleSave = async (reason?: string) => {
    if (!currentProfileId) {
      toast({
        title: t("missingProfileTitle"),
        description: t("missingProfileDescription"),
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    await savePhLog({ ph: value, note: reason });
    toast({
      title: t("savedTitle"),
      description: t("savedDescription", { name: currentProfile?.displayName ?? "プロフィール" }),
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
              {t("simpleLabel")}
            </Text>
            <Heading size="lg" lineHeight="short">
              {t("simpleHeading")}
            </Heading>
            <Text color="gray.600">{t("simpleDescription")}</Text>
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
                  {t("phUnits")}
                </Text>
              </Flex>
              <Box pt={6} pb={2}>
                <Slider
                  aria-label={t("sliderAria")}
                  min={4.5}
                  max={8.5}
                  step={0.1}
                  value={value}
                  onChange={setValue}
                  focusThumbOnChange={false}
                  isDisabled={!currentProfileId}
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
                    {t("sliderLow")}
                  </Text>
                  <Text fontWeight="600" color="gray.600">
                    {t("sliderHigh")}
                  </Text>
                </Flex>
              </Box>
            </Box>
            <HStack spacing={4} flexWrap="wrap">
              <Button size="lg" flex="1" onClick={() => handleSave()} isDisabled={!currentProfileId || loading}>
                {t("saveReading")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                flex="1"
                onClick={() => handleSave(t("sameAsUsual"))}
                isDisabled={!currentProfileId || loading}
              >
                {t("sameAsUsual")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                flex="1"
                onClick={() => handleSave(t("notFeelingWell"))}
                isDisabled={!currentProfileId || loading}
              >
                {t("notFeelingWell")}
              </Button>
            </HStack>
            {error ? (
              <Box bg="orange.50" p={4} borderRadius="lg" border="1px solid" borderColor="orange.200">
                <Text color="orange.800" fontWeight="600">
                  {t("offlineTitle")}
                </Text>
                <Text color="orange.700">{t("offlineBody")}</Text>
              </Box>
            ) : null}
            {latestLog ? (
              <Box bg="gray.50" p={4} borderRadius="lg" border="1px solid" borderColor="gray.100">
                <Text fontWeight="700" color="brand.700">
                  {t("lastSavedLabel")}
                </Text>
                <Text color="gray.700">
                  {t("lastSavedEntry", {
                    value: latestLog.ph.toFixed(1),
                    date: latestLog.date.toLocaleDateString(),
                    note: latestLog.note ? `(${latestLog.note})` : "",
                  })}
                </Text>
              </Box>
            ) : (
              <Box bg="gray.50" p={4} borderRadius="lg" border="1px solid" borderColor="gray.100">
                <Text color="gray.700">{t("noEntries")}</Text>
              </Box>
            )}
          </Stack>
        </CardBody>
      </Card>
    </Stack>
  );
};

export default SimpleMode;
