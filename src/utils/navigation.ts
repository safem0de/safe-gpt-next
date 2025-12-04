export const redirectTo = (url: string) => {
  if (globalThis.window === undefined) return;
  if (typeof globalThis.window.location?.assign === "function") {
    globalThis.window.location.assign(url);
  } else {
    globalThis.window.location.href = url;
  }
};
