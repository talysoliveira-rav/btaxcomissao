/**
 * Ilustrações de flores em traço fino (só contorno), usadas como marca d'água sutil em cada aba.
 * viewBox 0 0 200 200; herdam a cor via currentColor.
 */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      {children}
    </svg>
  );
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

export function Rose(p: P) {
  return (
    <Svg {...p}>
      {/* miolo em espiral */}
      <path d="M100 66c-5-1-9 3-8 8 1 6 10 7 13 2 3-6-2-13-10-13-9 0-15 9-12 18 4 10 19 12 26 3" />
      <path d="M86 70c-9 8-11 22-3 31 8 9 24 10 33 1 7-7 8-18 2-26" />
      {/* pétalas */}
      <path d="M80 62c-15 2-25 17-22 33 3 18 21 29 40 27 19-2 33-17 31-36-1-12-8-21-18-25" />
      <path d="M72 84c-12 0-20 9-18 20 3 17 22 31 46 31 23 0 41-13 44-30 2-11-6-19-17-18" />
      <path d="M58 98c-6 4-8 11-5 18 6 13 24 22 47 22" />
      <path d="M142 98c6 4 8 11 5 18-6 13-24 22-47 22" />
      {/* caule e folhas */}
      <path d="M100 138c-2 18 2 36-1 58" />
      <path d="M100 160c-12-11-31-13-42-5 12 9 30 11 42 5z" />
      <path d="M100 160c-14-2-28-4-42-5" />
      <path d="M100 176c11-13 29-17 41-11-10 11-27 15-41 11z" />
      <path d="M100 176c13-5 27-9 41-11" />
      <path d="M99 148l-5-4M101 186l5-3" />
    </Svg>
  );
}

export function Sunflower(p: P) {
  const cx = 100, cy = 82;
  return (
    <Svg {...p}>
      {range(18).map((i) => (
        <path key={i} d={`M${cx} ${cy - 26}c-7-12-8-28 0-40 8 12 7 28 0 40z`} transform={`rotate(${i * 20} ${cx} ${cy})`} />
      ))}
      {range(18).map((i) => (
        <path key={`b${i}`} d={`M${cx} ${cy - 24}c-5-9-5-20 0-28 5 8 5 19 0 28z`} transform={`rotate(${i * 20 + 10} ${cx} ${cy})`} opacity={0.6} />
      ))}
      <circle cx={cx} cy={cy} r={24} />
      <circle cx={cx} cy={cy} r={17} />
      {/* sementes em espiral */}
      {range(34).map((i) => {
        const a = i * 137.5 * (Math.PI / 180);
        const r = 2.6 * Math.sqrt(i + 1);
        return <circle key={`s${i}`} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={0.9} />;
      })}
      <path d="M100 108c1 28-2 56 1 88" />
      <path d="M100 150c-8-16-28-24-44-18 6 16 26 24 44 18z" />
      <path d="M100 150c-14-6-28-12-44-18" />
      <path d="M101 170c10-14 30-18 44-10-8 14-28 18-44 10z" />
    </Svg>
  );
}

export function Tulip(p: P) {
  return (
    <Svg {...p}>
      <path d="M78 52c-4 30 4 56 22 58 18-2 26-28 22-58-8 6-14 13-16 22-2-10-4-20-6-30-2 10-4 20-6 30-2-9-8-16-16-22z" />
      <path d="M100 44c-6 12-8 28-6 42M100 44c6 12 8 28 6 42" opacity={0.6} />
      <path d="M100 110c0 30-3 58-1 86" />
      <path d="M99 196c-6-34-22-60-44-74 4 30 20 54 44 74z" />
      <path d="M99 196c-12-26-26-50-44-74" />
      <path d="M100 168c6-22 20-40 40-50 0 24-16 42-40 50z" />
    </Svg>
  );
}

export function Daisy(p: P) {
  const cx = 100, cy = 78;
  return (
    <Svg {...p}>
      {range(16).map((i) => (
        <path key={i} d={`M${cx} ${cy - 11}c-5-10-5-30 0-42 5 12 5 32 0 42z`} transform={`rotate(${i * 22.5} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={10} />
      <circle cx={cx} cy={cy} r={5} opacity={0.6} />
      <path d="M100 120c-3 26 3 50 0 76" />
      <path d="M100 156c-10-8-24-8-32 0 10 6 22 7 32 0z" />
      <path d="M100 172c10-10 24-10 32-2-10 8-22 8-32 2z" />
      {/* botão fechado ao lado */}
      <path d="M100 140c14-10 28-20 36-40" />
      <path d="M136 100c-4-6-2-14 4-16 4 6 2 14-4 16z" />
    </Svg>
  );
}

export function Orchid(p: P) {
  return (
    <Svg {...p}>
      {/* haste arqueada */}
      <path d="M40 196c6-60 30-110 88-140" />
      {/* flor principal */}
      <g transform="translate(112 92)">
        <path d="M0 0c-8-20-6-40 6-50 10 12 8 34-6 50z" />
        <path d="M0 0c-22-6-38-20-38-34 18-2 32 14 38 34z" />
        <path d="M0 0c22-6 38-20 38-34-18-2-32 14-38 34z" />
        <path d="M0 0c-26 4-42 16-44 30 20 4 36-10 44-30z" />
        <path d="M0 0c26 4 42 16 44 30-20 4-36-10-44-30z" />
        <path d="M0 0c-8 8-10 22-2 30 4 4 10 4 12-2 4-10 0-22-10-28z" />
        <circle r={4} />
      </g>
      {/* botões */}
      <path d="M128 56c4-8 12-10 16-6-2 8-10 10-16 6z" />
      <path d="M66 140c-8-6-10-14-4-18 6 4 8 12 4 18z" />
      {/* folhas largas */}
      <path d="M40 196c20-16 52-18 74-8-22 14-52 16-74 8z" />
      <path d="M44 194c-14-14-16-34-6-48 12 14 14 32 6 48z" />
    </Svg>
  );
}

export function Lily(p: P) {
  const cx = 100, cy = 84;
  return (
    <Svg {...p}>
      {range(6).map((i) => (
        <g key={i} transform={`rotate(${i * 60} ${cx} ${cy})`}>
          <path d={`M${cx} ${cy}c-12-14-14-36-2-58 4 6 8 10 14 10-4 18-6 34-12 48z`} />
          <path d={`M${cx} ${cy}c-2-16 0-32 6-46`} opacity={0.5} />
        </g>
      ))}
      {/* estames */}
      {[-24, -8, 8, 24].map((a) => (
        <g key={a} transform={`rotate(${a} ${cx} ${cy})`}>
          <path d={`M${cx} ${cy}c0-10 0-20 2-30`} />
          <path d={`M${cx - 1} ${cy - 30}c2-3 6-3 6 1`} />
        </g>
      ))}
      <path d="M100 96c2 34-2 66 0 100" />
      <path d="M100 140c-16-4-30-14-36-28 16 2 30 12 36 28z" />
      <path d="M100 170c16-6 30-18 34-32-16 4-30 16-34 32z" />
    </Svg>
  );
}

export function Hibiscus(p: P) {
  const cx = 96, cy = 92;
  return (
    <Svg {...p}>
      {range(5).map((i) => (
        <g key={i} transform={`rotate(${i * 72} ${cx} ${cy})`}>
          <path d={`M${cx} ${cy}c-20-8-34-30-26-50 8-12 22-8 26 2 4-10 18-14 26-2 8 20-6 42-26 50z`} />
          <path d={`M${cx} ${cy}c-2-14-2-28 0-40`} opacity={0.45} />
        </g>
      ))}
      {/* estame longo */}
      <path d="M96 92c10-14 24-26 40-32" />
      {[0, 6, 12, 18].map((d) => (
        <circle key={d} cx={120 + d * 0.9} cy={70 - d * 0.5} r={1.6} />
      ))}
      <circle cx={138} cy={58} r={3} />
      <path d="M86 132c-8 20-6 42 2 64" />
      <path d="M88 168c-16-6-28-2-34 6 12 6 26 4 34-6z" />
    </Svg>
  );
}

export function Lotus(p: P) {
  return (
    <Svg {...p}>
      <path d="M100 52c-14 18-16 48 0 72 16-24 14-54 0-72z" />
      <path d="M100 124c-22-8-36-32-34-58 20 8 32 32 34 58z" />
      <path d="M100 124c22-8 36-32 34-58-20 8-32 32-34 58z" />
      <path d="M100 124c-30 0-52-18-60-40 26-2 50 16 60 40z" />
      <path d="M100 124c30 0 52-18 60-40-26-2-50 16-60 40z" />
      <path d="M100 124c-34 6-62-4-74-20 26-8 56 4 74 20z" />
      <path d="M100 124c34 6 62-4 74-20-26-8-56 4-74 20z" />
      {/* água */}
      <path d="M30 146c14-6 26 6 40 0s26-6 40 0 26 6 40 0 20-4 26 0" />
      <path d="M48 162c12-5 22 5 34 0s22-5 34 0 22 5 34 0" opacity={0.6} />
      <path d="M70 178c10-4 18 4 28 0s18-4 28 0" opacity={0.4} />
    </Svg>
  );
}

export function Lavender(p: P) {
  const stalk = (x: number, top: number, bend: number) => (
    <g key={x}>
      <path d={`M${x} 196c${bend / 2} -40 ${bend} -90 ${bend} -${196 - top}`} />
      {range(9).map((i) => {
        const y = top + i * 9;
        const bx = +(x + bend * (1 - (y - top) / (196 - top))).toFixed(1);
        const w = +(6 - i * 0.3).toFixed(1);
        return (
          <g key={i}>
            <path d={`M${bx} ${y}c${-w} -2 ${-w - 2} -7 ${-w} -10 ${w * 0.7} 0 ${w + 1} 4 ${w} 10z`} />
            <path d={`M${bx} ${y + 3}c${w} -2 ${w + 2} -7 ${w} -10 ${-w * 0.7} 0 ${-w - 1} 4 ${-w} 10z`} />
          </g>
        );
      })}
    </g>
  );
  return (
    <Svg {...p}>
      {stalk(84, 30, 6)}
      {stalk(104, 18, 2)}
      {stalk(124, 40, -6)}
      <path d="M78 196c-6-20-16-32-30-38 4 18 14 30 30 38z" />
      <path d="M128 196c6-22 18-34 34-38-6 18-18 30-34 38z" />
      {/* laço */}
      <path d="M90 170c10 4 18 4 28 0M104 172c-10 6-16 14-14 20M104 172c8 6 14 14 12 20" />
    </Svg>
  );
}

export function Fern(p: P) {
  // Ramo de eucalipto/oliveira: caule curvo com folhas alternadas
  const P0 = [52, 194], P1 = [62, 96], P2 = [150, 26];
  const at = (t: number) => [
    (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0],
    (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1],
  ];
  const angle = (t: number) => {
    const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]);
    const dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };
  const leaves = range(9).map((i) => {
    const t = 0.12 + i * 0.1;
    const [x, y] = at(t);
    const side = i % 2 === 0 ? -1 : 1;
    const size = 1 - i * 0.06;
    return { x: x.toFixed(1), y: y.toFixed(1), rot: (angle(t) + side * 50).toFixed(1), size: size.toFixed(2), side };
  });
  return (
    <Svg {...p}>
      <path d={`M${P0[0]} ${P0[1]}Q${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} />
      {leaves.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.rot}) scale(${l.size})`}>
          <path d="M0 0c10-12 30-14 42-2-10 12-30 14-42 2z" />
          <path d="M0 0c14-1 28-1 42-2" opacity={0.55} />
        </g>
      ))}
      <path d="M150 26c6-4 12-4 16 0-4 5-11 5-16 0z" />
    </Svg>
  );
}

export const FLOWER_BY_SECTION: Record<string, (p: P) => React.JSX.Element> = {
  inicio: Rose,
  pedidos: Tulip,
  producao: Lavender,
  entregas: Daisy,
  catalogo: Orchid,
  estoque: Sunflower,
  clientes: Lily,
  datas: Hibiscus,
  relatorios: Lotus,
  configuracoes: Fern,
};
