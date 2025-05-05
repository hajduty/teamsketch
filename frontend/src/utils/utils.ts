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