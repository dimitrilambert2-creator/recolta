import { formatDateShort } from '../utils/format'

export default function ChartRecoltes({ data, totalInvesti }) {
  const W = 320, H = 120, PAD = { top: 10, right: 10, bottom: 28, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(totalInvesti, ...data.map(d => d.cumul)) * 1.1;
  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const toX = i => PAD.left + (data.length > 1 ? i * xStep : innerW / 2);
  const toY = v => PAD.top + innerH - (v / maxVal) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d.cumul)}`).join(" ");
  const areaPath = `${linePath} L${toX(data.length - 1)},${PAD.top + innerH} L${toX(0)},${PAD.top + innerH} Z`;

  const investiY = toY(totalInvesti);

  const xLabels = data.length <= 4
    ? data.map((d, i) => ({ i, label: formatDateShort(d.date) }))
    : [0, Math.floor(data.length / 3), Math.floor((2 * data.length) / 3), data.length - 1]
        .map(i => ({ i, label: formatDateShort(data[i].date) }));

  const yTicks = [0, 0.5, 1].map(f => ({
    val: maxVal * f,
    y: toY(maxVal * f),
    label: (maxVal * f).toFixed(0) + "€",
  }));

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#507030" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#507030" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => (
          <line key={i} x1={PAD.left} x2={PAD.left + innerW} y1={t.y} y2={t.y}
            stroke="#e0d0a0" strokeWidth="1" strokeDasharray="3,3" />
        ))}

        {investiY >= PAD.top && investiY <= PAD.top + innerH && (
          <>
            <line x1={PAD.left} x2={PAD.left + innerW} y1={investiY} y2={investiY}
              stroke="#a04020" strokeWidth="1" strokeDasharray="4,3" opacity="0.7" />
            <text x={PAD.left + innerW - 2} y={investiY - 3} textAnchor="end"
              fontSize="7" fill="#a04020" opacity="0.9">seuil</text>
          </>
        )}

        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="#507030" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.cumul)} r="3"
            fill="#fff9ee" stroke="#507030" strokeWidth="1.5" />
        ))}

        {yTicks.filter(t => t.val > 0).map((t, i) => (
          <text key={i} x={PAD.left - 4} y={t.y + 3} textAnchor="end"
            fontSize="7" fill="#a09060">{t.label}</text>
        ))}

        {xLabels.map(({ i, label }) => (
          <text key={i} x={toX(i)} y={H - 6} textAnchor="middle"
            fontSize="7" fill="#a09060">{label}</text>
        ))}

        {data.length > 0 && (
          <text x={toX(data.length - 1)} y={toY(data[data.length - 1].cumul) - 7}
            textAnchor="middle" fontSize="8" fontWeight="bold" fill="#507030">
            {data[data.length - 1].cumul.toFixed(2)}€
          </text>
        )}
      </svg>

      <div style={{ display: "flex", gap: 16, marginTop: 6, paddingLeft: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#507030" strokeWidth="2"/></svg>
          <span style={{ fontSize: 10, color: "#a09060" }}>Valeur récoltée (cumulée)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#a04020" strokeWidth="1" strokeDasharray="3,2"/></svg>
          <span style={{ fontSize: 10, color: "#a09060" }}>Seuil investi ({totalInvesti.toFixed(2)}€)</span>
        </div>
      </div>
    </div>
  );
}
