import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  useToast,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Portal,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePhBands } from "../hooks/usePhBands";
import { usePhLogs } from "../hooks/usePhLogs";
import { useProfiles } from "../hooks/useProfiles";
import { useI18n } from "../i18n";
import { categorizePh } from "../lib/phBands";

const MIN_PH = 5.0;
const MAX_PH = 7.5;
const WHOLE_CHOICES = [7, 6, 5];
const DECIMAL_CHOICES = [0.75, 0.5, 0.25, 0];

const formatPh = (ph: number) => {
  if (Number.isInteger(ph)) {
    return ph.toFixed(1);
  }
  const formatted = ph.toFixed(2).replace(/0$/, "");
  return formatted;
};

const SimpleMode = () => {
  const toast = useToast();
  const { currentProfileId, currentProfile } = useProfiles();
  const { latestLog, savePhLog, loading, error } = usePhLogs(currentProfileId);
  const { t } = useI18n();
  const { bands } = usePhBands();

  const [value, setValue] = useState(6.5);
  const [autoSavePending, setAutoSavePending] = useState(false);
  const [saving, setSaving] = useState(false);

  const clampAndRound = useCallback((ph: number) => {
    const clamped = Math.min(MAX_PH, Math.max(MIN_PH, ph));
    const rounded = Math.round(clamped / 0.25) * 0.25;
    return Number(rounded.toFixed(2));
  }, []);

  useEffect(() => {
    if (latestLog?.ph) {
      setValue(clampAndRound(latestLog.ph));
      setAutoSavePending(false);
    }
  }, [latestLog?.ph, clampAndRound]);

  const handleSave = useCallback(
    async (phValue: number, reason?: string) => {
      if (!currentProfileId) {
        toast({
          title: t("missingProfileTitle"),
          description: t("missingProfileDescription"),
          status: "warning",
          duration: 2000,
          isClosable: true,
        });
        setAutoSavePending(false);
        setSaving(false);
        return;
      }

      setSaving(true);
      await savePhLog({ ph: phValue, note: reason });
      toast({
        id: "simple-save",
        title: t("savedTitle"),
        description: t("savedDescription", { name: currentProfile?.displayName ?? "プロフィール" }),
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      setSaving(false);
      setAutoSavePending(false);
    },
    [currentProfileId, currentProfile?.displayName, savePhLog, t, toast],
  );

  useEffect(() => {
    if (!autoSavePending) return;

    let canceled = false;
    const run = async () => {
      await handleSave(value);
      if (canceled) return;
    };
    run();
    return () => {
      canceled = true;
    };
  }, [autoSavePending, handleSave, value]);

  const currentWhole = useMemo(() => Math.floor(value), [value]);
  const currentDecimal = useMemo(() => Number((value - Math.floor(value)).toFixed(2)), [value]);
  const currentCategory = categorizePh(value, bands);

  const handleSelect = (next: number) => {
    const normalized = clampAndRound(next);
    if (normalized === value) return;
    setValue(normalized);
    setAutoSavePending(true);
  };

  const handleQuickNote = async (reason?: string) => {
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
    await handleSave(value, reason);
  };

  return (
    <Stack spacing={6}>
      <Card shadow="md" bg="white">
        <CardHeader>
          <Stack spacing={2} align="center">
            <HStack align="center" spacing={2}>
              <Text color="brand.700" fontWeight="600">
                {t("simpleLabel")}
              </Text>
              <Popover trigger="click" placement="right-start">
                <PopoverTrigger>
                  <Text
                    as="span"
                    display="inline-flex"
                    justifyContent="center"
                    alignItems="center"
                    w="22px"
                    h="22px"
                    bg="gray.100"
                    color="gray.700"
                    borderRadius="full"
                    fontWeight="800"
                    fontSize="xs"
                    border="1px solid"
                    borderColor="gray.200"
                    cursor="pointer"
                    userSelect="none"
                  >
                    ?
                  </Text>
                </PopoverTrigger>
                <Portal>
                  <PopoverContent maxW="260px" _focus={{ boxShadow: "md" }}>
                    <PopoverArrow />
                    <PopoverBody fontSize="sm" color="gray.700">
                      {t("simpleDescription")} {t("simpleAutosaveHint")}
                    </PopoverBody>
                  </PopoverContent>
                </Portal>
              </Popover>
            </HStack>
            <Heading size="lg" lineHeight="short" textAlign="center">
              {t("simpleHeading")}
            </Heading>
          </Stack>
        </CardHeader>
        <CardBody>
          <Stack spacing={8}>
            <Box>
              <Flex align="center" justify="center" direction="column">
                <Heading
                  fontSize={{ base: "48px", sm: "56px", md: "64px" }}
                  color={`${currentCategory.colorScheme}.600`}
                  textAlign="center"
                >
                  {formatPh(value)}
                </Heading>
              </Flex>
              <SimpleGrid pt={4} columns={2} spacing={3} alignItems="start">
            <Stack spacing={2}>
              <Stack spacing={2}>
                {WHOLE_CHOICES.map((whole) => {
                  const nextValue = clampAndRound(whole + currentDecimal);
                  const active = currentWhole === whole;
                  const band = categorizePh(nextValue, bands);
                  const activeStyles = active
                    ? {
                        bg: `${band.colorScheme}.500`,
                        color: "white",
                        _hover: { bg: `${band.colorScheme}.600` },
                        _active: { bg: `${band.colorScheme}.700` },
                      }
                    : {
                        bg: "white",
                        color: `${band.colorScheme}.700`,
                        borderColor: `${band.colorScheme}.500`,
                        _hover: { bg: `${band.colorScheme}.50` },
                      };
                  return (
                    <Button
                      key={whole}
                      aria-pressed={active}
                      onClick={() => handleSelect(nextValue)}
                      isDisabled={!currentProfileId || saving}
                      variant={active ? "solid" : "outline"}
                      colorScheme={band.colorScheme}
                      fontSize="lg"
                      w="100%"
                      h="72px"
                      px={4}
                      {...activeStyles}
                    >
                      <Text fontWeight="800" fontSize="xl" textAlign="center" w="100%">
                        {whole}
                      </Text>
                    </Button>
                  );
                })}
              </Stack>
            </Stack>
            <Stack spacing={2}>
              <Stack spacing={2}>
                {DECIMAL_CHOICES.map((decimal) => {
                  const display =
                    decimal === 0 ? ".0" : decimal === 0.25 ? ".25" : decimal === 0.5 ? ".5" : ".75";
                  const nextValue = clampAndRound(currentWhole + decimal);
                  const band = categorizePh(nextValue, bands);
                  const active = currentDecimal === decimal;
                  const isDisabledDecimal = currentWhole === 7 && decimal > 0.5;
                  if (isDisabledDecimal) {
                    return null;
                  }
                  const activeStyles = active
                    ? {
                        bg: `${band.colorScheme}.500`,
                        color: "white",
                        _hover: { bg: `${band.colorScheme}.600` },
                        _active: { bg: `${band.colorScheme}.700` },
                      }
                    : {
                        bg: "white",
                        color: `${band.colorScheme}.700`,
                        borderColor: `${band.colorScheme}.500`,
                        _hover: { bg: `${band.colorScheme}.50` },
                      };
                  return (
                    <Button
                      key={decimal}
                      aria-pressed={active}
                      onClick={() => handleSelect(nextValue)}
                      isDisabled={!currentProfileId || saving || isDisabledDecimal}
                      variant={active ? "solid" : "outline"}
                      colorScheme={band.colorScheme}
                      fontSize="lg"
                      w="100%"
                      px={4}
                      {...activeStyles}
                    >
                      {display}
                    </Button>
                  );
                })}
              </Stack>
            </Stack>
          </SimpleGrid>
        </Box>
        <HStack spacing={4} flexWrap="wrap">
            <Button
              size="lg"
              variant="outline"
                  flex="1"
                  onClick={() => handleQuickNote(t("sameAsUsual"))}
                  isDisabled={!currentProfileId || loading || saving}
                >
                  {t("sameAsUsual")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  flex="1"
                  onClick={() => handleQuickNote(t("notFeelingWell"))}
                  isDisabled={!currentProfileId || loading || saving}
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
                    value: formatPh(clampAndRound(latestLog.ph)),
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
