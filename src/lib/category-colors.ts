// Paleta de cores distintas e vibrantes para categorias
const CATEGORY_COLORS = [
  "#f97316", // laranja
  "#8b5cf6", // roxo
  "#06b6d4", // ciano
  "#ec4899", // rosa
  "#eab308", // amarelo
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#f43f5e", // rosa forte
  "#84cc16", // lima
  "#a855f7", // violeta
  "#22d3ee", // azul claro
  "#fb923c", // laranja claro
  "#e879f9", // magenta
  "#34d399", // verde menta
  "#facc15", // dourado
  "#38bdf8", // azul sky
  "#f472b6", // pink
  "#a3e635", // verde limão
  "#c084fc", // lilás
  "#2dd4bf", // turquesa
  "#fbbf24", // âmbar
  "#818cf8", // azul lavanda
  "#fb7185", // coral
  "#4ade80", // verde
];

export function pickCategoryColor(usedColors: string[]): string {
  const usedSet = new Set(usedColors.map((c) => c.toLowerCase()));

  // Tenta encontrar uma cor da paleta que não está em uso
  for (const color of CATEGORY_COLORS) {
    if (!usedSet.has(color.toLowerCase())) return color;
  }

  // Se todas estiverem em uso, gera uma cor HSL aleatória com boa saturação
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 55%)`;
}
