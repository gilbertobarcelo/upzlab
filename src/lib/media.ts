export const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;
export const MAX_VIDEO_MB = 50;
export const MAX_IMAGE_MB = 10;

export function isVideoPost(post: { imageUrl?: string; isVideo?: boolean }): boolean {
  return !!post.isVideo || (!!post.imageUrl && VIDEO_EXT.test(post.imageUrl));
}

export function validateMedia(file: File): string | null {
  const video = file.type.startsWith("video/");
  const limit = (video ? MAX_VIDEO_MB : MAX_IMAGE_MB) * 1024 * 1024;
  return file.size > limit
    ? `Arquivo muito grande. Limite de ${video ? MAX_VIDEO_MB : MAX_IMAGE_MB} MB para ${video ? "vídeos" : "imagens"}.`
    : null;
}
