const BRAND_DEFINITIONS = [
  { label: "Tesla", aliases: ["tesla"], models: ["model 3", "model y", "model s", "model x", "cybertruck"] },
  { label: "BMW", aliases: ["bmw"] },
  { label: "Mercedes-Benz", aliases: ["mercedes-benz", "mercedes benz", "mercedes"] },
  { label: "Audi", aliases: ["audi"] },
  { label: "Hyundai", aliases: ["hyundai"] },
  { label: "Tata Motors", aliases: ["tata motors", "tata"] },
  { label: "Mahindra", aliases: ["mahindra"] },
  { label: "Maruti Suzuki", aliases: ["maruti suzuki", "maruti", "suzuki"] },
  { label: "Honda", aliases: ["honda"] },
  { label: "Toyota", aliases: ["toyota"] },
  { label: "Kia", aliases: ["kia"] },
  { label: "MG", aliases: ["mg motor", "mg"] },
  { label: "Volkswagen", aliases: ["volkswagen", "vw"] },
  { label: "Skoda", aliases: ["skoda", "skoda auto"] },
  { label: "Renault", aliases: ["renault"] },
  { label: "Nissan", aliases: ["nissan"] },
  { label: "Ford", aliases: ["ford"] },
  { label: "Jeep", aliases: ["jeep"] },
  { label: "Volvo", aliases: ["volvo"] },
  { label: "Land Rover", aliases: ["land rover", "landrover"] },
  { label: "Jaguar", aliases: ["jaguar"] },
  { label: "Porsche", aliases: ["porsche"] },
  { label: "Lexus", aliases: ["lexus"] },
  { label: "Mini", aliases: ["mini cooper", "mini"] },
  { label: "BYD", aliases: ["byd"] },
  { label: "Citroen", aliases: ["citroen", "citroen"] },
  { label: "Fiat", aliases: ["fiat"] },
  { label: "Chevrolet", aliases: ["chevrolet", "chevy"] },
  { label: "Mitsubishi", aliases: ["mitsubishi"] },
  { label: "Isuzu", aliases: ["isuzu"] },
  { label: "Datsun", aliases: ["datsun"] },
];

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeBrandText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsTerm(text, term) {
  if (!text || !term) return false;
  const pattern = escapeRegex(term).replace(/\s+/g, "[\\s-]+");
  return new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`, "i").test(text);
}

function uniqueTerms(values) {
  return [...new Set(values.map(normalizeBrandText).filter((value) => value.length > 1))];
}

export function getBrandProfile(vehicle) {
  if (!vehicle) return null;

  const manufacturer = String(vehicle.manufacturer || "").trim();
  const model = String(vehicle.vehicle_model || "").trim();
  const haystack = normalizeBrandText(`${manufacturer} ${model}`);
  if (!haystack) return null;

  const knownBrand = BRAND_DEFINITIONS.find((brand) =>
    [...brand.aliases, ...(brand.models || [])].some((term) => containsTerm(haystack, normalizeBrandText(term)))
  );

  if (knownBrand) {
    return {
      label: knownBrand.label,
      terms: uniqueTerms([knownBrand.label, ...knownBrand.aliases]),
    };
  }

  if (!manufacturer) return null;

  return {
    label: manufacturer,
    terms: uniqueTerms([manufacturer, manufacturer.split(/\s+/)[0]]),
  };
}

export function brandMatchesText(text, profile) {
  const normalized = normalizeBrandText(text);
  if (!normalized || !profile?.terms?.length) return false;
  return profile.terms.some((term) => containsTerm(normalized, term));
}

export function brandOverpassPattern(term) {
  return escapeRegex(normalizeBrandText(term)).replace(/\s+/g, "[ _-]?");
}

export function getVehicleLabel(vehicle) {
  if (!vehicle) return null;
  return [vehicle.manufacturer, vehicle.vehicle_model]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ") || null;
}
