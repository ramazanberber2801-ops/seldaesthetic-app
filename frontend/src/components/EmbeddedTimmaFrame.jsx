import { useMemo, useState } from "react";
import { AlertCircle, LoaderCircle, RotateCcw } from "lucide-react";

function normalizeTimmaUrl(value, fallbackUrl) {
  const candidate = (value || fallbackUrl || "").trim();
  if (!candidate) return "";

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export default function EmbeddedTimmaFrame({
  title,
  configuredUrl,
  fallbackUrl,
  testId,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const src = useMemo(
    () => normalizeTimmaUrl(configuredUrl, fallbackUrl),
    [configuredUrl, fallbackUrl]
  );

  const reload = () => {
    setIsLoading(true);
    setReloadKey((value) => value + 1);
  };

  if (!src) {
    return (
      <div className="mx-4 mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-amber-700" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-semibold text-stone-900">Tjenesten er ikke konfigurert</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Klinikken må legge inn en gyldig Timma-lenke i innstillingene.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-white">
      {isLoading && (
        <div
          className="absolute inset-0 z-10 flex min-h-[420px] flex-col items-center justify-center bg-paper px-6 text-center"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle className="h-9 w-9 animate-spin text-stone-700" aria-hidden="true" />
          <p className="mt-4 font-medium text-stone-800">Åpner Timma inne i appen</p>
          <p className="mt-1 text-sm text-stone-500">Du blir værende i Yasaflow.</p>
        </div>
      )}

      <iframe
        key={reloadKey}
        title={title}
        src={src}
        data-testid={testId}
        className="block w-full bg-white"
        style={{ height: "calc(100vh - 190px)", minHeight: "760px", border: "none" }}
        allow="payment; clipboard-write"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setIsLoading(false)}
      />

      {!isLoading && (
        <button
          type="button"
          onClick={reload}
          className="fixed bottom-24 right-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white shadow-lg"
          aria-label="Last Timma på nytt"
        >
          <RotateCcw className="h-5 w-5 text-stone-700" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
