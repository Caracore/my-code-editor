export function useResize() {
  function startResizeRight(
    e: React.MouseEvent,
    setWidth: React.Dispatch<React.SetStateAction<number>>,
  ) {
    const startX = e.clientX;

    function onMouseMove(ev: MouseEvent) {
      const delta = ev.clientX - startX;
      setWidth((prev: number) => Math.max(150, prev - delta));
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function startResizeBottom(
    e: React.MouseEvent,
    setHeight: React.Dispatch<React.SetStateAction<number>>,
  ) {
    const startY = e.clientY;

    function onMouseMove(ev: MouseEvent) {
      const delta = ev.clientY - startY;
      setHeight((prev: number) => Math.max(100, prev - delta));
    }

    function onMouseUp() {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return { startResizeRight, startResizeBottom };
}
