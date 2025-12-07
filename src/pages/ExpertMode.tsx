import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  Heading,
  HStack,
  Input,
  RangeSlider,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  RangeSliderTrack,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { usePhBands } from "../hooks/usePhBands";
import { usePhLogs } from "../hooks/usePhLogs";
import { usePralSearch } from "../hooks/usePralSearch";
import { useProfiles } from "../hooks/useProfiles";
import { useI18n } from "../i18n";
import { DEFAULT_PH_BANDS, isValidBands, PhBands } from "../lib/phBands";

const ExpertMode = () => {
  const { currentProfileId } = useProfiles();
  const { latestLog } = usePhLogs(currentProfileId);
  const { result: pralResult, search: searchPral, loading: pralLoading, error: pralError } =
    usePralSearch(currentProfileId);
  const [query, setQuery] = useState(pralResult?.query ?? "");
  const { t } = useI18n();
  const { bands, setBands, resetBands } = usePhBands();
  const [draftBands, setDraftBands] = useState<PhBands>(bands);
  const toast = useToast();

  useEffect(() => {
    setDraftBands(bands);
  }, [bands]);


  const stats = useMemo(
    () => [
      { label: t("statsLatest"), value: latestLog ? latestLog.ph.toFixed(1) : "—" },
      { label: t("statsTrend"), value: latestLog ? t("trendSteady") : t("trendNone") },
      { label: t("statsEntries"), value: latestLog ? "3" : t("entriesZero") },
      { label: t("statsPral"), value: t("pralOffline") },
    ],
    [latestLog, t],
  );

  return (
    <Stack spacing={6}>
      <Card shadow="md" bg="white">
        <CardHeader>
          <Stack spacing={2}>
            <Text color="brand.700" fontWeight="600">
              {t("expertLabel")}
            </Text>
            <Heading size="lg">{t("expertHeading")}</Heading>
            <Text color="gray.600">{t("expertDescription")}</Text>
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
            <Card variant="outline" borderColor="gray.100" bg="gray.50">
              <CardHeader pb={2}>
                <Stack spacing={1}>
                  <Heading size="md">{t("acidityRangesTitle")}</Heading>
                  <Text color="gray.600">{t("acidityRangesDescription")}</Text>
                  <Text color="gray.500" fontSize="sm">
                    {t("acidityRangesHintDefault")}
                  </Text>
                </Stack>
              </CardHeader>
              <CardBody pt={0}>
                <Stack spacing={4}>
                  <RangeSlider
                    min={5}
                    max={7.5}
                    step={0.05}
                    value={[
                      draftBands.acidicUpper,
                      draftBands.slightlyAcidicUpper,
                      draftBands.neutralUpper,
                      draftBands.slightlyAlkalineUpper,
                    ]}
                    onChange={(vals) =>
                      setDraftBands({
                        acidicUpper: Number(vals[0]),
                        slightlyAcidicUpper: Number(vals[1]),
                        neutralUpper: Number(vals[2]),
                        slightlyAlkalineUpper: Number(vals[3]),
                      })
                    }
                  >
                    <RangeSliderTrack bg="gray.100">
                      <RangeSliderFilledTrack bg="brand.500" />
                    </RangeSliderTrack>
                    <RangeSliderThumb index={0} boxSize={5} />
                    <RangeSliderThumb index={1} boxSize={5} />
                    <RangeSliderThumb index={2} boxSize={5} />
                    <RangeSliderThumb index={3} boxSize={5} />
                  </RangeSlider>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                    <Box>
                      <Text fontWeight="600" color="gray.700" fontSize="sm">
                        {t("acidityAcidic")}
                      </Text>
                      <Text color="gray.600" fontFamily="mono">
                        ≤ {draftBands.acidicUpper.toFixed(2)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="600" color="gray.700" fontSize="sm">
                        {t("aciditySlightlyAcidic")}
                      </Text>
                      <Text color="gray.600" fontFamily="mono">
                        ≤ {draftBands.slightlyAcidicUpper.toFixed(2)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="600" color="gray.700" fontSize="sm">
                        {t("acidityNeutral")}
                      </Text>
                      <Text color="gray.600" fontFamily="mono">
                        ≤ {draftBands.neutralUpper.toFixed(2)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="600" color="gray.700" fontSize="sm">
                        {t("aciditySlightlyAlkaline")}
                      </Text>
                      <Text color="gray.600" fontFamily="mono">
                        ≤ {draftBands.slightlyAlkalineUpper.toFixed(2)}
                      </Text>
                    </Box>
                  </SimpleGrid>
                  <HStack spacing={3}>
                    <Button
                      onClick={() => {
                        if (!isValidBands(draftBands)) {
                          toast({
                            title: t("acidityInvalidOrder"),
                            status: "warning",
                            duration: 2500,
                            isClosable: true,
                          });
                          return;
                        }
                        setBands(draftBands);
                        toast({
                          title: t("aciditySaved"),
                          status: "success",
                          duration: 2000,
                          isClosable: true,
                        });
                      }}
                    >
                      {t("aciditySave")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDraftBands(DEFAULT_PH_BANDS);
                        resetBands();
                      }}
                    >
                      {t("acidityReset")}
                    </Button>
                  </HStack>
                </Stack>
              </CardBody>
            </Card>

            <Box>
              <Heading size="md" mb={2}>
                {t("chartsHeading")}
              </Heading>
              <Text color="gray.600">{t("chartsDescription")}</Text>
            </Box>

            <Box>
              <Heading size="md" mb={2}>
                {t("filtersHeading")}
              </Heading>
              <Text color="gray.600">{t("filtersDescription")}</Text>
            </Box>

            <Card variant="outline" borderColor="gray.100" bg="gray.50">
              <CardHeader pb={2}>
                <Stack spacing={1}>
                  <Heading size="md">{t("pralHeading")}</Heading>
                  <Text color="gray.600">{t("pralDescription")}</Text>
                </Stack>
              </CardHeader>
              <CardBody pt={0}>
                <Stack spacing={4}>
                  <HStack align="stretch">
                    <Input
                      placeholder={t("pralPlaceholder")}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <Button
                      onClick={() => searchPral(query)}
                      isDisabled={!query.trim()}
                      isLoading={pralLoading}
                    >
                      Search
                    </Button>
                  </HStack>
                  {pralError ? (
                    <Text color="red.600" fontWeight="600">
                      {pralError}
                    </Text>
                  ) : null}
                      {pralLoading ? (
                        <HStack color="gray.600">
                          <Spinner size="sm" />
                          <Text>{t("pralSearching")}</Text>
                        </HStack>
                      ) : null}
                      {pralResult ? (
                        <Stack spacing={3}>
                          <HStack justify="space-between" align="baseline">
                            <Text color="gray.700" fontWeight="700">
                              {t("pralLastQuery", { query: pralResult.query })}
                            </Text>
                            <Badge colorScheme={pralResult.cached ? "green" : "blue"}>
                              {pralResult.cached ? t("pralOffline") : t("pralFresh")}
                            </Badge>
                          </HStack>
                          <Text color="gray.600" fontSize="sm">
                            {t("pralUpdated", { date: new Date(pralResult.fetchedAt).toLocaleString() })}
                          </Text>
                          <Stack spacing={2}>
                            {pralResult.items.slice(0, 4).map((item) => (
                              <Flex
                                key={`${item.name}-${item.pral}`}
                            justify="space-between"
                            align="center"
                            p={3}
                            bg="white"
                            borderRadius="md"
                            border="1px solid"
                            borderColor="gray.100"
                              >
                                <Box>
                                  <Text fontWeight="700" color="brand.700">
                                    {item.name || t("pralCardLabel")}
                                  </Text>
                                  <Text color="gray.600" fontSize="sm">
                                    {item.category ?? t("pralCardLabel")} · {item.portion ?? "100g"}
                                  </Text>
                                </Box>
                                <Text fontWeight="800" color="brand.800">
                                  {item.pral.toFixed(1)}
                                </Text>
                              </Flex>
                            ))}
                            {pralResult.items.length === 0 ? (
                              <Text color="gray.600">{t("pralNoResults")}</Text>
                            ) : null}
                          </Stack>
                        </Stack>
                      ) : (
                        <Text color="gray.600">{t("pralNoQueries")}</Text>
                      )}
                    </Stack>
                  </CardBody>
                </Card>

                <Button alignSelf="start" variant="outline">
                  {t("csvExport")}
                </Button>
              </Stack>
            </CardBody>
          </Card>
        </Stack>
  );
};

export default ExpertMode;
