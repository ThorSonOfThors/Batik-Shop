// utils/country.ts
// ISO 3166-1 alpha-2 country normalization for Stripe & backend usage

export const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  afghanistan: 'AF',
  albania: 'AL',
  algeria: 'DZ',
  andorra: 'AD',
  angola: 'AO',
  antigua: 'AG',
  argentina: 'AR',
  armenia: 'AM',
  australia: 'AU',
  austria: 'AT',
  azerbaijan: 'AZ',

  bahamas: 'BS',
  bahrain: 'BH',
  bangladesh: 'BD',
  barbados: 'BB',
  belarus: 'BY',
  belgium: 'BE',
  belize: 'BZ',
  benin: 'BJ',
  bhutan: 'BT',
  bolivia: 'BO',
  'bosnia and herzegovina': 'BA',
  botswana: 'BW',
  brazil: 'BR',
  brunei: 'BN',
  bulgaria: 'BG',
  'burkina faso' : 'BF',
  burundi: 'BI',

  cambodia: 'KH',
  cameroon: 'CM',
  canada: 'CA',
  'cape verde': 'CV',
  chad: 'TD',
  chile: 'CL',
  china: 'CN',
  colombia: 'CO',
  comoros: 'KM',
  congo: 'CG',
  'costa rica': 'CR',
  croatia: 'HR',
  cuba: 'CU',
  cyprus: 'CY',
  'czech republic': 'CZ',
  czechia: 'CZ',

  denmark: 'DK',
  djibouti: 'DJ',
  dominica: 'DM',
  'dominican republic': 'DO',

  ecuador: 'EC',
  egypt: 'EG',
  'el salvador': 'SV',
  estonia: 'EE',
  eswatini: 'SZ',
  ethiopia: 'ET',

  fiji: 'FJ',
  finland: 'FI',
  france: 'FR',

  gabon: 'GA',
  gambia: 'GM',
  georgia: 'GE',
  germany: 'DE',
  ghana: 'GH',
  greece: 'GR',
  grenada: 'GD',
  guatemala: 'GT',
  guinea: 'GN',
  guyana: 'GY',

  haiti: 'HT',
  honduras: 'HN',
  hungary: 'HU',

  iceland: 'IS',
  india: 'IN',
  indonesia: 'ID',
  iran: 'IR',
  iraq: 'IQ',
  ireland: 'IE',
  israel: 'IL',
  italy: 'IT',

  jamaica: 'JM',
  japan: 'JP',
  jordan: 'JO',

  kazakhstan: 'KZ',
  kenya: 'KE',
  kuwait: 'KW',
  kyrgyzstan: 'KG',

  laos: 'LA',
  latvia: 'LV',
  lebanon: 'LB',
  lesotho: 'LS',
  liberia: 'LR',
  libya: 'LY',
  liechtenstein: 'LI',
  lithuania: 'LT',
  luxembourg: 'LU',

  madagascar: 'MG',
  malawi: 'MW',
  malaysia: 'MY',
  maldives: 'MV',
  mali: 'ML',
  malta: 'MT',
  mauritania: 'MR',
  mauritius: 'MU',
  mexico: 'MX',
  moldova: 'MD',
  monaco: 'MC',
  mongolia: 'MN',
  montenegro: 'ME',
  morocco: 'MA',
  mozambique: 'MZ',
  myanmar: 'MM',

  namibia: 'NA',
  nepal: 'NP',
  netherlands: 'NL',
  'new zealand': 'NZ',
  nicaragua: 'NI',
  niger: 'NE',
  nigeria: 'NG',
  'north macedonia': 'MK',
  norway: 'NO',

  oman: 'OM',

  pakistan: 'PK',
  panama: 'PA',
  paraguay: 'PY',
  peru: 'PE',
  philippines: 'PH',
  poland: 'PL',
  portugal: 'PT',

  qatar: 'QA',

  romania: 'RO',
  russia: 'RU',
  rwanda: 'RW',

  'saudi arabia': 'SA',
  senegal: 'SN',
  serbia: 'RS',
  singapore: 'SG',
  slovakia: 'SK',
  slovenia: 'SI',
  somalia: 'SO',
  'south africa': 'ZA',
  'south korea': 'KR',
  spain: 'ES',
  'sri lanka': 'LK',
  sudan: 'SD',
  sweden: 'SE',
  switzerland: 'CH',
  syria: 'SY',

  taiwan: 'TW',
  tajikistan: 'TJ',
  tanzania: 'TZ',
  thailand: 'TH',
  tunisia: 'TN',
  turkey: 'TR',

  uganda: 'UG',
  ukraine: 'UA',
  'united arab emirates': 'AE',
  uae: 'AE',
  'united kingdom': 'GB',
  uk: 'GB',
  'united states': 'US',
  usa: 'US',
  uruguay: 'UY',
  uzbekistan: 'UZ',

  venezuela: 'VE',
  vietnam: 'VN',

  yemen: 'YE',

  zambia: 'ZM',
  zimbabwe: 'ZW',
}

// Normalizer (use everywhere Stripe is involved)
export function normalizeCountryToISO(input: string): string {
  if (!input) return ''

  const value = input.trim()

  // Already ISO
  if (/^[A-Za-z]{2}$/.test(value)) {
    return value.toUpperCase()
  }

  console.log(COUNTRY_NAME_TO_ISO[value.toLowerCase()] ?? value);

  return COUNTRY_NAME_TO_ISO[value.toLowerCase()] ?? value
}
