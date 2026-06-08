/* ════════════════════════════════════════════════════════════════
   Voyage de démonstration — Corée du Sud, Mathis & Margot
   1 → 15 octobre · Paris en avion · Séoul / Busan / Séoul
   coords = position normalisée [x,y] sur la carte schématique
   (Séoul ≈ nord-ouest, Busan ≈ sud-est, DMZ au nord, Nami à l'est).
   « today » = J6 → progression ~40 %.
   ════════════════════════════════════════════════════════════════ */
window.TRIP = {
  name: "Corée du Sud",
  tagline: "Séoul · Busan · Séoul",
  startISO: "2025-10-01",
  endISO: "2025-10-15",
  duration: 15,
  todayIndex: 5,
  participants: [
    { name: "Mathis", initials: "Ma", hue: 38 },
    { name: "Margot", initials: "Mg", hue: 168 }
  ],
  cities: [
    { name: "Séoul", x: 0.30, y: 0.40 },
    { name: "Busan", x: 0.69, y: 0.86 }
  ],
  chapters: [
    { id: "seoul-1", label: "Séoul, premiers jours", city: "Séoul", days: "J1 – J6", nights: 5, hue: 168,
      blurb: "Palais, ruelles hanok et premières nuits dans la ville qui ne dort jamais.",
      link: { mode: "train", text: "KTX vers Busan" } },
    { id: "busan",   label: "Échappée à Busan",      city: "Busan", days: "J7 – J9", nights: 2, hue: 28,
      blurb: "Le grand bleu du Sud : plages, marché aux poissons et temple sur la mer.",
      link: { mode: "train", text: "Retour KTX Séoul" } },
    { id: "seoul-2", label: "Retour à Séoul",        city: "Séoul", days: "J10 – J15", nights: 5, hue: 200,
      blurb: "Derniers palais, cafés de Seongsu et adieux avant le vol retour.",
      link: { mode: "avion", text: "Vol retour Paris" } }
  ],
  days: [
    { n: 1, dateISO: "2025-10-01", weekday: "Mer", region: "Vol", city: "Paris → Séoul",
      title: "Le grand départ", note: "Vol de nuit. On dort le plus possible — décalage de 7 h à l'arrivée.",
      hero: "ROISSY-CDG · TERMINAL 2E", coords: [0.24, 0.30],
      todo: ["Passeports + e-VISA K-ETA", "Adaptateur de prise", "Capture hors-ligne de la 1ʳᵉ journée"],
      steps: [
        { type: "transport", mode: "avion", from: "Paris CDG", to: "Séoul ICN", time: "13:05", timeEnd: "08:30", over: "+1", ref: "AF 267", dur: "11 h 25", note: "Sièges 32 A/C réservés côté hublot." }
      ]},
    { n: 2, dateISO: "2025-10-02", weekday: "Jeu", region: "Séoul", city: "Séoul",
      title: "Arrivée à Myeongdong", note: "Journée douce pour récupérer du vol. Premier vrai repas coréen le soir.",
      hero: "MYEONGDONG · NÉONS DU SOIR", coords: [0.33, 0.31],
      todo: ["Carte T-money pour le métro", "Échanger des wons", "eSIM ou Wi-Fi pocket"],
      steps: [
        { type: "transport", mode: "train", from: "Aéroport ICN", to: "Séoul Station", time: "10:10", dur: "43 min", label: "AREX express" },
        { type: "logement", label: "Stay Myeongdong", place: "Jung-gu, Séoul", checkin: "15:00", nights: 5 },
        { type: "restaurant", label: "Premier BBQ coréen", place: "Myeongdong", time: "20:00", note: "Samgyeopsal + soju, recommandé par l'hôtel." }
      ]},
    { n: 3, dateISO: "2025-10-03", weekday: "Ven", region: "Séoul", city: "Séoul",
      title: "Palais & ruelles hanok", note: "Louer un hanbok près du palais pour l'entrée gratuite.",
      hero: "GYEONGBOKGUNG · COUR ROYALE", coords: [0.31, 0.27],
      todo: ["Réserver le hanbok en ligne", "Arriver avant 10 h pour la relève"],
      steps: [
        { type: "activite", label: "Palais de Gyeongbokgung", place: "Jongno-gu", time: "09:30", dur: "2 h", note: "Relève de la garde à 10:00." },
        { type: "activite", label: "Village hanok de Bukchon", place: "Bukchon", time: "12:30", dur: "1 h 30" },
        { type: "restaurant", label: "Tosokchon Samgyetang", place: "Sejong-daero", time: "14:00", note: "La poule au ginseng la plus connue de Séoul." }
      ]},
    { n: 4, dateISO: "2025-10-04", weekday: "Sam", region: "Séoul", city: "Séoul",
      title: "Marchés & panorama", note: "Monter à la N Seoul Tower au coucher du soleil.",
      hero: "N SEOUL TOWER · NAMSAN", coords: [0.35, 0.33],
      steps: [
        { type: "restaurant", label: "Marché de Gwangjang", place: "Jongno-gu", time: "11:00", note: "Bindaetteok & mayak gimbap." },
        { type: "activite", label: "Ruelles d'Insadong", place: "Insadong", time: "14:00", dur: "2 h" },
        { type: "activite", label: "N Seoul Tower", place: "Mont Namsan", time: "17:30", dur: "2 h", note: "Téléphérique puis cadenas d'amour." }
      ]},
    { n: 5, dateISO: "2025-10-05", weekday: "Dim", region: "Séoul", city: "Séoul",
      title: "Jeunesse & rivière Han", note: "Pique-nique au parc de Yeouido en fin de journée.",
      hero: "RIVIÈRE HAN · YEOUIDO", coords: [0.30, 0.35],
      steps: [
        { type: "activite", label: "Quartier de Hongdae", place: "Mapo-gu", time: "11:00", dur: "3 h", note: "Street art, friperies, performances de rue." },
        { type: "activite", label: "Parc de la rivière Han", place: "Yeouido", time: "17:00", dur: "2 h" }
      ]},
    { n: 6, dateISO: "2025-10-06", weekday: "Lun", region: "Séoul", city: "Excursion DMZ",
      title: "Frontière du Nord", note: "Réservation obligatoire — passeport indispensable.",
      hero: "DMZ · ZONE DÉMILITARISÉE", coords: [0.34, 0.13],
      todo: ["Passeport sur soi (contrôle)", "Confirmer l'horaire de la navette", "Pas de short ni sandales"],
      steps: [
        { type: "transport", mode: "bus", from: "Séoul", to: "DMZ", time: "07:30", dur: "1 h 10", label: "Navette de l'excursion" },
        { type: "activite", label: "Tunnel n°3 & observatoire", place: "Paju", time: "09:30", dur: "4 h", note: "Tour guidé en français." }
      ]},
    { n: 7, dateISO: "2025-10-07", weekday: "Mar", region: "Busan", city: "Séoul → Busan",
      title: "Cap au sud, en KTX", note: "Train à grande vitesse, garder les billets pour le contrôle.",
      hero: "KTX · GARE DE BUSAN", coords: [0.66, 0.78],
      todo: ["Imprimer / sauvegarder les billets KTX", "Laisser une valise en consigne à Séoul ?"],
      steps: [
        { type: "transport", mode: "train", from: "Séoul Station", to: "Busan Station", time: "09:00", timeEnd: "11:40", ref: "KTX 045", dur: "2 h 40" },
        { type: "logement", label: "Haeundae Sea Hotel", place: "Haeundae, Busan", checkin: "14:00", nights: 2 },
        { type: "restaurant", label: "Dîner à Gwangalli", place: "Plage de Gwangalli", time: "19:30", note: "Vue sur le pont Diamond illuminé." }
      ]},
    { n: 8, dateISO: "2025-10-08", weekday: "Mer", region: "Busan", city: "Busan",
      title: "Couleurs de Gamcheon", note: "Prévoir de bonnes chaussures, ça grimpe.",
      hero: "GAMCHEON · VILLAGE CULTUREL", coords: [0.63, 0.81],
      steps: [
        { type: "activite", label: "Village culturel de Gamcheon", place: "Saha-gu", time: "10:00", dur: "3 h", note: "Le « Santorin coréen », maisons en escalier." },
        { type: "restaurant", label: "Marché aux poissons Jagalchi", place: "Jung-gu", time: "13:30", note: "Poisson grillé choisi sur l'étal." }
      ]},
    { n: 9, dateISO: "2025-10-09", weekday: "Jeu", region: "Busan", city: "Busan",
      title: "Plage & temple sur la mer", note: "Haedong Yonggungsa au lever du jour si possible.",
      hero: "HAEDONG YONGGUNGSA · MER", coords: [0.72, 0.74],
      steps: [
        { type: "activite", label: "Plage de Haeundae", place: "Haeundae", time: "09:00", dur: "2 h" },
        { type: "activite", label: "Temple Haedong Yonggungsa", place: "Gijang-gun", time: "12:00", dur: "2 h", note: "Rare temple bouddhiste au bord de l'océan." }
      ]},
    { n: 10, dateISO: "2025-10-10", weekday: "Ven", region: "Séoul", city: "Busan → Séoul",
      title: "Retour vers la capitale", note: "Nouveau quartier : Hongdae, plus vivant le soir.",
      hero: "RETOUR KTX · HONGDAE", coords: [0.30, 0.32],
      steps: [
        { type: "transport", mode: "train", from: "Busan Station", to: "Séoul Station", time: "11:20", timeEnd: "14:00", ref: "KTX 112", dur: "2 h 40" },
        { type: "logement", label: "Hongdae Loft", place: "Mapo-gu, Séoul", checkin: "15:30", nights: 5 }
      ]},
    { n: 11, dateISO: "2025-10-11", weekday: "Sam", region: "Séoul", city: "Séoul",
      title: "Design & ruisseau", note: "Cheonggyecheon est magnifique illuminé le soir.",
      hero: "DONGDAEMUN · DDP", coords: [0.35, 0.30],
      steps: [
        { type: "activite", label: "Dongdaemun Design Plaza", place: "Jung-gu", time: "11:00", dur: "2 h" },
        { type: "activite", label: "Ruisseau de Cheonggyecheon", place: "Centre-ville", time: "16:00", dur: "1 h 30" }
      ]},
    { n: 12, dateISO: "2025-10-12", weekday: "Dim", region: "Séoul", city: "Séoul",
      title: "Jardin secret", note: "Billet « Secret Garden » à réserver en ligne la veille.",
      hero: "CHANGDEOKGUNG · HUWON", coords: [0.34, 0.27],
      todo: ["Réserver le créneau Secret Garden", "Visite guidée uniquement"],
      steps: [
        { type: "activite", label: "Palais de Changdeokgung", place: "Jongno-gu", time: "10:00", dur: "1 h 30" },
        { type: "activite", label: "Jardin secret (Huwon)", place: "Changdeokgung", time: "11:30", dur: "1 h", note: "Visite guidée uniquement." },
        { type: "restaurant", label: "Café à Ikseon-dong", place: "Ikseon-dong", time: "15:00" }
      ]},
    { n: 13, dateISO: "2025-10-13", weekday: "Lun", region: "Séoul", city: "Excursion Nami",
      title: "Île de Nami", note: "L'allée de metasequoias est l'image carte postale.",
      hero: "ÎLE DE NAMI · ALLÉE", coords: [0.47, 0.20],
      steps: [
        { type: "transport", mode: "train", from: "Séoul", to: "Gapyeong", time: "08:40", dur: "1 h 10", label: "ITX-Cheongchun" },
        { type: "activite", label: "Île de Nami", place: "Gapyeong-gun", time: "10:30", dur: "4 h" }
      ]},
    { n: 14, dateISO: "2025-10-14", weekday: "Mar", region: "Séoul", city: "Séoul",
      title: "Derniers instants", note: "Garder de la place dans la valise pour les souvenirs.",
      hero: "SEONGSU · CAFÉS & ATELIERS", coords: [0.37, 0.31],
      todo: ["Acheter le thé / les masques", "Peser les valises", "Check-in en ligne du vol"],
      steps: [
        { type: "activite", label: "Quartier de Seongsu", place: "Seongdong-gu", time: "11:00", dur: "3 h", note: "Le « Brooklyn de Séoul »." },
        { type: "autre", label: "Achats souvenirs", place: "Myeongdong", time: "16:00" }
      ]},
    { n: 15, dateISO: "2025-10-15", weekday: "Mer", region: "Vol", city: "Séoul → Paris",
      title: "Le vol retour", note: "Départ tôt — navette AREX à 06:30 pour être large.",
      hero: "ICN · PORTE D'EMBARQUEMENT", coords: [0.24, 0.30],
      steps: [
        { type: "transport", mode: "train", from: "Séoul Station", to: "Aéroport ICN", time: "06:30", dur: "43 min", label: "AREX express" },
        { type: "transport", mode: "avion", from: "Séoul ICN", to: "Paris CDG", time: "10:35", timeEnd: "16:50", ref: "AF 265", dur: "12 h 15" }
      ]}
  ]
};
