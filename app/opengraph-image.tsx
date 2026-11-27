import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Graphiti — Paint Pixel Art onto Your GitHub Contribution Graph";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INVADER_ICON = [
  [0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0],
  [0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0],
  [0, 0, 4, 4, 4, 4, 4, 4, 4, 0, 0],
  [0, 4, 4, 1, 4, 4, 4, 1, 4, 4, 0],
  [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [4, 0, 4, 0, 0, 0, 0, 0, 4, 0, 4],
  [0, 0, 0, 4, 4, 0, 4, 4, 0, 0, 0],
];

const COLORS: Record<number, string> = {
  0: "#161b22",
  1: "#0e4429",
  2: "#006d32",
  3: "#26a641",
  4: "#39d353",
};

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d1117",
          color: "#f0f6fc",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            border: "2px solid #30363d",
            borderRadius: "24px",
            backgroundColor: "#010409",
            padding: "48px 64px",
          }}
        >
          {/* Pixel Invader Showcase */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "36px" }}>
            {INVADER_ICON.map((row, rIdx) => (
              <div key={rIdx} style={{ display: "flex", gap: "8px" }}>
                {row.map((val, cIdx) => (
                  <div
                    key={cIdx}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      backgroundColor: COLORS[val],
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#ffffff",
              marginBottom: "12px",
            }}
          >
            Graphiti Studio
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "#8b949e",
              textAlign: "center",
            }}
          >
            Paint pixel art & text banners onto your GitHub contribution graph
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
