import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";

interface Video {
  bitrate: number | null;
  url: string;
  content_type: string;
}

interface VideoUrls {
  variants: Video[];
  video_preview_url: string;
}

const TweetVideo = ({ videoUrls }: { videoUrls: string | null }) => {
  if (!videoUrls) return null;

  let parsed;
  try {
    parsed = JSON.parse(videoUrls);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {parsed.map((video: VideoUrls, i: number) => (
        <VideoPreview key={i} video={video} />
      ))}
    </div>
  );
};

const VideoPreview = ({ video }: { video: VideoUrls }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Prioritize MP4 over HLS for better compatibility
  const mp4Variants = video.variants?.filter(
    (v: Video) => v.content_type === "video/mp4"
  );
  const bestMp4Variant = mp4Variants?.sort(
    (a: Video, b: Video) => (b.bitrate ?? 0) - (a.bitrate ?? 0)
  )[0];

  const hlsVariant = video.variants?.find(
    (v: Video) => v.content_type === "application/x-mpegURL"
  );

  // Use MP4 first, HLS as fallback
  const preferredUrl = bestMp4Variant?.url || hlsVariant?.url;
  const isHls = !bestMp4Variant && hlsVariant;

  useEffect(() => {
    if (!isPlaying || !videoRef.current || !preferredUrl) return;

    const video = videoRef.current;
    setError(null);

    // If it's an HLS stream and HLS.js is supported
    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        xhrSetup: (xhr: XMLHttpRequest) => {
          xhr.withCredentials = false;
        },
      });
      
      hlsRef.current = hls;
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          setError(`Video error: ${data.type}`);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.log('Fatal error, destroying HLS');
              hls.destroy();
              break;
          }
        }
      });

      hls.loadSource(preferredUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => {
          console.error('Play error:', e);
          setError('Failed to play video');
        });
      });

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    } 
    // If it's HLS but on Safari (native HLS support)
    else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = preferredUrl;
      video.play().catch(e => {
        console.error('Play error:', e);
        setError('Failed to play video');
      });
    }
    // Regular MP4
    else {
      video.src = preferredUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => {
          console.error('Play error:', e);
          setError('Failed to play video');
        });
      });
      
      video.addEventListener('error', (e) => {
        console.error('Video error:', e);
        setError('Failed to load video');
      });
    }
  }, [isPlaying, preferredUrl, isHls]);

  if (!preferredUrl) return null;

  return (
    <div className="relative w-full rounded-xl overflow-hidden">
      {!isPlaying ? (
        <>
          <img
            src={`${import.meta.env.VITE_BOT_BASE_URL}/api/token-icon?url=${String(video.video_preview_url)}`}
            alt="Video preview"
            className="w-full object-cover rounded-xl h-40"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <svg
              className="w-12 h-12 text-white cursor-pointer hover:scale-110 transition-transform"
              fill="currentColor"
              viewBox="0 0 24 24"
              onClick={() => setIsPlaying(true)}
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            controls
            className="w-full object-cover rounded-xl h-40 bg-black"
            onClick={(e) => e.stopPropagation()}
            playsInline
            preload="metadata"
          />
          {error && (
            <div className="absolute inset-0 flex items-center h-40 justify-center bg-black/80 text-white text-sm p-4">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TweetVideo;