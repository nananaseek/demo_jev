// Generates fictional specialist profiles for the demo.
// Deterministic: same seed -> same data. No real people, clinics or contacts.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const output = join(here, "..", "src", "features", "specialists", "data", "specialists.generated.ts");

const SEED = 20261124;

const CATEGORY_ORDER = [
  "mental-health",
  "cardiology",
  "neurology",
  "gastroenterology",
  "dermatology",
  "orthopedics",
  "pediatrics",
  "general-medicine",
];

const SPECS = {
  "mental-health": {
    "psychologist": {
      role: "Психолог",
      tags: ["стрес", "тривога", "стосунки", "самооцінка", "вигорання", "адаптація", "втрата", "сон", "панічні атаки", "кар'єра"],
      approaches: ["КПТ-консультування", "екзистенційна терапія", "системна терапія", "коучинг"],
      price: 900,
    },
    "psychotherapist": {
      role: "Психотерапевт",
      tags: ["панічні атаки", "тривога", "депресія", "травма", "нав'язливі думки", "розлади харчування", "сором", "дитячі травми", "КПТ", "EMDR"],
      approaches: ["КПТ", "EMDR", "психодинамічна терапія", "схема-терапія"],
      price: 1100,
    },
    "psychiatrist": {
      role: "Психіатр",
      tags: ["депресія", "біполярний розлад", "психоз", "тривога", "безсоння", "суїцидальні думки", "ОКР", "медикаментозна терапія"],
      approaches: ["медикаментозна терапія", "психофармакологія", "комплексна оцінка"],
      price: 1000,
    },
  },
  "cardiology": {
    "cardiologist": {
      role: "Кардіолог",
      tags: ["біль у грудях", "гіпертонія", "задишка", "набряки", "шуми в серці", "холестерин", "профілактика", "тиск"],
      approaches: ["ЕКГ", "ЕхоКГ", "добовий моніторинг", "ліпідний профіль"],
      price: 800,
    },
    "arrhythmologist": {
      role: "Аритмолог",
      tags: ["перебої", "тахікардія", "фібриляція передсердь", "запаморочення", "ритм серця", "ЕКГ", "холтер"],
      approaches: ["Холтер", "ЕФД", "абляція", "антиаритмічна терапія"],
      price: 950,
    },
    "cardiosurgeon": {
      role: "Кардіохірург",
      tags: ["вади серця", "коронарна хвороба", "аневризма", "стентування", "операція", "вроджені вади"],
      approaches: ["АКШ", "протезування клапанів", "стентування"],
      price: 1200,
    },
  },
  "neurology": {
    "neurologist": {
      role: "Невролог",
      tags: ["головний біль", "мігрень", "невралгія", "оніміння", "тремор", "порушення пам'яті", "запаморочення"],
      approaches: ["МРТ-оцінка", "медикаментозна терапія", "ботулінотерапія"],
      price: 850,
    },
    "epileptologist": {
      role: "Епілептолог",
      tags: ["судоми", "епілепсія", "втрата свідомості", "напади", "протиепілептичні ліки", "ЕЕГ"],
      approaches: ["ЕЕГ", "підбір протиепілептичних препаратів", "відео-ЕЕГ"],
      price: 1000,
    },
    "neurosurgeon": {
      role: "Нейрохірург",
      tags: ["грижа диска", "пухлина", "аневризма", "травма хребта", "травма мозку", "операція"],
      approaches: ["мікрохірургія", "ендоскопія", "стабілізація хребта"],
      price: 1300,
    },
  },
  "gastroenterology": {
    "gastroenterologist": {
      role: "Гастроентеролог",
      tags: ["печія", "гастрит", "виразка", "здуття", "діарея", "закреп", "СПК", "нудота"],
      approaches: ["гастроскопія", "колоноскопія", "дієтотерапія", "антибактеріальна терапія"],
      price: 800,
    },
    "hepatologist": {
      role: "Гепатолог",
      tags: ["печінка", "гепатит", "жовтяниця", "цироз", "жирова хвороба печінки", "печінкові ферменти"],
      approaches: ["еластографія", "противірусна терапія", "УЗД печінки"],
      price: 900,
    },
    "dietitian": {
      role: "Дієтолог",
      tags: ["харчування", "зайва вага", "діабет", "харчова алергія", "дефіцит вітамінів", "ШКТ"],
      approaches: ["розрахунок КБЖУ", "лікувальні дієти", "харчовий щоденник"],
      price: 700,
    },
  },
  "dermatology": {
    "dermatologist": {
      role: "Дерматолог",
      tags: ["висип", "свербіж", "дерматит", "екзема", "псоріаз", "акне", "грибок"],
      approaches: ["дерматоскопія", "топічна терапія", "фотолікування"],
      price: 700,
    },
    "dermatooncologist": {
      role: "Дерматоонколог",
      tags: ["родимка", "меланома", "новоутворення", "дерматоскопія", "рак шкіри"],
      approaches: ["дерматоскопія", "біопсія", "спостереження новоутворень"],
      price: 900,
    },
    "trichologist": {
      role: "Трихолог",
      tags: ["випадання волосся", "алопеція", "лупа", "себорея", "шкіра голови"],
      approaches: ["трихоскопія", "мезотерапія", "топічна терапія"],
      price: 750,
    },
  },
  "orthopedics": {
    "orthopedist": {
      role: "Ортопед-травматолог",
      tags: ["перелом", "розтягнення", "біль у коліні", "артроз", "плоскостопість", "травма"],
      approaches: ["рентген", "УЗД суглобів", "внутрішньосуглобові ін'єкції", "гіпсування"],
      price: 750,
    },
    "vertebrologist": {
      role: "Вертебролог",
      tags: ["біль у спині", "грижа диска", "протрузія", "сколіоз", "остеохондроз", "біль у шиї"],
      approaches: ["МРТ хребта", "мануальна терапія", "блокади"],
      price: 800,
    },
    "rehabilitologist": {
      role: "Реабілітолог",
      tags: ["реабілітація", "ЛФК", "біль у м'язах", "після операції", "відновлення", "постава"],
      approaches: ["ЛФК", "кінезіотерапія", "масаж", "фізіотерапія"],
      price: 650,
    },
  },
  "pediatrics": {
    "pediatrician": {
      role: "Педіатр",
      tags: ["температура", "кашель", "нежить", "щеплення", "розвиток дитини", "харчування"],
      approaches: ["огляд", "щеплення", "інтерпретація аналізів"],
      price: 650,
    },
    "pediatric-neurologist": {
      role: "Дитячий невролог",
      tags: ["затримка розвитку", "судоми", "тики", "головний біль", "сон", "увага"],
      approaches: ["ЕЕГ", "нейропсихологічна оцінка", "медикаментозна терапія"],
      price: 800,
    },
    "pediatric-allergist": {
      role: "Дитячий алерголог",
      tags: ["харчова алергія", "атопічний дерматит", "кропив'янка", "астма", "сезонна алергія"],
      approaches: ["алергопроби", "елімінаційна дієта", "імунотерапія"],
      price: 800,
    },
  },
  "general-medicine": {
    "therapist": {
      role: "Терапевт",
      tags: ["втома", "застуда", "тиск", "аналізи", "слабкість", "кашель"],
      approaches: ["загальний огляд", "аналізи", "ЕКГ", "направлення"],
      price: 550,
    },
    "family-doctor": {
      role: "Сімейний лікар",
      tags: ["профілактика", "вакцинація", "хронічні хвороби", "перший контакт", "сім'я"],
      approaches: ["профілактичні огляди", "вакцинація", "супровід хронічних хвороб"],
      price: 600,
    },
    "geriatrician": {
      role: "Геріатр",
      tags: ["падіння", "пам'ять", "багато ліків", "крихкість", "65+", "супровід"],
      approaches: ["комплексна геріатрична оцінка", "перегляд ліків", "профілактика падінь"],
      price: 700,
    },
  },
};

const FIRST_NAMES = [
  "Олена", "Ірина", "Наталія", "Оксана", "Тетяна", "Марія", "Софія", "Юлія", "Анна", "Катерина",
  "Андрій", "Сергій", "Дмитро", "Олександр", "Максим", "Богдан", "Ігор", "Василь", "Микола", "Петро",
  "Ольга", "Вікторія", "Христина", "Соломія", "Леся", "Дарина", "Аліна", "Іванна", "Роман", "Тарас",
  "Ярослав", "Віталій", "Євген", "Артем", "Назар", "Остап", "Ліліана", "Зоряна", "Орест", "Уляна",
];

const LAST_NAMES = [
  "Шевченко", "Коваленко", "Бондаренко", "Ткаченко", "Кравченко", "Мельник", "Поліщук", "Гончар",
  "Лисенко", "Руденко", "Марченко", "Савченко", "Петренко", "Іваненко", "Мороз", "Клименко",
  "Пономаренко", "Гриценко", "Даниленко", "Науменко", "Сидоренко", "Захарченко", "Кушнір", "Тарасенко",
  "Юрченко", "Яковенко", "Олійник", "Литвиненко", "Гаврилюк", "Демченко", "Хоменко", "Мазур",
  "Павленко", "Слободян", "Власенко", "Романенко", "Корнієнко", "Білоус", "Тимошенко", "Гуменюк",
];

const EDUCATION = [
  "Медична академія «Асклепій», Київ",
  "Університет здоров'я «Свідомість», Львів",
  "Інститут медицини «Гіппократ», Дніпро",
  "Медична школа «Пульс», Одеса",
  "Академія сімейної медицини, Харків",
];

const LANGUAGE_SETS = [
  ["Українська"],
  ["Українська", "Англійська"],
  ["Українська", "Англійська", "Польська"],
  ["Українська", "Польська"],
];

function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(SEED);
const pick = (list) => list[Math.floor(random() * list.length)];

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const usedNames = new Set();
function makeName() {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
  throw new Error("Unable to generate a unique fictional name");
}

const BASE_SLOT = Date.parse("2026-11-25T09:00:00+02:00");

const doctors = [];
let doctorIndex = 0;

for (const categoryId of CATEGORY_ORDER) {
  const subcategories = SPECS[categoryId];
  let subIndex = 0;
  for (const [subcategoryId, spec] of Object.entries(subcategories)) {
    const count = 5 + ((doctorIndex + subIndex) % 4);
    for (let i = 0; i < count; i += 1) {
      const experienceYears = 3 + Math.floor(random() * 26);
      const rating = Math.round((4.5 + random() * 0.5) * 10) / 10;
      const tags = shuffle(spec.tags).slice(0, 5);
      const approach = pick(spec.approaches);
      const languages = LANGUAGE_SETS[doctorIndex % LANGUAGE_SETS.length];
      const patientGroup = categoryId === "pediatrics" ? "дітей" : "дорослих";
      const slot = new Date(
        BASE_SLOT + (Math.floor(doctorIndex / 3) * 24 + (doctorIndex % 3) * 3) * 60 * 60 * 1000,
      );

      doctors.push({
        id: `${subcategoryId}-${i + 1}`,
        categoryId,
        subcategoryId,
        name: makeName(),
        role: spec.role,
        experienceYears,
        rating,
        reviews: 12 + Math.floor(random() * 320),
        priceUah: Math.round((spec.price + experienceYears * 18 + rating * 40) / 50) * 50,
        languages,
        approaches: shuffle(spec.approaches).slice(0, 3),
        tags,
        bio: `Приймає ${patientGroup}. Спеціалізується на ${tags[0]} та ${tags[1]}; працює в підході «${approach}». Пояснює план простими словами.`,
        education: EDUCATION[doctorIndex % EDUCATION.length],
        nextSlot: slot.toISOString(),
      });

      doctorIndex += 1;
    }
    subIndex += 1;
  }
}

const lines = doctors.map((doctor) => `  ${JSON.stringify(doctor)},`);

const file = `// AUTO-GENERATED by scripts/generate-specialists.mjs (seed ${SEED}).
// Fictional demo data. Names, clinics, education and contacts are invented.
// Run: npm run data:generate
import type { Specialist } from "../types";

export const specialists: readonly Specialist[] = [
${lines.join("\n")}
];
`;

writeFileSync(output, file, "utf8");
console.log(`Generated ${doctors.length} fictional specialists -> ${output}`);
