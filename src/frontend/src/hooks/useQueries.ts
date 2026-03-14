import { useMutation } from "@tanstack/react-query";
import type { SensitivityProfile } from "../backend.d";
import { useActor } from "./useActor";

export function useGetSensitivity() {
  const { actor } = useActor();

  return useMutation<SensitivityProfile, Error, string>({
    mutationFn: async (deviceName: string) => {
      if (!actor) throw new Error("Backend not ready");
      return actor.getSensitivity(deviceName);
    },
  });
}
