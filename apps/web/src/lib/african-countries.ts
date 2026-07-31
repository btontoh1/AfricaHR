// All 54 UN-recognized African sovereign states, with ISO 3166-1 alpha-2
// country code, common English name, nationality (demonym), and ISO 4217
// currency. Several West/Central African states share a currency (the CFA
// franc zones), so AFRICAN_CURRENCIES below is deduplicated by currency code
// rather than listing it once per country.
export interface AfricanCountry {
  code: string;
  name: string;
  nationality: string;
  currencyCode: string;
  currencyName: string;
}

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  { code: 'DZ', name: 'Algeria', nationality: 'Algerian', currencyCode: 'DZD', currencyName: 'Algerian Dinar' },
  { code: 'AO', name: 'Angola', nationality: 'Angolan', currencyCode: 'AOA', currencyName: 'Angolan Kwanza' },
  { code: 'BJ', name: 'Benin', nationality: 'Beninese', currencyCode: 'XOF', currencyName: 'West African CFA Franc' },
  { code: 'BW', name: 'Botswana', nationality: 'Botswanan', currencyCode: 'BWP', currencyName: 'Botswana Pula' },
  { code: 'BF', name: 'Burkina Faso', nationality: 'Burkinabé', currencyCode: 'XOF', currencyName: 'West African CFA Franc' },
  { code: 'BI', name: 'Burundi', nationality: 'Burundian', currencyCode: 'BIF', currencyName: 'Burundian Franc' },
  { code: 'CV', name: 'Cabo Verde', nationality: 'Cabo Verdean', currencyCode: 'CVE', currencyName: 'Cabo Verdean Escudo' },
  { code: 'CM', name: 'Cameroon', nationality: 'Cameroonian', currencyCode: 'XAF', currencyName: 'Central African CFA Franc' },
  { code: 'CF', name: 'Central African Republic', nationality: 'Central African', currencyCode: 'XAF', currencyName: 'Central African CFA Franc' },
  { code: 'TD', name: 'Chad', nationality: 'Chadian', currencyCode: 'XAF', currencyName: 'Central African CFA Franc' },
  { code: 'KM', name: 'Comoros', nationality: 'Comorian', currencyCode: 'KMF', currencyName: 'Comorian Franc' },
  { code: 'CG', name: 'Congo, Republic of the', nationality: 'Congolese', currencyCode: 'XAF', currencyName: 'Central African CFA Franc' },
  { code: 'CD', name: 'Congo, Democratic Republic of the', nationality: 'Congolese', currencyCode: 'CDF', currencyName: 'Congolese Franc' },
  { code: 'CI', name: "Côte d'Ivoire", nationality: 'Ivorian', currencyCode: 'XOF', currencyName: 'West African CFA Franc' },
  { code: 'DJ', name: 'Djibouti', nationality: 'Djiboutian', currencyCode: 'DJF', currencyName: 'Djiboutian Franc' },
  { code: 'EG', name: 'Egypt', nationality: 'Egyptian', currencyCode: 'EGP', currencyName: 'Egyptian Pound' },
  { code: 'GQ', name: 'Equatorial Guinea', nationality: 'Equatorial Guinean', currencyCode: 'XAF', currencyName: 'Central African CFA Franc' },
  { code: 'ER', name: 'Eritrea', nationality: 'Eritrean', currencyCode: 'ERN', currencyName: 'Eritrean Nakfa' },
  { code: 'SZ', name: 'Eswatini', nationality: 'Swazi', currencyCode: 'SZL', currencyName: 'Eswatini Lilangeni' },
  { code: 'ET', name: 'Ethiopia', nationality: 'Ethiopian', currencyCode: 'ETB', currencyName: 'Ethiopian Birr' },
  { code: 'GA', name: 'Gabon', nationality: 'Gabonese', currencyCode: 'XAF', currencyName: 'Central African CFA Franc' },
  { code: 'GM', name: 'Gambia', nationality: 'Gambian', currencyCode: 'GMD', currencyName: 'Gambian Dalasi' },
  { code: 'GH', name: 'Ghana', nationality: 'Ghanaian', currencyCode: 'GHS', currencyName: 'Ghanaian Cedi' },
  { code: 'GN', name: 'Guinea', nationality: 'Guinean', currencyCode: 'GNF', currencyName: 'Guinean Franc' },
  { code: 'GW', name: 'Guinea-Bissau', nationality: 'Bissau-Guinean', currencyCode: 'XOF', currencyName: 'West African CFA Franc' },
  { code: 'KE', name: 'Kenya', nationality: 'Kenyan', currencyCode: 'KES', currencyName: 'Kenyan Shilling' },
  { code: 'LS', name: 'Lesotho', nationality: 'Basotho', currencyCode: 'LSL', currencyName: 'Lesotho Loti' },
  { code: 'LR', name: 'Liberia', nationality: 'Liberian', currencyCode: 'LRD', currencyName: 'Liberian Dollar' },
  { code: 'LY', name: 'Libya', nationality: 'Libyan', currencyCode: 'LYD', currencyName: 'Libyan Dinar' },
  { code: 'MG', name: 'Madagascar', nationality: 'Malagasy', currencyCode: 'MGA', currencyName: 'Malagasy Ariary' },
  { code: 'MW', name: 'Malawi', nationality: 'Malawian', currencyCode: 'MWK', currencyName: 'Malawian Kwacha' },
  { code: 'ML', name: 'Mali', nationality: 'Malian', currencyCode: 'XOF', currencyName: 'West African CFA Franc' },
  { code: 'MR', name: 'Mauritania', nationality: 'Mauritanian', currencyCode: 'MRU', currencyName: 'Mauritanian Ouguiya' },
  { code: 'MU', name: 'Mauritius', nationality: 'Mauritian', currencyCode: 'MUR', currencyName: 'Mauritian Rupee' },
  { code: 'MA', name: 'Morocco', nationality: 'Moroccan', currencyCode: 'MAD', currencyName: 'Moroccan Dirham' },
  { code: 'MZ', name: 'Mozambique', nationality: 'Mozambican', currencyCode: 'MZN', currencyName: 'Mozambican Metical' },
  { code: 'NA', name: 'Namibia', nationality: 'Namibian', currencyCode: 'NAD', currencyName: 'Namibian Dollar' },
  { code: 'NE', name: 'Niger', nationality: 'Nigerien', currencyCode: 'XOF', currencyName: 'West African CFA Franc' },
  { code: 'NG', name: 'Nigeria', nationality: 'Nigerian', currencyCode: 'NGN', currencyName: 'Nigerian Naira' },
  { code: 'RW', name: 'Rwanda', nationality: 'Rwandan', currencyCode: 'RWF', currencyName: 'Rwandan Franc' },
  { code: 'ST', name: 'São Tomé and Príncipe', nationality: 'São Toméan', currencyCode: 'STN', currencyName: 'São Tomé and Príncipe Dobra' },
  { code: 'SN', name: 'Senegal', nationality: 'Senegalese', currencyCode: 'XOF', currencyName: 'West African CFA Franc' },
  { code: 'SC', name: 'Seychelles', nationality: 'Seychellois', currencyCode: 'SCR', currencyName: 'Seychellois Rupee' },
  { code: 'SL', name: 'Sierra Leone', nationality: 'Sierra Leonean', currencyCode: 'SLE', currencyName: 'Sierra Leonean Leone' },
  { code: 'SO', name: 'Somalia', nationality: 'Somali', currencyCode: 'SOS', currencyName: 'Somali Shilling' },
  { code: 'ZA', name: 'South Africa', nationality: 'South African', currencyCode: 'ZAR', currencyName: 'South African Rand' },
  { code: 'SS', name: 'South Sudan', nationality: 'South Sudanese', currencyCode: 'SSP', currencyName: 'South Sudanese Pound' },
  { code: 'SD', name: 'Sudan', nationality: 'Sudanese', currencyCode: 'SDG', currencyName: 'Sudanese Pound' },
  { code: 'TZ', name: 'Tanzania', nationality: 'Tanzanian', currencyCode: 'TZS', currencyName: 'Tanzanian Shilling' },
  { code: 'TG', name: 'Togo', nationality: 'Togolese', currencyCode: 'XOF', currencyName: 'West African CFA Franc' },
  { code: 'TN', name: 'Tunisia', nationality: 'Tunisian', currencyCode: 'TND', currencyName: 'Tunisian Dinar' },
  { code: 'UG', name: 'Uganda', nationality: 'Ugandan', currencyCode: 'UGX', currencyName: 'Ugandan Shilling' },
  { code: 'ZM', name: 'Zambia', nationality: 'Zambian', currencyCode: 'ZMW', currencyName: 'Zambian Kwacha' },
  { code: 'ZW', name: 'Zimbabwe', nationality: 'Zimbabwean', currencyCode: 'ZWG', currencyName: 'Zimbabwe Gold' },
];

export interface AfricanCurrency {
  code: string;
  name: string;
}

// Deduplicated by currency code (the CFA franc zones share one currency
// across several countries), sorted alphabetically by name.
export const AFRICAN_CURRENCIES: AfricanCurrency[] = Array.from(
  new Map(AFRICAN_COUNTRIES.map((c) => [c.currencyCode, { code: c.currencyCode, name: c.currencyName }])).values(),
).sort((a, b) => a.name.localeCompare(b.name));
