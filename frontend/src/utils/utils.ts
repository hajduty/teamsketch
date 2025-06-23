export const getTransformedPointer = (stage: any) => {
  const scale = stage.scaleX();
  const position = stage.position();
  const pointer = stage.getPointerPosition();

  return {
    x: (pointer.x - position.x) / scale,
    y: (pointer.y - position.y) / scale
  };
};

export const generateHistoryId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export function getUUID() {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  } else {
    // Simple UUID v4 fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
