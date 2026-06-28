import { useMutation } from "@tanstack/react-query";
import { createKitFlow, updateKitFlow } from "@/services/api-bridge";
import { useInvalidateWorkspace } from "@/hooks/useWorkspace";
import type { UiProduct } from "@/services/mappers";

export type KitArtworkInput = { file?: File; preview?: string; name?: string };

export type CreateKitInput = {
  name: string;
  pickedIndices: number[];
  catalog: UiProduct[];
  packaging: string;
  designNotes?: string;
  artwork?: KitArtworkInput;
};

export function useCreateKit() {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: (input: CreateKitInput) => createKitFlow(input),
    onSuccess: () => invalidate(),
  });
}

export type UpdateKitInput = {
  id: string;
  name?: string;
  pickedIndices: number[];
  catalog: UiProduct[];
  packaging?: string;
  designNotes?: string;
  artwork?: KitArtworkInput;
};

export function useUpdateKit() {
  const invalidate = useInvalidateWorkspace();
  return useMutation({
    mutationFn: (input: UpdateKitInput) => updateKitFlow(input),
    onSuccess: () => invalidate(),
  });
}
