import React from "react";

const BADGE_COLORS = {
  tesla: "#0F172A",
  bmw: "#FFFFFF",
  mercedes: "#FFFFFF",
  audi: "#FFFFFF",
  hyundai: "#FFFFFF",
  tata: "#FFFFFF",
  mahindra: "#FFFFFF",
  toyota: "#FFFFFF",
  honda: "#FFFFFF",
  maruti: "#FFFFFF",
  kia: "#111827",
  mg: "#FFFFFF",
  ford: "#FFFFFF",
  volkswagen: "#FFFFFF",
  skoda: "#FFFFFF",
  nissan: "#FFFFFF",
  renault: "#EFDF00",
  jaguar: "#FFFFFF",
  landrover: "#FFFFFF",
  volvo: "#FFFFFF",
  porsche: "#FFFFFF",
  jeep: "#FFFFFF",
  lexus: "#111827",
  mini: "#111827",
  byd: "#FFFFFF",
  ferrari: "#FFEB00",
  lamborghini: "#111827",
  mclaren: "#FFFFFF",
  bugatti: "#FFFFFF",
  rollsroyce: "#111827",
  bentley: "#FFFFFF",
  maserati: "#FFFFFF",
  astonmartin: "#FFFFFF",
  dodge: "#111827",
  chevrolet: "#FFFFFF",
  alfaromeo: "#FFFFFF",
};

const ACCENTS = {
  tesla: "#E11D48",
  bmw: "#0B6BB5",
  mercedes: "#111827",
  audi: "#C8102E",
  hyundai: "#002C5F",
  tata: "#1B4F8A",
  mahindra: "#C8102E",
  toyota: "#EB0A1E",
  honda: "#E11D48",
  maruti: "#0B4EA2",
  kia: "#C8102E",
  mg: "#C8102E",
  ford: "#00274C",
  volkswagen: "#001E50",
  skoda: "#4BA82E",
  nissan: "#C3002F",
  renault: "#1F2937",
  jaguar: "#1F2937",
  landrover: "#005A2B",
  volvo: "#1F2937",
  porsche: "#C8102E",
  jeep: "#1B4F3A",
  lexus: "#1F2937",
  mini: "#FFFFFF",
  byd: "#C8102E",
  ferrari: "#111827",
  lamborghini: "#D6A50B",
  mclaren: "#FF8000",
  bugatti: "#C8102E",
  rollsroyce: "#FFFFFF",
  bentley: "#1F2937",
  chevrolet: "#D6A50B",
  alfaromeo: "#1B4F8A",
};

function initials(value) {
  return String(value || "V")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "V";
}

function wordmark(text, fill, fontSize = 12) {
  return (
    <text x="20" y="21" textAnchor="middle" dominantBaseline="middle"
      fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" fontSize={fontSize}
      letterSpacing="0.5" fill={fill}>
      {text}
    </text>
  );
}

function emblem(brandKey, brand) {
  const accent = ACCENTS[brandKey] || "#2563EB";
  switch (brandKey) {
    case "tesla":
      return (
        <>
          <path d="M8 12.5h24M15.5 12.5v16M24.5 12.5v16M15.5 20h9M10.5 12.5c2.7-2.6 5.6-3.8 9.5-3.8s6.8 1.2 9.5 3.8"
            fill="none" stroke="#FFFFFF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "bmw":
      return (
        <>
          <circle cx="20" cy="20" r="17" fill="#0B1B33" />
          <circle cx="20" cy="20" r="13.5" fill="#FFFFFF" />
          <path d="M20 8a12 12 0 0 1 12 12H20Z" fill="#1C69D4" />
          <path d="M20 32a12 12 0 0 1-12-12h12Z" fill="#1C69D4" />
          <circle cx="20" cy="20" r="13.5" fill="none" stroke="#8C99AA" strokeWidth="1" />
        </>
      );
    case "mercedes":
      return (
        <>
          <circle cx="20" cy="20" r="17" fill="#FFFFFF" stroke="#1F2937" strokeWidth="2" />
          <circle cx="20" cy="20" r="12.5" fill="none" stroke="#C8CDD5" strokeWidth="1" />
          <path d="M20 7.5V20M20 20 9.2 27.2M20 20l10.8 7.2" fill="none" stroke="#1F2937" strokeWidth="2.3" strokeLinecap="round" />
        </>
      );
    case "audi":
      return (
        <g fill="none" stroke="#111827" strokeWidth="2">
          <circle cx="10.5" cy="20" r="5.4" />
          <circle cx="16.8" cy="20" r="5.4" />
          <circle cx="23.2" cy="20" r="5.4" />
          <circle cx="29.5" cy="20" r="5.4" />
        </g>
      );
    case "hyundai":
      return (
        <>
          <ellipse cx="20" cy="20" rx="16.8" ry="11.6" fill="none" stroke="#002C5F" strokeWidth="2" />
          <path d="M14 27 16.4 13M25.6 27 24 20M14.6 20h10.8M26 13l-1.6 7" fill="none"
            stroke="#002C5F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "tata":
      return (
        <>
          <ellipse cx="20" cy="20" rx="17.5" ry="12.5" fill="none" stroke="#1B4F8A" strokeWidth="2" />
          <path d="M11 14h18M20 14v13M15 27c2-.4 3.5-1.4 5-3M25 27c-2-.4-3.5-1.4-5-3"
            fill="none" stroke="#1B4F8A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "mahindra":
      return (
        <>
          <circle cx="20" cy="20" r="16.5" fill="none" stroke="#C8102E" strokeWidth="1.8" />
          <path d="M8 27V15l6 5 6-8 6 8 6-5v12" fill="none" stroke="#C8102E" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 27h24" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "toyota":
      return (
        <g fill="none" stroke="#EB0A1E" strokeWidth="1.7">
          <ellipse cx="20" cy="20" rx="17" ry="10.4" />
          <ellipse cx="20" cy="20" rx="7.2" ry="10.4" />
          <ellipse cx="20" cy="20" rx="10.4" ry="4.2" />
        </g>
      );
    case "honda":
      return (
        <>
          <rect x="7" y="7" width="26" height="26" rx="7" fill="none" stroke="#E11D48" strokeWidth="2" />
          <path d="M13 12v16M27 12v16M13 20h14" fill="none" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    case "maruti":
      return (
        <>
          <ellipse cx="20" cy="20" rx="17" ry="11.5" fill="none" stroke="#0B4EA2" strokeWidth="2" />
          <path d="M12 24c3-2 5-2 8 0s5 2 8 0M13 18c3-2 5-2 8 0s5 2 6 0" fill="none"
            stroke="#0B4EA2" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "kia":
      return wordmark("KIA", "#FFFFFF", 13);
    case "mg":
      return (
        <>
          <path d="M12 6h16l6 6v16l-6 6H12l-6-6V12Z" fill="none" stroke="#C8102E" strokeWidth="2" />
          {wordmark("MG", "#C8102E", 11)}
        </>
      );
    case "ford":
      return (
        <>
          <ellipse cx="20" cy="20" rx="17" ry="11" fill="#FFFFFF" stroke="#00274C" strokeWidth="2" />
          <text x="20" y="21.5" textAnchor="middle" dominantBaseline="middle"
            fontFamily="Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="12" fill="#00274C">Ford</text>
        </>
      );
    case "volkswagen":
      return (
        <>
          <circle cx="20" cy="20" r="16.5" fill="none" stroke="#001E50" strokeWidth="2" />
          <path d="M12 12l4 16 4-11 4 11 4-16" fill="none" stroke="#001E50" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "skoda":
      return (
        <>
          <circle cx="20" cy="20" r="16.5" fill="none" stroke="#4BA82E" strokeWidth="2" />
          <path d="M11 22c5-8 12-11 18-11-2 4-2 8 0 12-4-3-8-3-12 1l-6-2Z" fill="none"
            stroke="#4BA82E" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="20" cy="20" r="2.2" fill="#4BA82E" />
        </>
      );
    case "nissan":
      return (
        <>
          <circle cx="20" cy="20" r="16.5" fill="none" stroke="#C3002F" strokeWidth="2" />
          <path d="M8 20h24M14 14h12" stroke="#C3002F" strokeWidth="2.4" strokeLinecap="round" />
        </>
      );
    case "renault":
      return (
        <>
          <path d="M20 4 34 20 20 36 6 20Z" fill="none" stroke="#1F2937" strokeWidth="3" strokeLinejoin="round" />
          <path d="M20 11 28 20 20 29 12 20Z" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinejoin="round" />
        </>
      );
    case "jaguar":
      return (
        <>
          <path d="M6 24c5-2 7-6 12-7 4-1 7-2 12-5-2 4-2 6-4 9-4 5-12 6-20 3Z" fill="none"
            stroke="#1F2937" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="28.5" cy="15" r="1.1" fill="#1F2937" />
        </>
      );
    case "landrover":
      return (
        <>
          <ellipse cx="20" cy="20" rx="18" ry="11" fill="none" stroke="#005A2B" strokeWidth="2" />
          {wordmark("LR", "#005A2B", 11)}
        </>
      );
    case "volvo":
      return (
        <>
          <circle cx="19" cy="21" r="13" fill="none" stroke="#1F2937" strokeWidth="2.2" />
          <path d="M28 12 35 5M29 5h6v6" fill="none" stroke="#1F2937" strokeWidth="2.2" strokeLinecap="round" />
        </>
      );
    case "porsche":
      return (
        <>
          <path d="M8 8h24v12c0 8-5 13-12 17-7-4-12-9-12-17Z" fill="#FFFFFF" stroke="#C8102E" strokeWidth="2" />
          <path d="M20 8v29M8 18h24" stroke="#C8102E" strokeWidth="1" opacity="0.5" />
          {wordmark("P", "#1F2937", 11)}
        </>
      );
    case "jeep":
      return (
        <>
          <rect x="4" y="12" width="32" height="16" rx="4" fill="none" stroke="#1B4F3A" strokeWidth="2" />
          {wordmark("Jeep", "#1B4F3A", 11)}
        </>
      );
    case "lexus":
      return (
        <>
          <ellipse cx="20" cy="20" rx="17" ry="12" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <path d="M21 10v17h8" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "mini":
      return (
        <>
          <path d="M7 18 13 14 20 17 27 14 33 18M13 14v12M27 14v12" fill="none"
            stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {wordmark("MINI", "#FFFFFF", 8)}
        </>
      );
    case "byd":
      return (
        <>
          <ellipse cx="20" cy="20" rx="17" ry="11.5" fill="none" stroke="#C8102E" strokeWidth="2" />
          {wordmark("BYD", "#C8102E", 10)}
        </>
      );
    case "ferrari":
      return (
        <>
          <path d="M8 6h24v14c0 8-5 13-12 16-7-3-12-8-12-16Z" fill="#111827" />
          <path d="M20 12c-3 3-4 6-3 9l5 3 5-3c1-3 0-6-3-9" fill="none" stroke="#FFEB00" strokeWidth="1.6" />
          {wordmark("SF", "#FFEB00", 7)}
        </>
      );
    case "lamborghini":
      return (
        <>
          <path d="M8 6h24v14c0 8-5 13-12 16-7-3-12-8-12-16Z" fill="#111827" stroke="#D6A50B" strokeWidth="1.6" />
          <path d="M14 24c2-6 4-9 6-11 2 2 4 5 6 11l-3-2-3 3-3-3Z" fill="#D6A50B" />
        </>
      );
    case "mclaren":
      return (
        <>
          <path d="M6 26c8-11 17-15 28-16-6 5-9 9-12 14-5 0-10 1-16 2Z" fill="#FF8000" />
          <path d="M12 30c6-3 12-4 20-3" fill="none" stroke="#FF8000" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "bugatti":
      return (
        <>
          <ellipse cx="20" cy="20" rx="17" ry="11" fill="none" stroke="#C8102E" strokeWidth="2" />
          {wordmark("EB", "#C8102E", 12)}
        </>
      );
    case "rollsroyce":
      return (
        <>
          <path d="M11 10v20M18 10v20M11 10c5 2 7 6 7 10M29 10v20M22 10v20M29 10c-5 2-7 6-7 10"
            fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "bentley":
      return (
        <>
          <path d="M4 20 12 14v12ZM36 20 28 14v12Z" fill="#1F2937" />
          <circle cx="20" cy="20" r="8" fill="none" stroke="#1F2937" strokeWidth="2.4" />
          {wordmark("B", "#1F2937", 11)}
        </>
      );
    case "maserati":
      return (
        <>
          <path d="M20 6v20M14 16c0 8 2 12 6 15 4-3 6-7 6-15M14 16l-4-5M26 16l4-5"
            fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case "astonmartin":
      return (
        <>
          <path d="M6 22 20 14l14 8-14 8Z" fill="none" stroke="#005A2B" strokeWidth="2" strokeLinejoin="round" />
          {wordmark("AM", "#005A2B", 7)}
        </>
      );
    case "dodge":
      return (
        <>
          <path d="M10 10h5v20h-5zM17 10h5v20h-5zM24 10h5v20h-5z" fill="#C8102E" />
          <path d="M9 14h22M9 20h22M9 26h22" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.7" />
        </>
      );
    case "chevrolet":
      return (
        <>
          <path d="M8 18h8v-4h8v4h8v4h-8v4h-8v-4H8Z" fill="none" stroke="#D6A50B" strokeWidth="2.4" strokeLinejoin="round" />
        </>
      );
    case "alfaromeo":
      return (
        <>
          <circle cx="20" cy="20" r="16" fill="none" stroke="#1B4F8A" strokeWidth="2" />
          <path d="M20 6v9M20 11c-3 0-6 2-6 6h12c0-4-3-6-6-6ZM14 20v5h12v-5" fill="none"
            stroke="#8B1E2D" strokeWidth="2" strokeLinejoin="round" />
        </>
      );
    default:
      return wordmark(initials(brand), accent, 11);
  }
}

export default function BrandLogo({ brandKey = "generic", brand = "", size = 32, className = "" }) {
  const key = BADGE_COLORS[brandKey] ? brandKey : "generic";
  const background = BADGE_COLORS[key] || "#EFF6FF";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}
      role="img" aria-label={`${brand || key} logo`}>
      <title>{brand || key}</title>
      <rect width="40" height="40" rx="11" fill={background} />
      <rect x="0.5" y="0.5" width="39" height="39" rx="10.5" fill="none" stroke="rgba(15,23,42,0.08)" />
      {emblem(key, brand)}
    </svg>
  );
}
