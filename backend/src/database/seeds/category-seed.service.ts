import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { PrimaryType } from '../entities/primary-type.entity';

@Injectable()
export class CategorySeedService implements OnModuleInit {
  private readonly logger = new Logger(CategorySeedService.name);

  constructor(
    @InjectRepository(Category)
    private readonly catRepo: Repository<Category>,
    @InjectRepository(PrimaryType)
    private readonly primaryTypeRepo: Repository<PrimaryType>,
  ) {}

  async onModuleInit() {
    const count = await this.catRepo.count({ where: { isDefault: true } });
    if (count > 0) {
      this.logger.log(`Catégories par défaut déjà seedées (${count})`);
      return;
    }

    this.logger.log('📁 Seeding default categories...');

    // Récupérer les primary types pour mapper par key_name
    const types = await this.primaryTypeRepo.find();
    const typeMap = new Map(types.map(t => [t.keyName, t.id]));

    const defaults: Partial<Category>[] = [
      {
        name: 'Livres',
        slug: 'livres',
        description: 'Livres, mangas, BD, romans, guides...',
        icon: '📚',
        color: '#e74c3c',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('books') ?? null,
        defaultProviders: ['googlebooks', 'openlibrary', 'comicvine', 'bedetheque'],
      },
      {
        name: 'Jeux vidéo',
        slug: 'jeux-video',
        description: 'Jeux vidéo toutes plateformes',
        icon: '🎮',
        color: '#3498db',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('video_games') ?? null,
        defaultProviders: ['igdb', 'rawg', 'jvc', 'consolevariations'],
      },
      {
        name: 'Musique',
        slug: 'musique',
        description: 'Vinyles, CD, cassettes, éditions collector',
        icon: '🎵',
        color: '#9b59b6',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('music') ?? null,
        defaultProviders: ['discogs', 'deezer', 'musicbrainz', 'itunes'],
      },
      {
        name: 'Films',
        slug: 'films',
        description: 'Films en DVD, Blu-ray, 4K, collectors',
        icon: '🎬',
        color: '#f39c12',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('movies') ?? null,
        defaultProviders: ['tmdb', 'tvdb', 'amazon-media'],
      },
      {
        name: 'Séries',
        slug: 'series',
        description: 'Séries TV et animées, coffrets',
        icon: '📺',
        color: '#16a085',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('series') ?? null,
        defaultProviders: ['tmdb', 'tvdb'],
      },
      {
        name: 'Figurines',
        slug: 'figurines',
        description: 'Figurines, statues, Funko Pop, Nendoroid...',
        icon: '🧸',
        color: '#e67e22',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('toys_fig') ?? null,
        defaultProviders: ['coleka', 'luluberlu', 'transformerland', 'amazon-collectibles'],
      },
      {
        name: 'Jouets construction',
        slug: 'jouets-construction',
        description: 'LEGO, Playmobil, Mega Construx...',
        icon: '🧱',
        color: '#c0392b',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('toys_construct') ?? null,
        defaultProviders: ['lego', 'playmobil', 'mega', 'klickypedia', 'kreo'],
      },
      {
        name: 'Jeux de société',
        slug: 'jeux-de-societe',
        description: 'Jeux de plateau, jeux de rôle, puzzles',
        icon: '🎲',
        color: '#27ae60',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('board_games') ?? null,
        defaultProviders: ['bgg'],
      },
      {
        name: 'Cartes à collectionner',
        slug: 'cartes-a-collectionner',
        description: 'Pokémon, Magic, Yu-Gi-Oh!, Lorcana...',
        icon: '🃏',
        color: '#2980b9',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('trading_cards') ?? null,
        defaultProviders: ['pokemon', 'mtg', 'yugioh', 'lorcana', 'digimon', 'onepiece'],
      },
      {
        name: "Albums d'images",
        slug: 'albums-d-images',
        description: "Albums Panini, stickers, chromos",
        icon: '🖼️',
        color: '#8e44ad',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('sticker_albums') ?? null,
        defaultProviders: ['paninimania'],
      },
      {
        name: 'Divers',
        slug: 'divers',
        description: 'Objets ne rentrant dans aucune autre catégorie',
        icon: '📦',
        color: '#95a5a6',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('divers') ?? null,
      },
      {
        name: 'Consoles & Systèmes',
        slug: 'consoles-systemes',
        description: 'Consoles de jeux vidéo, accessoires, systèmes rétro et modernes',
        icon: '🕹️',
        color: '#1abc9c',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('video_games') ?? null,
      },
      {
        name: 'Cassettes VHS',
        slug: 'cassettes-vhs',
        description: `La VHS (Video Home System) est un standard d'enregistrement vidéo sur bande magnétique développé par JVC (Victor Company of Japan) et lancé en 1976. Ce format a dominé le marché grand public pendant plus de deux décennies.

**Histoire** — Lancée au Japon en septembre 1976 et aux États-Unis en 1977, la VHS s'est imposée face au Betamax de Sony lors de la célèbre « guerre des formats ». Le format a été adopté massivement grâce à sa durée d'enregistrement supérieure (2h puis 4h et 6h en LP/EP) et à la stratégie de licence ouverte de JVC.

**Caractéristiques** — La cassette VHS mesure 187 × 103 × 25 mm et contient une bande magnétique de 12,7 mm de large. La résolution est d'environ 240 lignes horizontales en NTSC et 250 en PAL/SECAM. Le son est enregistré en mono ou Hi-Fi stéréo (à partir de 1984).

**Variantes** — VHS-C (version compacte pour caméscopes), S-VHS (Super VHS, résolution améliorée à 400 lignes), D-VHS (version numérique haute définition), W-VHS (pour la HDTV analogique).

**Âge d'or** — Les années 1980-1990 ont vu l'explosion des vidéoclubs et de la distribution directe en vidéo (DTV). Les films sortaient en VHS plusieurs mois après le cinéma, créant un marché colossal.

**Collection** — Aujourd'hui, les VHS connaissent un regain d'intérêt auprès des collectionneurs, notamment les éditions originales, les films d'horreur rares, les éditions clamshell Disney "Black Diamond", et les copies promotionnelles. Certaines VHS rares atteignent des prix significatifs sur le marché.`,
        icon: '/storage/default_categories/13/images/vhs_cassette.jpg',
        iconType: 'url',
        color: '#2c3e50',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('movies') ?? null,
      },
      {
        name: 'LaserDisc',
        slug: 'laserdisc',
        description: `Le LaserDisc (LD) est le premier format de disque optique grand public pour la vidéo, développé par MCA et Philips et commercialisé à partir de 1978 sous le nom de « DiscoVision ». Bien que jamais dominant, il a posé les bases de tous les formats optiques suivants.

**Histoire** — Lancé en décembre 1978 aux États-Unis, le LaserDisc était initialement vendu sous la marque MCA DiscoVision, puis rebaptisé LaserVision et enfin LaserDisc. Pioneer Electronics est devenu le principal fabricant de lecteurs et a propulsé le format. La production a cessé en 2001, avec le dernier titre sorti au Japon.

**Caractéristiques** — Le disque mesure 30 cm de diamètre (comme un vinyle 33 tours), utilise la lecture optique par laser et offre une résolution de 425 lignes horizontales (bien supérieure à la VHS). Le son peut être analogique stéréo ou numérique (PCM, puis Dolby Digital et DTS à partir des années 1990).

**Formats** — CLV (Constant Linear Velocity) pour les films longs (60 min par face) et CAV (Constant Angular Velocity) pour une qualité maximale avec effets spéciaux (30 min par face, pause parfaite, avance image par image).

**Au Japon** — Le LaserDisc a connu un succès significatif au Japon, où il a atteint 10% de pénétration du marché. Les éditions japonaises sont particulièrement recherchées par les collectionneurs, notamment les coffrets anime et les éditions limitées.

**Collection** — Les LaserDisc sont très prisés des cinéphiles pour leurs transferts souvent supervisés par les réalisateurs, leurs suppléments exclusifs (commentaires audio, documentaires) et certaines versions de films jamais rééditées en DVD/Blu-ray. Les éditions Criterion Collection en LD sont particulièrement recherchées.`,
        icon: '/storage/default_categories/23/images/laserdisc.jpg',
        iconType: 'url',
        color: '#c0392b',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('movies') ?? null,
      },
      {
        name: 'Vinyles',
        slug: 'vinyles',
        description: 'Disques vinyles 33 tours, 45 tours, éditions limitées',
        icon: '💿',
        color: '#7d3c98',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('music') ?? null,
      },
      {
        name: 'CD Audio',
        slug: 'cd-audio',
        description: 'Compact discs, albums, singles, éditions collector',
        icon: '💽',
        color: '#2e86c1',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('music') ?? null,
      },
      {
        name: 'Disney Lorcana',
        slug: 'disney-lorcana',
        description: `Disney Lorcana est un jeu de cartes à collectionner (TCG) édité par Ravensburger en collaboration avec The Walt Disney Company, lancé en août 2023. Premier TCG de Ravensburger, il représente le plus gros investissement jamais réalisé par l'éditeur allemand.

**Univers et histoire** — Le jeu se déroule dans le monde magique de Lorcana, où des personnages appelés « Illumineurs » utilisent de l'encre magique pour invoquer des « Reflets » (Glimmers), des êtres inspirés des personnages Disney. Le Grand Illuminarium, au cœur des Contrées d'Encre, sert de répertoire à toutes les histoires jamais racontées. Trois types de Reflets existent : les Nés de l'Histoire (Storyborn), les Nés du Rêve (Dreamborn) et les Nés du Déluge (Floodborn).

**Gameplay** — Chaque joueur construit un deck d'au moins 60 cartes parmi quatre types : Personnages, Objets, Actions et Lieux. Six couleurs d'encre (Ambre, Améthyste, Émeraude, Rubis, Saphir, Acier) offrent des stratégies variées. Le premier joueur à accumuler 20 points de Savoir (Lore) remporte la partie. Les mécaniques incluent le Shift (évolution de personnages), les cartes à double encre, et le mode Pack Rush.

**Extensions** — Depuis "The First Chapter" (août 2023), le jeu compte plus de 12 extensions dont Rise of the Floodborn, Into the Inklands, Ursula's Return, Shimmering Skies, Azurite Sea, Archazia's Island, et bien d'autres. Chaque set introduit de nouveaux personnages Disney et des mécaniques innovantes.

**Raretés** — Les cartes se déclinent en 8 niveaux de rareté : Commune, Peu commune, Rare, Super Rare, Légendaire, Épique, Enchantée et Iconique (les deux dernières introduites avec le set Fabled).

**Compétition** — Un circuit compétitif existe avec les Disney Lorcana Challenges organisés dans le monde entier, des championnats régionaux (Europe, Amérique du Nord, Océanie) et un Championnat du Monde inauguré en juin 2025 à Walt Disney World.`,
        icon: '/storage/default_categories/15/images/lorcana_enchantee.png',
        iconType: 'url',
        color: '#1a1a6e',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('trading_cards') ?? null,
        defaultProviders: ['lorcana'],
      },
      {
        name: 'Pokémon Jeu de Cartes à Collectionner',
        slug: 'pokemon-jcc',
        description: `Le Jeu de Cartes à Collectionner Pokémon (Pokémon TCG) est un jeu de cartes stratégique lancé au Japon en 1996 par Media Factory, puis distribué mondialement par Wizards of the Coast (1999-2003) et The Pokémon Company International depuis 2003.

**Concept** — Les joueurs construisent des decks de 60 cartes comprenant des Pokémon, des cartes Dresseur et des cartes Énergie. Le but est de mettre K.O. les Pokémon adverses pour récupérer des cartes Récompense.

**Types de cartes** — Pokémon de base, Évolutions, Pokémon-EX, Pokémon-GX, Pokémon-V, Pokémon-VMAX, Pokémon-ex (Écarlate et Violet), et les Pokémon-ex Téracristal. Les raretés vont de Commune à Illustration Rare Spéciale (SAR).

**Extensions majeures** — Set de Base (1999), Jungle, Fossile, Team Rocket, Neo Genesis, EX Rubis & Saphir, Diamant & Perle, Noir & Blanc, XY, Soleil & Lune, Épée & Bouclier, Écarlate & Violet.

**Compétition** — Les Championnats du Monde Pokémon ont lieu chaque année depuis 2004. Le circuit compétitif comprend des Challenges, des Coupes, des Championnats Régionaux, Internationaux et le Championnat du Monde.

**Collection** — Avec plus de 100 milliards de cartes produites depuis son lancement, le Pokémon TCG est le jeu de cartes le plus vendu au monde. Certaines cartes rares comme le Dracaufeu 1ère Édition holographique du Set de Base atteignent des prix records aux enchères.`,
        icon: '/storage/default_categories/17/images/card_pikachu.png',
        iconType: 'url',
        color: '#f1c40f',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('trading_cards') ?? null,
        defaultProviders: ['pokemon'],
      },
      {
        name: 'Magic: The Gathering',
        slug: 'magic-the-gathering',
        description: `Magic: The Gathering (MTG) est le premier jeu de cartes à collectionner de l'histoire, créé par Richard Garfield et publié par Wizards of the Coast en 1993. Il a posé les fondations du genre TCG et reste l'un des plus populaires au monde.

**Concept** — Chaque joueur incarne un Planeswalker, un puissant mage qui invoque des créatures, lance des sorts et utilise des artefacts pour vaincre son adversaire. Les decks sont construits à partir de cinq couleurs de mana : blanc, bleu, noir, rouge et vert.

**Formats** — Standard, Modern, Legacy, Vintage, Commander (EDH), Pioneer, Pauper, Draft et Sealed. Commander est devenu le format le plus populaire pour le jeu casual.

**Extensions emblématiques** — Alpha/Beta/Unlimited (1993), Arabian Nights, Antiquities, Legends, The Dark, Revised, Ice Age, Mirage, Tempest, Urza's Saga, Invasion, Ravnica, Innistrad, Khans of Tarkir, et les sets récents comme Les Cavernes Oubliées d'Ixalan.

**Le Power Nine** — Les neuf cartes les plus puissantes jamais imprimées : Black Lotus, Ancestral Recall, Time Walk, les cinq Mox et Timetwister. Le Black Lotus est la carte la plus chère du monde.

**Compétition** — Le Pro Tour (désormais Pro Tour), les Grand Prix (MagicFest), le Championnat du Monde et le circuit Arena Championship.`,
        icon: '/storage/default_categories/18/images/card_black_lotus.jpg',
        iconType: 'url',
        color: '#8B6914',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('trading_cards') ?? null,
        defaultProviders: ['mtg'],
      },
      {
        name: 'Yu-Gi-Oh!',
        slug: 'yu-gi-oh',
        description: `Yu-Gi-Oh! est un jeu de cartes à collectionner créé par Kazuki Takahashi, basé sur le manga du même nom publié dans le Weekly Shōnen Jump à partir de 1996. Le jeu de cartes officiel (OCG/TCG) est édité par Konami depuis 1999.

**Concept** — Deux joueurs s'affrontent avec des decks d'au minimum 40 cartes, chacun commençant avec 8000 points de vie. Le jeu utilise des Monstres, des Magies et des Pièges. L'objectif est de réduire les points de vie adverses à zéro.

**Mécaniques** — Invocation Normale, Tribut, Fusion, Rituel, Synchro (5D's), Xyz (ZEXAL), Pendule (ARC-V), Lien (VRAINS). Le jeu a évolué avec l'ajout du Extra Deck et des zones Pendule/Lien.

**Cartes iconiques** — Magicien Sombre, Dragon Blanc aux Yeux Bleus, Dragon Noir aux Yeux Rouges, Exodia le Maudit, Slifer le Dragon du Ciel, Obélisque le Tourmenteur, Dragon Ailé de Râ.

**Raretés** — Commune, Rare, Super Rare, Ultra Rare, Secret Rare, Ultimate Rare, Ghost Rare, Starlight Rare, Quarter Century Secret Rare (25th Anniversary).

**Compétition** — Yu-Gi-Oh! Championship Series (YCS), Championnat du Monde (World Championship), Yu-Gi-Oh! Open Tour.`,
        icon: '/storage/default_categories/19/images/card_dark_magician.jpg',
        iconType: 'url',
        color: '#7D3C98',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('trading_cards') ?? null,
        defaultProviders: ['yugioh'],
      },
      {
        name: 'Dragon Ball Super Card Game',
        slug: 'dragon-ball-super-card-game',
        description: `Le Dragon Ball Super Card Game (DBSCG) est un jeu de cartes à collectionner édité par Bandai depuis 2017, basé sur l'univers de Dragon Ball créé par Akira Toriyama.

**Concept** — Deux joueurs s'affrontent avec des decks de 51 cartes (50 cartes principales + 1 carte Leader). Chaque joueur commence avec 8 points de vie et doit réduire ceux de l'adversaire à zéro en attaquant avec des cartes Combattant.

**Mécaniques** — Le jeu utilise un système d'Énergie pour jouer des cartes, des cartes Combattant pour attaquer et défendre, des cartes Extra pour des effets spéciaux, et des cartes Unisson introduites plus tard. Le Leader peut éveiller (passer en mode dos) quand le joueur a peu de vie.

**Séries** — Le jeu a connu plusieurs séries : les séries classiques (numérotées), les Expansion Sets, les Starter Decks, et le reboot "Fusion World" lancé en 2024.

**Personnages populaires** — Son Goku (toutes transformations), Vegeta, Broly, Frieza, Cell, Gohan, Trunks du Futur, Beerus, Jiren.

**Collection** — Les cartes les plus rares incluent les Special Rare (SPR), les Secret Rare (SCR) et les God Rare, dont certaines atteignent des valeurs significatives sur le marché secondaire.`,
        icon: '/storage/default_categories/20/images/card_goku.jpg',
        iconType: 'url',
        color: '#f39c12',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('trading_cards') ?? null,
      },
      {
        name: 'One Piece Card Game',
        slug: 'one-piece-card-game',
        description: `Le One Piece Card Game est un jeu de cartes à collectionner édité par Bandai depuis 2022, basé sur le manga et l'anime One Piece d'Eiichiro Oda, l'une des franchises les plus populaires au monde.

**Concept** — Deux joueurs s'affrontent avec des decks de 50 cartes plus une carte Leader. Chaque joueur a une zone Don!! (énergie), joue des Personnages, des Événements et des Étapes. L'objectif est d'attaquer le Leader adverse et de lui infliger suffisamment de dégâts (retirer toutes ses cartes Vie).

**Mécaniques** — Le système Don!! est unique : 2 Don!! sont ajoutés chaque tour et peuvent être attachés aux personnages pour augmenter leur puissance ou activer des effets. Les cartes Leader ont une puissance de base et des effets spéciaux.

**Personnages populaires** — Monkey D. Luffy, Roronoa Zoro, Nami, Sanji, Portgas D. Ace, Trafalgar Law, Shanks, Barbe Noire, Boa Hancock, Kaido.

**Raretés** — Commune (C), Peu Commune (UC), Rare (R), Super Rare (SR), Secret Rare (SEC), Leader (L), Don!! Parallèle, et les Manga Rare/Art Rare très recherchées.

**Succès** — Le jeu a connu un succès commercial fulgurant dès son lancement, devenant l'un des TCG les plus demandés. Les tournois officiels Bandai (Treasure Cup, Regional) attirent des milliers de joueurs.`,
        icon: '/storage/default_categories/21/images/card_luffy.jpg',
        iconType: 'url',
        color: '#e74c3c',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('trading_cards') ?? null,
      },
      {
        name: 'Digimon Card Game',
        slug: 'digimon-card-game',
        description: `Le Digimon Card Game est un jeu de cartes à collectionner édité par Bandai, relancé en 2020 avec un tout nouveau système de jeu. Basé sur la franchise Digimon créée en 1997, il combine stratégie et nostalgie.

**Concept** — Deux joueurs s'affrontent avec des decks de 50 cartes plus un Digi-Egg Deck de 0 à 5 cartes. Chaque joueur commence avec 0 point de Mémoire dans une barre partagée de -10 à +10. Quand un joueur dépasse le seuil, c'est au tour de l'adversaire.

**Mécaniques** — Le système de Digivolution est central : les Digimon évoluent en empilant des cartes, chaque évolution déclenchant des effets et réduisant le coût de jeu. Les effets "When Digivolving", "On Play", "Security" et "On Deletion" créent des interactions stratégiques.

**Types de cartes** — Digi-Egg, Digimon (Rookie, Champion, Ultimate, Mega), Tamer, Option. Les couleurs (Rouge, Bleu, Jaune, Vert, Noir, Violet, Blanc) définissent les stratégies.

**Digimon iconiques** — Agumon, Greymon, MetalGreymon, WarGreymon, Omnimon, Gabumon, Patamon, Angemon, Gallantmon, Beelzemon.

**Compétition** — Bandai organise des tournois officiels, des Regional Championships et des Digimon Card Game World Championships. Le jeu a su se créer une communauté fidèle et compétitive.`,
        icon: '/storage/default_categories/22/images/card_agumon.jpg',
        iconType: 'url',
        color: '#e67e22',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('trading_cards') ?? null,
      },
    ];

    const entities = this.catRepo.create(defaults);
    await this.catRepo.save(entities);

    this.logger.log(`✅ ${entities.length} catégories par défaut créées`);
  }
}
