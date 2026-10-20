import { useQueryClient } from "@tanstack/react-query";
import { getGetEasyRideStateQueryKey, useGetEasyRideState, useSaveEasyRideState } from "@workspace/api-client-react";
import type { EasyRideState } from "@workspace/api-client-react";

export function useEasyRide() {
  const queryClient = useQueryClient();
  const query = useGetEasyRideState();
  const saveMutation = useSaveEasyRideState({
    mutation: {
      onMutate: async ({ data }) => {
        const key = getGetEasyRideStateQueryKey();
        await queryClient.cancelQueries({ queryKey: key });
        const previous = queryClient.getQueryData<EasyRideState>(key);
        queryClient.setQueryData(key, data);
        return { previous };
      },
      onSuccess: (saved) => queryClient.setQueryData(getGetEasyRideStateQueryKey(), saved),
      onError: (_error, _variables, context) => {
        if (context?.previous) queryClient.setQueryData(getGetEasyRideStateQueryKey(), context.previous);
      },
    },
  });
  return {
    state: query.data,
    loading: query.isLoading,
    error: query.error,
    retry: query.refetch,
    saving: saveMutation.isPending,
    save: (data: EasyRideState) => saveMutation.mutate({ data }),
  };
}
