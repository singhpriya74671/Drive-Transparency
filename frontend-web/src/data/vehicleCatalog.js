// Centralized vehicle catalog.
// Add new models here and the 3D visual, brand logo and diagnostics pick them up
// automatically. "model3D" is reserved for a future GLTF/GLB asset path - when a
// real asset is supplied, the procedural geometry below is used only as fallback.

const geometry = (overrides = {}) => ({
  length: 4.6,
  width: 1.86,
  ride: 0.28,
  bodyTop: 0.92,
  roofTop: 1.46,
  roofFront: 0.85,
  roofRear: -0.95,
  rearSlope: 0.4,
  frontSlope: 0.55,
  noseDrop: 0.14,
  wheelbase: 2.85,
  wheelRadius: 0.44,
  tyreWidth: 0.3,
  openTop: false,
  roofRack: false,
  spare: false,
  spoiler: null,
  rearStyle: "hatch",
  ...overrides,
});

export const BODY_LABELS = {
  sedan: "Sedan",
  hatchback: "Hatchback",
  suv: "SUV",
  crossover: "Crossover",
  coupe: "Coupe",
  convertible: "Convertible",
  cabriolet: "Cabriolet",
  roadster: "Roadster",
  wagon: "Station Wagon",
  minivan: "Minivan",
  van: "Van",
  pickup: "Pickup Truck",
  offroad: "Off-road Vehicle",
  sport: "Sport",
  supercar: "Supercar",
  hypercar: "Hypercar",
  muscle: "Muscle",
  luxury: "Luxury Car",
  limousine: "Limousine",
  micro: "Micro",
  f1: "Formula 1",
};

export const BODY_TYPES = {
  sedan: geometry({
    length: 4.75, bodyTop: 0.93, roofTop: 1.44, roofFront: 0.86, roofRear: -0.92,
    rearSlope: 0.42, frontSlope: 0.58, wheelbase: 2.85, noseDrop: 0.16,
  }),
  hatchback: geometry({
    length: 4.1, bodyTop: 0.92, roofTop: 1.45, roofFront: 0.72, roofRear: -1.42,
    rearSlope: 0.16, frontSlope: 0.55, wheelbase: 2.5, noseDrop: 0.14,
  }),
  suv: geometry({
    length: 4.8, width: 1.94, ride: 0.36, bodyTop: 1.05, roofTop: 1.72,
    roofFront: 1.02, roofRear: -1.62, rearSlope: 0.18, frontSlope: 0.52,
    wheelbase: 2.9, wheelRadius: 0.49, tyreWidth: 0.34, noseDrop: 0.12,
  }),
  crossover: geometry({
    length: 4.7, width: 1.9, ride: 0.32, bodyTop: 1.0, roofTop: 1.62,
    roofFront: 0.98, roofRear: -1.45, rearSlope: 0.28, frontSlope: 0.55,
    wheelbase: 2.85, wheelRadius: 0.47, tyreWidth: 0.32, noseDrop: 0.12,
  }),
  coupe: geometry({
    length: 4.6, bodyTop: 0.88, roofTop: 1.34, roofFront: 0.72, roofRear: -1.1,
    rearSlope: 0.78, frontSlope: 0.62, wheelbase: 2.8, wheelRadius: 0.45, noseDrop: 0.16,
  }),
  convertible: geometry({
    length: 4.5, bodyTop: 0.88, roofTop: 1.24, roofFront: 0.72, roofRear: -1.0,
    rearSlope: 0.5, frontSlope: 0.6, openTop: true, wheelbase: 2.75, wheelRadius: 0.44,
  }),
  cabriolet: geometry({
    length: 4.65, bodyTop: 0.9, roofTop: 1.26, roofFront: 0.75, roofRear: -1.05,
    rearSlope: 0.55, frontSlope: 0.6, openTop: true, wheelbase: 2.8, wheelRadius: 0.45,
  }),
  roadster: geometry({
    length: 4.15, width: 1.88, ride: 0.24, bodyTop: 0.82, roofTop: 1.16,
    roofFront: 0.55, roofRear: -1.0, rearSlope: 0.55, frontSlope: 0.58,
    openTop: true, wheelbase: 2.55, wheelRadius: 0.42, noseDrop: 0.18,
  }),
  wagon: geometry({
    length: 4.85, bodyTop: 0.95, roofTop: 1.5, roofFront: 0.9, roofRear: -1.85,
    rearSlope: 0.12, frontSlope: 0.55, wheelbase: 2.95, wheelRadius: 0.45,
    roofRack: true,
  }),
  minivan: geometry({
    length: 4.75, width: 1.92, ride: 0.32, bodyTop: 1.08, roofTop: 1.82,
    roofFront: 1.12, roofRear: -1.85, rearSlope: 0.12, frontSlope: 0.42,
    wheelbase: 2.9, wheelRadius: 0.46, roofRack: true,
  }),
  van: geometry({
    length: 5.0, width: 1.98, ride: 0.34, bodyTop: 1.15, roofTop: 1.95,
    roofFront: 1.25, roofRear: -2.0, rearSlope: 0.08, frontSlope: 0.35,
    wheelbase: 3.1, wheelRadius: 0.47, tyreWidth: 0.34, roofRack: true, rearStyle: "van",
  }),
  pickup: geometry({
    length: 5.25, width: 1.98, ride: 0.42, bodyTop: 1.08, roofTop: 1.72,
    roofFront: 1.02, roofRear: -0.45, rearSlope: 0.2, frontSlope: 0.5,
    wheelbase: 3.25, wheelRadius: 0.5, tyreWidth: 0.36, rearStyle: "bed",
  }),
  offroad: geometry({
    length: 4.65, width: 1.96, ride: 0.46, bodyTop: 1.14, roofTop: 1.86,
    roofFront: 1.08, roofRear: -1.75, rearSlope: 0.1, frontSlope: 0.3,
    wheelbase: 2.75, wheelRadius: 0.52, tyreWidth: 0.36, spare: true, roofRack: true,
  }),
  sport: geometry({
    length: 4.55, width: 1.98, ride: 0.24, bodyTop: 0.8, roofTop: 1.22,
    roofFront: 0.62, roofRear: -1.05, rearSlope: 0.7, frontSlope: 0.6,
    wheelbase: 2.8, wheelRadius: 0.45, tyreWidth: 0.34, spoiler: "wing", noseDrop: 0.18,
  }),
  supercar: geometry({
    length: 4.6, width: 2.05, ride: 0.2, bodyTop: 0.74, roofTop: 1.12,
    roofFront: 0.5, roofRear: -0.95, rearSlope: 0.65, frontSlope: 0.55,
    wheelbase: 2.8, wheelRadius: 0.43, tyreWidth: 0.36, spoiler: "wing", noseDrop: 0.2,
  }),
  hypercar: geometry({
    length: 4.75, width: 2.08, ride: 0.18, bodyTop: 0.72, roofTop: 1.08,
    roofFront: 0.45, roofRear: -1.0, rearSlope: 0.6, frontSlope: 0.5,
    wheelbase: 2.85, wheelRadius: 0.42, tyreWidth: 0.38, spoiler: "wing", noseDrop: 0.22,
  }),
  muscle: geometry({
    length: 4.9, width: 1.98, ride: 0.26, bodyTop: 0.86, roofTop: 1.32,
    roofFront: 0.62, roofRear: -1.15, rearSlope: 0.5, frontSlope: 0.65,
    wheelbase: 2.95, wheelRadius: 0.46, tyreWidth: 0.36, spoiler: "lip", noseDrop: 0.16,
  }),
  luxury: geometry({
    length: 5.15, width: 1.94, ride: 0.3, bodyTop: 0.98, roofTop: 1.52,
    roofFront: 0.98, roofRear: -1.35, rearSlope: 0.48, frontSlope: 0.6,
    wheelbase: 3.15, wheelRadius: 0.47,
  }),
  limousine: geometry({
    length: 5.6, width: 1.96, ride: 0.3, bodyTop: 1.0, roofTop: 1.56,
    roofFront: 1.1, roofRear: -1.85, rearSlope: 0.3, frontSlope: 0.55,
    wheelbase: 3.45, wheelRadius: 0.47,
  }),
  micro: geometry({
    length: 3.55, width: 1.62, ride: 0.3, bodyTop: 0.94, roofTop: 1.5,
    roofFront: 0.66, roofRear: -1.2, rearSlope: 0.18, frontSlope: 0.4,
    wheelbase: 2.2, wheelRadius: 0.36, tyreWidth: 0.24, noseDrop: 0.1,
  }),
  f1: geometry({
    length: 5.0, width: 2.0, ride: 0.1, bodyTop: 0.42, roofTop: 0.78,
    roofFront: 0.3, roofRear: -0.6, wheelbase: 3.4, wheelRadius: 0.38, tyreWidth: 0.34,
    spoiler: "f1", noseDrop: 0.3,
  }),
};

export const BRANDS = {
  tesla: { name: "Tesla", paint: "#E9EEF4", accent: "#E11D48", defaultBody: "crossover", grille: "none", keywords: ["tesla"] },
  bmw: { name: "BMW", paint: "#2A4A72", accent: "#0B6BB5", defaultBody: "sedan", grille: "twin", keywords: ["bmw", "bayerische"] },
  mercedes: { name: "Mercedes-Benz", paint: "#C8CDD5", accent: "#111827", defaultBody: "sedan", grille: "wide", keywords: ["mercedes", "benz", "mercedesbenz"] },
  audi: { name: "Audi", paint: "#3C424B", accent: "#C8102E", defaultBody: "sedan", grille: "single", keywords: ["audi"] },
  hyundai: { name: "Hyundai", paint: "#E4E9F0", accent: "#002C5F", defaultBody: "suv", grille: "wide", keywords: ["hyundai"] },
  tata: { name: "Tata", paint: "#2F6DB5", accent: "#1B4F8A", defaultBody: "suv", grille: "single", keywords: ["tata", "tatamotors"] },
  mahindra: { name: "Mahindra", paint: "#2C2C2E", accent: "#C8102E", defaultBody: "suv", grille: "mesh", keywords: ["mahindra"] },
  toyota: { name: "Toyota", paint: "#E7EAEE", accent: "#EB0A1E", defaultBody: "suv", grille: "wide", keywords: ["toyota"] },
  honda: { name: "Honda", paint: "#DCE3EA", accent: "#E11D48", defaultBody: "sedan", grille: "mesh", keywords: ["honda"] },
  maruti: { name: "Maruti Suzuki", paint: "#D9DEE6", accent: "#0B4EA2", defaultBody: "hatchback", grille: "mesh", keywords: ["maruti", "suzuki"] },
  kia: { name: "Kia", paint: "#C9D2DC", accent: "#C8102E", defaultBody: "suv", grille: "wide", keywords: ["kia"] },
  mg: { name: "MG", paint: "#B23A3A", accent: "#C8102E", defaultBody: "suv", grille: "mesh", keywords: ["mgmotor"] },
  ford: { name: "Ford", paint: "#3B5F8A", accent: "#00274C", defaultBody: "suv", grille: "wide", keywords: ["ford"] },
  volkswagen: { name: "Volkswagen", paint: "#C8CDD4", accent: "#001E50", defaultBody: "hatchback", grille: "wide", keywords: ["volkswagen"] },
  skoda: { name: "Skoda", paint: "#2F5D50", accent: "#4BA82E", defaultBody: "sedan", grille: "single", keywords: ["skoda"] },
  nissan: { name: "Nissan", paint: "#B9C2CC", accent: "#C3002F", defaultBody: "crossover", grille: "wide", keywords: ["nissan"] },
  renault: { name: "Renault", paint: "#DDE3EA", accent: "#EFDF00", defaultBody: "crossover", grille: "single", keywords: ["renault"] },
  jaguar: { name: "Jaguar", paint: "#27313D", accent: "#1F2937", defaultBody: "sedan", grille: "wide", keywords: ["jaguar"] },
  landrover: { name: "Land Rover", paint: "#3E4A3A", accent: "#005A2B", defaultBody: "suv", grille: "wide", keywords: ["landrover"] },
  volvo: { name: "Volvo", paint: "#2E3742", accent: "#1F2937", defaultBody: "suv", grille: "wide", keywords: ["volvo"] },
  porsche: { name: "Porsche", paint: "#D7DCE2", accent: "#C8102E", defaultBody: "sport", grille: "wide", keywords: ["porsche"] },
  jeep: { name: "Jeep", paint: "#4A5A3A", accent: "#1B4F3A", defaultBody: "offroad", grille: "wide", keywords: ["jeep"] },
  lexus: { name: "Lexus", paint: "#E4E8ED", accent: "#1F2937", defaultBody: "suv", grille: "wide", keywords: ["lexus"] },
  mini: { name: "Mini", paint: "#C9CED6", accent: "#111827", defaultBody: "hatchback", grille: "single", keywords: ["minicooper", "mini"] },
  byd: { name: "BYD", paint: "#DCE4EC", accent: "#C8102E", defaultBody: "suv", grille: "none", keywords: ["byd"] },
  ferrari: { name: "Ferrari", paint: "#C0392B", accent: "#FFEB00", defaultBody: "supercar", grille: "wide", keywords: ["ferrari"] },
  lamborghini: { name: "Lamborghini", paint: "#D6A50B", accent: "#111827", defaultBody: "supercar", grille: "wide", keywords: ["lamborghini"] },
  mclaren: { name: "McLaren", paint: "#E67E22", accent: "#FF8000", defaultBody: "supercar", grille: "single", keywords: ["mclaren"] },
  bugatti: { name: "Bugatti", paint: "#2C3E50", accent: "#C8102E", defaultBody: "hypercar", grille: "single", keywords: ["bugatti"] },
  rollsroyce: { name: "Rolls-Royce", paint: "#E8E8E8", accent: "#111827", defaultBody: "limousine", grille: "wide", keywords: ["rollsroyce"] },
  bentley: { name: "Bentley", paint: "#2F3B47", accent: "#1F2937", defaultBody: "coupe", grille: "wide", keywords: ["bentley"] },
  maserati: { name: "Maserati", paint: "#2F4C6B", accent: "#1F2937", defaultBody: "sedan", grille: "wide", keywords: ["maserati"] },
  astonmartin: { name: "Aston Martin", paint: "#1F4A3F", accent: "#005A2B", defaultBody: "sport", grille: "wide", keywords: ["astonmartin"] },
  dodge: { name: "Dodge", paint: "#B33A3A", accent: "#111827", defaultBody: "muscle", grille: "mesh", keywords: ["dodge"] },
  chevrolet: { name: "Chevrolet", paint: "#2F5F8F", accent: "#D6A50B", defaultBody: "muscle", grille: "wide", keywords: ["chevrolet", "chevy"] },
  alfaromeo: { name: "Alfa Romeo", paint: "#8B1E2D", accent: "#1B4F8A", defaultBody: "sedan", grille: "single", keywords: ["alfaromeo", "alfa"] },
  generic: { name: "Vehicle", paint: "#DDE3EA", accent: "#2563EB", defaultBody: "sedan", grille: "mesh", keywords: [] },
};

const model = (brandKey, name, bodyType, extra = {}) => ({ brandKey, model: name, bodyType, ...extra });

export const VEHICLE_MODELS = [
  // Tesla
  model("tesla", "Model Y", "crossover", { electric: true, aliases: ["modely"] }),
  model("tesla", "Model 3", "sedan", { electric: true, aliases: ["model3"] }),
  model("tesla", "Model S", "sedan", { electric: true, aliases: ["models"] }),
  model("tesla", "Model X", "suv", { electric: true, aliases: ["modelx"] }),
  model("tesla", "Cybertruck", "pickup", { electric: true, paint: "#9AA4AE", aliases: ["cybertruck"] }),
  // BMW
  model("bmw", "X5", "suv", { aliases: ["x5", "xdrive40i"] }),
  model("bmw", "X3", "suv", { aliases: ["x3"] }),
  model("bmw", "X7", "suv", { aliases: ["x7"] }),
  model("bmw", "X1", "crossover", { aliases: ["x1"] }),
  model("bmw", "3 Series", "sedan", { aliases: ["3series", "330i", "320d", "330e", "3series"] }),
  model("bmw", "5 Series", "sedan", { aliases: ["5series", "530i", "520d"] }),
  model("bmw", "7 Series", "luxury", { aliases: ["7series", "740i", "730d"] }),
  model("bmw", "M3", "sport", { aliases: ["m3"] }),
  model("bmw", "i4", "sedan", { electric: true, aliases: ["i4"] }),
  model("bmw", "iX", "suv", { electric: true, aliases: ["ix"] }),
  // Mercedes-Benz
  model("mercedes", "C-Class", "sedan", { aliases: ["cclass", "c200", "c300"] }),
  model("mercedes", "E-Class", "sedan", { aliases: ["eclass", "e200", "e300"] }),
  model("mercedes", "S-Class", "limousine", { aliases: ["sclass", "s500", "s400"] }),
  model("mercedes", "GLC", "suv", { aliases: ["glc"] }),
  model("mercedes", "GLE", "suv", { aliases: ["gle"] }),
  model("mercedes", "G-Class", "offroad", { aliases: ["gclass", "gwagon", "g63"] }),
  model("mercedes", "A-Class", "hatchback", { aliases: ["aclass", "a200"] }),
  model("mercedes", "EQS", "sedan", { electric: true, aliases: ["eqs"] }),
  // Audi
  model("audi", "Q5", "suv", { aliases: ["q5"] }),
  model("audi", "Q7", "suv", { aliases: ["q7"] }),
  model("audi", "Q8", "suv", { aliases: ["q8"] }),
  model("audi", "Q3", "crossover", { aliases: ["q3"] }),
  model("audi", "A4", "sedan", { aliases: ["a4"] }),
  model("audi", "A6", "sedan", { aliases: ["a6"] }),
  model("audi", "A3", "hatchback", { aliases: ["a3"] }),
  model("audi", "e-tron", "suv", { electric: true, aliases: ["etron"] }),
  model("audi", "R8", "supercar", { aliases: ["r8"] }),
  // Hyundai
  model("hyundai", "Creta", "suv", { aliases: ["creta"] }),
  model("hyundai", "i20", "hatchback", { aliases: ["i20"] }),
  model("hyundai", "Verna", "sedan", { aliases: ["verna", "accent"] }),
  model("hyundai", "Tucson", "suv", { aliases: ["tucson"] }),
  model("hyundai", "Venue", "crossover", { aliases: ["venue"] }),
  model("hyundai", "Ioniq 5", "crossover", { electric: true, aliases: ["ioniq5"] }),
  model("hyundai", "Santro", "micro", { aliases: ["santro"] }),
  // Tata
  model("tata", "Nexon", "suv", { aliases: ["nexon"] }),
  model("tata", "Nexon EV", "suv", { electric: true, aliases: ["nexonev"] }),
  model("tata", "Punch", "micro", { aliases: ["punch"] }),
  model("tata", "Harrier", "suv", { aliases: ["harrier"] }),
  model("tata", "Safari", "suv", { aliases: ["safari"] }),
  model("tata", "Altroz", "hatchback", { aliases: ["altroz"] }),
  model("tata", "Tiago", "hatchback", { aliases: ["tiago"] }),
  model("tata", "Tigor", "sedan", { aliases: ["tigor"] }),
  model("tata", "Curvv", "coupe", { aliases: ["curvv"] }),
  // Mahindra
  model("mahindra", "Thar", "offroad", { aliases: ["thar"] }),
  model("mahindra", "Scorpio", "suv", { aliases: ["scorpio"] }),
  model("mahindra", "Scorpio N", "suv", { aliases: ["scorpion"] }),
  model("mahindra", "XUV700", "suv", { aliases: ["xuv700"] }),
  model("mahindra", "XUV300", "suv", { aliases: ["xuv300"] }),
  model("mahindra", "XUV400", "suv", { electric: true, aliases: ["xuv400"] }),
  model("mahindra", "Bolero", "suv", { aliases: ["bolero"] }),
  // Toyota
  model("toyota", "Fortuner", "suv", { aliases: ["fortuner"] }),
  model("toyota", "Innova", "minivan", { aliases: ["innova"] }),
  model("toyota", "Innova Crysta", "minivan", { aliases: ["innovacrysta"] }),
  model("toyota", "Camry", "sedan", { aliases: ["camry"] }),
  model("toyota", "Corolla", "sedan", { aliases: ["corolla"] }),
  model("toyota", "Hilux", "pickup", { aliases: ["hilux"] }),
  model("toyota", "Land Cruiser", "suv", { aliases: ["landcruiser"] }),
  model("toyota", "Supra", "sport", { aliases: ["supra"] }),
  model("toyota", "Prius", "hatchback", { electric: true, aliases: ["prius"] }),
  model("toyota", "Glanza", "hatchback", { aliases: ["glanza"] }),
  model("toyota", "Urban Cruiser", "suv", { aliases: ["urbancruiser"] }),
  // Honda
  model("honda", "City", "sedan", { aliases: ["city"] }),
  model("honda", "Civic", "sedan", { aliases: ["civic"] }),
  model("honda", "CR-V", "suv", { aliases: ["crv"] }),
  model("honda", "Amaze", "sedan", { aliases: ["amaze"] }),
  model("honda", "Jazz", "hatchback", { aliases: ["jazz"] }),
  model("honda", "Elevate", "suv", { aliases: ["elevate"] }),
  // Maruti Suzuki
  model("maruti", "Swift", "hatchback", { aliases: ["swift"] }),
  model("maruti", "Baleno", "hatchback", { aliases: ["baleno"] }),
  model("maruti", "Dzire", "sedan", { aliases: ["dzire", "swiftdzire"] }),
  model("maruti", "Brezza", "suv", { aliases: ["brezza"] }),
  model("maruti", "Ertiga", "minivan", { aliases: ["ertiga"] }),
  model("maruti", "Grand Vitara", "suv", { aliases: ["grandvitara"] }),
  model("maruti", "Fronx", "crossover", { aliases: ["fronx"] }),
  model("maruti", "Wagon R", "micro", { aliases: ["wagonr"] }),
  // Kia
  model("kia", "Seltos", "suv", { aliases: ["seltos"] }),
  model("kia", "Sonet", "suv", { aliases: ["sonet"] }),
  model("kia", "Carens", "minivan", { aliases: ["carens"] }),
  model("kia", "Carnival", "minivan", { aliases: ["carnival"] }),
  model("kia", "EV6", "crossover", { electric: true, aliases: ["ev6"] }),
  // MG
  model("mg", "Hector", "suv", { aliases: ["hector"] }),
  model("mg", "Astor", "suv", { aliases: ["astor"] }),
  model("mg", "ZS EV", "suv", { electric: true, aliases: ["zsev"] }),
  // Ford
  model("ford", "Mustang", "muscle", { aliases: ["mustang"] }),
  model("ford", "Endeavour", "suv", { aliases: ["endeavour", "everest"] }),
  model("ford", "EcoSport", "suv", { aliases: ["ecosport"] }),
  model("ford", "Ranger", "pickup", { aliases: ["ranger"] }),
  model("ford", "F-150", "pickup", { aliases: ["f150"] }),
  // Volkswagen
  model("volkswagen", "Polo", "hatchback", { aliases: ["polo"] }),
  model("volkswagen", "Vento", "sedan", { aliases: ["vento"] }),
  model("volkswagen", "Virtus", "sedan", { aliases: ["virtus"] }),
  model("volkswagen", "Taigun", "suv", { aliases: ["taigun"] }),
  model("volkswagen", "Tiguan", "suv", { aliases: ["tiguan"] }),
  model("volkswagen", "Golf", "hatchback", { aliases: ["golf"] }),
  // Skoda
  model("skoda", "Octavia", "sedan", { aliases: ["octavia"] }),
  model("skoda", "Superb", "luxury", { aliases: ["superb"] }),
  model("skoda", "Kushaq", "suv", { aliases: ["kushaq"] }),
  model("skoda", "Slavia", "sedan", { aliases: ["slavia"] }),
  model("skoda", "Kodiaq", "suv", { aliases: ["kodiaq"] }),
  // Nissan
  model("nissan", "Magnite", "crossover", { aliases: ["magnite"] }),
  model("nissan", "Sunny", "sedan", { aliases: ["sunny"] }),
  model("nissan", "GT-R", "supercar", { aliases: ["gtr"] }),
  // Renault
  model("renault", "Kwid", "micro", { aliases: ["kwid"] }),
  model("renault", "Duster", "suv", { aliases: ["duster"] }),
  model("renault", "Triber", "minivan", { aliases: ["triber"] }),
  model("renault", "Kiger", "crossover", { aliases: ["kiger"] }),
  // Jaguar / Land Rover
  model("jaguar", "F-Pace", "suv", { aliases: ["fpace"] }),
  model("jaguar", "XE", "sedan", { aliases: ["xe"] }),
  model("jaguar", "F-Type", "sport", { aliases: ["ftype"] }),
  model("landrover", "Range Rover", "suv", { aliases: ["rangerover"] }),
  model("landrover", "Defender", "offroad", { aliases: ["defender"] }),
  model("landrover", "Discovery", "suv", { aliases: ["discovery"] }),
  model("landrover", "Evoque", "suv", { aliases: ["evoque"] }),
  // Volvo / Porsche
  model("volvo", "XC40", "suv", { aliases: ["xc40"] }),
  model("volvo", "XC60", "suv", { aliases: ["xc60"] }),
  model("volvo", "XC90", "suv", { aliases: ["xc90"] }),
  model("volvo", "S60", "sedan", { aliases: ["s60"] }),
  model("porsche", "911", "sport", { aliases: ["911", "carrera"] }),
  model("porsche", "Cayenne", "suv", { aliases: ["cayenne"] }),
  model("porsche", "Macan", "suv", { aliases: ["macan"] }),
  model("porsche", "Taycan", "sedan", { electric: true, aliases: ["taycan"] }),
  model("porsche", "Panamera", "luxury", { aliases: ["panamera"] }),
  // Jeep / Lexus / Mini / BYD
  model("jeep", "Wrangler", "offroad", { aliases: ["wrangler"] }),
  model("jeep", "Compass", "suv", { aliases: ["compass"] }),
  model("jeep", "Grand Cherokee", "suv", { aliases: ["grandcherokee"] }),
  model("lexus", "RX", "suv", { aliases: ["rx"] }),
  model("lexus", "ES", "sedan", { aliases: ["es"] }),
  model("lexus", "NX", "suv", { aliases: ["nx"] }),
  model("mini", "Cooper", "hatchback", { aliases: ["cooper"] }),
  model("mini", "Countryman", "crossover", { aliases: ["countryman"] }),
  model("byd", "Atto 3", "suv", { electric: true, aliases: ["atto3"] }),
  model("byd", "Seal", "sedan", { electric: true, aliases: ["seal"] }),
  // Performance / luxury marques
  model("ferrari", "488", "supercar", { aliases: ["488", "gtb"] }),
  model("ferrari", "SF90", "hypercar", { aliases: ["sf90"] }),
  model("ferrari", "Roma", "coupe", { aliases: ["roma"] }),
  model("lamborghini", "Huracan", "supercar", { aliases: ["huracan"] }),
  model("lamborghini", "Urus", "suv", { aliases: ["urus"] }),
  model("lamborghini", "Aventador", "hypercar", { aliases: ["aventador"] }),
  model("mclaren", "720S", "supercar", { aliases: ["720s"] }),
  model("bugatti", "Chiron", "hypercar", { aliases: ["chiron"] }),
  model("rollsroyce", "Phantom", "limousine", { aliases: ["phantom"] }),
  model("rollsroyce", "Cullinan", "suv", { aliases: ["cullinan"] }),
  model("bentley", "Continental GT", "coupe", { aliases: ["continentalgt"] }),
  model("bentley", "Bentayga", "suv", { aliases: ["bentayga"] }),
  model("maserati", "Ghibli", "sedan", { aliases: ["ghibli"] }),
  model("maserati", "Levante", "suv", { aliases: ["levante"] }),
  model("astonmartin", "DB11", "sport", { aliases: ["db11"] }),
  model("dodge", "Challenger", "muscle", { aliases: ["challenger"] }),
  model("dodge", "Charger", "muscle", { aliases: ["charger"] }),
  model("chevrolet", "Camaro", "muscle", { aliases: ["camaro"] }),
  model("chevrolet", "Corvette", "sport", { aliases: ["corvette"] }),
  model("chevrolet", "Silverado", "pickup", { aliases: ["silverado"] }),
  model("alfaromeo", "Giulia", "sedan", { aliases: ["giulia"] }),
  model("alfaromeo", "Stelvio", "suv", { aliases: ["stelvio"] }),
  model("generic", "Formula 1", "f1", { aliases: ["formula1", "f1car"] }),
];

const BODY_KEYWORDS = [
  ["pickup", ["pickup", "truck", "hilux", "ranger", "silverado", "cybertruck", "f150"]],
  ["offroad", ["offroad", "offroad", "defender", "wrangler", "thar", "gwagon", "gclass", "landcruiser", "bolero"]],
  ["minivan", ["minivan", "van", "innova", "ertiga", "carens", "carnival", "triber", "crysta"]],
  ["wagon", ["wagon", "estate", "avant", "touring"]],
  ["convertible", ["convertible", "cabriolet"]],
  ["roadster", ["roadster"]],
  ["coupe", ["coupe", "fastback", "curvv"]],
  ["hatchback", ["hatchback", "hatch", "swift", "baleno", "i20", "polo", "altroz", "tiago", "kwid", "santro", "glanza", "jazz"]],
  ["supercar", ["supercar", "huracan", "720s", "488", "r8", "gtr", "corvette"]],
  ["hypercar", ["hypercar", "chiron", "sf90", "aventador"]],
  ["muscle", ["muscle", "mustang", "camaro", "challenger", "charger"]],
  ["limousine", ["limousine", "limo", "phantom", "sclass"]],
  ["luxury", ["luxury", "panamera", "superb", "7series"]],
  ["sport", ["sport", "911", "supra", "ftype", "db11", "carrera"]],
  ["suv", ["suv", "x5", "x3", "x7", "q5", "q7", "q8", "creta", "fortuner", "nexon", "hector", "seltos", "cayenne", "urus", "cullinan", "bentayga", "levante", "stelvio", "compass", "harrier", "safari", "scorpio", "xuv", "brezza", "tucson", "venue", "elevate", "kushaq", "kodiaq", "taigun", "tiguan", "xc40", "xc60", "xc90"]],
  ["crossover", ["crossover", "modely", "atto3", "ev6", "ioniq5", "fronx", "kiger", "magnite", "x1", "q3", "ecosport", "countryman"]],
  ["micro", ["micro", "kwid", "punch", "wagonr"]],
  ["sedan", ["sedan", "city", "corolla", "camry", "cclass", "eclass", "3series", "5series", "a4", "a6", "octavia", "slavia", "verna", "amaze", "dzire", "tigor", "sunny", "civic", "giulia", "ghibli", "taycan", "seal"]],
];

const normalize = (value) => String(value == null ? "" : value).toLowerCase().replace(/[^a-z0-9]+/g, "");

const BRAND_ENTRIES = Object.entries(BRANDS).map(([key, brand]) => ({
  key,
  ...brand,
  normKeywords: [brand.name, key, ...(brand.keywords || [])].map(normalize).filter(Boolean),
}));

function findBrand(manufacturer, modelName) {
  const haystack = normalize(`${manufacturer || ""} ${modelName || ""}`);
  if (!haystack) return null;
  let best = null;
  BRAND_ENTRIES.forEach((brand) => {
    if (brand.key === "generic") return;
    const hit = brand.normKeywords.some((keyword) => {
      if (!keyword) return false;
      if (haystack === keyword) return true;
      return keyword.length >= 3 && haystack.includes(keyword);
    });
    if (hit) {
      if (!best || keywordScore(brand, haystack) > keywordScore(best, haystack)) best = brand;
    }
  });
  return best;
}

function keywordScore(brand, haystack) {
  return brand.normKeywords.reduce((score, keyword) => {
    if (keyword && haystack.includes(keyword)) return Math.max(score, keyword.length);
    return score;
  }, 0);
}

function scoreModel(entry, brandKey, combined, modelNorm) {
  if (brandKey && entry.brandKey !== brandKey) return 0;
  const names = [entry.model, ...(entry.aliases || [])].map(normalize).filter(Boolean);
  let score = 0;
  names.forEach((candidate) => {
    if (combined === candidate) score = Math.max(score, 120);
    else if (modelNorm === candidate) score = Math.max(score, 110);
    else if (combined.includes(candidate) && candidate.length >= 2) score = Math.max(score, 80 + Math.min(candidate.length, 20));
    else if (modelNorm.includes(candidate) && candidate.length >= 2) score = Math.max(score, 70 + Math.min(candidate.length, 20));
    else if (candidate.includes(modelNorm) && modelNorm.length >= 2) score = Math.max(score, 55 + modelNorm.length);
  });
  return score;
}

function findModelEntry(brandKey, manufacturer, modelName) {
  const combined = normalize(`${manufacturer || ""} ${modelName || ""}`);
  const modelNorm = normalize(modelName);
  let best = null;
  let bestScore = 0;
  VEHICLE_MODELS.forEach((entry) => {
    const score = scoreModel(entry, brandKey, combined, modelNorm);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  });
  return bestScore >= 55 ? best : null;
}

function inferBodyType(text) {
  const haystack = normalize(text);
  for (const [body, keywords] of BODY_KEYWORDS) {
    if (keywords.some((keyword) => haystack.includes(normalize(keyword)))) return body;
  }
  return null;
}

function cleanModelName(modelName, brandName) {
  const raw = String(modelName || "").trim();
  if (!raw) return "Vehicle";
  const brand = String(brandName || "").trim();
  if (brand && raw.toLowerCase().startsWith(brand.toLowerCase())) {
    const rest = raw.slice(brand.length).trim();
    if (rest) return rest;
  }
  return raw;
}

// Find a catalog entry from free text. Used by the vehicle input autocomplete.
export function findCatalogEntry(text) {
  const value = String(text || "").trim();
  if (!value) return null;
  const brand = findBrand("", value);
  return findModelEntry(brand?.key || null, "", value);
}

export function listBrands() {
  const seen = new Set();
  return VEHICLE_MODELS.reduce((list, entry) => {
    const brand = BRANDS[entry.brandKey];
    if (!brand || entry.brandKey === "generic" || seen.has(entry.brandKey)) return list;
    seen.add(entry.brandKey);
    list.push({ key: entry.brandKey, name: brand.name });
    return list;
  }, []).sort((a, b) => a.name.localeCompare(b.name));
}

export function listVehicleOptions() {
  return VEHICLE_MODELS.filter((entry) => entry.brandKey !== "generic").map((entry) => ({
    value: `${BRANDS[entry.brandKey].name} ${entry.model}`,
    brand: BRANDS[entry.brandKey].name,
    model: entry.model,
    bodyType: entry.bodyType,
    bodyLabel: BODY_LABELS[entry.bodyType] || entry.bodyType,
    electric: Boolean(entry.electric),
  }));
}

// Autocomplete helper for the manual model input. Matches on the combined
// "Brand Model" string so "bmwx5", "creta" and "Tesla Model Y" all work.
export function suggestVehicleOptions(query, limit = 8) {
  const options = listVehicleOptions();
  const q = normalize(query);
  if (!q) return options.slice(0, limit);
  return options
    .map((option) => {
      const haystack = normalize(`${option.brand} ${option.model}`);
      let score = 0;
      if (haystack.startsWith(q)) score = 100;
      else if (haystack.includes(q)) score = 60;
      else if (normalize(option.model).includes(q)) score = 45;
      else if (normalize(option.brand).startsWith(q)) score = 40;
      return { option, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.option);
}

export function isElectricVehicle(vehicle) {
  if (!vehicle) return false;
  const profile = resolveVehicleProfile(vehicle);
  return profile.electric;
}

export function resolveVehicleProfile(vehicle) {
  const manufacturer = String(vehicle?.manufacturer || "").trim();
  const rawModel = String(vehicle?.vehicle_model || vehicle?.model || "").trim();
  const brand = findBrand(manufacturer, rawModel);
  const brandKey = brand?.key || null;
  const entry = findModelEntry(brandKey, manufacturer, rawModel);

  const resolvedBrandKey = entry?.brandKey && entry.brandKey !== "generic" ? entry.brandKey : (brandKey || "generic");
  const brandConfig = BRANDS[resolvedBrandKey] || BRANDS.generic;

  const displayBrand = entry && entry.brandKey !== "generic"
    ? BRANDS[entry.brandKey].name
    : (manufacturer || (brandConfig.key === "generic" ? "" : brandConfig.name));

  const displayModel = entry
    ? entry.model
    : cleanModelName(rawModel, displayBrand || brandConfig.name);

  const guessedBody = inferBodyType(`${rawModel} ${manufacturer}`) || brandConfig.defaultBody || "sedan";
  const bodyType = entry?.bodyType || guessedBody;
  const bodyGeometry = BODY_TYPES[bodyType] || BODY_TYPES.sedan;

  const fuelElectric = String(vehicle?.fuel_type || "").toLowerCase() === "electric";
  const electric = Boolean(entry?.electric || fuelElectric);

  return {
    key: `${resolvedBrandKey}-${normalize(displayModel) || "vehicle"}-${bodyType}`,
    brandKey: resolvedBrandKey,
    brand: displayBrand || "Vehicle",
    model: displayModel || "Vehicle",
    displayName: `${displayBrand || ""} ${displayModel || ""}`.trim() || "Vehicle",
    bodyType,
    bodyLabel: BODY_LABELS[bodyType] || bodyType,
    electric,
    paint: entry?.paint || brandConfig.paint || "#DDE3EA",
    accent: entry?.accent || brandConfig.accent || "#2563EB",
    grille: brandConfig.grille || "mesh",
    geometry: bodyGeometry,
    model3D: entry?.model3D || null,
    matched: Boolean(entry),
    brandMatched: Boolean(brand) || resolvedBrandKey !== "generic",
  };
}

function hashSeed(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRng(seed) {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const pickInt = (rng, min, max) => Math.round(min + (max - min) * rng());
const pickFloat = (rng, min, max, digits = 1) => Number((min + (max - min) * rng()).toFixed(digits));

// Deterministic but model-specific telemetry so every vehicle presents
// different (but stable) specs without needing the backend.
function deriveVehicleSpecs(profile, seed) {
  const rng = makeRng(seed);
  const electric = profile.electric;
  const year = 2020 + pickInt(rng, 0, 5);
  const mileage = pickInt(rng, 6000, 68000);
  const batteryAge = pickInt(rng, 6, 54);
  const batteryVoltage = pickFloat(rng, 12.35, 12.9, 1);
  const engineTemp = electric ? pickInt(rng, 34, 56) : pickInt(rng, 86, 104);
  const avgSpeed = pickInt(rng, 28, 62);
  const runtime = pickInt(rng, 180, 2200);
  const fuelEfficiency = electric ? null : pickFloat(rng, 11, 22, 1);
  const packVoltage = electric ? pickInt(rng, 330, 430) : null;
  const motorRpm = electric ? pickInt(rng, 4200, 9000) : Math.round(1200 + (avgSpeed / 120) * 6000);
  const range = electric ? pickInt(rng, 320, 660) : null;
  const acceleration = electric ? pickFloat(rng, 3.1, 5.7, 1) : pickFloat(rng, 6.5, 12, 1);
  const drivetrainOptions = electric
    ? ["RWD", "Dual Motor AWD"]
    : ["FWD", "RWD", "AWD", "4x4"];
  const drivetrain = drivetrainOptions[pickInt(rng, 0, drivetrainOptions.length - 1)];
  const connectivity = rng() < 0.5 ? "5G" : "4G";
  const brakeCondition = rng() < 0.78 ? "good" : "fair";
  const lastService = new Date(Date.now() - pickInt(rng, 20, 300) * 86400000).toISOString();

  return {
    manufacturing_year: year,
    mileage_km: mileage,
    battery_age_months: batteryAge,
    battery_voltage: batteryVoltage,
    engine_temp_c: engineTemp,
    avg_speed_kmh: avgSpeed,
    engine_runtime_hours: runtime,
    fuel_efficiency_kmpl: fuelEfficiency,
    pack_voltage: packVoltage,
    motor_rpm: motorRpm,
    range_km: range,
    acceleration_sec: acceleration,
    drivetrain,
    power_kw: pickInt(rng, 70, 320),
    top_speed_mph: pickInt(rng, 105, 190),
    connectivity,
    brake_condition: brakeCondition,
    last_service_date: lastService,
    last_oil_change_date: electric ? null : lastService,
  };
}

// Turn a free-text model name (e.g. "BMW X5") into a complete, display-ready
// vehicle object. This is the single source of truth for the dashboard.
export function buildVehicleFromInput(text, overrides = {}) {
  const raw = String(text || "").trim();
  if (!raw) return null;

  const profile = resolveVehicleProfile({ vehicle_model: raw });
  const seed = hashSeed(profile.displayName || raw);
  const specs = deriveVehicleSpecs(profile, seed);
  const isGeneric = !profile.matched && profile.brandKey === "generic";

  return {
    id: 0,
    owner_name: "Driver",
    phone: null,
    vehicle_model: profile.matched ? profile.model : raw,
    manufacturer: isGeneric ? "" : profile.brand,
    fuel_type: profile.electric ? "electric" : "petrol",
    ...specs,
    has_unusual_noise: false,
    has_vibration: false,
    has_reduced_mileage: false,
    has_braking_issues: false,
    additional_symptoms: "",
    has_dtc: false,
    dtc_codes: "",
    created_at: new Date().toISOString(),
    _unsaved: true,
    _manual: true,
    _input: raw,
    ...overrides,
  };
}

// Convenience: resolve a raw input string down to its brand + model + profile.
export function parseVehicleText(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const profile = resolveVehicleProfile({ vehicle_model: raw });
  return { input: raw, brand: profile.brand, model: profile.model, profile };
}

export default {
  BODY_TYPES,
  BODY_LABELS,
  BRANDS,
  VEHICLE_MODELS,
  resolveVehicleProfile,
  findCatalogEntry,
  listBrands,
  listVehicleOptions,
  suggestVehicleOptions,
  buildVehicleFromInput,
  parseVehicleText,
  isElectricVehicle,
};
