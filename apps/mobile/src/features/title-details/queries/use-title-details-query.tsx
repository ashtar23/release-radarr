import { useQuery } from "@tanstack/react-query";
import {
  getTitleDetails,
  titleDetailsConfigError,
} from "../data-access/get-title-details";

const TITLE_DETAILS_STALE_TIME_MS = 60_000;
const TITLE_DETAILS_QUERY_KEY_PREFIX = ["titles", "detail"];

function useTitleDetailsQuery({ titleId }: { titleId: string }) {
  return useQuery({
    queryKey: [...TITLE_DETAILS_QUERY_KEY_PREFIX, titleId],
    enabled: titleId.length > 0 && titleDetailsConfigError === null,
    queryFn: ({ signal }) => getTitleDetails({ id: titleId, signal }),
    staleTime: TITLE_DETAILS_STALE_TIME_MS,
  });
}

export { useTitleDetailsQuery };
