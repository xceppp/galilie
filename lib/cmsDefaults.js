'use strict';

const NC_EMAIL = 'chaltoutenouamane@gmail.com';

const DEFAULT_CTA = '/form.html?intent=concours';

const content = {
  // Hero
  'hero.eyebrow': 'Conseil · Coaching · Meknès & à distance',
  'hero.title_html': 'Prenez de meilleures décisions — atteignez vos objectifs plus vite.',
  'hero.lead':
    'Conseil franc et coaching sur mesure pour dirigeants, cadres et profils ambitieux — des décisions claires, des résultats mesurables.',
  'hero.cta_primary': 'Demander un premier échange (20 min) →',
  'hero.cta_secondary': 'Comment ça marche',
  'hero.assure': 'Réponse personnalisée · Sans engagement',
  'hero.metric.1_value': '1-à-1',
  'hero.metric.1_suffix': '',
  'hero.metric.1_label': 'Accompagnement',
  'hero.metric.2_value': 'Meknès',
  'hero.metric.2_suffix': '',
  'hero.metric.2_label': '& à distance',
  'hero.metric.3_value': '20',
  'hero.metric.3_suffix': ' min',
  'hero.metric.3_label': 'Premier échange',
  'hero.card.badge': 'Premier échange',
  'hero.card.title': 'Parlons de votre objectif',
  'hero.card.sub':
    "20 minutes, confidentiel et sans engagement. On clarifie votre besoin et on définit la meilleure façon d'avancer.",
  'hero.card.items':
    'Diagnostic clair de votre situation\nRecommandation ciblée, pas générique\nConfidentialité totale',
  'hero.card.cta': 'Demander un premier échange →',
  'hero.card.rating': 'Premier échange confidentiel',

  // Concours — heures extra Licence / Master → formulaire
  'concours.label': 'Rejoignez-nous — Heures extra',
  'concours.title_html': 'Préparez votre <em>Licence</em> ou votre <em>Master</em>.',
  'concours.subtitle_html':
    "Vous visez une <strong>Licence d'Excellence, Licence Pro ou Master</strong> ? Rejoignez NC Consulting pour des <strong>heures extra</strong> de coaching 1-à-1 — oral, bases et méthode — à Meknès ou à distance. Ensuite, inscrivez-vous via le formulaire.",
  'promo.badge': 'Places limitées',
  'promo.urgency': 'Coaching 1-à-1',
  'promo.title': 'Rejoignez les prochains créneaux d\'heures extra',
  'promo.title_highlight': 'prochains créneaux',
  'promo.places_reserved': '7',
  'promo.places_total': '10',
  'promo.updated_label': 'Créneaux mis à jour régulièrement',
  'promo.cta_label': 'Rejoindre la préparation →',
  'promo.cta_url': DEFAULT_CTA,
  'proof.1_value': '1-à-1',
  'proof.1_label': 'heures dédiées',
  'proof.2_value': 'Suivi',
  'proof.2_label': 'jusqu\'aux résultats',
  'proof.3_value': 'Oral',
  'proof.3_label': '& bases renforcées',
  'proof.4_value': '0 DH',
  'proof.4_label': 'premier échange',

  // Pôles section
  'poles.label': 'Nos pôles',
  'poles.title_html': 'Trois expertises pour <em>professionnels exigeants</em>.',
  'poles.subtitle':
    'Conseil, coaching et montée en compétences — exclusivement pour dirigeants, cadres et entrepreneurs.',
  'poles.formation.tab': 'Formation',
  'poles.formation.title': 'Montée en compétences & expertise',
  'poles.formation.desc':
    'Programmes ciblés pour dirigeants, cadres et entrepreneurs — formats courts ou modulaires, objectifs concrets et mise en pratique immédiate. Présentiel à Meknès ou entièrement à distance.',
  'poles.formation.cta': 'Demander un premier échange →',
  'poles.formation.items':
    'Prise de parole & communication\nNégociation & influence\nTransformation digitale',
  'poles.accompagnement.tab': 'Accompagnement',
  'poles.accompagnement.title': 'Coaching exécutif & accompagnement 1-à-1',
  'poles.accompagnement.desc':
    'Programme structuré sur plusieurs semaines pour renforcer leadership, posture et performance — objectifs mesurables, suivi régulier entre les séances et bilans d\'étape. Présentiel à Meknès ou entièrement à distance.',
  'poles.accompagnement.cta': 'Demander un premier échange →',
  'poles.accompagnement.items':
    'Entrepreneuriat\nRH, management & organisations\nDéveloppement personnel & carrière\nLeadership & prise de décision\nPréparation aux entretiens & oraux',
  'poles.conseil.tab': 'Conseil',
  'poles.conseil.title': 'Conseil stratégique & partenariat',
  'poles.conseil.desc':
    "Partenariat stratégique continu pour vos transitions, projets majeurs et décisions structurantes — vision stratégique, aide à la décision et disponibilité privilégiée. Confidentialité absolue sur l'ensemble de la mission.",
  'poles.conseil.cta': 'Demander un premier échange →',
  'poles.conseil.items':
    'Stratégie & aide à la décision\nTransitions & restructuration\nOrganisation & performance\nPilotage de projets\nFinance & investissement\nDéveloppement commercial',
  'poles.note.1_html': '<b>Premier échange</b> de 20 minutes',
  'poles.note.2_html': 'Réponse <b>sous 24 h</b>',
  'poles.note.3_html': 'Présentiel <b>Meknès</b> ou à distance',

  // Méthode
  'methode.label': 'Comment ça marche',
  'methode.title_html': 'De la prise de contact aux <em>résultats</em>, en 3 étapes.',
  'methode.subtitle':
    'Un parcours simple et cadré — vous savez exactement ce qui se passe à chaque étape.',
  'methode.quiz_lead':
    'Où en êtes-vous dans votre parcours ? Choisissez une étape pour voir le détail.',
  'methode.1.num': '01',
  'methode.1.tag': 'Simple & rapide',
  'methode.1.title': 'Prenez contact',
  'methode.1.desc':
    'Un premier échange de 20 minutes, confidentiel et sans engagement.',
  'methode.1.chips': '2 minutes,Sans engagement',
  'methode.2.num': '02',
  'methode.2.tag': 'Sous 24 h',
  'methode.2.title': 'Diagnostic & recommandation',
  'methode.2.desc':
    'Nous analysons votre situation, répondons à vos questions et proposons un plan clair — consultation, coaching ou accompagnement sur mesure.',
  'methode.2.chips': 'Réponse sous 24 h,Conseiller dédié',
  'methode.3.num': '03',
  'methode.3.tag': 'Résultats',
  'methode.3.title': "Passez à l'action",
  'methode.3.desc':
    'Suivez un accompagnement structuré avec des jalons mesurables. Des progrès visibles dès les premières semaines.',
  'methode.3.chips': 'Suivi réel,Exigence',

  // Pourquoi NC
  'expert.label': 'Pourquoi NC Consulting',
  'expert.title_html': 'Un consultant <em>dédié</em>, une exigence premium.',
  'expert.text':
    'NC Consulting place le conseil et le coaching au centre : relation directe, diagnostic franc et accompagnement sur mesure — sans intermédiaire, sans formule générique.',
  'expert.cta': 'Demander un premier échange →',
  'expert.pillar.1.title': 'Clarté stratégique',
  'expert.pillar.1.text':
    "Décisions éclairées, priorités nettes et plans d'action concrets dès les premiers échanges.",
  'expert.pillar.2.title': 'Performance durable',
  'expert.pillar.2.text':
    'Leadership, posture et discipline de résultats pour performer dans la durée.',
  'expert.pillar.3.title': 'Confiance absolue',
  'expert.pillar.3.text':
    'Échanges confidentiels, écoute exigeante et suivi réel entre chaque séance.',

  // Mot du fondateur
  'founder.label': 'Mot du fondateur',
  'founder.title_html': 'Une exigence <em>personnelle</em>, un engagement total.',
  'founder.quote':
    "« J'ai créé NC Consulting pour offrir aux dirigeants et professionnels ambitieux ce que j'aurais voulu trouver : un regard extérieur exigeant, une écoute réelle et des recommandations applicables dès le lendemain. »",
  'founder.text':
    "Chaque accompagnement est traité avec la même rigueur — confidentialité absolue, clarté dans le diagnostic et suivi jusqu'aux résultats. À Meknès ou à distance, la relation reste directe, sans intermédiaire.",
  'founder.name': 'Nouamane Chaltoute',
  'founder.credential': "Professeur d'enseignement supérieur",
  'founder.role': 'Fondateur · NC Consulting · Meknès',
  'founder.cta': 'Réserver un échange avec moi →',

  // À propos
  'about.label': 'Explorer · Meknès & à distance',
  'about.title_html': 'Toute NC Consulting, <em>en un arbre.</em>',
  'about.quiz_lead':
    'Déployez les branches pour parcourir le cabinet — qui nous sommes, ce que nous faisons, comment nous travaillons. Chaque feuille mène au détail complet.',
  'about.mission_title': 'Notre mission',
  'about.mission_lead_html':
    '<strong>NC Consulting</strong> accompagne dirigeants, cadres et professionnels ambitieux avec une approche directe : diagnostic franc, recommandations actionnables et suivi dans la durée.',
  'about.mission_p2':
    "Notre expertise couvre le conseil stratégique, le coaching exécutif et l'accompagnement sur mesure — à Meknès et à distance, via ncconsulting.ma.",
  'about.mission_note':
    'La relation de confiance et la confidentialité sont au cœur de chaque mission.',
  'about.fact.1_num': '15+',
  'about.fact.1_lbl': "Ans d'expérience",
  'about.fact.2_num': 'Meknès',
  'about.fact.2_lbl': 'Ancrage local · Maroc',
  'about.fact.3_num': '2',
  'about.fact.3_lbl': 'Formats : présentiel & visio',
  'about.pillar.1.title': 'Consultation, coaching & conseil',
  'about.pillar.1.text':
    'Conseil stratégique et coaching exécutif pour décisions claires et impact mesurable.',
  'about.pillar.2.title': 'Sur mesure, sans formule générique',
  'about.pillar.2.text':
    'Chaque accompagnement est calibré sur votre contexte, vos objectifs et votre rythme.',
  'about.pillar.3.title': 'Professionnels exigeants uniquement',
  'about.pillar.3.text':
    'Dirigeants, cadres et entrepreneurs qui visent l\'excellence et des résultats concrets.',
  'about.cta': 'Échanger avec un conseiller →',
  'about.clients_label': 'Pour qui',

  // Témoignages
  'reels.label': 'Retours terrain',
  'reels.title_html': 'Ils interviennent <em>avec nous</em>.',
  'reels.subtitle_html':
    'Intervenants et partenaires du cabinet — ce qu\u2019ils disent de nos formations.',
  'reels.note_html':
    'Suivez nos actualités sur <a href="https://www.linkedin.com/company/nc-consulting10" target="_blank" rel="noopener noreferrer">LinkedIn</a>.',

  // FAQ header
  'faq.label': 'FAQ',
  'faq.title_html': 'Réponses rapides, <em>zéro stress</em>.',

  // Contact
  'contact.scarcity': 'Premier échange de 20 min — sans engagement',
  'contact.title_html': 'Réservez un <em>premier échange</em>',
  'contact.lead':
    'Vingt minutes pour clarifier votre besoin (conseil, coaching ou préparation). Réponse personnalisée sous 24 h.',
  'contact.benefits':
    '20 minutes · Meknès ou à distance\nConfidentiel · sans frais ni engagement\nDiagnostic franc et prochaines étapes concrètes\nRéponse sous 24 heures',
  'contact.slots_html': 'Réponse sous <b style="color:var(--gold-lt)">24 h</b> · Sur rendez-vous',

  // Footer & contact info
  'footer.tagline':
    'Conseil, coaching exécutif & accompagnement premium — à Meknès et à distance.',
  'contact.location': 'Meknès, Maroc',
  'contact.phone_display': '06 06 11 11 99',
  'contact.phone_tel': '+212606111199',
  'contact.email': NC_EMAIL,
  'footer.copyright': '© 2026 NC Consulting · Meknès, Maroc',
};

const announcements = [
  {
    id: 'semaine-gratuite',
    title: "Semaine gratuite — Licences d'Excellence",
    text: "Cette session (juillet 2026) est terminée. Réservez un premier échange pour un accompagnement personnalisé.",
    status: 'Terminée',
    date_day: '23',
    date_month: 'Juil',
    image: 'assets/annonce-semaine-gratuite.png',
    body:
      "La semaine gratuite de préparation (début 23 juillet 2026) est terminée. Pour un accompagnement concours, coaching ou conseil, réservez un premier échange de 20 minutes — Meknès ou à distance, sans engagement.",
    details: [
      'Statut :: Session terminée',
      'Alternative :: Premier échange 20 min',
      'Lieu :: Meknès ou à distance',
      'Engagement :: Aucun',
    ].join('\n'),
    cta_label: 'Réserver un échange →',
    cta_url: '/form.html',
    active: false,
    order: 99,
  },
  {
    id: 'nouveaux-creneaux',
    title: "Premier échange de 20 min — Meknès ou à distance",
    text: 'Confidentiel, sans engagement. On clarifie votre besoin et la meilleure façon d\'avancer.',
    status: 'Sur rendez-vous',
    date_day: '—',
    date_month: 'Échange',
    image: '',
    body:
      "Réservez un premier échange confidentiel avec NC Consulting. On clarifie votre besoin (coaching, conseil ou préparation concours) et on définit la meilleure façon d'avancer — sans engagement.",
    details: [
      'Durée :: 20 minutes',
      'Lieu :: Meknès ou à distance',
      'Engagement :: Aucun',
      'Réponse :: Sous 24h',
    ].join('\n'),
    cta_label: 'Demander un échange →',
    cta_url: '/form.html',
    active: true,
    order: 1,
  },
];

const trust = [
  { id: 't1', bold: 'Expertise', text: 'solo premium', active: true, order: 1 },
  { id: 't2', bold: 'Meknès', text: '& Maroc', active: true, order: 2 },
  { id: 't3', bold: 'Confidentialité', text: 'garantie', active: true, order: 3 },
  { id: 't4', bold: 'Approche', text: 'sur mesure', active: true, order: 4 },
  { id: 't5', bold: 'Résultats', text: 'mesurables', active: true, order: 5 },
  { id: 't6', bold: 'Présentiel', text: '& à distance', active: true, order: 6 },
];

const formations = [
  {
    id: 'f1',
    tag: 'Licence',
    title: 'Heures extra — Licence',
    subtitle:
      'Renforcez votre préparation avant le concours Licence d\'Excellence ou Licence Pro.',
    items: [
      'Oral & posture sous pression',
      'Compta · économie · management',
      'Anglais concours',
      'Plan de révision réaliste',
      'Suivi jusqu\'aux résultats',
    ].join('\n'),
    cta_label: 'Rejoindre — Licence →',
    cta_url: '/form.html?intent=concours&programme=licence',
    active: true,
    order: 1,
  },
  {
    id: 'f2',
    tag: 'Master',
    title: 'Heures extra — Master',
    subtitle:
      'Ajoutez des heures ciblées pour réussir l\'accès Master (dossier, oral, projet pro).',
    items: [
      'Projet professionnel & oral',
      'Finance · audit · management',
      'Anglais & argumentaire',
      'Méthode dossier / entretien',
      'Suivi jusqu\'à l\'admission',
    ].join('\n'),
    cta_label: 'Rejoindre — Master →',
    cta_url: '/form.html?intent=concours&programme=master',
    active: true,
    order: 2,
  },
  {
    id: 'f3',
    tag: 'Temps aménagé',
    title: 'Heures extra — en travaillant',
    subtitle:
      'Vous reprisez Licence / Master en parallèle du boulot ? On calibre des heures compatibles.',
    items: [
      'Planning compatible emploi',
      'Sessions courtes & régulières',
      'Licence ou Master aménagé',
      'Meknès ou visio',
      'Premier échange 20 min',
    ].join('\n'),
    cta_label: 'Rejoindre — Formulaire →',
    cta_url: DEFAULT_CTA,
    active: true,
    order: 3,
  },
];

const faq = [
  {
    id: 'q1',
    question: "À qui s'adresse NC Consulting ?",
    answer:
      'Dirigeants, cadres, entrepreneurs et professionnels ambitieux qui cherchent un regard extérieur exigeant pour progresser plus vite et prendre de meilleures décisions.',
    active: true,
    order: 1,
  },
  {
    id: 'q2',
    question: 'Comment se déroule une consultation 1-à-1 ?',
    answer:
      "Une séance individuelle et confidentielle : nous cadrons votre problématique, l'analysons ensemble, puis repartons avec un plan d'action concret et un compte-rendu écrit.",
    active: true,
    order: 2,
  },
  {
    id: 'q3',
    question: 'Les séances à distance sont-elles aussi efficaces qu\'en présentiel ?',
    answer:
      'Oui : même exigence qu\'en présentiel lorsque le suivi est structuré et régulier. Vous choisissez le format qui vous convient — Meknès ou visio.',
    active: true,
    order: 3,
  },
  {
    id: 'q4',
    question: 'Quelle différence entre coaching exécutif et accompagnement & conseil ?',
    answer:
      'Le coaching exécutif est un programme structuré sur plusieurs semaines autour de votre leadership et performance. L\'accompagnement & conseil est un partenariat continu pour vos projets, transitions et décisions majeures.',
    active: true,
    order: 4,
  },
  {
    id: 'q5',
    question: 'Comment se passe le premier échange ?',
    answer:
      'Vingt minutes, par téléphone ou en visio, sans frais ni engagement. Il sert à qualifier votre situation et à déterminer si je suis la bonne personne — et si ce n\u2019est pas le cas, je vous le dis.',
    active: true,
    order: 5,
  },
];

const cases = [
  {
    id: 'c1',
    tag: 'Conseil · PME',
    title: "Clarifier la feuille de route d'une PME en croissance",
    description:
      "Un dirigeant de PME industrielle à Meknès avait besoin d'arbitrer entre expansion commerciale et restructuration interne. En quelques semaines d'accompagnement conseil, priorités clarifiées, comité de pilotage mis en place et décisions majeures tranchées.",
    outcome: '✓ Feuille de route validée · Équipe alignée',
    active: true,
    order: 1,
  },
  {
    id: 'c2',
    tag: 'Coaching exécutif',
    title: "Renforcer le leadership d'un manager en transition",
    description:
      'Un cadre promu à un poste de direction peinait à prendre sa place et à déléguer. Programme de coaching exécutif sur plusieurs semaines : posture affirmée, communication structurée et indicateurs de performance suivis à chaque étape.',
    outcome: '✓ Promotion consolidée · Équipe mobilisée',
    active: true,
    order: 2,
  },
];

const clients = [
  { id: 'cl1', label: 'Dirigeants PME', active: true, order: 1 },
  { id: 'cl2', label: 'Cadres supérieurs', active: true, order: 2 },
  { id: 'cl3', label: 'Entrepreneurs', active: true, order: 3 },
  { id: 'cl4', label: 'Institutions publiques', active: true, order: 4 },
  { id: 'cl5', label: 'Profils en transition', active: true, order: 5 },
];

const blog = require('./cmsBlogDefaults');

const nouveau = [
  {
    id: 'nv-heures-master',
    type: 'master',
    title: 'Heures extra — Master',
    summary:
      'Ajoutez des heures 1-à-1 pour préparer votre accès Master : oral, projet pro, finance / management.',
    status: 'Places ouvertes',
    etab: 'NC Consulting',
    deadline: 'Sur rendez-vous',
    ville: 'Meknès & visio',
    facts: [
      'Format :: Coaching 1-à-1',
      'Objectif :: Accès Master',
      'Lieu :: Meknès ou à distance',
      'Entrée :: Formulaire NC',
    ].join('\n'),
    body:
      'Vous visez un Master ? Rejoignez NC Consulting pour des heures extra ciblées — dossier, oral et argumentaire — puis inscrivez-vous via le formulaire.',
    nc_angle:
      'On calibre le volume d’heures selon votre calendrier et votre filière, puis on enchaîne sur un plan concret jusqu’à l’admission.',
    source_label: '',
    source_url: '',
    cta_url: '/form.html?intent=concours&programme=master',
    active: true,
    order: 1,
  },
  {
    id: 'nv-heures-licence',
    type: 'lex',
    title: 'Heures extra — Licence d’Excellence',
    summary:
      'Renforcez oral, bases et méthode avant le concours Licence — sessions dédiées avec NC Consulting.',
    status: 'Places ouvertes',
    etab: 'NC Consulting',
    deadline: 'Sur rendez-vous',
    ville: 'Meknès & visio',
    facts: [
      'Format :: Coaching 1-à-1',
      'Objectif :: Concours Licence',
      'Lieu :: Meknès ou à distance',
      'Entrée :: Formulaire NC',
    ].join('\n'),
    body:
      'Vous préparez une Licence d’Excellence ou Licence Pro ? Rejoignez les heures extra NC : oral, compta, éco, management, anglais — puis le formulaire pour réserver votre créneau.',
    nc_angle:
      'Même exigence qu’à l’oral du concours : clarté, bases solides, tenue sous pression — avec un suivi jusqu’aux résultats.',
    source_label: '',
    source_url: '',
    cta_url: '/form.html?intent=concours&programme=licence',
    active: true,
    order: 2,
  },
  {
    id: 'nv-heures-amenage',
    type: 'lpro',
    title: 'Heures extra — temps aménagé',
    summary:
      'Vous travaillez et visez Licence / Master aménagé ? On calibre des heures compatibles avec votre emploi.',
    status: 'Sur rendez-vous',
    etab: 'NC Consulting',
    deadline: 'Flexible',
    ville: 'Meknès & visio',
    facts: [
      'Format :: Sessions courtes',
      'Public :: Salariés / reprise',
      'Lieu :: Meknès ou à distance',
      'Entrée :: Formulaire NC',
    ].join('\n'),
    body:
      'Planning réaliste, sessions courtes et régulières, suivi jusqu’au concours — sans quitter votre activité.',
    nc_angle:
      'Un premier échange de 20 min suffit pour voir si le volume d’heures est tenable avec votre emploi du temps.',
    source_label: '',
    source_url: '',
    cta_url: '/form.html?intent=concours',
    active: true,
    order: 3,
  },
];

module.exports = {
  DEFAULT_CTA,
  content,
  announcements,
  trust,
  formations,
  faq,
  cases,
  clients,
  blog,
  nouveau,
};
