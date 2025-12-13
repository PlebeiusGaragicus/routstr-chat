/**
 * Detects if the current device is a mobile device
 */
function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined")
    return false;

  // Check for touch capability and mobile user agent
  const hasTouchScreen =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const mobileUA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Also check if it's a small screen (likely mobile)
  const isSmallScreen = window.innerWidth <= 768;

  return (hasTouchScreen && mobileUA) || (hasTouchScreen && isSmallScreen);
}

/**
 * Attempts to use the Web Share API to share/save the file
 * Returns true if successful, false if not supported or failed
 */
async function tryWebShare(blob: Blob, filename: string): Promise<boolean> {
  // Check if Web Share API with files is supported
  if (!navigator.share || !navigator.canShare) {
    return false;
  }

  try {
    const file = new File([blob], filename, { type: blob.type });
    const shareData = { files: [file] };

    // Check if we can share this file type
    if (!navigator.canShare(shareData)) {
      return false;
    }

    await navigator.share(shareData);
    return true;
  } catch (error) {
    // User cancelled or share failed - this is expected behavior
    if (error instanceof Error && error.name === "AbortError") {
      return true; // User cancelled, but API worked
    }
    console.warn("Web Share API failed:", error);
    return false;
  }
}

/**
 * Opens a blob URL in a new tab for manual saving (mobile fallback)
 */
function openInNewTab(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, "_blank");

  // Clean up the URL after a delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000); // Keep URL valid for 1 minute

  // If popup was blocked, show alert with instructions
  if (!newWindow) {
    // Create a temporary link and show instructions
    alert(
      'To save the image: Long-press on the image above and select "Save Image"'
    );
  }
}

export async function downloadImageFromSrc(
  src: string | Blob,
  suggestedName?: string
) {
  try {
    let blob: Blob;
    let fileName: string;

    if (typeof src !== "string") {
      blob = src;
      const extension = getExtensionFromMime(blob.type) || "png";
      fileName = suggestedName || `image-${Date.now()}.${extension}`;
    } else if (src.startsWith("data:")) {
      // If src is a data URL, create a blob directly
      const response = await fetch(src);
      blob = await response.blob();
      const extension = getExtensionFromMime(blob.type) || "png";
      fileName = suggestedName || `image-${Date.now()}.${extension}`;
    } else {
      // Otherwise, fetch the image respecting CORS if allowed
      const res = await fetch(src, { mode: "cors" as RequestMode });
      blob = await res.blob();
      const extension =
        getExtensionFromMime(blob.type) || inferExtensionFromUrl(src) || "png";
      fileName =
        suggestedName ||
        getFileNameFromUrl(src) ||
        `image-${Date.now()}.${extension}`;
    }

    // On mobile, try Web Share API first (provides native save option)
    if (isMobileDevice()) {
      const shared = await tryWebShare(blob, fileName);
      if (shared) {
        return; // Successfully shared/saved
      }

      // Fallback: open in new tab for long-press saving
      openInNewTab(blob);
      return;
    }

    // Desktop: use traditional download
    triggerDownload(blob, fileName);
  } catch (error) {
    console.error("Download failed:", error);

    // Final fallback: try to open the original URL in a new tab
    if (typeof src === "string" && !src.startsWith("data:")) {
      window.open(src, "_blank");
    } else if (src instanceof Blob) {
      openInNewTab(src);
    } else {
      alert(
        "Failed to download image. Please try long-pressing the image to save it."
      );
    }
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getFileNameFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url, window.location.href).pathname;
    const last = pathname.split("/").filter(Boolean).pop();
    if (!last) return null;
    return last.includes(".") ? last : `${last}.png`;
  } catch {
    return null;
  }
}

function inferExtensionFromUrl(url: string): string | null {
  const match = url.match(/\.([a-zA-Z0-9]{2,5})(?:\?|#|$)/);
  return match ? match[1] : null;
}

function getExtensionFromMime(mime: string): string | null {
  const parts = mime.split("/");
  return parts.length === 2 ? parts[1] : null;
}
