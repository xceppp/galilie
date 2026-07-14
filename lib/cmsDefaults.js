'use strict';

const DEFAULT_CTA =
  'https://docs.google.com/forms/d/e/1FAIpQLScDuQN8ybcOMC7wEZlXEIdZqx1Y9L-dvS92YUVLLfZ6vCixfA/viewform';

const content = {
  // Hero
  'hero.eyebrow': 'Conseil · Coaching · Meknès & à distance',
  'hero.title_html': 'Prenez de meilleures décisions.<br><em>Atteignez vos objectifs</em> plus vite.',
  'hero.lead':
    'NC Consulting accompagne dirigeants, cadres et profils ambitieux avec un conseil franc et un coaching sur mesure — des décisions claires, des résultats mesurables.',
  'hero.cta_primary': 'Réserver mon appel découverte (20 min, gratuit) →',
  'hero.cta_secondary': 'Comment ça marche',
  'hero.assure': 'Réponse personnalisée · Sans engagement',
  'hero.metric.1_value': '97',
  'hero.metric.1_suffix': '%',
  'hero.metric.1_label': 'Satisfaction client',
  'hero.metric.2_value': '1500',
  'hero.metric.2_suffix': '+',
  'hero.metric.2_label': 'Profils accompagnés',
  'hero.metric.3_value': '15',
  'hero.metric.3_suffix': '+',
  'hero.metric.3_label': "Ans d'expertise",
  'hero.card.badge': 'Appel découverte offert',
  'hero.card.title': 'Parlons de votre objectif',
  'hero.card.sub':
    "20 minutes, gratuit et sans engagement. On clarifie votre besoin et on définit la meilleure façon d'avancer.",
  'hero.card.items':
    'Diagnostic clair de votre situation\nRecommandation ciblée, pas générique\nConfidentialité totale',
  'hero.card.cta': 'Réserver mon appel gratuit →',
  'hero.card.rating': 'Noté 4,9/5 par nos clients',

  // Concours
  'concours.label': 'Urgent — Session 2026',
  'concours.title_html': 'Préparation Intensive <em>Concours</em>.',
  'concours.subtitle_html':
    "Décrochez votre place en <strong>Licence d'Excellence, Licence Pro &amp; Master</strong> — Économie, Gestion, Finance &amp; Management. Chaque année, les meilleures filières se remplissent en quelques jours.",
  'promo.badge': 'Offre de lancement',
  'promo.urgency': 'Clôture imminente',
  'promo.title': 'Tarif réduit réservé aux 10 premiers inscrits',
  'promo.title_highlight': '10 premiers inscrits',
  'promo.places_reserved': '7',
  'promo.places_total': '10',
  'promo.updated_label': 'Places mises à jour le 13 juillet 2026',
  'promo.cta_label': 'Bloquer mon tarif →',
  'promo.cta_url': DEFAULT_CTA,
  'proof.1_value': '+200',
  'proof.1_label': 'étudiants accompagnés',
  'proof.2_value': '92%',
  'proof.2_label': "d'admis à leur concours",
  'proof.3_value': '1-à-1',
  'proof.3_label': 'coaching individuel inclus',
  'proof.4_value': '0 DH',
  'proof.4_label': 'réservation sans engagement',

  // Pôles section
  'poles.label': 'Nos pôles',
  'poles.title_html': 'Trois expertises pour <em>professionnels exigeants</em>.',
  'poles.subtitle':
    'Conseil, coaching et montée en compétences — exclusivement pour dirigeants, cadres et entrepreneurs.',
  'poles.formation.tab': 'Formation',
  'poles.formation.title': 'Montée en compétences & expertise',
  'poles.formation.desc':
    'Programmes ciblés pour dirigeants, cadres et entrepreneurs — formats courts ou modulaires, objectifs concrets et mise en pratique immédiate. Présentiel à Meknès ou entièrement à distance.',
  'poles.formation.cta': 'Réserver mon appel gratuit →',
  'poles.formation.items':
    'Leadership & management\nPrise de parole & communication\nNégociation & influence\nGestion de projet\nPerformance commerciale\nTransformation digitale',
  'poles.accompagnement.tab': 'Accompagnement',
  'poles.accompagnement.title': 'Coaching exécutif & accompagnement 1-à-1',
  'poles.accompagnement.desc':
    'Programme structuré sur plusieurs semaines pour renforcer leadership, posture et performance — objectifs mesurables, suivi régulier entre les séances et bilans d\'étape. Présentiel à Meknès ou entièrement à distance.',
  'poles.accompagnement.cta': 'Réserver mon appel gratuit →',
  'poles.accompagnement.items':
    'Entrepreneuriat\nRH, management & organisations\nDéveloppement personnel & carrière\nDigital, data & international\nLeadership & prise de décision\nPréparation aux entretiens & oraux',
  'poles.conseil.tab': 'Conseil',
  'poles.conseil.title': 'Conseil stratégique & partenariat',
  'poles.conseil.desc':
    "Partenariat stratégique continu pour vos transitions, projets majeurs et décisions structurantes — vision stratégique, aide à la décision et disponibilité privilégiée. Confidentialité absolue sur l'ensemble de la mission.",
  'poles.conseil.cta': 'Réserver mon appel gratuit →',
  'poles.conseil.items':
    'Stratégie & aide à la décision\nTransitions & restructuration\nOrganisation & performance\nPilotage de projets\nFinance & investissement\nDéveloppement commercial',
  'poles.note.1_html': '<b>1er échange gratuit</b> de 20 minutes',
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
    'Réservez un appel découverte ou envoyez votre demande en 2 minutes. Nous cadrons votre objectif et orientons vers le pôle le plus adapté.',
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
  'methode.3.chips': '97% de satisfaction,Suivi réel',

  // Pourquoi NC
  'expert.label': 'Pourquoi NC Consulting',
  'expert.title_html': 'Un consultant <em>dédié</em>, une exigence premium.',
  'expert.text':
    'NC Consulting place le conseil et le coaching au centre : relation directe, diagnostic franc et accompagnement sur mesure — sans intermédiaire, sans formule générique.',
  'expert.cta': 'Réserver mon appel gratuit →',
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
  'about.clients_label': 'Ils nous font confiance',

  // Témoignages
  'reels.label': 'Ils nous font confiance',
  'reels.title_html': 'Des professionnels <em>partagent leur expérience</em>.',
  'reels.subtitle_html':
    "Paroles d'experts et retours terrain — la preuve de notre engagement.",
  'reels.note_html':
    'Suivez nos actualités sur <a href="https://www.linkedin.com/company/nc-consulting10" target="_blank" rel="noopener noreferrer">LinkedIn</a>.',

  // FAQ header
  'faq.label': 'FAQ',
  'faq.title_html': 'Réponses rapides, <em>zéro stress</em>.',

  // Contact
  'contact.scarcity': 'Accompagnements limités par trimestre — suivi personnalisé garanti',
  'contact.title_html': 'Prêt à passer au <em>niveau supérieur</em> ?',
  'contact.lead':
    "Réservez un appel découverte gratuit de 20 minutes, ou envoyez votre demande. Nous clarifions votre besoin et définissons la meilleure façon d'avancer.",
  'contact.benefits':
    'Contexte pris en compte, clairement synthétisé\nRecommandation ciblée, pas une réponse générique\nUn conseiller suit votre dossier\nPas de frais ni d\'engagement à cette étape',
  'contact.slots_html': 'Réponse sous <b style="color:var(--gold-lt)">24–48 h</b> · Sans engagement',

  // Footer & contact info
  'footer.tagline':
    'Conseil, coaching exécutif & accompagnement premium — à Meknès et à distance.',
  'contact.location': 'Meknès, Maroc',
  'contact.phone_display': '06 06 11 11 99',
  'contact.phone_tel': '+212606111199',
  'contact.email': 'chaltoutenouamane@gmail.com',
  'footer.copyright': '© 2026 NC Consulting · Meknès, Maroc',
};

const announcements = [
  { id: 'a1', text: "Préparation Licences d'Excellence", active: true, order: 1 },
  { id: 'a2', text: 'Licences Professionnelles & Masters', active: true, order: 2 },
  { id: 'a3', text: "Concours d'accès aux Masters", active: true, order: 3 },
  { id: 'a4', text: 'Économie · Gestion · Finance · Management', active: true, order: 4 },
  { id: 'a5', text: 'Places limitées — Réservez votre place', active: true, order: 5 },
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
    tag: 'Post-Bac+2',
    title: "Licences d'Excellence",
    subtitle: 'Tronc Commun + 5 Packs de spécialité au choix.',
    items: [
      'Pack Finance :: Comptabilité · CCA · Audit',
      'Pack Management :: Entrepreneuriat · Gestion de projet',
      'Pack Marketing :: Commerce digital · E-commerce',
      'Pack Logistique :: Transport international',
      'Pack Économie :: Politiques publiques · Macroéconomie',
    ].join('\n'),
    cta_url: DEFAULT_CTA,
    active: true,
    order: 1,
  },
  {
    id: 'f2',
    tag: 'Post-Licence',
    title: 'Packs Masters 2026',
    subtitle: 'Des parcours ciblés selon vos ambitions professionnelles.',
    items: [
      'Packs 1 & 2 :: Master CCA · GFCF · Finance Publique · Audit',
      'Pack 3 :: Management · Projet · SI · Digital',
      'Pack 4 :: GRH · Marketing · Commerce',
      'Pack 5 :: Économie · Banque-Finance · Risques',
    ].join('\n'),
    cta_url: DEFAULT_CTA,
    active: true,
    order: 2,
  },
  {
    id: 'f3',
    tag: 'Licences Pro & Masters',
    title: 'Filières Concernées',
    subtitle: 'Une préparation méthodique pour intégrer les meilleures universités.',
    items: [
      'Économie & Gestion',
      'Finance · Comptabilité · Audit',
      'Marketing & Commerce',
      'Management · Ressources Humaines',
      'Banque · Assurance · Logistique',
    ].join('\n'),
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
    question: 'Le premier échange est-il payant ?',
    answer:
      'Non. Le premier appel découverte de 20 minutes est gratuit et sans engagement — il sert à clarifier votre besoin et orienter vers le pôle le plus adapté.',
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
      "Un dirigeant de PME industrielle à Meknès avait besoin d'arbitrer entre expansion commerciale et restructuration interne. En 6 semaines d'accompagnement conseil, priorités clarifiées, comité de pilotage mis en place et décisions majeures tranchées.",
    outcome: '✓ Feuille de route validée · Équipe alignée',
    active: true,
    order: 1,
  },
  {
    id: 'c2',
    tag: 'Coaching exécutif',
    title: "Renforcer le leadership d'un manager en transition",
    description:
      'Un cadre promu à un poste de direction peinait à prendre sa place et à déléguer. Programme de coaching exécutif sur 10 semaines : posture affirmée, communication structurée et indicateurs de performance suivis à chaque étape.',
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

module.exports = {
  DEFAULT_CTA,
  content,
  announcements,
  trust,
  formations,
  faq,
  cases,
  clients,
};
