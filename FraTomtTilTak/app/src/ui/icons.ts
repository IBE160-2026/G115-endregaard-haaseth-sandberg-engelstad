// Icon helpers kept from v0.5 (moved out of ui/tabs/context in story 1.6).
// The icon set lives in assets/icons and is served as /icons/...

export const iconUrl = (path: string) => `${import.meta.env.BASE_URL}icons/${path}`;

export const icon = (path: string, size = 32) =>
  `<img src="${iconUrl(path)}" width="${size}" height="${size}" alt="">`;
