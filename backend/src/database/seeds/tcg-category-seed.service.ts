import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryField } from '../entities/category-field.entity';
import { CategoryRelationshipDefault } from '../entities/category-relationship-default.entity';

interface TcgCategoryDef {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  defaultProviders: string[] | null;
  fields: Partial<CategoryField>[];
}

@Injectable()
export class TcgCategorySeedService implements OnModuleInit {
  private readonly logger = new Logger(TcgCategorySeedService.name);

  constructor(
    @InjectRepository(Category)
    private readonly catRepo: Repository<Category>,
    @InjectRepository(CategoryField)
    private readonly fieldRepo: Repository<CategoryField>,
    @InjectRepository(CategoryRelationshipDefault)
    private readonly relDefaultRepo: Repository<CategoryRelationshipDefault>,
  ) {}

  async onModuleInit() {
    // Find parent "Cartes à collectionner"
    const parent = await this.catRepo.findOne({
      where: { slug: 'cartes-a-collectionner', isDefault: true },
    });
    if (!parent) {
      this.logger.warn('Parent "Cartes à collectionner" introuvable — skip TCG seed');
      return;
    }

    // Check if already seeded (at least one TCG child)
    const existing = await this.relDefaultRepo.findOne({
      where: { parentId: parent.id },
    });
    if (existing) {
      this.logger.log('Sous-catégories TCG déjà seedées');
      return;
    }

    this.logger.log('🃏 Seeding TCG sub-categories & fields...');

    for (const def of TCG_CATEGORIES) {
      // Create category
      const cat = this.catRepo.create({
        name: def.name,
        slug: def.slug,
        description: def.description,
        icon: def.icon,
        color: def.color,
        defaultProviders: def.defaultProviders,
        isDefault: true,
        isPublic: true,
        userId: null,
      });
      const saved = await this.catRepo.save(cat);

      // Create parent relationship
      const rel = this.relDefaultRepo.create({
        parentId: parent.id,
        childId: saved.id,
      });
      await this.relDefaultRepo.save(rel);

      // Create fields
      if (def.fields.length > 0) {
        const fields = def.fields.map((f) =>
          this.fieldRepo.create({ ...f, categoryId: saved.id }),
        );
        await this.fieldRepo.save(fields);
      }

      this.logger.log(`  ✅ ${def.name}: ${def.fields.length} champs`);
    }

    this.logger.log('✅ TCG sub-categories seedées');
  }
}

const TCG_CATEGORIES: TcgCategoryDef[] = [
  {
    name: 'Lorcana',
    slug: 'lorcana',
    description: 'Cartes Disney Lorcana',
    icon: '✨',
    color: '#6c5ce7',
    defaultProviders: ['lorcana'],
    fields: [
      { fieldKey: 'artist', fieldNameFr: 'Artiste', fieldNameEn: 'Artist', fieldType: 'text' as any, icon: '🎨', sortOrder: 1 },
      { fieldKey: 'color', fieldNameFr: 'Couleur', fieldNameEn: 'Color', fieldType: 'select' as any, fieldOptions: ['Ambre', 'Améthyste', 'Émeraude', 'Rubis', 'Saphir', 'Acier'], icon: '💧', sortOrder: 2 },
      { fieldKey: 'cost', fieldNameFr: 'Coût', fieldNameEn: 'Cost', fieldType: 'number' as any, icon: '💰', sortOrder: 3 },
      { fieldKey: 'strength', fieldNameFr: 'Force', fieldNameEn: 'Strength', fieldType: 'number' as any, icon: '⚔️', sortOrder: 4 },
      { fieldKey: 'willpower', fieldNameFr: 'Volonté', fieldNameEn: 'Willpower', fieldType: 'number' as any, icon: '🛡️', sortOrder: 5 },
      { fieldKey: 'lore', fieldNameFr: 'Lore', fieldNameEn: 'Lore', fieldType: 'number' as any, icon: '📖', sortOrder: 6 },
      { fieldKey: 'inkwell', fieldNameFr: 'Encrier', fieldNameEn: 'Inkwell', fieldType: 'boolean' as any, icon: '🖋️', sortOrder: 7 },
      { fieldKey: 'story', fieldNameFr: 'Histoire', fieldNameEn: 'Story', fieldType: 'text' as any, icon: '✨', sortOrder: 8 },
      { fieldKey: 'version', fieldNameFr: 'Version', fieldNameEn: 'Version', fieldType: 'text' as any, icon: '📝', sortOrder: 9 },
      { fieldKey: 'subtypes', fieldNameFr: 'Sous-types', fieldNameEn: 'Subtypes', fieldType: 'multiselect' as any, fieldOptions: ['Héros', 'Villain', 'Chanson', 'Action'], icon: '🏷️', sortOrder: 10 },
      { fieldKey: 'foil_types', fieldNameFr: 'Types foil', fieldNameEn: 'Foil Types', fieldType: 'multiselect' as any, icon: '💎', sortOrder: 11 },
      { fieldKey: 'abilities', fieldNameFr: 'Capacités', fieldNameEn: 'Abilities', fieldType: 'textarea' as any, icon: '⚡', sortOrder: 12 },
      { fieldKey: 'flavor_text', fieldNameFr: 'Texte ambiance', fieldNameEn: 'Flavor Text', fieldType: 'textarea' as any, icon: '💬', sortOrder: 13 },
    ],
  },
  {
    name: 'Pokémon',
    slug: 'pokemon',
    description: 'Cartes Pokémon TCG',
    icon: '⚡',
    color: '#f1c40f',
    defaultProviders: ['pokemon'],
    fields: [
      { fieldKey: 'supertype', fieldNameFr: 'Supertype', fieldNameEn: 'Supertype', fieldType: 'select' as any, fieldOptions: ['Pokémon', 'Dresseur', 'Énergie'], icon: '⭐', sortOrder: 1 },
      { fieldKey: 'subtypes', fieldNameFr: 'Sous-types', fieldNameEn: 'Subtypes', fieldType: 'multiselect' as any, fieldOptions: ['V', 'EX', 'VMAX', 'VSTAR', 'GX', 'Tag Team', 'Radiant', 'ex', 'tera'], icon: '🏷️', sortOrder: 2 },
      { fieldKey: 'element_types', fieldNameFr: 'Types', fieldNameEn: 'Types', fieldType: 'multiselect' as any, fieldOptions: ['Feu', 'Eau', 'Plante', 'Électrik', 'Psy', 'Combat', 'Obscurité', 'Métal', 'Dragon', 'Fée', 'Incolore'], icon: '🔥', sortOrder: 3 },
      { fieldKey: 'hp', fieldNameFr: 'PV', fieldNameEn: 'HP', fieldType: 'text' as any, icon: '❤️', sortOrder: 4 },
      { fieldKey: 'stage', fieldNameFr: 'Stade', fieldNameEn: 'Stage', fieldType: 'select' as any, fieldOptions: ['Base', 'Niveau 1', 'Niveau 2', 'BREAK', 'MÉGA', 'Restauré'], icon: '📊', sortOrder: 5 },
      { fieldKey: 'evolves_from', fieldNameFr: 'Évolue de', fieldNameEn: 'Evolves From', fieldType: 'text' as any, icon: '🔄', sortOrder: 6 },
      { fieldKey: 'attacks', fieldNameFr: 'Attaques', fieldNameEn: 'Attacks', fieldType: 'textarea' as any, icon: '⚔️', sortOrder: 7 },
      { fieldKey: 'abilities', fieldNameFr: 'Talents', fieldNameEn: 'Abilities', fieldType: 'textarea' as any, icon: '⚡', sortOrder: 8 },
      { fieldKey: 'weaknesses', fieldNameFr: 'Faiblesses', fieldNameEn: 'Weaknesses', fieldType: 'text' as any, icon: '💥', sortOrder: 9 },
      { fieldKey: 'resistances', fieldNameFr: 'Résistances', fieldNameEn: 'Resistances', fieldType: 'text' as any, icon: '🛡️', sortOrder: 10 },
      { fieldKey: 'retreat_cost', fieldNameFr: 'Coût retraite', fieldNameEn: 'Retreat Cost', fieldType: 'number' as any, icon: '🏃', sortOrder: 11 },
      { fieldKey: 'regulation_mark', fieldNameFr: 'Marque régulation', fieldNameEn: 'Regulation Mark', fieldType: 'text' as any, icon: '📋', sortOrder: 12 },
      { fieldKey: 'pokedex_number', fieldNameFr: 'N° Pokédex', fieldNameEn: 'Pokédex Number', fieldType: 'text' as any, icon: '📖', sortOrder: 13 },
      { fieldKey: 'rules', fieldNameFr: 'Règles', fieldNameEn: 'Rules', fieldType: 'textarea' as any, icon: '📜', sortOrder: 14 },
    ],
  },
  {
    name: 'Magic: The Gathering',
    slug: 'magic-the-gathering',
    description: 'Cartes Magic: The Gathering',
    icon: '🧙',
    color: '#e67e22',
    defaultProviders: ['mtg'],
    fields: [
      { fieldKey: 'mana_cost', fieldNameFr: 'Coût de mana', fieldNameEn: 'Mana Cost', fieldType: 'text' as any, icon: '💧', sortOrder: 1 },
      { fieldKey: 'cmc', fieldNameFr: 'CMC', fieldNameEn: 'Converted Mana Cost', fieldType: 'number' as any, icon: '🔢', sortOrder: 2 },
      { fieldKey: 'type_line', fieldNameFr: 'Type', fieldNameEn: 'Type Line', fieldType: 'text' as any, icon: '📝', sortOrder: 3 },
      { fieldKey: 'oracle_text', fieldNameFr: 'Texte Oracle', fieldNameEn: 'Oracle Text', fieldType: 'textarea' as any, icon: '📜', sortOrder: 4 },
      { fieldKey: 'power', fieldNameFr: 'Force', fieldNameEn: 'Power', fieldType: 'text' as any, icon: '⚔️', sortOrder: 5 },
      { fieldKey: 'toughness', fieldNameFr: 'Endurance', fieldNameEn: 'Toughness', fieldType: 'text' as any, icon: '🛡️', sortOrder: 6 },
      { fieldKey: 'loyalty', fieldNameFr: 'Loyauté', fieldNameEn: 'Loyalty', fieldType: 'text' as any, icon: '👑', sortOrder: 7 },
      { fieldKey: 'colors', fieldNameFr: 'Couleurs', fieldNameEn: 'Colors', fieldType: 'multiselect' as any, fieldOptions: ['Blanc', 'Bleu', 'Noir', 'Rouge', 'Vert'], icon: '🎨', sortOrder: 8 },
      { fieldKey: 'color_identity', fieldNameFr: 'Identité couleur', fieldNameEn: 'Color Identity', fieldType: 'multiselect' as any, fieldOptions: ['Blanc', 'Bleu', 'Noir', 'Rouge', 'Vert'], icon: '🪪', sortOrder: 9 },
      { fieldKey: 'layout', fieldNameFr: 'Disposition', fieldNameEn: 'Layout', fieldType: 'select' as any, fieldOptions: ['normal', 'transform', 'modal_dfc', 'split', 'flip', 'adventure', 'meld', 'saga', 'class', 'prototype'], icon: '📄', sortOrder: 10 },
      { fieldKey: 'keywords', fieldNameFr: 'Mots-clés', fieldNameEn: 'Keywords', fieldType: 'multiselect' as any, fieldOptions: ['Flying', 'Trample', 'Deathtouch', 'Lifelink', 'Haste', 'Vigilance', 'First Strike', 'Double Strike', 'Menace', 'Reach', 'Flash', 'Hexproof'], icon: '🔑', sortOrder: 11 },
      { fieldKey: 'foil', fieldNameFr: 'Foil', fieldNameEn: 'Foil', fieldType: 'boolean' as any, icon: '✨', sortOrder: 12 },
      { fieldKey: 'promo', fieldNameFr: 'Promo', fieldNameEn: 'Promo', fieldType: 'boolean' as any, icon: '🎁', sortOrder: 13 },
      { fieldKey: 'reprint', fieldNameFr: 'Réimpression', fieldNameEn: 'Reprint', fieldType: 'boolean' as any, icon: '🔄', sortOrder: 14 },
    ],
  },
  {
    name: 'Yu-Gi-Oh!',
    slug: 'yu-gi-oh',
    description: 'Cartes Yu-Gi-Oh!',
    icon: '👁️',
    color: '#e74c3c',
    defaultProviders: ['yugioh'],
    fields: [
      { fieldKey: 'card_type', fieldNameFr: 'Type de carte', fieldNameEn: 'Card Type', fieldType: 'select' as any, fieldOptions: ['Monstre Normal', 'Monstre Effet', 'Monstre Rituel', 'Monstre Fusion', 'Monstre Synchro', 'Monstre XYZ', 'Monstre Link', 'Magie', 'Piège'], icon: '🃏', sortOrder: 1 },
      { fieldKey: 'attribute', fieldNameFr: 'Attribut', fieldNameEn: 'Attribute', fieldType: 'select' as any, fieldOptions: ['TÉNÈBRES', 'LUMIÈRE', 'TERRE', 'EAU', 'FEU', 'VENT', 'DIVIN'], icon: '🌟', sortOrder: 2 },
      { fieldKey: 'race', fieldNameFr: 'Race', fieldNameEn: 'Race', fieldType: 'select' as any, fieldOptions: ['Dragon', 'Magicien', 'Guerrier', 'Démon', 'Zombie', 'Machine', 'Aqua', 'Bête', 'Rocher', 'Plante', 'Insecte', 'Fée', 'Poisson', 'Tonnerre', 'Pyro', 'Reptile', 'Serpent de mer', 'Bête ailée', 'Dinosaure', 'Psychique', 'Cyberse', 'Bête divine', 'Wyrm'], icon: '🐾', sortOrder: 3 },
      { fieldKey: 'level', fieldNameFr: 'Niveau', fieldNameEn: 'Level', fieldType: 'number' as any, icon: '⭐', sortOrder: 4 },
      { fieldKey: 'atk', fieldNameFr: 'ATK', fieldNameEn: 'ATK', fieldType: 'number' as any, icon: '⚔️', sortOrder: 5 },
      { fieldKey: 'def', fieldNameFr: 'DEF', fieldNameEn: 'DEF', fieldType: 'number' as any, icon: '🛡️', sortOrder: 6 },
      { fieldKey: 'archetype', fieldNameFr: 'Archétype', fieldNameEn: 'Archetype', fieldType: 'text' as any, icon: '📂', sortOrder: 7 },
      { fieldKey: 'link_value', fieldNameFr: 'Valeur Link', fieldNameEn: 'Link Value', fieldType: 'number' as any, icon: '🔗', sortOrder: 8 },
      { fieldKey: 'link_markers', fieldNameFr: 'Marqueurs Link', fieldNameEn: 'Link Markers', fieldType: 'multiselect' as any, fieldOptions: ['Haut', 'Bas', 'Gauche', 'Droite', 'Haut-Gauche', 'Haut-Droite', 'Bas-Gauche', 'Bas-Droite'], icon: '➡️', sortOrder: 9 },
      { fieldKey: 'pendulum_scale', fieldNameFr: 'Échelle Pendule', fieldNameEn: 'Pendulum Scale', fieldType: 'number' as any, icon: '⚖️', sortOrder: 10 },
      { fieldKey: 'pendulum_effect', fieldNameFr: 'Effet Pendule', fieldNameEn: 'Pendulum Effect', fieldType: 'textarea' as any, icon: '🔮', sortOrder: 11 },
    ],
  },
  {
    name: 'Dragon Ball Super Card Game',
    slug: 'dragon-ball-super',
    description: 'Cartes Dragon Ball Super',
    icon: '🐉',
    color: '#f39c12',
    defaultProviders: ['dbs'],
    fields: [
      { fieldKey: 'card_type', fieldNameFr: 'Type de carte', fieldNameEn: 'Card Type', fieldType: 'select' as any, fieldOptions: ['LEADER', 'BATTLE', 'EXTRA', 'UNISON', 'SECRET'], icon: '🃏', sortOrder: 1 },
      { fieldKey: 'color', fieldNameFr: 'Couleur', fieldNameEn: 'Color', fieldType: 'select' as any, fieldOptions: ['Rouge', 'Bleu', 'Vert', 'Jaune', 'Noir', 'Blanc'], icon: '💧', sortOrder: 2 },
      { fieldKey: 'power', fieldNameFr: 'Puissance', fieldNameEn: 'Power', fieldType: 'text' as any, icon: '💪', sortOrder: 3 },
      { fieldKey: 'energy_cost', fieldNameFr: 'Coût énergie', fieldNameEn: 'Energy Cost', fieldType: 'text' as any, icon: '⚡', sortOrder: 4 },
      { fieldKey: 'combo_cost', fieldNameFr: 'Coût combo', fieldNameEn: 'Combo Cost', fieldType: 'text' as any, icon: '🔄', sortOrder: 5 },
      { fieldKey: 'combo_power', fieldNameFr: 'Puissance combo', fieldNameEn: 'Combo Power', fieldType: 'text' as any, icon: '💥', sortOrder: 6 },
      { fieldKey: 'character', fieldNameFr: 'Personnage', fieldNameEn: 'Character', fieldType: 'multiselect' as any, icon: '🦸', sortOrder: 7 },
      { fieldKey: 'traits', fieldNameFr: 'Traits', fieldNameEn: 'Traits', fieldType: 'multiselect' as any, icon: '🏷️', sortOrder: 8 },
      { fieldKey: 'era', fieldNameFr: 'Saga', fieldNameEn: 'Era', fieldType: 'multiselect' as any, icon: '📅', sortOrder: 9 },
      { fieldKey: 'keywords', fieldNameFr: 'Mots-clés', fieldNameEn: 'Keywords', fieldType: 'multiselect' as any, icon: '🔑', sortOrder: 10 },
      { fieldKey: 'skill_text', fieldNameFr: 'Compétence', fieldNameEn: 'Skill Text', fieldType: 'textarea' as any, icon: '📜', sortOrder: 11 },
    ],
  },
  {
    name: 'One Piece Card Game',
    slug: 'one-piece',
    description: 'Cartes One Piece',
    icon: '🏴‍☠️',
    color: '#e74c3c',
    defaultProviders: ['onepiece'],
    fields: [
      { fieldKey: 'card_type', fieldNameFr: 'Type de carte', fieldNameEn: 'Card Type', fieldType: 'select' as any, fieldOptions: ['Leader', 'Personnage', 'Événement', 'Scène'], icon: '🃏', sortOrder: 1 },
      { fieldKey: 'color', fieldNameFr: 'Couleur', fieldNameEn: 'Color', fieldType: 'select' as any, fieldOptions: ['Rouge', 'Vert', 'Bleu', 'Violet', 'Noir', 'Jaune'], icon: '💧', sortOrder: 2 },
      { fieldKey: 'attribute', fieldNameFr: 'Attribut', fieldNameEn: 'Attribute', fieldType: 'select' as any, fieldOptions: ['Frappe', 'Distance', 'Sagesse', 'Tranchant'], icon: '🌟', sortOrder: 3 },
      { fieldKey: 'cost', fieldNameFr: 'Coût', fieldNameEn: 'Cost', fieldType: 'number' as any, icon: '💰', sortOrder: 4 },
      { fieldKey: 'power', fieldNameFr: 'Puissance', fieldNameEn: 'Power', fieldType: 'number' as any, icon: '💪', sortOrder: 5 },
      { fieldKey: 'counter', fieldNameFr: 'Compteur', fieldNameEn: 'Counter', fieldType: 'number' as any, icon: '🛡️', sortOrder: 6 },
      { fieldKey: 'life', fieldNameFr: 'Vie', fieldNameEn: 'Life', fieldType: 'number' as any, icon: '❤️', sortOrder: 7 },
      { fieldKey: 'effect', fieldNameFr: 'Effet', fieldNameEn: 'Effect', fieldType: 'textarea' as any, icon: '📜', sortOrder: 8 },
      { fieldKey: 'trigger_effect', fieldNameFr: 'Effet déclencheur', fieldNameEn: 'Trigger Effect', fieldType: 'textarea' as any, icon: '⚡', sortOrder: 9 },
      { fieldKey: 'tags', fieldNameFr: 'Tags', fieldNameEn: 'Tags', fieldType: 'multiselect' as any, icon: '🏷️', sortOrder: 10 },
    ],
  },
  {
    name: 'Digimon Card Game',
    slug: 'digimon',
    description: 'Cartes Digimon',
    icon: '🦕',
    color: '#3498db',
    defaultProviders: ['digimon'],
    fields: [
      { fieldKey: 'card_type', fieldNameFr: 'Type de carte', fieldNameEn: 'Card Type', fieldType: 'select' as any, fieldOptions: ['Digimon', 'Tamer', 'Option', 'Digi-Egg'], icon: '🃏', sortOrder: 1 },
      { fieldKey: 'color', fieldNameFr: 'Couleur', fieldNameEn: 'Color', fieldType: 'select' as any, fieldOptions: ['Red', 'Blue', 'Yellow', 'Green', 'Black', 'Purple', 'White'], icon: '💧', sortOrder: 2 },
      { fieldKey: 'digi_stage', fieldNameFr: 'Stade', fieldNameEn: 'Stage', fieldType: 'select' as any, fieldOptions: ['Baby', 'In-Training', 'Rookie', 'Champion', 'Ultimate', 'Mega'], icon: '📊', sortOrder: 3 },
      { fieldKey: 'level', fieldNameFr: 'Niveau', fieldNameEn: 'Level', fieldType: 'number' as any, icon: '⭐', sortOrder: 4 },
      { fieldKey: 'dp', fieldNameFr: 'DP', fieldNameEn: 'DP', fieldType: 'number' as any, icon: '💪', sortOrder: 5 },
      { fieldKey: 'play_cost', fieldNameFr: 'Coût de jeu', fieldNameEn: 'Play Cost', fieldType: 'number' as any, icon: '💰', sortOrder: 6 },
      { fieldKey: 'digivolve_cost_1', fieldNameFr: 'Coût digivolution 1', fieldNameEn: 'Digivolve Cost 1', fieldType: 'number' as any, icon: '🔄', sortOrder: 7 },
      { fieldKey: 'digivolve_cost_2', fieldNameFr: 'Coût digivolution 2', fieldNameEn: 'Digivolve Cost 2', fieldType: 'number' as any, icon: '🔄', sortOrder: 8 },
      { fieldKey: 'attribute', fieldNameFr: 'Attribut', fieldNameEn: 'Attribute', fieldType: 'select' as any, fieldOptions: ['Vaccine', 'Virus', 'Data', 'Free', 'Variable', 'Unknown'], icon: '🌟', sortOrder: 9 },
      { fieldKey: 'digi_type', fieldNameFr: 'Type Digi', fieldNameEn: 'Digi-Type', fieldType: 'text' as any, icon: '🐾', sortOrder: 10 },
      { fieldKey: 'main_effect', fieldNameFr: 'Effet principal', fieldNameEn: 'Main Effect', fieldType: 'textarea' as any, icon: '📜', sortOrder: 11 },
      { fieldKey: 'inherited_effect', fieldNameFr: 'Effet hérité', fieldNameEn: 'Inherited Effect', fieldType: 'textarea' as any, icon: '🧬', sortOrder: 12 },
      { fieldKey: 'security_effect', fieldNameFr: 'Effet sécurité', fieldNameEn: 'Security Effect', fieldType: 'textarea' as any, icon: '🔒', sortOrder: 13 },
      { fieldKey: 'color2', fieldNameFr: 'Couleur secondaire', fieldNameEn: 'Secondary Color', fieldType: 'select' as any, fieldOptions: ['Red', 'Blue', 'Yellow', 'Green', 'Black', 'Purple', 'White'], icon: '🎨', sortOrder: 14 },
      { fieldKey: 'evolution_color', fieldNameFr: "Couleur d'évolution", fieldNameEn: 'Evolution Color', fieldType: 'select' as any, fieldOptions: ['Red', 'Blue', 'Yellow', 'Green', 'Black', 'Purple', 'White'], icon: '🔄', sortOrder: 15 },
      { fieldKey: 'evolution_level', fieldNameFr: "Niveau d'évolution", fieldNameEn: 'Evolution Level', fieldType: 'number' as any, icon: '📈', sortOrder: 16 },
      { fieldKey: 'xros_requirement', fieldNameFr: 'Condition Xros', fieldNameEn: 'Xros Requirement', fieldType: 'text' as any, icon: '⚔️', sortOrder: 17 },
      { fieldKey: 'tcgplayer_id', fieldNameFr: 'TCGPlayer ID', fieldNameEn: 'TCGPlayer ID', fieldType: 'text' as any, icon: '🔗', sortOrder: 18 },
      { fieldKey: 'set_name', fieldNameFr: 'Extension', fieldNameEn: 'Set Name', fieldType: 'text' as any, icon: '📦', sortOrder: 19 },
      { fieldKey: 'artist', fieldNameFr: 'Artiste', fieldNameEn: 'Artist', fieldType: 'text' as any, icon: '🎨', sortOrder: 20 },
    ],
  },
];
