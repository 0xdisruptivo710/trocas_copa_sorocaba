/**
 * Cidades da Região Metropolitana de Sorocaba + entorno.
 * O app é focado nessa região; UF é sempre SP (não exibimos seletor).
 *
 * Lista usada em sugestões do LocationCapture e filtros do Explorar.
 */

export const SOROCABA_CITIES = [
  "Sorocaba",
  "Votorantim",
  "Araçoiaba da Serra",
  "Piedade",
  "Itapetininga",
  "Salto de Pirapora",
  "Iperó",
  "Tatuí",
  "Capela do Alto",
  "Cesário Lange",
  "Boituva",
  "Porto Feliz",
  "São Roque",
  "Mairinque",
  "Alumínio",
  "Ibiúna",
  "Pilar do Sul",
  "Sarapuí",
  "Salto",
  "Itu",
] as const;

export type SorocabaCity = (typeof SOROCABA_CITIES)[number];

export const REGION_LABEL = "Sorocaba e região";
export const REGION_UF = "SP";
