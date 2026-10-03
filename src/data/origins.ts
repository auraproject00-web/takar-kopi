import type { ProcessId, SpeciesId } from './beans'

/**
 * Built-in coffee origin reference for the bean search (works offline).
 * Taste notes are a general picture per process; every farm, harvest and
 * roastery differs. Text that is not a proper noun carries both languages.
 */
export interface Localized {
  id: string
  en: string
}

const FLAVORS = {
  chocolate: { id: 'cokelat', en: 'chocolate' },
  darkChocolate: { id: 'cokelat hitam', en: 'dark chocolate' },
  milkChocolate: { id: 'cokelat susu', en: 'milk chocolate' },
  cocoa: { id: 'kakao', en: 'cocoa' },
  caramel: { id: 'karamel', en: 'caramel' },
  brownSugar: { id: 'gula merah', en: 'brown sugar' },
  palmSugar: { id: 'gula aren', en: 'palm sugar' },
  honey: { id: 'madu', en: 'honey' },
  molasses: { id: 'molase', en: 'molasses' },
  vanilla: { id: 'vanila', en: 'vanilla' },
  nutty: { id: 'kacang', en: 'nutty' },
  almond: { id: 'almond', en: 'almond' },
  hazelnut: { id: 'hazelnut', en: 'hazelnut' },
  peanut: { id: 'kacang tanah', en: 'peanut' },
  malt: { id: 'malt', en: 'malt' },
  spice: { id: 'rempah', en: 'spice' },
  cinnamon: { id: 'kayu manis', en: 'cinnamon' },
  clove: { id: 'cengkih', en: 'clove' },
  herbal: { id: 'herbal', en: 'herbal' },
  earthy: { id: 'earthy', en: 'earthy' },
  tobacco: { id: 'tembakau', en: 'tobacco' },
  woody: { id: 'kayu', en: 'woody' },
  cedar: { id: 'kayu cedar', en: 'cedar' },
  smoky: { id: 'smoky', en: 'smoky' },
  citrus: { id: 'jeruk', en: 'citrus' },
  lemon: { id: 'lemon', en: 'lemon' },
  lime: { id: 'jeruk nipis', en: 'lime' },
  orange: { id: 'jeruk manis', en: 'orange' },
  bergamot: { id: 'bergamot', en: 'bergamot' },
  grapefruit: { id: 'grapefruit', en: 'grapefruit' },
  jasmine: { id: 'melati', en: 'jasmine' },
  floral: { id: 'bunga', en: 'floral' },
  rose: { id: 'mawar', en: 'rose' },
  blackTea: { id: 'teh hitam', en: 'black tea' },
  berry: { id: 'beri', en: 'berry' },
  blueberry: { id: 'blueberry', en: 'blueberry' },
  strawberry: { id: 'stroberi', en: 'strawberry' },
  raspberry: { id: 'raspberry', en: 'raspberry' },
  blackcurrant: { id: 'blackcurrant', en: 'blackcurrant' },
  redFruit: { id: 'buah merah', en: 'red fruit' },
  cherry: { id: 'ceri', en: 'cherry' },
  grape: { id: 'anggur', en: 'grape' },
  wine: { id: 'wine', en: 'winey' },
  tropical: { id: 'buah tropis', en: 'tropical fruit' },
  mango: { id: 'mangga', en: 'mango' },
  pineapple: { id: 'nanas', en: 'pineapple' },
  passionfruit: { id: 'markisa', en: 'passion fruit' },
  jackfruit: { id: 'nangka', en: 'jackfruit' },
  banana: { id: 'pisang', en: 'banana' },
  lychee: { id: 'leci', en: 'lychee' },
  peach: { id: 'persik', en: 'peach' },
  apricot: { id: 'aprikot', en: 'apricot' },
  apple: { id: 'apel', en: 'apple' },
  greenApple: { id: 'apel hijau', en: 'green apple' },
  plum: { id: 'plum', en: 'plum' },
  raisin: { id: 'kismis', en: 'raisin' },
  date: { id: 'kurma', en: 'date' },
  tamarind: { id: 'asam jawa', en: 'tamarind' },
  sugarcane: { id: 'tebu', en: 'sugar cane' },
  butter: { id: 'mentega', en: 'buttery' },
  rum: { id: 'rum', en: 'rum' },
  boozy: { id: 'boozy', en: 'boozy' },
  yogurt: { id: 'yogurt', en: 'yogurt' },
  cereal: { id: 'sereal', en: 'cereal' },
} satisfies Record<string, Localized>

export type FlavorId = keyof typeof FLAVORS

export function flavorName(id: FlavorId, lang: 'id' | 'en'): string {
  return FLAVORS[id][lang]
}

export type Level = 'low' | 'medium' | 'high'

export interface Origin {
  id: string
  /** Display name (a place or trade name). */
  name: string
  /** Extra search words: old names, nearby places, common spellings. */
  aliases: string[]
  country: Localized
  region: string
  /** Metres above sea level, e.g. "1200–1600". */
  altitude: string
  species: SpeciesId
  varieties: string[]
  /** Processes this origin is most often sold as. */
  common: ProcessId[]
  body: Level
  acidity: Level
  about: Localized
  notes: Record<ProcessId, FlavorId[]>
}

const ID = { id: 'Indonesia', en: 'Indonesia' }

export const ORIGINS: Origin[] = [
  {
    id: 'gayo',
    name: 'Gayo',
    aliases: ['sumatra', 'sumatera', 'aceh', 'aceh gayo', 'takengon', 'bener meriah', 'aceh tengah', 'gayo lues'],
    country: ID,
    region: 'Aceh Tengah, Bener Meriah',
    altitude: '1200–1700',
    species: 'arabica',
    varieties: ['Ateng', 'Timtim', 'Abyssinia', 'Borbor'],
    common: ['wetHulled', 'washed', 'natural', 'honey'],
    body: 'high',
    acidity: 'medium',
    about: {
      id: 'Kopi arabika paling terkenal dari Aceh, tumbuh di sekitar Danau Laut Tawar. Dulu identik dengan giling basah, sekarang banyak juga washed dan natural.',
      en: "Aceh's best-known arabica, grown around Lake Laut Tawar. Once synonymous with wet-hulling, now widely sold washed and natural too.",
    },
    notes: {
      washed: ['darkChocolate', 'lemon', 'brownSugar', 'spice'],
      natural: ['berry', 'wine', 'darkChocolate', 'tropical'],
      honey: ['brownSugar', 'redFruit', 'caramel', 'spice'],
      wetHulled: ['earthy', 'spice', 'darkChocolate', 'tobacco', 'herbal'],
      anaerobic: ['tropical', 'boozy', 'cinnamon', 'cocoa'],
    },
  },
  {
    id: 'kerinci',
    name: 'Kerinci',
    aliases: ['sumatra', 'sumatera', 'jambi', 'gunung kerinci', 'sungai penuh', 'kayu aro'],
    country: ID,
    region: 'Kerinci, Jambi',
    altitude: '1400–1700',
    species: 'arabica',
    varieties: ['Sigarar Utang', 'Andungsari', 'Ateng'],
    common: ['washed', 'natural', 'honey'],
    body: 'medium',
    acidity: 'medium',
    about: {
      id: 'Dari lereng Gunung Kerinci, dekat kebun teh Kayu Aro. Dikenal bersih dan manis.',
      en: 'From the slopes of Mount Kerinci, near the Kayu Aro tea estate. Known for being clean and sweet.',
    },
    notes: {
      washed: ['citrus', 'brownSugar', 'blackTea', 'floral'],
      natural: ['strawberry', 'grape', 'chocolate', 'wine'],
      honey: ['honey', 'apricot', 'caramel'],
      wetHulled: ['spice', 'earthy', 'chocolate'],
      anaerobic: ['tropical', 'boozy', 'strawberry', 'cinnamon'],
    },
  },
  {
    id: 'mandailing',
    name: 'Mandailing',
    aliases: ['sumatra', 'sumatera', 'tapanuli selatan', 'sumatra mandheling', 'mandheling'],
    country: ID,
    region: 'Mandailing Natal, Sumatra Utara',
    altitude: '1000–1500',
    species: 'arabica',
    varieties: ['Sigarar Utang', 'Ateng', 'Typica'],
    common: ['wetHulled', 'washed'],
    body: 'high',
    acidity: 'low',
    about: {
      id: 'Nama dagang lama "Sumatra Mandheling". Body tebal dan rasa rendah asam khas giling basah.',
      en: 'The old trade name "Sumatra Mandheling". Heavy body and low acidity typical of wet-hulling.',
    },
    notes: {
      washed: ['chocolate', 'caramel', 'citrus', 'spice'],
      natural: ['raisin', 'darkChocolate', 'berry'],
      honey: ['brownSugar', 'chocolate', 'redFruit'],
      wetHulled: ['earthy', 'cedar', 'darkChocolate', 'spice', 'herbal'],
      anaerobic: ['boozy', 'cocoa', 'plum'],
    },
  },
  {
    id: 'lintong',
    name: 'Lintong',
    aliases: ['sumatra', 'sumatera', 'lintongnihuta', 'humbang hasundutan', 'danau toba', 'toba', 'sumatra lintong'],
    country: ID,
    region: 'Humbang Hasundutan, Sumatra Utara',
    altitude: '1200–1500',
    species: 'arabica',
    varieties: ['Sigarar Utang', 'Ateng'],
    common: ['wetHulled', 'washed'],
    body: 'high',
    acidity: 'medium',
    about: {
      id: 'Dataran tinggi di selatan Danau Toba. Lebih cerah dari Mandailing tapi tetap tebal.',
      en: 'Highlands south of Lake Toba. Brighter than Mandailing but still full-bodied.',
    },
    notes: {
      washed: ['citrus', 'chocolate', 'brownSugar'],
      natural: ['berry', 'wine', 'chocolate'],
      honey: ['caramel', 'redFruit', 'spice'],
      wetHulled: ['herbal', 'spice', 'cedar', 'darkChocolate'],
      anaerobic: ['tropical', 'boozy', 'clove'],
    },
  },
  {
    id: 'sidikalang',
    name: 'Sidikalang',
    aliases: ['sumatra', 'sumatera', 'dairi', 'sumatra utara'],
    country: ID,
    region: 'Dairi, Sumatra Utara',
    altitude: '1000–1400',
    species: 'arabica',
    varieties: ['Sigarar Utang', 'Ateng'],
    common: ['wetHulled', 'natural'],
    body: 'high',
    acidity: 'low',
    about: {
      id: 'Kopi tua dari Dairi, ada arabika dan robusta. Pahit manis, cocok untuk tubruk dan kopi susu.',
      en: 'A long-established coffee from Dairi, both arabica and robusta. Bittersweet; great for tubruk and milk coffee.',
    },
    notes: {
      washed: ['chocolate', 'nutty', 'citrus'],
      natural: ['raisin', 'chocolate', 'wine'],
      honey: ['brownSugar', 'nutty', 'cocoa'],
      wetHulled: ['darkChocolate', 'earthy', 'tobacco', 'spice'],
      anaerobic: ['boozy', 'cocoa', 'plum'],
    },
  },
  {
    id: 'solok',
    name: 'Solok',
    aliases: ['sumatra', 'sumatera', 'solok radjo', 'sumatra barat', 'sumbar', 'minang', 'gunung talang'],
    country: ID,
    region: 'Solok, Sumatra Barat',
    altitude: '1300–1600',
    species: 'arabica',
    varieties: ['Sigarar Utang', 'Andungsari', 'Typica'],
    common: ['washed', 'natural', 'honey'],
    body: 'medium',
    acidity: 'medium',
    about: {
      id: 'Dari lereng Gunung Talang. Banyak dijual sebagai specialty dengan proses bervariasi.',
      en: 'From the slopes of Mount Talang. Often sold as specialty in a range of processes.',
    },
    notes: {
      washed: ['lemon', 'brownSugar', 'floral', 'blackTea'],
      natural: ['strawberry', 'tropical', 'chocolate'],
      honey: ['honey', 'peach', 'caramel'],
      wetHulled: ['spice', 'chocolate', 'earthy'],
      anaerobic: ['passionfruit', 'boozy', 'cinnamon'],
    },
  },
  {
    id: 'semendo',
    name: 'Semendo',
    aliases: ['sumatra', 'sumatera', 'sumatra selatan', 'sumsel', 'muara enim', 'pagar alam', 'robusta semendo'],
    country: ID,
    region: 'Muara Enim, Sumatra Selatan',
    altitude: '800–1200',
    species: 'robusta',
    varieties: ['Robusta lokal'],
    common: ['natural', 'honey'],
    body: 'high',
    acidity: 'low',
    about: {
      id: 'Salah satu robusta paling dikenal dari Sumatra Selatan. Manis tebal, enak untuk espresso dan kopi susu.',
      en: 'One of the best-known robustas of South Sumatra. Thick and sweet; good for espresso and milk coffee.',
    },
    notes: {
      washed: ['cocoa', 'nutty', 'malt'],
      natural: ['darkChocolate', 'palmSugar', 'peanut', 'earthy'],
      honey: ['palmSugar', 'cocoa', 'nutty'],
      wetHulled: ['earthy', 'tobacco', 'darkChocolate'],
      anaerobic: ['boozy', 'cocoa', 'jackfruit'],
    },
  },
  {
    id: 'lampung',
    name: 'Lampung',
    aliases: ['sumatra', 'sumatera', 'robusta lampung', 'lampung barat', 'liwa', 'tanggamus'],
    country: ID,
    region: 'Lampung Barat, Tanggamus',
    altitude: '600–1000',
    species: 'robusta',
    varieties: ['Robusta lokal'],
    common: ['natural', 'honey'],
    body: 'high',
    acidity: 'low',
    about: {
      id: 'Penghasil robusta terbesar di Indonesia. Pahit tebal dan aroma kacang.',
      en: "Indonesia's largest robusta producer. Bold bitterness and a nutty aroma.",
    },
    notes: {
      washed: ['cocoa', 'nutty', 'cereal'],
      natural: ['darkChocolate', 'peanut', 'earthy', 'tobacco'],
      honey: ['brownSugar', 'cocoa', 'nutty'],
      wetHulled: ['earthy', 'woody', 'darkChocolate'],
      anaerobic: ['boozy', 'cocoa', 'banana'],
    },
  },
  {
    id: 'preanger',
    name: 'Java Preanger',
    aliases: ['jawa barat', 'jabar', 'priangan', 'malabar', 'puntang', 'garut', 'cikurai', 'papandayan', 'bandung', 'manglayang', 'halu'],
    country: ID,
    region: 'Priangan (Bandung, Garut), Jawa Barat',
    altitude: '1200–1700',
    species: 'arabica',
    varieties: ['Sigarar Utang', 'Ateng', 'Typica', 'Lini S'],
    common: ['washed', 'natural', 'honey'],
    body: 'medium',
    acidity: 'medium',
    about: {
      id: 'Kopi bersejarah dari dataran tinggi Priangan (Malabar, Puntang, Cikurai). Kini banyak lot specialty.',
      en: 'Historic coffee from the Priangan highlands (Malabar, Puntang, Cikurai). Many specialty lots today.',
    },
    notes: {
      washed: ['lime', 'brownSugar', 'floral', 'blackTea'],
      natural: ['strawberry', 'wine', 'chocolate', 'tropical'],
      honey: ['honey', 'redFruit', 'caramel'],
      wetHulled: ['spice', 'earthy', 'chocolate'],
      anaerobic: ['tropical', 'boozy', 'cinnamon', 'yogurt'],
    },
  },
  {
    id: 'ijen',
    name: 'Java Ijen',
    aliases: ['jawa timur', 'jatim', 'bondowoso', 'ijen raung', 'kawah ijen', 'java estate'],
    country: ID,
    region: 'Bondowoso, Jawa Timur',
    altitude: '1100–1500',
    species: 'arabica',
    varieties: ['Typica', 'USDA', 'Kartika'],
    common: ['washed', 'natural'],
    body: 'medium',
    acidity: 'medium',
    about: {
      id: 'Dari dataran tinggi Ijen–Raung, bekas perkebunan Belanda. Rasanya rapi dan seimbang.',
      en: 'From the Ijen–Raung plateau, once Dutch-era estates. Tidy and balanced.',
    },
    notes: {
      washed: ['chocolate', 'nutty', 'citrus', 'herbal'],
      natural: ['berry', 'chocolate', 'raisin'],
      honey: ['caramel', 'apricot', 'nutty'],
      wetHulled: ['earthy', 'spice', 'cocoa'],
      anaerobic: ['boozy', 'tropical', 'cocoa'],
    },
  },
  {
    id: 'temanggung',
    name: 'Temanggung',
    aliases: ['jawa tengah', 'jateng', 'sindoro', 'sumbing', 'robusta temanggung'],
    country: ID,
    region: 'Temanggung, Jawa Tengah',
    altitude: '600–1300',
    species: 'robusta',
    varieties: ['Robusta lokal', 'Arabika Sindoro'],
    common: ['natural', 'honey', 'washed'],
    body: 'high',
    acidity: 'low',
    about: {
      id: 'Robusta dari kaki Sindoro–Sumbing yang tumbuh di antara tanaman tembakau. Arabikanya juga mulai dikenal.',
      en: 'Robusta from the foothills of Sindoro–Sumbing, grown among tobacco fields. Its arabica is getting known too.',
    },
    notes: {
      washed: ['cocoa', 'caramel', 'nutty'],
      natural: ['darkChocolate', 'tobacco', 'palmSugar'],
      honey: ['palmSugar', 'cocoa', 'jackfruit'],
      wetHulled: ['earthy', 'tobacco', 'woody'],
      anaerobic: ['boozy', 'jackfruit', 'cocoa'],
    },
  },
  {
    id: 'dampit',
    name: 'Dampit',
    aliases: ['malang', 'robusta dampit', 'jawa timur'],
    country: ID,
    region: 'Dampit, Malang',
    altitude: '400–800',
    species: 'robusta',
    varieties: ['Robusta lokal'],
    common: ['natural'],
    body: 'high',
    acidity: 'low',
    about: {
      id: 'Sentra robusta di Malang selatan. Pekat dan pahit manis, langganan kopi susu.',
      en: 'The robusta hub of southern Malang. Strong and bittersweet; a milk-coffee staple.',
    },
    notes: {
      washed: ['cocoa', 'nutty', 'malt'],
      natural: ['darkChocolate', 'peanut', 'earthy'],
      honey: ['brownSugar', 'cocoa', 'nutty'],
      wetHulled: ['earthy', 'woody', 'tobacco'],
      anaerobic: ['boozy', 'cocoa', 'banana'],
    },
  },
  {
    id: 'kintamani',
    name: 'Kintamani',
    aliases: ['bali', 'bali kintamani', 'batur', 'bangli'],
    country: ID,
    region: 'Bangli, Bali',
    altitude: '1000–1600',
    species: 'arabica',
    varieties: ['Kopyol', 'USDA', 'S795'],
    common: ['washed', 'natural', 'honey'],
    body: 'medium',
    acidity: 'high',
    about: {
      id: 'Ditanam bersama jeruk di sekitar Gunung Batur, jadi khas segar dan beraroma jeruk. Sudah ber-Indikasi Geografis.',
      en: 'Grown alongside citrus trees around Mount Batur, so it tends to be bright and citrusy. Has a Geographical Indication.',
    },
    notes: {
      washed: ['orange', 'lemon', 'brownSugar', 'floral'],
      natural: ['orange', 'strawberry', 'wine', 'chocolate'],
      honey: ['orange', 'honey', 'caramel'],
      wetHulled: ['citrus', 'spice', 'chocolate'],
      anaerobic: ['tropical', 'orange', 'boozy'],
    },
  },
  {
    id: 'bajawa',
    name: 'Flores Bajawa',
    aliases: ['flores', 'ngada', 'ntt', 'nusa tenggara timur', 'arabika flores'],
    country: ID,
    region: 'Ngada, Flores',
    altitude: '1200–1600',
    species: 'arabica',
    varieties: ['Typica', 'Catimor', 'Jember'],
    common: ['washed', 'natural', 'honey'],
    body: 'medium',
    acidity: 'medium',
    about: {
      id: 'Dari kaki Gunung Inerie di tanah vulkanik. Manis cokelat dengan sentuhan buah.',
      en: 'From the foothills of Mount Inerie on volcanic soil. Chocolatey sweetness with a touch of fruit.',
    },
    notes: {
      washed: ['chocolate', 'vanilla', 'citrus', 'floral'],
      natural: ['berry', 'chocolate', 'wine'],
      honey: ['caramel', 'vanilla', 'redFruit'],
      wetHulled: ['earthy', 'spice', 'darkChocolate'],
      anaerobic: ['tropical', 'boozy', 'vanilla'],
    },
  },
  {
    id: 'manggarai',
    name: 'Flores Manggarai',
    aliases: ['manggarai', 'ruteng', 'colol', 'flores', 'ntt'],
    country: ID,
    region: 'Manggarai, Flores',
    altitude: '1100–1500',
    species: 'arabica',
    varieties: ['Typica', 'Juria', 'Catimor'],
    common: ['washed', 'natural'],
    body: 'medium',
    acidity: 'medium',
    about: {
      id: 'Dari sekitar Ruteng dan Colol. Arabika dan robustanya sama-sama dikenal.',
      en: 'From around Ruteng and Colol. Known for both its arabica and robusta.',
    },
    notes: {
      washed: ['chocolate', 'caramel', 'citrus'],
      natural: ['berry', 'darkChocolate', 'raisin'],
      honey: ['brownSugar', 'redFruit', 'chocolate'],
      wetHulled: ['earthy', 'spice', 'cocoa'],
      anaerobic: ['boozy', 'tropical', 'cocoa'],
    },
  },
  {
    id: 'toraja',
    name: 'Toraja',
    aliases: ['sulawesi', 'tana toraja', 'sapan', 'pulu-pulu', 'toraja kalosi', 'celebes'],
    country: ID,
    region: 'Tana Toraja, Sulawesi Selatan',
    altitude: '1400–1900',
    species: 'arabica',
    varieties: ['Typica (S795)', 'Lini S', 'Pulu-pulu'],
    common: ['wetHulled', 'washed', 'natural'],
    body: 'high',
    acidity: 'medium',
    about: {
      id: 'Kopi dataran tinggi Toraja yang mendunia. Tebal, rempah, dengan keasaman lembut.',
      en: "Toraja's world-famous highland coffee. Full-bodied and spicy with gentle acidity.",
    },
    notes: {
      washed: ['chocolate', 'citrus', 'floral', 'brownSugar'],
      natural: ['berry', 'wine', 'chocolate', 'spice'],
      honey: ['caramel', 'redFruit', 'spice'],
      wetHulled: ['darkChocolate', 'spice', 'earthy', 'herbal'],
      anaerobic: ['tropical', 'boozy', 'cinnamon'],
    },
  },
  {
    id: 'kalosi',
    name: 'Kalosi Enrekang',
    aliases: ['enrekang', 'kalosi', 'sulawesi', 'latimojong'],
    country: ID,
    region: 'Enrekang, Sulawesi Selatan',
    altitude: '1200–1700',
    species: 'arabica',
    varieties: ['Typica (S795)', 'Lini S'],
    common: ['wetHulled', 'washed'],
    body: 'high',
    acidity: 'medium',
    about: {
      id: 'Tetangga Toraja di pegunungan Latimojong. Nama "Kalosi" dulu dipakai untuk kopi Sulawesi.',
      en: 'Toraja\'s neighbour in the Latimojong mountains. "Kalosi" was once the trade name for Sulawesi coffee.',
    },
    notes: {
      washed: ['chocolate', 'citrus', 'nutty'],
      natural: ['berry', 'chocolate', 'wine'],
      honey: ['brownSugar', 'caramel', 'redFruit'],
      wetHulled: ['earthy', 'spice', 'darkChocolate', 'woody'],
      anaerobic: ['boozy', 'tropical', 'spice'],
    },
  },
  {
    id: 'wamena',
    name: 'Papua Wamena',
    aliases: ['papua', 'wamena', 'baliem', 'lembah baliem', 'jayawijaya'],
    country: ID,
    region: 'Lembah Baliem, Papua',
    altitude: '1500–2000',
    species: 'arabica',
    varieties: ['Typica'],
    common: ['washed', 'natural'],
    body: 'medium',
    acidity: 'medium',
    about: {
      id: 'Ditanam petani kecil di Lembah Baliem, umumnya tanpa pupuk kimia. Manis dan bersih.',
      en: 'Grown by smallholders in the Baliem Valley, mostly without chemical fertiliser. Sweet and clean.',
    },
    notes: {
      washed: ['chocolate', 'nutty', 'citrus', 'floral'],
      natural: ['berry', 'chocolate', 'caramel'],
      honey: ['honey', 'caramel', 'redFruit'],
      wetHulled: ['earthy', 'spice', 'chocolate'],
      anaerobic: ['tropical', 'boozy', 'cocoa'],
    },
  },
  {
    id: 'liberikaJambi',
    name: 'Liberika Jambi',
    aliases: ['tanjung jabung', 'tanjabbar', 'liberica', 'liberika', 'meranti', 'excelsa'],
    country: ID,
    region: 'Tanjung Jabung Barat, Jambi',
    altitude: '0–100',
    species: 'liberica',
    varieties: ['Liberika Tungkal Komposit'],
    common: ['natural', 'honey'],
    body: 'high',
    acidity: 'low',
    about: {
      id: 'Liberika dari lahan gambut dataran rendah. Aroma nangka yang khas. Mirip juga dengan liberika Meranti (Riau).',
      en: 'Liberica from lowland peat soil, with its signature jackfruit aroma. Similar to Meranti liberica (Riau).',
    },
    notes: {
      washed: ['jackfruit', 'woody', 'cocoa'],
      natural: ['jackfruit', 'smoky', 'darkChocolate', 'tamarind'],
      honey: ['jackfruit', 'palmSugar', 'woody'],
      wetHulled: ['earthy', 'smoky', 'woody'],
      anaerobic: ['jackfruit', 'boozy', 'tropical'],
    },
  },
  {
    id: 'yirgacheffe',
    name: 'Ethiopia Yirgacheffe',
    aliases: ['ethiopia', 'etiopia', 'yirgachefe', 'gedeo', 'kochere', 'aricha'],
    country: { id: 'Etiopia', en: 'Ethiopia' },
    region: 'Gedeo, SNNPR',
    altitude: '1700–2200',
    species: 'arabica',
    varieties: ['Heirloom (landrace)', '74110', '74112'],
    common: ['washed', 'natural'],
    body: 'low',
    acidity: 'high',
    about: {
      id: 'Ikon kopi floral dari tanah asal arabika. Washed-nya ringan seperti teh.',
      en: "The icon of floral coffee from arabica's homeland. The washed lots are tea-like and delicate.",
    },
    notes: {
      washed: ['jasmine', 'bergamot', 'lemon', 'blackTea'],
      natural: ['blueberry', 'strawberry', 'jasmine', 'wine'],
      honey: ['peach', 'honey', 'floral'],
      wetHulled: ['floral', 'herbal', 'citrus'],
      anaerobic: ['strawberry', 'yogurt', 'tropical', 'rose'],
    },
  },
  {
    id: 'guji',
    name: 'Ethiopia Guji',
    aliases: ['ethiopia', 'etiopia', 'hambela', 'shakiso', 'uraga', 'oromia'],
    country: { id: 'Etiopia', en: 'Ethiopia' },
    region: 'Guji, Oromia',
    altitude: '1800–2300',
    species: 'arabica',
    varieties: ['Heirloom (landrace)', '74158'],
    common: ['natural', 'washed'],
    body: 'medium',
    acidity: 'high',
    about: {
      id: 'Dulu bagian Sidamo, kini terkenal sendiri dengan natural yang manis buah.',
      en: 'Once part of Sidamo, now famous on its own for fruit-sweet naturals.',
    },
    notes: {
      washed: ['peach', 'floral', 'lemon', 'honey'],
      natural: ['blueberry', 'tropical', 'chocolate', 'wine'],
      honey: ['apricot', 'honey', 'floral'],
      wetHulled: ['herbal', 'citrus', 'cocoa'],
      anaerobic: ['strawberry', 'boozy', 'mango', 'cinnamon'],
    },
  },
  {
    id: 'sidamo',
    name: 'Ethiopia Sidamo',
    aliases: ['ethiopia', 'etiopia', 'sidama', 'bensa', 'bona zuria'],
    country: { id: 'Etiopia', en: 'Ethiopia' },
    region: 'Sidama',
    altitude: '1500–2200',
    species: 'arabica',
    varieties: ['Heirloom (landrace)'],
    common: ['washed', 'natural'],
    body: 'medium',
    acidity: 'high',
    about: {
      id: 'Wilayah luas di selatan Etiopia dengan rasa buah dan bunga yang kompleks.',
      en: 'A large region in southern Ethiopia with complex fruit and floral flavours.',
    },
    notes: {
      washed: ['lemon', 'floral', 'peach', 'blackTea'],
      natural: ['blueberry', 'wine', 'chocolate'],
      honey: ['apricot', 'honey', 'citrus'],
      wetHulled: ['herbal', 'citrus', 'cocoa'],
      anaerobic: ['tropical', 'boozy', 'strawberry'],
    },
  },
  {
    id: 'kenya',
    name: 'Kenya Nyeri',
    aliases: ['kenya', 'kenia', 'nyeri', 'kirinyaga', 'sl28', 'sl34'],
    country: { id: 'Kenya', en: 'Kenya' },
    region: 'Nyeri, Kirinyaga',
    altitude: '1600–2100',
    species: 'arabica',
    varieties: ['SL28', 'SL34', 'Ruiru 11', 'Batian'],
    common: ['washed'],
    body: 'medium',
    acidity: 'high',
    about: {
      id: 'Terkenal dengan keasaman tajam dan rasa blackcurrant dari varietas SL28/SL34.',
      en: 'Famous for sharp acidity and blackcurrant from the SL28/SL34 varieties.',
    },
    notes: {
      washed: ['blackcurrant', 'grapefruit', 'tamarind', 'brownSugar'],
      natural: ['blackcurrant', 'wine', 'plum', 'chocolate'],
      honey: ['redFruit', 'brownSugar', 'grapefruit'],
      wetHulled: ['blackcurrant', 'herbal', 'earthy'],
      anaerobic: ['blackcurrant', 'boozy', 'tropical'],
    },
  },
  {
    id: 'huila',
    name: 'Colombia Huila',
    aliases: ['colombia', 'kolombia', 'pitalito', 'san agustin', 'nariño', 'narino'],
    country: { id: 'Kolombia', en: 'Colombia' },
    region: 'Huila',
    altitude: '1500–2000',
    species: 'arabica',
    varieties: ['Caturra', 'Castillo', 'Colombia', 'Pink Bourbon'],
    common: ['washed', 'honey', 'natural', 'anaerobic'],
    body: 'medium',
    acidity: 'high',
    about: {
      id: 'Salah satu wilayah terbaik Kolombia. Manis, cerah, dan banyak eksperimen fermentasi.',
      en: "One of Colombia's best regions. Sweet, bright, and a hotbed of fermentation experiments.",
    },
    notes: {
      washed: ['redFruit', 'caramel', 'citrus', 'chocolate'],
      natural: ['strawberry', 'chocolate', 'wine'],
      honey: ['caramel', 'peach', 'redFruit'],
      wetHulled: ['chocolate', 'spice', 'earthy'],
      anaerobic: ['strawberry', 'lychee', 'boozy', 'yogurt'],
    },
  },
  {
    id: 'cerrado',
    name: 'Brazil Cerrado',
    aliases: ['brazil', 'brasil', 'cerrado mineiro', 'sul de minas', 'minas gerais', 'santos'],
    country: { id: 'Brasil', en: 'Brazil' },
    region: 'Cerrado Mineiro, Minas Gerais',
    altitude: '800–1300',
    species: 'arabica',
    varieties: ['Mundo Novo', 'Catuaí', 'Yellow Bourbon'],
    common: ['natural', 'honey'],
    body: 'high',
    acidity: 'low',
    about: {
      id: 'Kopi Brasil klasik: manis kacang dan cokelat, rendah asam. Andalan untuk espresso blend.',
      en: 'Classic Brazil: nutty and chocolatey, low acidity. A go-to for espresso blends.',
    },
    notes: {
      washed: ['milkChocolate', 'almond', 'citrus'],
      natural: ['peanut', 'milkChocolate', 'caramel', 'cereal'],
      honey: ['caramel', 'hazelnut', 'brownSugar'],
      wetHulled: ['nutty', 'earthy', 'cocoa'],
      anaerobic: ['raisin', 'boozy', 'chocolate'],
    },
  },
  {
    id: 'antigua',
    name: 'Guatemala Antigua',
    aliases: ['guatemala', 'huehuetenango', 'atitlan'],
    country: { id: 'Guatemala', en: 'Guatemala' },
    region: 'Antigua',
    altitude: '1500–1700',
    species: 'arabica',
    varieties: ['Bourbon', 'Caturra', 'Catuaí'],
    common: ['washed'],
    body: 'medium',
    acidity: 'medium',
    about: {
      id: 'Lembah di antara gunung api. Cokelat dan rempah dengan keasaman rapi.',
      en: 'A valley between volcanoes. Chocolate and spice with tidy acidity.',
    },
    notes: {
      washed: ['chocolate', 'spice', 'apple', 'caramel'],
      natural: ['cherry', 'chocolate', 'wine'],
      honey: ['caramel', 'apple', 'brownSugar'],
      wetHulled: ['spice', 'earthy', 'cocoa'],
      anaerobic: ['boozy', 'cherry', 'cinnamon'],
    },
  },
  {
    id: 'tarrazu',
    name: 'Costa Rica Tarrazú',
    aliases: ['costa rica', 'kosta rika', 'tarrazu', 'west valley'],
    country: { id: 'Kosta Rika', en: 'Costa Rica' },
    region: 'Tarrazú, San José',
    altitude: '1200–1900',
    species: 'arabica',
    varieties: ['Caturra', 'Catuaí', 'Villa Sarchi'],
    common: ['honey', 'washed'],
    body: 'medium',
    acidity: 'high',
    about: {
      id: 'Rumah proses honey (yellow, red, black). Bersih, manis, dan cerah.',
      en: 'The home of honey processing (yellow, red, black). Clean, sweet and bright.',
    },
    notes: {
      washed: ['citrus', 'honey', 'apple'],
      natural: ['redFruit', 'chocolate', 'wine'],
      honey: ['honey', 'apricot', 'brownSugar', 'peach'],
      wetHulled: ['nutty', 'spice', 'cocoa'],
      anaerobic: ['tropical', 'boozy', 'cinnamon'],
    },
  },
  {
    id: 'geisha',
    name: 'Panama Geisha',
    aliases: ['panama', 'gesha', 'boquete', 'chiriqui', 'chiriquí', 'esmeralda'],
    country: { id: 'Panama', en: 'Panama' },
    region: 'Boquete, Chiriquí',
    altitude: '1500–1900',
    species: 'arabica',
    varieties: ['Geisha'],
    common: ['washed', 'natural'],
    body: 'low',
    acidity: 'high',
    about: {
      id: 'Varietas Geisha yang mendunia lewat lelang. Sangat floral, mahal, dan wangi.',
      en: 'The Geisha variety made famous at auction. Intensely floral, pricey and fragrant.',
    },
    notes: {
      washed: ['jasmine', 'bergamot', 'peach', 'honey'],
      natural: ['jasmine', 'strawberry', 'tropical', 'wine'],
      honey: ['jasmine', 'apricot', 'honey'],
      wetHulled: ['floral', 'herbal', 'citrus'],
      anaerobic: ['jasmine', 'lychee', 'passionfruit', 'boozy'],
    },
  },
  {
    id: 'rwanda',
    name: 'Rwanda',
    aliases: ['rwanda', 'ruanda', 'nyamasheke', 'huye', 'kivu'],
    country: { id: 'Rwanda', en: 'Rwanda' },
    region: 'Nyamasheke, Huye',
    altitude: '1500–2000',
    species: 'arabica',
    varieties: ['Red Bourbon'],
    common: ['washed', 'natural'],
    body: 'medium',
    acidity: 'high',
    about: {
      id: 'Bourbon dari tepi Danau Kivu. Manis buah merah dan teh.',
      en: 'Bourbon from the shores of Lake Kivu. Red-fruit sweetness and tea.',
    },
    notes: {
      washed: ['redFruit', 'blackTea', 'orange', 'brownSugar'],
      natural: ['raspberry', 'wine', 'chocolate'],
      honey: ['redFruit', 'honey', 'caramel'],
      wetHulled: ['herbal', 'cocoa', 'spice'],
      anaerobic: ['raspberry', 'boozy', 'tropical'],
    },
  },
  {
    id: 'honduras',
    name: 'Honduras Marcala',
    aliases: ['honduras', 'marcala', 'santa barbara', 'copan'],
    country: { id: 'Honduras', en: 'Honduras' },
    region: 'Marcala, La Paz',
    altitude: '1300–1700',
    species: 'arabica',
    varieties: ['Catuaí', 'Lempira', 'Parainema', 'Pacas'],
    common: ['washed', 'honey'],
    body: 'medium',
    acidity: 'medium',
    about: {
      id: 'Kopi Amerika Tengah yang manis dan bersahabat. Cocok untuk seduh harian.',
      en: 'A sweet, approachable Central American coffee. Great for everyday brewing.',
    },
    notes: {
      washed: ['caramel', 'milkChocolate', 'apple'],
      natural: ['cherry', 'chocolate', 'raisin'],
      honey: ['caramel', 'peach', 'brownSugar'],
      wetHulled: ['nutty', 'earthy', 'cocoa'],
      anaerobic: ['tropical', 'boozy', 'cinnamon'],
    },
  },
  {
    id: 'peru',
    name: 'Peru Cajamarca',
    aliases: ['peru', 'cajamarca', 'jaen', 'cusco', 'puno'],
    country: { id: 'Peru', en: 'Peru' },
    region: 'Cajamarca',
    altitude: '1400–2000',
    species: 'arabica',
    varieties: ['Typica', 'Caturra', 'Bourbon'],
    common: ['washed'],
    body: 'medium',
    acidity: 'medium',
    about: {
      id: 'Banyak dari koperasi petani kecil dan organik. Lembut dan manis.',
      en: 'Largely from smallholder and organic co-ops. Soft and sweet.',
    },
    notes: {
      washed: ['milkChocolate', 'caramel', 'nutty', 'citrus'],
      natural: ['berry', 'chocolate', 'raisin'],
      honey: ['honey', 'caramel', 'apple'],
      wetHulled: ['nutty', 'earthy', 'cocoa'],
      anaerobic: ['tropical', 'boozy', 'cocoa'],
    },
  },
  {
    id: 'blueMountain',
    name: 'Jamaica Blue Mountain',
    aliases: ['jamaica', 'jamaika', 'blue mountain'],
    country: { id: 'Jamaika', en: 'Jamaica' },
    region: 'Blue Mountains',
    altitude: '900–1700',
    species: 'arabica',
    varieties: ['Typica'],
    common: ['washed'],
    body: 'medium',
    acidity: 'low',
    about: {
      id: 'Kopi legendaris dan mahal dari pegunungan Jamaika. Halus dan sangat seimbang.',
      en: 'Legendary, pricey coffee from the Jamaican mountains. Smooth and very balanced.',
    },
    notes: {
      washed: ['milkChocolate', 'nutty', 'floral', 'butter'],
      natural: ['cherry', 'chocolate', 'nutty'],
      honey: ['honey', 'nutty', 'caramel'],
      wetHulled: ['nutty', 'earthy', 'cocoa'],
      anaerobic: ['boozy', 'chocolate', 'cherry'],
    },
  },
  {
    id: 'yemen',
    name: 'Yemen Mocha',
    aliases: ['yemen', 'yaman', 'mocha', 'mokha', 'haraz', 'bani matar'],
    country: { id: 'Yaman', en: 'Yemen' },
    region: 'Haraz, Bani Matar',
    altitude: '1500–2500',
    species: 'arabica',
    varieties: ['Udaini', 'Dawairi', 'Tufahi'],
    common: ['natural'],
    body: 'high',
    acidity: 'medium',
    about: {
      id: 'Asal nama "mocha". Dijemur kering di teras pegunungan, rasanya liar dan kompleks.',
      en: 'Where the name "mocha" comes from. Sun-dried on mountain terraces; wild and complex.',
    },
    notes: {
      washed: ['chocolate', 'spice', 'apricot'],
      natural: ['date', 'raisin', 'darkChocolate', 'wine', 'spice'],
      honey: ['date', 'honey', 'spice'],
      wetHulled: ['earthy', 'spice', 'cocoa'],
      anaerobic: ['boozy', 'date', 'cinnamon'],
    },
  },
  {
    id: 'daklak',
    name: 'Vietnam Dak Lak',
    aliases: ['vietnam', 'dak lak', 'đắk lắk', 'buon ma thuot', 'robusta vietnam'],
    country: { id: 'Vietnam', en: 'Vietnam' },
    region: 'Đắk Lắk, Central Highlands',
    altitude: '500–800',
    species: 'robusta',
    varieties: ['Robusta TR4', 'TR9'],
    common: ['natural', 'honey'],
    body: 'high',
    acidity: 'low',
    about: {
      id: 'Pusat robusta dunia, bahan kopi phin dan kopi susu Vietnam.',
      en: "The world's robusta heartland, behind Vietnamese phin and milk coffee.",
    },
    notes: {
      washed: ['cocoa', 'nutty', 'malt'],
      natural: ['darkChocolate', 'earthy', 'peanut', 'tobacco'],
      honey: ['brownSugar', 'cocoa', 'nutty'],
      wetHulled: ['earthy', 'woody', 'smoky'],
      anaerobic: ['boozy', 'cocoa', 'banana'],
    },
  },
]

/** Lowercase, no accents, single spaces: "Đắk  Lắk" → "dak lak". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const SEARCH_TEXT = new Map(
  ORIGINS.map((o) => [
    o.id,
    normalize([o.name, ...o.aliases, o.country.id, o.country.en, o.region, ...o.varieties].join(' ')),
  ]),
)

/**
 * Origins containing every word of the query, best first: a name match
 * beats a whole-word match, which beats part of a word. Empty query → nothing.
 */
export function searchOrigins(query: string): Origin[] {
  const words = normalize(query).split(' ').filter(Boolean)
  if (words.length === 0) return []
  const scored: { o: Origin; score: number }[] = []
  for (const o of ORIGINS) {
    const text = SEARCH_TEXT.get(o.id)!
    if (!words.every((w) => text.includes(w))) continue
    const name = normalize(o.name)
    const whole = ` ${text} `
    const score =
      name === words.join(' ')
        ? 0
        : words.every((w) => name.includes(w))
          ? 1
          : // Whole-word hits ("bali") beat parts of longer words ("baliem").
            words.every((w) => whole.includes(` ${w} `))
            ? 2
            : 3
    scored.push({ o, score })
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.o)
}

export function findOrigin(id: string | undefined): Origin | undefined {
  return ORIGINS.find((o) => o.id === id)
}
