export type CountryCode = {
  name: string;
  dial: string; // e.g. "+227"
  iso2: string;
  flag: string;
};

// West Africa / WAEMU + the corridors this business actually deals in come first,
// then the rest of the world alphabetically. Not exhaustive, but covers what shows
// up in the legacy customer data (Niger, Chad, Nigeria, Mali, Kuwait, UAE, etc.)
// plus common destinations. Staff can still type a custom code if one's missing.
export const countryCodes: CountryCode[] = [
  { name: "Niger", dial: "+227", iso2: "NE", flag: "🇳🇪" },
  { name: "Chad", dial: "+235", iso2: "TD", flag: "🇹🇩" },
  { name: "Nigeria", dial: "+234", iso2: "NG", flag: "🇳🇬" },
  { name: "Mali", dial: "+223", iso2: "ML", flag: "🇲🇱" },
  { name: "Côte d'Ivoire", dial: "+225", iso2: "CI", flag: "🇨🇮" },
  { name: "Benin", dial: "+229", iso2: "BJ", flag: "🇧🇯" },
  { name: "Togo", dial: "+228", iso2: "TG", flag: "🇹🇬" },
  { name: "Burkina Faso", dial: "+226", iso2: "BF", flag: "🇧🇫" },
  { name: "Senegal", dial: "+221", iso2: "SN", flag: "🇸🇳" },
  { name: "Guinea", dial: "+224", iso2: "GN", flag: "🇬🇳" },
  { name: "Guinea-Bissau", dial: "+245", iso2: "GW", flag: "🇬🇼" },
  { name: "Ghana", dial: "+233", iso2: "GH", flag: "🇬🇭" },
  { name: "Cameroon", dial: "+237", iso2: "CM", flag: "🇨🇲" },
  { name: "Central African Republic", dial: "+236", iso2: "CF", flag: "🇨🇫" },
  { name: "Libya", dial: "+218", iso2: "LY", flag: "🇱🇾" },
  { name: "Sudan", dial: "+249", iso2: "SD", flag: "🇸🇩" },
  { name: "Egypt", dial: "+20", iso2: "EG", flag: "🇪🇬" },
  { name: "Kuwait", dial: "+965", iso2: "KW", flag: "🇰🇼" },
  { name: "United Arab Emirates", dial: "+971", iso2: "AE", flag: "🇦🇪" },
  { name: "Saudi Arabia", dial: "+966", iso2: "SA", flag: "🇸🇦" },
  { name: "Qatar", dial: "+974", iso2: "QA", flag: "🇶🇦" },
  { name: "Turkey", dial: "+90", iso2: "TR", flag: "🇹🇷" },
  { name: "Morocco", dial: "+212", iso2: "MA", flag: "🇲🇦" },
  { name: "Algeria", dial: "+213", iso2: "DZ", flag: "🇩🇿" },
  { name: "Tunisia", dial: "+216", iso2: "TN", flag: "🇹🇳" },
  { name: "France", dial: "+33", iso2: "FR", flag: "🇫🇷" },
  { name: "United Kingdom", dial: "+44", iso2: "GB", flag: "🇬🇧" },
  { name: "United States", dial: "+1", iso2: "US", flag: "🇺🇸" },
  { name: "Canada", dial: "+1", iso2: "CA", flag: "🇨🇦" },
  { name: "China", dial: "+86", iso2: "CN", flag: "🇨🇳" },
  { name: "India", dial: "+91", iso2: "IN", flag: "🇮🇳" },
  { name: "Lebanon", dial: "+961", iso2: "LB", flag: "🇱🇧" },
  { name: "Germany", dial: "+49", iso2: "DE", flag: "🇩🇪" },
  { name: "Belgium", dial: "+32", iso2: "BE", flag: "🇧🇪" },
  { name: "Italy", dial: "+39", iso2: "IT", flag: "🇮🇹" },
  { name: "Spain", dial: "+34", iso2: "ES", flag: "🇪🇸" },
];

export function findCountryByDial(dial: string): CountryCode | undefined {
  return countryCodes.find((c) => c.dial === dial);
}
