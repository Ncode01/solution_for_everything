/** User-facing message for TanStack Query / API failures. */
export function formatQueryError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return "Session expired. Sign in again to continue.";
    }
    if (error.message === "Failed to fetch" || error.message.includes("NetworkError")) {
      return "Network error. Check your connection and API URL.";
    }
    return error.message;
  }
  return "Something went wrong while loading data.";
}
