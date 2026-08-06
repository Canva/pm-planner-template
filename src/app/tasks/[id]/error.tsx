"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BriefDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[BriefDetailError]", error);
  }, [error]);

  const router = useRouter();

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-10 gap-4">
      <div className="max-w-lg w-full bg-red-50 border border-red-200 rounded-xl p-6 text-sm">
        <h2 className="text-base font-semibold text-red-700 mb-2">Something went wrong loading this brief</h2>
        <p className="text-red-600 font-mono text-xs break-all mb-4">{error.message || String(error)}</p>
        {error.stack && (
          <pre className="text-xs text-red-500 overflow-auto bg-red-100 rounded p-3 mb-4 max-h-48">
            {error.stack}
          </pre>
        )}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try again
          </button>
          <button
            onClick={() => router.back()}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
