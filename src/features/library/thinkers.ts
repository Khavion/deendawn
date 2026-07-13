/**
 * Thinker pages — ORIGINAL DRAFT COPY (era/school/works are historical facts;
 * key ideas are neutral one-line summaries). HUMAN GATE #9: every entry here
 * is flagged in docs/SCHOLAR_REVIEW.md and ships only after sign-off. English
 * data-file content for now; UR/AR translations follow the same review.
 */
export interface Thinker {
  key: string;
  name: string;
  era: string;
  school: string;
  majorWorks: string[];
  keyIdeas: string[];
  /** artifact authorKey linking to bundled library works, if any. */
  libraryAuthorKey?: string;
}

export const THINKERS: Thinker[] = [
  {
    key: 'ghazali',
    name: 'Abu Hamid al-Ghazali',
    era: '1058–1111 CE, Tus (Persia)',
    school: 'Ash‘ari theology · Shafi‘i law · Sufism',
    majorWorks: [
      'Ihya Ulum al-Din',
      'The Incoherence of the Philosophers',
      'Deliverance from Error',
    ],
    keyIdeas: [
      'Direct spiritual experience can carry more certainty than abstract argument.',
      'Critiqued the philosophers of his era for overreaching beyond what reason can prove.',
      'Sought to reconnect legal and ritual practice with inner sincerity.',
    ],
    libraryAuthorKey: 'ghazali',
  },
  {
    key: 'rumi',
    name: 'Jalal al-Din Rumi',
    era: '1207–1273 CE, Balkh to Konya',
    school: 'Sufism (Mevlevi tradition)',
    majorWorks: ['Masnavi', 'Divan-e Shams', 'Fihi Ma Fihi'],
    keyIdeas: [
      'Used poetry and parable to describe love of the Divine.',
      'Held that longing itself points the seeker toward its source.',
      'His Masnavi weaves everyday stories into spiritual teaching.',
    ],
    libraryAuthorKey: 'rumi',
  },
  {
    key: 'ibnsina',
    name: 'Ibn Sina (Avicenna)',
    era: '980–1037 CE, Bukhara',
    school: 'Peripatetic philosophy · Medicine',
    majorWorks: ['The Canon of Medicine', 'The Book of Healing'],
    keyIdeas: [
      'Distinguished essence from existence in analyzing what things are.',
      'His medical encyclopedia was studied in Europe for centuries.',
      'Argued for a Necessary Existent as the ground of all contingent beings.',
    ],
  },
  {
    key: 'ibnrushd',
    name: 'Ibn Rushd (Averroes)',
    era: '1126–1198 CE, Cordoba',
    school: 'Peripatetic philosophy · Maliki law',
    majorWorks: [
      'The Incoherence of the Incoherence',
      'Decisive Treatise',
      'Commentaries on Aristotle',
    ],
    keyIdeas: [
      'Held that demonstrative reason and revelation cannot truly conflict.',
      'His Aristotle commentaries deeply shaped medieval European thought.',
      'Answered al-Ghazali’s critique of philosophy point by point.',
    ],
  },
  {
    key: 'farabi',
    name: 'Al-Farabi',
    era: 'c. 872–950 CE, Farab to Damascus',
    school: 'Peripatetic philosophy · Political philosophy',
    majorWorks: ['The Virtuous City', 'Enumeration of the Sciences'],
    keyIdeas: [
      'Described the ideal city as one ordered toward true happiness.',
      'Known as the “Second Teacher” after Aristotle.',
      'Mapped how the sciences relate to one another as a unified whole.',
    ],
  },
  {
    key: 'kindi',
    name: 'Al-Kindi',
    era: 'c. 801–873 CE, Kufa and Baghdad',
    school: 'Early Islamic philosophy',
    majorWorks: ['On First Philosophy', 'Treatises on optics, music, and medicine'],
    keyIdeas: [
      'Championed adopting truth from any source that carries it.',
      'Among the first to bring Greek philosophy into Arabic thought.',
      'Wrote across philosophy, mathematics, music, and medicine.',
    ],
  },
  {
    key: 'ibnkhaldun',
    name: 'Ibn Khaldun',
    era: '1332–1406 CE, Tunis to Cairo',
    school: 'Historiography · Social theory',
    majorWorks: ['Muqaddimah', 'Kitab al-Ibar'],
    keyIdeas: [
      'Analyzed the rise and fall of dynasties through group solidarity (asabiyyah).',
      'Treated history as a science requiring criticism of sources.',
      'Described economic and social patterns centuries before modern sociology.',
    ],
  },
  {
    key: 'ibnarabi',
    name: 'Ibn Arabi',
    era: '1165–1240 CE, Murcia to Damascus',
    school: 'Sufi metaphysics (Akbari tradition)',
    majorWorks: ['The Meccan Revelations', 'The Bezels of Wisdom'],
    keyIdeas: [
      'Explored how the many relate to the One across all existence.',
      'Wrote of the “perfect human” as a mirror of divine attributes.',
      'His metaphysics shaped Sufi thought from Anatolia to Southeast Asia.',
    ],
  },
  {
    key: 'razi',
    name: 'Fakhr al-Din al-Razi',
    era: '1150–1210 CE, Rayy to Herat',
    school: 'Ash‘ari theology · Quranic exegesis',
    majorWorks: ['The Great Commentary (Mafatih al-Ghayb)', 'Al-Matalib al-Aliya'],
    keyIdeas: [
      'Wove philosophy and theology into massive Quranic commentary.',
      'Catalogued arguments and counterarguments before judging between them.',
      'Modeled a disciplined, question-driven style of theological writing.',
    ],
  },
  {
    key: 'suhrawardi',
    name: 'Shihab al-Din Suhrawardi',
    era: '1154–1191 CE, Suhraward to Aleppo',
    school: 'Illuminationist philosophy (Ishraq)',
    majorWorks: ['The Philosophy of Illumination'],
    keyIdeas: [
      'Recast reality in terms of degrees of light and its unveiling.',
      'Joined Peripatetic rigor with visionary experience.',
      'Founded the Ishraqi school that flourished in Persia.',
    ],
  },
  {
    key: 'biruni',
    name: 'Al-Biruni',
    era: '973–1048 CE, Khwarazm',
    school: 'Mathematics · Astronomy · Comparative study of religions',
    majorWorks: ['India', 'The Mas‘udi Canon', 'Chronology of Ancient Nations'],
    keyIdeas: [
      'Measured the Earth and catalogued cultures with equal precision.',
      'Studied Indian religion and science on their own terms.',
      'Modeled empirical patience: observe first, conclude later.',
    ],
  },
  {
    key: 'ibntufayl',
    name: 'Ibn Tufayl',
    era: 'c. 1105–1185 CE, Granada to Marrakesh',
    school: 'Peripatetic philosophy',
    majorWorks: ['Hayy ibn Yaqzan'],
    keyIdeas: [
      'His island tale asks how far unaided reason can reach toward truth.',
      'Influenced European philosophy through early translations.',
      'Explored harmony between individual insight and revealed religion.',
    ],
  },
  {
    key: 'ashari',
    name: 'Abu al-Hasan al-Ash‘ari',
    era: '874–936 CE, Basra and Baghdad',
    school: 'Founder of Ash‘ari theology',
    majorWorks: ['Al-Ibana', 'Maqalat al-Islamiyyin'],
    keyIdeas: [
      'Charted a middle path between literalism and pure rationalism.',
      'Catalogued the theological positions of his era with care.',
      'His school became one of the two great Sunni theological traditions.',
    ],
  },
  {
    key: 'ibntaymiyyah',
    name: 'Ibn Taymiyyah',
    era: '1263–1328 CE, Harran to Damascus',
    school: 'Hanbali law · Theology',
    majorWorks: ['Majmu al-Fatawa', 'Dar’ Ta‘arud al-Aql wa al-Naql'],
    keyIdeas: [
      'Argued sound reason and sound transmission never truly conflict.',
      'Pressed for returning to the understanding of the earliest generations.',
      'Wrote extensively while imprisoned; his influence remains debated and broad.',
    ],
  },
  {
    key: 'shahwaliullah',
    name: 'Shah Waliullah Dehlawi',
    era: '1703–1762 CE, Delhi',
    school: 'Hadith scholarship · Renewal thought',
    majorWorks: ['Hujjat Allah al-Baligha'],
    keyIdeas: [
      'Sought the wisdom and purposes behind revealed law.',
      'Bridged juristic schools during a period of political decline.',
      'Translated the Quran into Persian to widen access in his region.',
    ],
  },
  {
    key: 'mullasadra',
    name: 'Mulla Sadra',
    era: 'c. 1571–1640 CE, Shiraz',
    school: 'Transcendent theosophy (al-Hikma al-Muta‘aliya)',
    majorWorks: ['The Four Journeys (Asfar)'],
    keyIdeas: [
      'Taught that existence is primary and comes in intensifying degrees.',
      'Described substantial motion: things deepen in being over time.',
      'Fused Avicennan philosophy, Illuminationism, and mysticism.',
    ],
  },
];
