interface ResizeHandleProps {
  direction: "horizontal" | "vertical";
  onMouseDown: (e: React.MouseEvent) => void;
}

export default function ResizeHandle({
  direction,
  onMouseDown,
}: ResizeHandleProps) {
  const isHorizontal = direction === "horizontal";

  return (
    <div
      className="resizeHandle"
      onMouseDown={onMouseDown}
      style={{
        width: isHorizontal ? "5px" : "100%",
        height: isHorizontal ? "100%" : "5px",
        cursor: isHorizontal ? "col-resize" : "row-resize",
        background: "#333",
        flexShrink: 0,
        zIndex: 10,
      }}
    />
  );
}
