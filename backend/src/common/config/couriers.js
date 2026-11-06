// Courier integrations that have a backend service in this project.
// Add an entry here only after its service + routes exist (e.g. common/services/steadfast.service.js);
// only these show up in Settings → Couriers for the Owner to enable.
export const COURIERS = [
  { key: "pathao", name: "Pathao", settingsPath: "/settings/pathao-courier" },
];

export const COURIER_KEYS = COURIERS.map((c) => c.key);
export const AVAILABLE_COURIER_KEYS = COURIER_KEYS;
export const DEFAULT_ENABLED_COURIERS = ["pathao"];
