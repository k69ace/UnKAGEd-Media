import { imageSize } from "image-size";
import type { AgentResult, ScanInput } from "@/lib/types";
import type { SiteSnapshot } from "@/lib/utils/siteSnapshot";
import { isSafeUrl } from "@/lib/utils/urlSafety";
import { makeFinding, scoreFromDeductions } from "./helpers";

const MAX_IMAGES_TO_INSPECT = 8;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // don't download huge files
const LOW_RES_WIDTH_THRESHOLD = 500;
const LARGE_FILE_BYTES_THRESHOLD = 1_500_000;

type InspectedImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  bytes?: number;
  failed?: boolean;
};

async function inspectImage(ref: { src: string; alt: string }): Promise<InspectedImage> {
  if (!isSafeUrl(ref.src)) return { ...ref, failed: true };

  try {
    const res = await fetch(ref.src, { signal: AbortSignal.timeout(8000), redirect: "manual" });
    if (!res.ok) return { ...ref, failed: true };

    const contentLength = Number(res.headers.get("content-length") ?? 0);
    if (contentLength > MAX_IMAGE_BYTES) {
      return { ...ref, bytes: contentLength };
    }

    const buffer = new Uint8Array(await res.arrayBuffer());
    const dimensions = imageSize(buffer);
    return { ...ref, width: dimensions.width, height: dimensions.height, bytes: buffer.byteLength };
  } catch {
    return { ...ref, failed: true };
  }
}

/**
 * Photo Agent — downloads a sample of homepage images to check resolution
 * and file size (proxies for "blurry/pixelated" and "slow-loading" photos)
 * plus alt-text coverage for accessibility/SEO.
 */
export async function runPhotoAgent(input: ScanInput, snapshot: SiteSnapshot | null): Promise<AgentResult> {
  if (!input.url || !snapshot) {
    return {
      agentId: "photos",
      label: "Photo Quality",
      status: "skipped",
      dataSource: "unavailable",
      score: 0,
      summary: "No website was available to inspect photos on.",
      findings: [],
    };
  }

  const candidateImages = snapshot.images
    .filter((img) => !img.src.endsWith(".svg") && !img.src.startsWith("data:"))
    .slice(0, MAX_IMAGES_TO_INSPECT);

  if (candidateImages.length === 0) {
    return {
      agentId: "photos",
      label: "Photo Quality",
      status: "ok",
      dataSource: "live",
      score: 20,
      summary: "No photos were found on the homepage. Photos are one of the biggest drivers of clicks and orders.",
      findings: [
        makeFinding("critical", "No photos on homepage", "Restaurants with quality food photos see significantly higher engagement and conversion.", {
          estimatedImpact: "Missed visual appeal that drives clicks and orders",
          fixable: true,
          agentId: "photos",
        }),
      ],
    };
  }

  const inspected = await Promise.all(candidateImages.map(inspectImage));

  const findings = [];
  const deductions: number[] = [];

  const missingAlt = inspected.filter((img) => !img.alt);
  if (missingAlt.length > 0) {
    deductions.push(Math.min(15, missingAlt.length * 3));
    findings.push(
      makeFinding("warning", "Photos missing alt text", `${missingAlt.length} of ${inspected.length} sampled images have no descriptive alt text, hurting accessibility and image SEO.`, {
        fixable: true,
        agentId: "photos",
      }),
    );
  } else {
    findings.push(makeFinding("good", "Alt text present", "All sampled images have descriptive alt text.", { agentId: "photos" }));
  }

  const lowRes = inspected.filter((img) => img.width && img.width < LOW_RES_WIDTH_THRESHOLD);
  if (lowRes.length > 0) {
    deductions.push(Math.min(25, lowRes.length * 8));
    findings.push(
      makeFinding("critical", "Low-resolution photos detected", `${lowRes.length} image(s) are under ${LOW_RES_WIDTH_THRESHOLD}px wide and will look blurry or pixelated, especially on retina displays.`, {
        estimatedImpact: "Blurry photos are strongly correlated with lower click-through and order rates",
        fixable: true,
        agentId: "photos",
      }),
    );
  } else {
    findings.push(makeFinding("good", "Good photo resolution", "Sampled images are high enough resolution to look sharp.", { agentId: "photos" }));
  }

  const largeFiles = inspected.filter((img) => img.bytes && img.bytes > LARGE_FILE_BYTES_THRESHOLD);
  if (largeFiles.length > 0) {
    deductions.push(Math.min(15, largeFiles.length * 5));
    findings.push(
      makeFinding("warning", "Unoptimized/oversized image files", `${largeFiles.length} image(s) are over ${(LARGE_FILE_BYTES_THRESHOLD / 1_000_000).toFixed(1)}MB, slowing down page load.`, {
        fixable: true,
        agentId: "photos",
      }),
    );
  }

  const failed = inspected.filter((img) => img.failed);
  if (failed.length > 0) {
    findings.push(
      makeFinding("info", "Some images couldn't be analyzed", `${failed.length} image(s) failed to load during analysis (broken link, blocked, or unsupported format).`, {
        agentId: "photos",
      }),
    );
  }

  if (inspected.length < 4) {
    deductions.push(8);
    findings.push(
      makeFinding("warning", "Very few photos on homepage", `Only found ${inspected.length} image(s). Aim for a gallery of food, ambiance, and staff photos.`, {
        fixable: true,
        agentId: "photos",
      }),
    );
  }

  const score = scoreFromDeductions(deductions);

  return {
    agentId: "photos",
    label: "Photo Quality",
    status: "ok",
    dataSource: "live",
    score,
    summary:
      score >= 80
        ? "Your photos are high quality and well optimized."
        : score >= 50
          ? "Your photos have fixable quality or optimization issues."
          : "Photo quality issues are likely hurting engagement and conversions.",
    findings,
    metrics: {
      imagesFound: snapshot.images.length,
      imagesSampled: inspected.length,
      lowResCount: lowRes.length,
      missingAltCount: missingAlt.length,
    },
  };
}
