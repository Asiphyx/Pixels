import { FC, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { Book, BookOpen, History, Users, Map, Scroll } from 'lucide-react';

// Character class stats interface
interface ClassStats {
  strength: number;
  dexterity: number; 
  intelligence: number;
  wisdom: number;
  charisma: number;
  constitution: number;
}

// Character backstory interface
interface CharacterLore {
  name: string;
  avatar: string;
  title: string;
  race: string;
  class: string;
  stats: ClassStats;
  backstory: string;
  specialAbilities: string[];
  personalityTraits: string[];
  connections: string;
}

// TavernLore interface for organizing sections
interface TavernLore {
  history: string;
  location: string;
  patrons: string;
  specialFeatures: string;
  magicalProperties: string;
}

// Lore Book tabs
enum LoreTab {
  TAVERN = 'tavern',
  CHARACTERS = 'characters',
  WORLD = 'world',
}

// Character selection within the Characters tab
enum CharacterCategory {
  HEROES = 'heroes',
  BARTENDERS = 'bartenders',
}

export interface LoreBookProps {
  onClose: () => void;
}

const LoreBook: FC<LoreBookProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<LoreTab>(LoreTab.TAVERN);
  const [characterCategory, setCharacterCategory] = useState<CharacterCategory>(CharacterCategory.HEROES);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  
  // Tavern lore
  const tavernLore: TavernLore = {
    history: `The Hidden Gems Tavern was born from necessity and magic during The Great Rift Crisis over two centuries ago. Three sisters - Ruby, Sapphire, and Amethyst - found themselves caught in a cataclysmic magical event while attempting to escape the collapse of the Grand Arcanum Academy. 

As the walls of reality tore open around them, the sisters combined their unique magical talents in a desperate attempt to survive. Ruby's analytical precision, Sapphire's connection to otherworldly forces, and Amethyst's raw magical power created an anomaly: a stable pocket between realms.

The tavern began as merely their sanctuary, but soon they discovered their creation existed at a crossroads of realities. Travelers from across numerous worlds and dimensions began appearing, first as confused visitors, eventually as regular patrons. The sisters, initially cautious, soon embraced their unexpected role as interdimensional hosts.

Over the decades, the Hidden Gems Tavern developed a reputation across multiple worlds as a safe haven where the normal rules of rivalries, wars, and worldly conflicts did not apply. The sisters established a strict neutrality pact that all who enter must abide by - conflicts from outside must remain outside.

The tavern's physical properties constantly shift subtly as the boundaries between realms fluctuate, meaning rooms might rearrange, doorways occasionally open to unexpected destinations, and time doesn't always flow consistently. Patrons have learned to accept these quirks as part of the tavern's charm.`,
    
    location: `The Hidden Gems Tavern doesn't exist in any single definable location - it simultaneously occupies a spatial anomaly that intersects multiple planes of existence. To those with magical sensitivity, the tavern appears as a bright, warm light in the void between worlds.

Most patrons describe discovering the tavern during moments of great need or while lost between destinations. Common entry points include stepping through mist-filled alleyways at twilight, walking through particularly old stone archways while deep in thought, or simply opening the wrong door during a storm.

From the outside, the tavern adapts its appearance to match the architectural style of the viewer's home world, though always with the signature gemstone-colored lanterns hanging by the entrance - ruby red, sapphire blue, and amethyst purple.

The interior spaces shift and change based on need, magical influences, and the sisters' whims. Regular patrons know the central taproom always remains constant, while the corridors and rooms beyond might lead somewhere completely different from day to day.

The tavern sits at the intersection of at least seventeen known dimensions, with doorways occasionally opening to new realms without warning. This makes it both a premier meeting place for interdimensional travelers and an occasional headache for the sisters who maintain it.`,
    
    patrons: `The patrons of the Hidden Gems Tavern represent a diverse cross-section of the multiverse. On any given evening, one might find:

- Elven diplomats discussing trade agreements with dwarven merchants
- Time-displaced scholars comparing notes on histories that haven't happened yet
- Celestial beings masquerading as mortals to experience the simple pleasure of tavern life
- Weary adventurers seeking refuge from quests that span multiple worlds
- Exiled nobility from fallen kingdoms plotting their eventual return
- Elemental entities enjoying physical forms they adopt specifically for visiting
- Interplanar traders dealing in goods and curiosities from across the multiverse

The neutrality pact enforced by the sisters ensures that ancient enemies can sit at adjoining tables without bloodshed, though tension and cold glares are common enough. Many lifelong friendships, business partnerships, and even romantic relationships have formed between beings who would never have met if not for the tavern's unique position.

Regular patrons understand the unspoken etiquette: respect the peace, settle tabs promptly (the sisters accept currency from any realm but prefer interesting stories or minor magical trinkets), and never attempt to manipulate the tavern's spatial properties without permission.`,
    
    specialFeatures: `Beyond its interdimensional nature, the Hidden Gems Tavern boasts several unique features:

The Ever-Filling Kegs: Three magical brewing vessels, each attuned to one of the sisters, that produce signature drinks with subtle magical effects. Ruby's brews enhance mental clarity, Sapphire's induce prophetic dreams, and Amethyst's spark creativity and emotional openness.

The Whispering Wall: A section of stone near the hearth that occasionally murmurs secrets from other worlds. Patrons learn to take these whispers with skepticism, as the wall doesn't distinguish between truths, rumors, and creative fiction.

The Wandering Library: A small collection of books that constantly changes its contents. Books appear and disappear based on the current patrons' needs, sometimes containing crucial information they didn't know they required.

The Harmony Hearth: The central fireplace never goes out and burns with flames that change color based on the collective mood of the tavern's occupants. During rare moments of perfect contentment among all patrons, the flames briefly turn a pure white and grant minor blessings to everyone present.

The Remembrance Nook: A quiet corner filled with mementos from worlds that no longer exist, preserved by the sisters as a memorial to places and people lost to calamity or cosmic change.`,
    
    magicalProperties: `The Hidden Gems Tavern exists as a semi-sentient magical construct with several inherent properties:

Temporal Inconsistency: Time flows differently in different sections of the tavern. A patron might spend what feels like an hour in conversation, only to discover days have passed outside, or vice versa. The sisters can manipulate this effect somewhat but cannot fully control it.

Linguistic Comprehension: All speech within the tavern is automatically understood by listeners regardless of language or origin. The words are heard in their original tongue, but their meaning is magically conveyed. This does not extend to written text.

Adaptive Architecture: The tavern reshapes itself subtly to accommodate the needs and physical forms of its current patrons. Ceilings heighten for giants, chairs reinforce themselves for stone constructs, and ambient temperature adjusts for comfort.

Conflict Dampening: Magical fields throughout the establishment make it physically difficult to initiate violence. Weapons become unexpectedly heavy, aggressive spells fizzle, and would-be attackers find themselves oddly reluctant to follow through with harmful intentions.

Reality Anchoring: Despite its interdimensional nature, the tavern provides a stable environment that prevents most accidental magical effects. Spells cast inside tend to be more controlled and predictable than they would be in the chaotic spaces between worlds.

Memory Enhancement: Regular patrons find that memories formed in the tavern remain unusually vivid regardless of how much time passes, while memories of events immediately before finding the tavern often become hazy and dreamlike.`
  };
  
  // Character lore - heroes/avatars
  const heroLore: CharacterLore[] = [
    {
      name: "Bard",
      avatar: "bard",
      title: "The Melodious Wanderer",
      race: "Elven",
      class: "Bard",
      stats: {
        strength: 7,
        dexterity: 14,
        intelligence: 12,
        wisdom: 10,
        charisma: 18,
        constitution: 9
      },
      backstory: `Born to a prestigious musical dynasty in the Crystal Forests, this elven bard rejected the rigidly traditional compositions favored by their elders to explore the raw emotional power of music across all cultures. After being formally disowned for performing "crude mortal melodies" at an important celestial gathering, they wandered the realms collecting songs, stories, and musical techniques from every civilization they encountered.

During their travels, they stumbled upon an ancient harp made from the heartwood of a long-extinct singing tree. When played under the light of certain moons, this instrument can briefly bring memories to life as visible, intangible apparitions. The bard uses this ability not only to entertain but to help people process grief, celebrate joyful remembrances, and occasionally solve mysteries by reconstructing past events.

Their first encounter with the Hidden Gems Tavern occurred during a particularly violent thunderstorm when they sought shelter in what appeared to be an abandoned cottage. Upon entering, they found themselves in the tavern's warm common room. After an impromptu performance that moved even Sapphire to visible emotion, they became a regular visitor, often serving as an unofficial diplomat between different groups of patrons due to their natural charisma and cultural adaptability.

The bard maintains a complex relationship with their elven heritage, simultaneously rejecting its rigid traditions while working to preserve the ancient songs that risk being forgotten as younger elves increasingly adopt other cultures' music. Their ultimate goal is to create a grand composition that harmoniously blends musical elements from all known realms - a project they've been working on for decades.`,
      specialAbilities: [
        "Emotional Resonance: Can attune their music to directly influence the emotional state of listeners",
        "Perfect Recall: Can reproduce any piece of music after hearing it only once",
        "Memory Manifestation: Can use their ancient harp to temporarily visualize past events as ghostly apparitions",
        "Linguistic Adaptation: Quickly learns new languages by analyzing their songs and poetry"
      ],
      personalityTraits: [
        "Perpetually curious about new cultural expressions",
        "Surprisingly shrewd negotiator behind their carefree facade",
        "Collects instruments from every realm they visit",
        "Struggles with commitment in relationships",
        "Uncomfortable with silence and constantly hums or taps rhythms"
      ],
      connections: "The bard regularly exchanges exotic musical techniques with Amethyst, appreciates Sapphire's rare insights into otherworldly harmonies, and has composed several marketing jingles for Ruby's special menu items (much to her grudging appreciation)."
    },
    {
      name: "Knight",
      avatar: "knight",
      title: "The Oath-Bound Protector",
      race: "Human",
      class: "Knight",
      stats: {
        strength: 16,
        dexterity: 12,
        intelligence: 10,
        wisdom: 13,
        charisma: 11,
        constitution: 18
      },
      backstory: `A third-generation knight from a minor noble house known for their unwavering loyalty to a kingdom that has since fallen. When their homeland was conquered, they refused to bend the knee to the new rulers and instead embarked on a seemingly hopeless quest to find the rightful heir to the throne, who vanished during the final battle.

Their armor bears a unique enchantment passed down through their family line - it gradually adapts to and absorbs properties of significant enemies defeated by its wearer. Over years of battle, their originally standard plate mail has developed a patchwork appearance with segments that resist different types of damage based on past victories.

The knight first found the Hidden Gems Tavern while pursuing rumors of their lost sovereign. Stepping through a heavy fog on a battlefield, they emerged inside the tavern instead of the expected enemy encampment. Though initially suspicious, they recognized other patrons from fallen nations and realized the tavern could be a valuable source of information from across the realms.

Despite their serious demeanor, the knight harbors secret doubts about their quest. Their continued searching has gradually transformed from a matter of oath-bound duty to a search for personal purpose and identity in a world where traditional knighthood seems increasingly obsolete. They keep a small journal recording acts of honor and valor they've witnessed across multiple worlds, hoping to compile them into a new code of chivalry relevant to the complex multiverse they've discovered.`,
      specialAbilities: [
        "Adaptive Defense: Their enchanted armor provides resistance to damage types from previously defeated foes",
        "Unbreakable Resolve: Can continue fighting effectively even when severely injured",
        "Oath Magic: Limited ability to enforce sworn promises, both their own and those made in their presence",
        "Tactical Analysis: Can quickly identify combat weaknesses in opponents after observing them briefly"
      ],
      personalityTraits: [
        "Rigidly honorable to the point of occasional impracticality",
        "Struggles to adapt to situations that can't be solved through direct action",
        "Surprisingly gentle and nurturing with the vulnerable and innocent",
        "Collects small tokens from significant battles",
        "Uncomfortable with praise for actions they consider mere duty"
      ],
      connections: "The knight respects Ruby's efficiency and strategic mind, is deeply uncomfortable with Sapphire's cryptic prophecies about their quest, and appreciates Amethyst's battlefield magic knowledge despite finding her mannerisms exhausting."
    },
    {
      name: "Wizard",
      avatar: "wizard",
      title: "The Paradigm Breaker",
      race: "Human",
      class: "Wizard",
      stats: {
        strength: 6,
        dexterity: 8,
        intelligence: 19,
        wisdom: 16,
        charisma: 12,
        constitution: 9
      },
      backstory: `Raised in the Arcane Consortium, the most prestigious magical academy across seventeen known realms, this wizard showed early promise with an uncanny ability to identify flaws in established spell formulations. Their tendency to improve classic spells by breaking traditional magical paradigms earned them both academic acclaim and the bitter enmity of traditionalist archmages.

After creating a revolutionary theory unifying elemental and ethereal magic - considered impossible by established magical science - they were sabotaged by jealous rivals. An experiment tampered with by colleagues exploded, destroying half the academy and apparently killing the wizard. In truth, the magical backfire tore open a dimensional pocket where they remained trapped for decades, emerging only to discover that their theories had been stolen and their name erased from magical history.

They discovered the Hidden Gems Tavern while seeking rare components to reconstruct their research. Following a mysterious reagent vendor down an alley that shouldn't have existed, they found themselves instead at the tavern's bar, where Sapphire immediately recognized their unique magical signature and welcomed them by their true name - something that hadn't happened in years.

Now they use the tavern as a base for their continuing research, particularly studying the establishment's unique interdimensional properties. They've largely abandoned the pursuit of recognition, focusing instead on expanding magical knowledge for its own sake. However, they keep a meticulously documented record of their work with multiple copies hidden throughout different realms, determined that this time their contributions won't be erased.`,
      specialAbilities: [
        "Spell Deconstruction: Can analyze and identify the components of almost any spell they observe",
        "Magical Improvisation: Creates functioning spells on the fly by recombining known magical principles",
        "Dimensional Awareness: Can naturally sense rifts, portals, and weaknesses between planes of existence",
        "Arcane Conversion: Able to transform one type of magical energy into another through complex formulae"
      ],
      personalityTraits: [
        "Intensely curious about all magical phenomena",
        "Distrusts established authorities and institutions",
        "Takes obsessive notes about everything they witness",
        "Tendency to explain concepts at excessive length",
        "Values precision in language and gets irritated by magical inaccuracies"
      ],
      connections: "The wizard frequently engages Ruby in debates about the statistical probability of magical effects, has spent countless hours questioning Sapphire about her psychic abilities, and enjoys Amethyst's creative approaches to spellcasting while quietly correcting her magical terminology."
    },
    {
      name: "Merchant",
      avatar: "merchant",
      title: "The Boundary Broker",
      race: "Demonkind",
      class: "Merchant",
      stats: {
        strength: 11,
        dexterity: 14,
        intelligence: 16,
        wisdom: 8,
        charisma: 18,
        constitution: 13
      },
      backstory: `Born to a lesser demonic noble house specializing in binding contracts, they were expected to continue the family tradition of crafting deceptive deals to claim mortal souls. Showing both aptitude for the work and alarming moral qualms, they eventually fled their home realm with a stolen tome of contract law after deliberately sabotaging several major soul-claiming operations.

Using their innate understanding of agreement magic and interdimensional travel, they established themselves as a neutral intermediary for trade between realms that cannot normally interact. Their business expanded rapidly as they gained a reputation for crafting agreements that are binding but genuinely fair to both parties - a revolutionary concept in certain planar markets.

Their discovery of the Hidden Gems Tavern was less accident and more inevitability, as their constant pursuit of interdimensional connections naturally led them to the nexus point where the tavern exists. Recognizing its value as a meeting place for potential clients from normally inaccessible realms, they quickly became a regular patron.

While outwardly cheerful and charismatic, they are haunted by their heritage and constantly fear that their demonic nature will eventually corrupt their intentions. They donate a significant portion of their profits to charitable causes across multiple realms and maintain a network of orphanages for children displaced by interdimensional incidents - all anonymously to avoid drawing attention from their estranged family.`,
      specialAbilities: [
        "Contract Magic: Can create magically binding agreements that enforce compliance from all signatories",
        "Value Assessment: Can instantly determine the approximate worth of any item across multiple economic systems",
        "Planar Attunement: Able to locate the most valuable realm to sell particular goods for maximum profit",
        "Perfect Bargaining: Innate talent for finding compromise points that satisfy all parties in a negotiation"
      ],
      personalityTraits: [
        "Compulsively collects and categorizes unusual trinkets from different realms",
        "Maintains an elaborate facade of self-centered opportunism to hide genuine altruism",
        "Deeply uncomfortable with gratitude and deflects thanks with humor",
        "Knowledgeable about the cuisine of countless worlds and deeply appreciative of new flavors",
        "Abhors violence but maintains a network of capable mercenaries for necessary security"
      ],
      connections: "The merchant regularly supplies Ruby with rare ingredients for her special menu items, enjoys exchanging gossip with Amethyst about their mutual acquaintances, and has an ongoing arrangement with Sapphire to identify potentially valuable artifacts from the depths between realms."
    },
    {
      name: "Ranger",
      avatar: "ranger",
      title: "The Between-Worlds Pathfinder",
      race: "Troll",
      class: "Ranger",
      stats: {
        strength: 15,
        dexterity: 17,
        intelligence: 12,
        wisdom: 16,
        charisma: 8,
        constitution: 14
      },
      backstory: `Breaking every stereotype about their traditionally brutish race, this troll ranger exhibits exceptional sophistication and intelligence, having been raised by elven druids after their clan was destroyed. They developed an unparalleled knowledge of forest ecosystems and natural magic, eventually becoming a respected guardian of several interplanar wildlife sanctuaries.

Their life changed dramatically when they discovered a wound in reality within their forest - a tear between dimensions that leaked corrupting energy and allowed dangerous invasive species to cross between worlds. After successfully sealing this breach, they dedicated themselves to tracking and repairing similar interdimensional anomalies throughout the multiverse.

The ranger found the Hidden Gems Tavern while tracking a particularly elusive reality breach. Following trace energy through an ancient hollow tree, they emerged inside the tavern's back room. Initially suspicious, they eventually recognized the tavern's crucial role as a controlled, stable intersection between planes - a model for what interdimensional connections should be, rather than the chaotic tears they usually encounter.

They now use the tavern as a base of operations, gathering information about new dimensional breaches from patrons and occasionally recruiting help for larger operations. Their work has expanded to include relocating endangered species from dying realms, establishing protected habitats across different worlds to preserve biodiversity that would otherwise be lost to cosmic calamities.`,
      specialAbilities: [
        "Dimensional Tracking: Can follow the trail of creatures or entities across planar boundaries",
        "Reality Repair: Limited ability to mend small tears between dimensions using specialized techniques",
        "Adaptive Camouflage: Natural trollish regeneration redirected to rapidly adapt to new environments",
        "Beast Telepathy: Can communicate basic concepts and emotions with animals from any world"
      ],
      personalityTraits: [
        "Deeply uncomfortable in urban environments and large gatherings",
        "Surprisingly gentle despite intimidating appearance",
        "Speaks rarely but with precise, carefully chosen words",
        "Habitually catalogs new lifeforms encountered with detailed sketches",
        "Struggles with abstract concepts but excels with physical and spatial reasoning"
      ],
      connections: "The ranger provides Sapphire with information about changes in the void between worlds, helps Amethyst collect rare plants for her magical brews, and has a tense but respectful relationship with Ruby, who appreciates their precise reports but finds their earthy simplicity frustrating."
    },
    {
      name: "Rogue",
      avatar: "rogue",
      title: "The Shadow Diplomat",
      race: "Half-Human, Half-Dark Elf",
      class: "Rogue",
      stats: {
        strength: 10,
        dexterity: 18,
        intelligence: 14,
        wisdom: 13,
        charisma: 15,
        constitution: 8
      },
      backstory: `Born in the twilight between worlds to a human diplomat and a dark elf assassin, they were raised in the shadowy political intrigue of both societies while never fully belonging to either. Rather than choosing sides in the perpetual cold war between surface and underworld realms, they carved out a unique niche as an information broker and negotiator for deniable diplomatic exchanges between officially hostile powers.

Their mixed heritage grants them unique biological adaptations: surface-world stamina combined with underworld sensory capabilities. They can see perfectly in darkness while still tolerating bright light, though they prefer the comfortable shadows of dawn and dusk. These abilities, along with extensive training in both elven shadow-arts and human espionage techniques, make them an unparalleled infiltration specialist.

They discovered the Hidden Gems Tavern during a mission gone wrong, when an extraction tunnel unexpectedly opened into the tavern's wine cellar. After an awkward explanation to Ruby, who caught them among her prized vintages, they recognized the establishment's potential as a neutral meeting ground for their clients and arranged to make their unexpected visit the first of many.

Despite their morally ambiguous profession, they maintain a strict personal code: never sell information that would start a war, never betray a client's confidence, and always offer discounts to those working for genuine peace. They justify their occasional more questionable contracts as necessary to maintain the access and reputation required for their truly important work - facilitating dialogue between powers that cannot officially communicate.`,
      specialAbilities: [
        "Shadow Stepping: Can move between connected shadows as if they were doorways",
        "Perfect Memory: Can recall with perfect clarity any document or conversation they've experienced",
        "Identity Fluidity: Extraordinary ability to adopt new personas and disguises convincingly",
        "Selective Truth: Magical ability to speak statements that specific listeners interpret differently"
      ],
      personalityTraits: [
        "Collects secrets compulsively, even when they have no practical value",
        "Genuinely believes in the importance of balanced information flow in stable societies",
        "Maintains separate personas for different social circles",
        "Prefers elegant, non-violent solutions to problems",
        "Deeply curious about personal stories and motivations"
      ],
      connections: "The rogue has an intricate information-trading arrangement with Ruby, frequently passes messages between Sapphire and her mysterious contacts in the void, and occasionally helps Amethyst track down rare magical components from less-than-legitimate sources."
    }
  ];
  
  // Bartender lore
  const bartenderLore: CharacterLore[] = [
    {
      name: "Sapphire",
      avatar: "sapphire",
      title: "The Abyssal Seer",
      race: "Human-Merfolk Hybrid",
      class: "Psychic Oracle",
      stats: {
        strength: 9,
        dexterity: 14,
        intelligence: 16,
        wisdom: 20,
        charisma: 12,
        constitution: 15
      },
      backstory: `Sapphire was born in a coastal village to a mother who disappeared under mysterious circumstances. The truth, which she discovered years later, was that her mother was a deep sea merfolk priestess who had temporarily taken human form. When the magical transformation began to fail, her mother was forced to return to the depths, leaving her half-human child behind.

At age thirteen, Sapphire's latent psychic abilities manifested during a violent storm that destroyed her village. As the only survivor, she wandered the coastline until she was taken in by a colony of deep sea merfolk - her mother's people. There, beneath the waves in the crushing depths, she learned to harness her connection to abyssal entities that exist beyond normal perception.

These entities, which she refers to as "the deep ones" or "the void currents," granted her powerful psychic abilities but at a significant cost. A portion of her consciousness now perpetually exists in their realm, giving her prophetic insights but leaving her somewhat disconnected from conventional reality. Her body bears numerous tattoos that ripple and shift subtly as they help maintain the barrier between her physical form and the void energies she channels.

When the Great Rift Crisis occurred, Sapphire sensed the impending dimensional catastrophe through her connection to the between-spaces. She found her previously unknown half-sisters, Ruby and Amethyst, through a series of prophetic visions, arriving just in time to combine her void-manipulation abilities with their talents to create the stable dimensional pocket that became the Hidden Gems Tavern.

As the tavern's co-owner, Sapphire maintains their connection to the spaces between worlds, ensuring the establishment remains anchored despite constantly shifting dimensional currents. She's particularly attuned to the patterns of fate surrounding their patrons, often knowing who will arrive before they themselves decide to visit.`,
      specialAbilities: [
        "Void Sight: Can perceive events and entities in the spaces between dimensions",
        "Prophetic Vision: Receives unpredictable but accurate glimpses of possible futures",
        "Psychic Reading: Can sense strong emotional imprints and memories from objects or locations",
        "Water Breathing: Can breathe underwater indefinitely due to her merfolk heritage",
        "Darkness Adaptation: Perfect vision in complete darkness"
      ],
      personalityTraits: [
        "Often seems detached from immediate concerns, focusing on distant patterns",
        "Speaks in cryptic ocean metaphors and punk-inspired slang",
        "Deeply protective of those she considers 'her people'",
        "Uncomfortable with conventional social norms and expectations",
        "Constantly fights against the inhuman perspective of the void entities she's connected to",
        "Collects and documents prophecies about her sisters in a waterproof journal"
      ],
      connections: "Views Amethyst as chaotically endearing but exhausting, and Ruby as the practical anchor that keeps them all from drifting too far. Believes their sisterhood was destined by cosmic tides. Has numerous mysterious contacts in the void between worlds."
    },
    {
      name: "Amethyst",
      avatar: "amethyst",
      title: "The Flamboyant Battle-Mage",
      race: "Human",
      class: "Arcane Enchanter",
      stats: {
        strength: 8,
        dexterity: 16,
        intelligence: 17,
        wisdom: 10,
        charisma: 18,
        constitution: 10
      },
      backstory: `Amethyst began her magical education at the prestigious Grand Arcanum Academy, where she quickly distinguished herself with an unusual talent for combining combat magic with enchantment and illusion - disciplines typically kept separate. Her flamboyant approach to spellcasting and disregard for traditional magical boundaries made her popular with fellow students but controversial among faculty.

When a neighboring kingdom declared war, Amethyst was assigned to an elite battle-mage squadron despite being younger than most graduates. Her squadron became legendary for successful high-risk missions, with Amethyst's unconventional magical combinations proving particularly effective against enemy spellcasters.

During a crucial battle, her squadron was ambushed and would have been completely destroyed if not for Amethyst's desperate spell-weaving. She managed to create a magical barrier that saved herself but was forced to watch as her companions - who had become like family - were slaughtered. This traumatic event left her with persistent nightmares and a carefully hidden case of spell-shock (similar to combat trauma) that manifests during thunderstorms.

After the war, unable to return to conventional battle-mage duties due to trauma, she channeled her considerable magical talent into entertainment and creativity. She developed a public persona of exaggerated cheerfulness and flirtation that effectively masked her deeper pain while allowing her to continue using her magical abilities in a less destructive context.

When the Great Rift Crisis occurred, Amethyst was experimenting with dimensional magic as a way to create more spectacular illusions for her performances. This synchronicity put her in the perfect position to contribute her raw magical power and dimensional knowledge when she united with her previously unknown sisters, Ruby and Sapphire.`,
      specialAbilities: [
        "Combat Magic: Highly skilled in offensive and defensive battle spells despite rarely using them now",
        "Emotional Enchantment: Can influence the emotional states of others through magical effects",
        "Illusory Manifestation: Creates convincing illusions that can temporarily affect physical reality",
        "Magical Sensing: Can detect and identify magical auras and effects with great precision",
        "Plant Affinity: Special connection to magical flora that respond to her emotions"
      ],
      personalityTraits: [
        "Exaggeratedly flirtatious and dramatic to hide deeper emotional scars",
        "Deeply loyal to those she considers family",
        "Collects cute objects and magical trinkets compulsively",
        "Speaks with anime-inspired expressions and excessive enthusiasm",
        "Holds herself to impossibly high standards of magical performance",
        "Maintains a secret scrapbook of 'Sister Memories' with preserved flowers"
      ],
      connections: "Adores her sisters openly and dramatically, constantly teases Ruby about being too serious, and tries to draw Sapphire into her romantic schemes. Created personalized magical emergency amulets for both sisters that she renews with protection spells monthly."
    },
    {
      name: "Ruby",
      avatar: "ruby",
      title: "The Strategic Mastermind",
      race: "Human",
      class: "Information Specialist",
      stats: {
        strength: 12,
        dexterity: 15,
        intelligence: 19,
        wisdom: 16,
        charisma: 10,
        constitution: 14
      },
      backstory: `Born into a prosperous merchant family with connections throughout multiple kingdoms, Ruby was groomed from childhood to eventually take over the family business. She displayed an extraordinary aptitude for mathematics, logistics, and strategic planning that promised to elevate their trading house to unprecedented heights.

Everything changed when a coalition of corrupt nobles conspired to seize her family's assets through manufactured legal proceedings. Within months, their trading empire collapsed, her parents were imprisoned on false charges, and seventeen-year-old Ruby narrowly escaped the same fate by faking her own death.

Using her considerable organizational talents, Ruby spent the next several years building an information network from scratch. What began as a means to clear her family's name and exact revenge on their enemies evolved into a sophisticated intelligence operation. She developed a reputation for obtaining seemingly impossible information, though only her closest associates knew the extent of her network.

Ruby's approach to intelligence gathering emphasizes systematic methodology over flashy techniques. She pioneered a mathematical approach to information verification, developing complex algorithms to cross-reference and validate data from multiple sources. This scientific rigor made her services particularly valuable to those who needed absolute certainty in their intelligence.

When the Great Rift Crisis threatened multiple realities, Ruby detected the pattern of dimensional anomalies through her information network long before most authorities acknowledged the problem. Her investigation led her to two previously unknown half-sisters, Amethyst and Sapphire, whose magical talents complemented her strategic mind perfectly. Together, they created the Hidden Gems Tavern as both refuge and listening post at the intersection of multiple worlds.`,
      specialAbilities: [
        "Strategic Calculation: Can rapidly analyze complex situations for optimal solutions",
        "Information Network: Maintains extensive connections with informants across multiple realms",
        "Pattern Recognition: Identifies significant data points within seemingly random information",
        "Contingency Planning: Has prepared responses for hundreds of possible emergency scenarios",
        "Resource Optimization: Maximizes efficiency of available assets with minimal waste"
      ],
      personalityTraits: [
        "Speaks precisely with a preference for quantifiable statements",
        "Maintains meticulous organization in all aspects of her life",
        "Struggles to express emotions directly despite feeling them deeply",
        "Values practical solutions over theoretical ideals",
        "Secretly sentimental about family connections despite pragmatic exterior",
        "Maintains detailed contingency plans to protect her sisters from 347 different potential threats"
      ],
      connections: "Views herself as the practical caretaker of her more whimsical sisters. She'd never admit it, but she admires Amethyst's emotional openness and Sapphire's intuitive insights. Allocates 37% of tavern profits to causes her sisters would approve of without telling them."
    }
  ];
  
  // World lore sections
  const worldLore = {
    realms: `The multiverse connected through the Hidden Gems Tavern encompasses countless realms across different dimensional planes. Some of the most frequently represented include:

The Crystalline Dominion: A realm where magic manifests as physical crystal formations, resulting in landscapes of breathtaking geometric beauty and cities built from living crystal that grows according to the will of its inhabitants.

The Evernight: A world locked in perpetual darkness after its sun was stolen by a coalition of shadow entities. Its people have adapted with enhanced senses and bioluminescent body modifications, creating a hauntingly beautiful civilization that glows against the endless night.

The Mechanical Concordance: A plane where the boundary between living beings and machines has blurred to near non-existence. Its inhabitants regularly upgrade their bodies with clockwork enhancements, and even the animals and plants incorporate metallic elements.

The Verdant Wild: A realm where nature magic has reached its ultimate expression, with sentient plant life forming the dominant civilization. Trees serve as both buildings and citizens, while humanoid "gardeners" tend to specialized ecological needs.

The Sundered Empire: Once a mighty magical civilization spanning multiple dimensions, now fragmented into isolated pocket realms after a catastrophic magical civil war. Its refugees are common in the tavern, often seeking lost relatives or artifacts from their former homeland.

The Spiral Confluence: A unique plane where reality is arranged in concentric rings, each with different physical laws and magical properties. Travel between rings requires special adaptation, and its natives have evolved remarkable shapeshifting abilities to survive.

The Phantom Tides: A mysterious oceanic realm where the boundary between life and death is unusually permeable. Its sailors navigate both physical waters and spiritual currents, trading with ghostly port cities that materialize only under specific lunar alignments.`,
    
    magic: `Magical practices vary enormously between realms, but scholars who frequent the Hidden Gems Tavern have identified several broad traditions that appear in different forms across the multiverse:

Elemental Binding: The practice of forming agreements with elemental entities (whether sentient or merely conscious) to perform specific magical effects. This ranges from simple fire-starting to creating pocket dimensions with custom physical laws.

Soul Artifice: The controversial practice of embedding fragments of consciousness (willing or otherwise) into objects to create items with near-sentience and remarkable magical capabilities.

Pattern Mathematics: A precise, almost scientific approach to magic that treats spellcasting as a mathematical equation, manipulating fundamental patterns in reality through complex calculations and precisely drawn sigils.

Wyld Communion: Drawing power directly from primal natural forces through blood, sacrifice, dance, or ecstatic states. Considered dangerously unpredictable by more structured magical traditions.

Void Channeling: The dangerous practice of opening one's consciousness to the entities that exist in the spaces between dimensions. Grants immense power at the cost of gradually eroding the practitioner's connection to normal reality.

Divine Contracts: Formalized agreements with divine or semi-divine beings that grant specific powers in exchange for service, worship, or other considerations. The terms of these contracts vary enormously depending on the entities involved.

Harmonic Resonance: Using sound, music, or vibration to alter reality by matching the "frequency" of target phenomena. Particularly effective for healing, emotional influence, and communication across planar boundaries.`,
    
    conflicts: `Major interdimensional conflicts currently affecting tavern patrons include:

The Chromatic War: A complex, multi-faction conflict over control of rare color-based magic that exists outside normal light spectrums. Agents from at least seven different realms regularly gather intelligence in the tavern, maintaining an uneasy truce within its walls.

The Succession Crisis of the Infinite Throne: Following the disappearance of the immortal emperor who ruled the Golden Spiral realm, dozens of potential heirs from branch timelines have emerged claiming legitimacy. Their representatives frequently use the tavern as neutral ground for tense negotiations.

The Archive Dispute: Multiple scholarly organizations across different dimensions are competing, sometimes violently, to recover fragments of an ancient library believed to contain the complete magical knowledge of a vanished precursor civilization.

The Boundary Erosion Threat: An apolitical crisis affecting numerous realms as the natural barriers between dimensions weaken in certain regions, causing dangerous bleed-through effects. The tavern hosts regular summit meetings among affected worlds seeking cooperative solutions.

The Nightmare Incursion: Entities from a realm where dreams have physical form have begun invading the sleep of beings across multiple worlds. The tavern serves as a safe haven where dreamless sleep is possible, making it especially valuable to those targeted by these entities.`,
    
    factions: `Notable interdimensional organizations that maintain a presence in or around the tavern include:

The Planar Cartographers' Guild: A scholarly organization dedicated to mapping connections between dimensions and standardizing travel routes. They maintain a small office adjacent to the tavern that sometimes appears as a door where none existed previously.

The Concordiat of Displaced Peoples: An advocacy group representing refugees from worlds that have been destroyed or rendered uninhabitable by magical catastrophes, dimensional collapse, or similar disasters.

The Interstitial Market Collective: A loose association of merchants and traders who specialize in moving goods between incompatible economic systems, often using the tavern as a neutral exchange point.

The Regularity: A secretive organization dedicated to maintaining the overall stability of the multiverse by subtly limiting or encouraging dimensional travel and technological/magical development in various realms.

The Pattern Wardens: A monastic order whose members can perceive probability lines and work to prevent particularly catastrophic future outcomes by making minimal interventions at critical decision points.`
  };

  // Render selected character's lore
  const renderCharacterDetails = () => {
    let selectedLore: CharacterLore | undefined;
    
    if (characterCategory === CharacterCategory.HEROES) {
      selectedLore = heroLore.find(hero => hero.avatar === selectedCharacter);
    } else {
      selectedLore = bartenderLore.find(bartender => bartender.avatar === selectedCharacter);
    }
    
    if (!selectedLore) return null;
    
    return (
      <div className="character-details overflow-y-auto max-h-[calc(100vh-15rem)]">
        <div className="flex items-center mb-4 border-b border-[#8B4513] pb-3">
          <div className="avatar-container mr-3 bg-[#2C1810] rounded-full p-1">
            {/* Use appropriate avatar component based on type */}
            <div className="w-16 h-16 rounded-full bg-[#4A3429]"></div>
          </div>
          <div>
            <h3 className="font-['Press_Start_2P'] text-[#FFD700] text-lg">{selectedLore.name}</h3>
            <p className="text-[#E8D6B3] font-['VT323'] text-lg italic">{selectedLore.title}</p>
            <p className="text-[#E8D6B3] font-['VT323']">
              {selectedLore.race} {selectedLore.class}
            </p>
          </div>
        </div>
        
        {/* Stat Card */}
        <div className="stats-card mb-4 border-2 border-[#8B4513] bg-[#2C1810] rounded-lg p-3">
          <h4 className="font-['VT323'] text-[#FFD700] text-center mb-2 border-b border-[#8B4513] pb-1">Character Stats</h4>
          <div className="stats grid grid-cols-2 gap-2">
            <div className="stat-item">
              <span className="text-[#E8D6B3] font-['VT323']">STR:</span>
              <div className="stat-bar h-4 bg-[#4A3429] rounded-full overflow-hidden mt-1">
                <div className="h-full bg-[#CD5C5C]" style={{width: `${(selectedLore.stats.strength/20)*100}%`}}></div>
              </div>
              <span className="text-[#CD5C5C] font-['VT323'] text-right block">{selectedLore.stats.strength}</span>
            </div>
            <div className="stat-item">
              <span className="text-[#E8D6B3] font-['VT323']">DEX:</span>
              <div className="stat-bar h-4 bg-[#4A3429] rounded-full overflow-hidden mt-1">
                <div className="h-full bg-[#7FFF00]" style={{width: `${(selectedLore.stats.dexterity/20)*100}%`}}></div>
              </div>
              <span className="text-[#7FFF00] font-['VT323'] text-right block">{selectedLore.stats.dexterity}</span>
            </div>
            <div className="stat-item">
              <span className="text-[#E8D6B3] font-['VT323']">INT:</span>
              <div className="stat-bar h-4 bg-[#4A3429] rounded-full overflow-hidden mt-1">
                <div className="h-full bg-[#1E90FF]" style={{width: `${(selectedLore.stats.intelligence/20)*100}%`}}></div>
              </div>
              <span className="text-[#1E90FF] font-['VT323'] text-right block">{selectedLore.stats.intelligence}</span>
            </div>
            <div className="stat-item">
              <span className="text-[#E8D6B3] font-['VT323']">WIS:</span>
              <div className="stat-bar h-4 bg-[#4A3429] rounded-full overflow-hidden mt-1">
                <div className="h-full bg-[#9370DB]" style={{width: `${(selectedLore.stats.wisdom/20)*100}%`}}></div>
              </div>
              <span className="text-[#9370DB] font-['VT323'] text-right block">{selectedLore.stats.wisdom}</span>
            </div>
            <div className="stat-item">
              <span className="text-[#E8D6B3] font-['VT323']">CHA:</span>
              <div className="stat-bar h-4 bg-[#4A3429] rounded-full overflow-hidden mt-1">
                <div className="h-full bg-[#FFD700]" style={{width: `${(selectedLore.stats.charisma/20)*100}%`}}></div>
              </div>
              <span className="text-[#FFD700] font-['VT323'] text-right block">{selectedLore.stats.charisma}</span>
            </div>
            <div className="stat-item">
              <span className="text-[#E8D6B3] font-['VT323']">CON:</span>
              <div className="stat-bar h-4 bg-[#4A3429] rounded-full overflow-hidden mt-1">
                <div className="h-full bg-[#FF8C00]" style={{width: `${(selectedLore.stats.constitution/20)*100}%`}}></div>
              </div>
              <span className="text-[#FF8C00] font-['VT323'] text-right block">{selectedLore.stats.constitution}</span>
            </div>
          </div>
        </div>
        
        {/* Backstory */}
        <div className="section mb-4">
          <h4 className="font-['VT323'] text-[#FFD700] text-lg mb-2">Backstory</h4>
          <p className="text-[#E8D6B3] font-['VT323'] bg-[#2C1810] rounded p-3 leading-relaxed">
            {selectedLore.backstory}
          </p>
        </div>
        
        {/* Special Abilities */}
        <div className="section mb-4">
          <h4 className="font-['VT323'] text-[#FFD700] text-lg mb-2">Special Abilities</h4>
          <ul className="list-disc pl-5 text-[#E8D6B3] font-['VT323'] bg-[#2C1810] rounded p-3">
            {selectedLore.specialAbilities.map((ability, index) => (
              <li key={index} className="mb-1">{ability}</li>
            ))}
          </ul>
        </div>
        
        {/* Personality Traits */}
        <div className="section mb-4">
          <h4 className="font-['VT323'] text-[#FFD700] text-lg mb-2">Personality Traits</h4>
          <ul className="list-disc pl-5 text-[#E8D6B3] font-['VT323'] bg-[#2C1810] rounded p-3">
            {selectedLore.personalityTraits.map((trait, index) => (
              <li key={index} className="mb-1">{trait}</li>
            ))}
          </ul>
        </div>
        
        {/* Tavern Connections */}
        <div className="section mb-4">
          <h4 className="font-['VT323'] text-[#FFD700] text-lg mb-2">Tavern Connections</h4>
          <p className="text-[#E8D6B3] font-['VT323'] bg-[#2C1810] rounded p-3 leading-relaxed">
            {selectedLore.connections}
          </p>
        </div>
      </div>
    );
  };
  
  // Render tavern lore
  const renderTavernLore = () => {
    return (
      <div className="tavern-lore overflow-y-auto max-h-[calc(100vh-15rem)]">
        <div className="mb-4 text-center border-b border-[#8B4513] pb-3">
          <h3 className="font-['Press_Start_2P'] text-[#FFD700] text-lg mb-1">The Hidden Gems Tavern</h3>
          <p className="text-[#E8D6B3] font-['VT323'] text-lg italic">
            "A Sanctuary Between Realms"
          </p>
        </div>
        
        <div className="section mb-6">
          <div className="flex items-center mb-2">
            <History className="text-[#FFD700] mr-2" size={20} />
            <h4 className="font-['VT323'] text-[#FFD700] text-lg">History</h4>
          </div>
          <p className="text-[#E8D6B3] font-['VT323'] bg-[#2C1810] rounded p-3 leading-relaxed">
            {tavernLore.history}
          </p>
        </div>
        
        <div className="section mb-6">
          <div className="flex items-center mb-2">
            <Map className="text-[#FFD700] mr-2" size={20} />
            <h4 className="font-['VT323'] text-[#FFD700] text-lg">Location</h4>
          </div>
          <p className="text-[#E8D6B3] font-['VT323'] bg-[#2C1810] rounded p-3 leading-relaxed">
            {tavernLore.location}
          </p>
        </div>
        
        <div className="section mb-6">
          <div className="flex items-center mb-2">
            <Users className="text-[#FFD700] mr-2" size={20} />
            <h4 className="font-['VT323'] text-[#FFD700] text-lg">Patrons</h4>
          </div>
          <p className="text-[#E8D6B3] font-['VT323'] bg-[#2C1810] rounded p-3 leading-relaxed">
            {tavernLore.patrons}
          </p>
        </div>
        
        <div className="section mb-6">
          <div className="flex items-center mb-2">
            <BookOpen className="text-[#FFD700] mr-2" size={20} />
            <h4 className="font-['VT323'] text-[#FFD700] text-lg">Special Features</h4>
          </div>
          <p className="text-[#E8D6B3] font-['VT323'] bg-[#2C1810] rounded p-3 leading-relaxed">
            {tavernLore.specialFeatures}
          </p>
        </div>
        
        <div className="section mb-6">
          <div className="flex items-center mb-2">
            <Scroll className="text-[#FFD700] mr-2" size={20} />
            <h4 className="font-['VT323'] text-[#FFD700] text-lg">Magical Properties</h4>
          </div>
          <p className="text-[#E8D6B3] font-['VT323'] bg-[#2C1810] rounded p-3 leading-relaxed">
            {tavernLore.magicalProperties}
          </p>
        </div>
      </div>
    );
  };
  
  // Render world lore
  const renderWorldLore = () => {
    return (
      <div className="world-lore overflow-y-auto max-h-[calc(100vh-15rem)]">
        <div className="mb-4 text-center border-b border-[#8B4513] pb-3">
          <h3 className="font-['Press_Start_2P'] text-[#FFD700] text-lg mb-1">The Multiverse</h3>
          <p className="text-[#E8D6B3] font-['VT323'] text-lg italic">
            "Countless Realms Beyond the Tavern"
          </p>
        </div>
        
        <div className="section mb-6">
          <h4 className="font-['VT323'] text-[#FFD700] text-lg mb-2">Notable Realms</h4>
          <p className="text-[#E8D6B3] font-['VT323'] bg-[#2C1810] rounded p-3 leading-relaxed">
            {worldLore.realms}
          </p>
        </div>
        
        <div className="section mb-6">
          <h4 className="font-['VT323'] text-[#FFD700] text-lg mb-2">Magical Traditions</h4>
          <p className="text-[#E8D6B3] font-['VT323'] bg-[#2C1810] rounded p-3 leading-relaxed">
            {worldLore.magic}
          </p>
        </div>
        
        <div className="section mb-6">
          <h4 className="font-['VT323'] text-[#FFD700] text-lg mb-2">Current Conflicts</h4>
          <p className="text-[#E8D6B3] font-['VT323'] bg-[#2C1810] rounded p-3 leading-relaxed">
            {worldLore.conflicts}
          </p>
        </div>
        
        <div className="section mb-6">
          <h4 className="font-['VT323'] text-[#FFD700] text-lg mb-2">Interdimensional Factions</h4>
          <p className="text-[#E8D6B3] font-['VT323'] bg-[#2C1810] rounded p-3 leading-relaxed">
            {worldLore.factions}
          </p>
        </div>
      </div>
    );
  };
  
  // Render character selection for Heroes/Bartenders
  const renderCharacterSelection = () => {
    const characters = characterCategory === CharacterCategory.HEROES ? heroLore : bartenderLore;
    
    return (
      <div className="character-selection">
        <div className="mb-4 border-b border-[#8B4513] pb-3">
          <div className="tabs flex w-full mb-3">
            <button
              className={`px-4 py-2 flex-1 font-['VT323'] text-lg text-[#E8D6B3] ${
                characterCategory === CharacterCategory.HEROES 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
              }`}
              onClick={() => setCharacterCategory(CharacterCategory.HEROES)}
            >
              Heroes
            </button>
            <button
              className={`px-4 py-2 flex-1 font-['VT323'] text-lg text-[#E8D6B3] ${
                characterCategory === CharacterCategory.BARTENDERS
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
              }`}
              onClick={() => setCharacterCategory(CharacterCategory.BARTENDERS)}
            >
              Bartenders
            </button>
          </div>
          
          <p className="text-[#E8D6B3] font-['VT323'] text-center">
            {characterCategory === CharacterCategory.HEROES 
             ? "Adventurers who have found their way to the Hidden Gems Tavern" 
             : "The three sisters who created and maintain the Hidden Gems Tavern"}
          </p>
        </div>
        
        {selectedCharacter ? (
          // Show selected character details
          <div className="selected-character">
            {renderCharacterDetails()}
            <div className="mt-4 text-center">
              <button 
                className="px-4 py-2 bg-[#3A2419] text-[#E8D6B3] font-['VT323'] rounded hover:bg-[#4A3429]"
                onClick={() => setSelectedCharacter(null)}
              >
                ← Back to Characters
              </button>
            </div>
          </div>
        ) : (
          // Show character selection grid
          <div className="character-grid grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100vh-22rem)]">
            {characters.map(character => (
              <div 
                key={character.avatar}
                className="character-card bg-[#2C1810] rounded-lg p-3 border border-[#8B4513] cursor-pointer hover:border-[#FFD700] transition-all"
                onClick={() => setSelectedCharacter(character.avatar)}
              >
                <div className="avatar-container mx-auto mb-2 bg-[#3A2419] rounded-full p-1 w-16 h-16">
                  {/* Character avatar would go here */}
                  <div className="w-full h-full rounded-full bg-[#4A3429]"></div>
                </div>
                <h4 className="font-['VT323'] text-[#FFD700] text-center text-lg">{character.name}</h4>
                <p className="text-[#E8D6B3] font-['VT323'] text-center text-xs">{character.title}</p>
                <p className="text-[#E8D6B3] font-['VT323'] text-center text-xs mt-1">{character.race} {character.class}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // Main component render
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60">
      <div 
        className="lore-book-container bg-[#4A3429] w-11/12 max-w-4xl h-5/6 max-h-[800px] rounded-lg overflow-hidden 
                   shadow-[0_-4px_0_0px_#2C1810,0_4px_0_0px_#2C1810,-4px_0_0_0px_#2C1810,4px_0_0_0px_#2C1810,0_0_0_4px_#8B4513]"
      >
        <div className="lore-book-header bg-[#8B4513] p-3 flex justify-between items-center">
          <h2 className="font-['Press_Start_2P'] text-[#FFD700] text-xl flex items-center">
            <Book className="mr-2" />
            LORE BOOK
          </h2>
          <button onClick={onClose} className="text-[#E8D6B3] hover:text-[#FFD700] text-2xl">×</button>
        </div>
        
        <div className="lore-book-tabs flex flex-wrap border-b border-[#8B4513]">
          <button 
            className={`lore-tab flex-1 py-2 px-4 font-['VT323'] text-xl text-[#E8D6B3] ${
              activeTab === LoreTab.TAVERN 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
            }`}
            onClick={() => setActiveTab(LoreTab.TAVERN)}
          >
            The Tavern
          </button>
          <button 
            className={`lore-tab flex-1 py-2 px-4 font-['VT323'] text-xl text-[#E8D6B3] ${
              activeTab === LoreTab.CHARACTERS 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
            }`}
            onClick={() => setActiveTab(LoreTab.CHARACTERS)}
          >
            Characters
          </button>
          <button 
            className={`lore-tab flex-1 py-2 px-4 font-['VT323'] text-xl text-[#E8D6B3] ${
              activeTab === LoreTab.WORLD 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
            }`}
            onClick={() => setActiveTab(LoreTab.WORLD)}
          >
            The Multiverse
          </button>
        </div>
        
        <div className="lore-content p-4">
          {activeTab === LoreTab.TAVERN && renderTavernLore()}
          {activeTab === LoreTab.CHARACTERS && renderCharacterSelection()}
          {activeTab === LoreTab.WORLD && renderWorldLore()}
        </div>
      </div>
    </div>
  );
};

export default LoreBook;