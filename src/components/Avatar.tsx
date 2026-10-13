import { avatarSrc } from "@/lib/communityApi";

export default function Avatar({ name, url, size = 8 }: { name?: string | null; url?: string | null; size?: number }) {
  const src = avatarSrc(url);
  const px = `${size * 4}px`;
  return src ? (
    <img src={src} alt={name || ""} style={{ width: px, height: px }} className="rounded-full object-cover shrink-0" />
  ) : (
    <span
      style={{ width: px, height: px }}
      className="rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0"
    >
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}
