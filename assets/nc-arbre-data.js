/** Arbre déployé NC Consulting — source unique (accueil + decouvrir) */
window.NC_ARBRE = {
  root: {
    title: 'NC Consulting',
    subtitle: 'Conseil · Coaching · Formation',
  },
  branches: [
    {
      id: 'qui',
      num: '01',
      title: 'Qui sommes-nous',
      resume: 'Le cabinet, le fondateur, nos exigences',
      sections: [
        {
          label: 'Le cabinet',
          leaves: [
            {
              title: 'Un consultant dédié',
              text: 'Relation directe, sans intermédiaire, sans formule générique.',
              href: 'cabinet.html',
            },
            {
              title: 'Nouamane Chaltoute',
              text: "Professeur d'enseignement supérieur, fondateur du cabinet.",
              href: 'cabinet.html',
            },
            {
              title: "Expertise terrain",
              text: 'Accompagnement de dirigeants, cadres et candidats — Meknès et à distance.',
              href: 'cabinet.html',
            },
          ],
        },
        {
          label: 'Nos exigences',
          leaves: [
            {
              title: 'Clarté stratégique',
              text: 'Priorités nettes et plans d\u2019action concrets dès les premiers échanges.',
              href: 'cabinet.html',
            },
            {
              title: 'Performance durable',
              text: 'Leadership, posture et discipline de résultats dans la durée.',
              href: 'cabinet.html',
            },
            {
              title: 'Confiance absolue',
              text: 'Échanges confidentiels et suivi réel entre chaque séance.',
              href: 'cabinet.html',
            },
          ],
        },
      ],
      moreLink: {
        text: 'Voir la présentation complète du cabinet →',
        href: 'cabinet.html',
      },
    },
    {
      id: 'poles',
      num: '02',
      title: 'Nos pôles',
      resume: 'Conseil · Accompagnement · Formation',
      sections: [
        {
          label: 'Conseil — stratégie & aide à la décision',
          leaves: [
            {
              title: 'Stratégie & aide à la décision',
              text: 'Arbitrages à fort enjeu, éclairés par un regard extérieur.',
              href: '#formulaire',
            },
            {
              title: 'Transitions & restructuration',
              text: 'Cadrer, séquencer, tenir le cap du changement.',
              href: '#formulaire',
            },
            {
              title: 'Organisation & performance',
              text: 'Structurer les rôles, les rituels et le pilotage.',
              href: '#formulaire',
            },
            {
              title: 'Finance & investissement',
              text: "Décisions chiffrées, scénarios et priorités d'allocation.",
              href: '#formulaire',
            },
          ],
        },
        {
          label: 'Accompagnement — 1 à 1, dans la durée',
          leaves: [
            {
              title: 'Leadership & prise de décision',
              text: 'Posture de dirigeant et arbitrages sous pression.',
              href: '#formulaire',
            },
            {
              title: 'Développement personnel & carrière',
              text: 'Repositionnement, reconversion, trajectoire.',
              href: '#formulaire',
            },
            {
              title: 'Entrepreneuriat',
              text: 'Structuration du projet et priorités stratégiques.',
              href: '#formulaire',
            },
            {
              title: 'Entretiens & oraux',
              text: 'Préparation exigeante aux prises de parole décisives.',
              href: '#formulaire',
            },
          ],
        },
        {
          label: 'Formation — montée en compétences',
          leaves: [
            {
              title: 'Leadership & management',
              text: 'Formats courts ou modulaires, mise en pratique immédiate.',
              href: '#formulaire',
            },
            {
              title: 'Négociation & influence',
              text: 'Cas concrets, terrain, résultats mesurables.',
              href: '#formulaire',
            },
            {
              title: 'Prise de parole',
              text: 'Communication d\u2019impact pour dirigeants et cadres.',
              href: '#formulaire',
            },
            {
              title: 'Transformation digitale',
              text: 'Digital, data et international pour les équipes.',
              href: '#formulaire',
            },
          ],
        },
      ],
    },
    {
      id: 'methode',
      num: '03',
      title: 'Notre méthode',
      resume: 'Du premier appel aux résultats, en 3 étapes',
      sections: [
        {
          leaves: [
            {
              title: '01 · Prenez contact',
              text: 'Un premier échange de 20 minutes, confidentiel et sans engagement.',
              href: 'methode.html#etape-1',
            },
            {
              title: '02 · Diagnostic & recommandation',
              text: 'Analyse de votre besoin et plan clair, proposé sous 24 h.',
              href: 'methode.html#etape-2',
            },
            {
              title: '03 · Passez à l\u2019action',
              text: 'Accompagnement structuré, jalons mesurables et suivi réel.',
              href: 'methode.html#etape-3',
            },
          ],
        },
      ],
      moreLink: {
        text: 'Voir le parcours complet en détail →',
        href: 'methode.html',
      },
    },
    {
      id: 'profils',
      num: '04',
      title: 'Pour qui',
      resume: 'Cinq profils, un même niveau d\u2019exigence',
      sections: [
        {
          leaves: [
            {
              title: 'Dirigeants de PME',
              text: 'Arbitrages de croissance et feuilles de route clarifiées.',
              href: 'cabinet.html#confiance-dirigeants-pme',
            },
            {
              title: 'Cadres supérieurs',
              text: 'Leadership affirmé et coaching exécutif structuré.',
              href: 'cabinet.html#confiance-cadres-superieurs',
            },
            {
              title: 'Entrepreneurs',
              text: 'Structuration de projet et priorités stratégiques.',
              href: 'cabinet.html#confiance-entrepreneurs',
            },
            {
              title: 'Institutions publiques',
              text: 'Montée en compétences des équipes et du pilotage.',
              href: 'cabinet.html#confiance-institutions-publiques',
            },
            {
              title: 'Profils en transition',
              text: 'Reconversion et repositionnement, avec suivi.',
              href: 'cabinet.html#confiance-profils-en-transition',
            },
          ],
        },
      ],
    },
    {
      id: 'preuves',
      num: '05',
      title: 'Preuves & contact',
      resume: 'Témoignages, réponses, premier échange',
      sections: [
        {
          leaves: [
            {
              title: 'Témoignages',
              text: "Paroles d\u2019experts et retours terrain, publiés sur LinkedIn.",
              href: '#reels',
            },
            {
              title: 'FAQ',
              text: "À qui s\u2019adresse le cabinet, déroulé des séances, formats.",
              href: '#faq',
            },
            {
              title: '06 06 11 11 99',
              text: 'Meknès, Maroc — présentiel ou à distance.',
              href: 'tel:+212606111199',
            },
            {
              title: 'Appel découverte',
              text: '20 minutes, sans engagement. Réponse sous 24 h.',
              href: '#formulaire',
            },
          ],
        },
      ],
    },
  ],
  cta: {
    titleHtml: 'Prêt à passer au <em>niveau supérieur</em> ?',
    subtitle: 'Accompagnements limités par trimestre — suivi personnalisé garanti.',
    button: 'Demander un premier échange →',
    href: '#formulaire',
  },
};
