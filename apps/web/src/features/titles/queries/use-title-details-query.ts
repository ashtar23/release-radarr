import { useQuery } from "@tanstack/react-query";

import {
  getTitleDetails,
  titleDetailsConfigError,
} from "../data-access/get-title-details";

export function useTitleDetailsQuery(titleId: string) {
  const trimmedId = titleId.trim();

  return useQuery({
    queryKey: ["titles", "detail", trimmedId],
    enabled: trimmedId.length > 0 && titleDetailsConfigError === null,
    queryFn: ({ signal }) => getTitleDetails({ id: trimmedId, signal }),
  });
}
