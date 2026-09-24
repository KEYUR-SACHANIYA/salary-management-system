"use client";

import { useEffect } from "react";
import { Alert } from "@/components/ui/Alert";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer>
      <PageHeader title="Something went wrong" />
      <Alert tone="error">
        The page could not be loaded. Please try again.
      </Alert>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Try again
      </button>
    </PageContainer>
  );
}
