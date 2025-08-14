export const EASING_ORDERS = [
  { value: "none", label: "None" },
  { value: "power1", label: "Power1" },
  { value: "power2", label: "Power2" },
  { value: "power3", label: "Power3" },
  { value: "power4", label: "Power4" },
  { value: "back", label: "Back" },
  { value: "elastic", label: "Elastic" },
  { value: "bounce", label: "Bounce" },
  { value: "circ", label: "Circ" },
  { value: "expo", label: "Expo" },
  { value: "sine", label: "Sine" },
];

export const EASING_TYPES = [
  { value: "in", label: "In" },
  { value: "out", label: "Out" },
  { value: "inOut", label: "InOut" },
];

// Helper function to combine order and type into GSAP easing string
export const combineEasing = (order: string, type: string): string => {
  if (order === "none") return "none";
  return `${order}.${type}`;
};

// Helper function to parse GSAP easing string into order and type
export const parseEasing = (
  easing: string
): { order: string; type: string } => {
  if (easing === "none") return { order: "none", type: "out" };

  const parts = easing.split(".");
  if (parts.length === 2) {
    return { order: parts[0], type: parts[1] };
  }

  // Fallback
  return { order: "power2", type: "out" };
};

export default { EASING_ORDERS, EASING_TYPES, combineEasing, parseEasing };
