import { avatarSrc } from "@/lib/communityApi";

const DEFAULT_AVATAR = "/favicon.svg?v=5";

export default function Avatar({ name, url, size = 8 }: { name?: string | null; url?: string | null; size?: number }) {
  const src = avatarSrc(url) || DEFAULT_AVATAR;
  const px = `${size * 4}px`;
  return (
    <img
      src={src}
      alt={name || ""}
      style={{ width: px, height: px }}
      className="rounded-full object-cover shrink-0 bg-[#0d0d0d]"
      onError={(e) => {
        if (!e.currentTarget.src.endsWith(DEFAULT_AVATAR)) e.currentTarget.src = DEFAULT_AVATAR;
      }}
    />
  );
}
