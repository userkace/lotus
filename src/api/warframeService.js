/**
 * Warframe API Service
 * Handles fetching and processing data from Warframe Stat API
 */

const API_BASE_URL = 'https://api.warframestat.us';

/**
 * Fetches all Warframe world state data from Warframe Stat API
 * @param {string} [platform='pc'] - Platform to fetch data for (pc, ps4, xb1, ns)
 * @returns {Promise<Object>} Raw Warframe world state data
 */
export const fetchWarframeData = async (platform = 'pc') => {
  try {
    const response = await fetch(`${API_BASE_URL}/${platform}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Warframe data:', error);
    throw error;
  }
};

/**
 * Converts timestamp from API to JavaScript Date
 * @param {number|string} timestamp - Unix timestamp (seconds) or ISO 8601 string
 * @returns {Date} JavaScript Date object
 */
const parseTimestamp = (timestamp) => {
  if (!timestamp) return new Date();

  // If it's a string, check if it's an ISO 8601 format
  if (typeof timestamp === 'string') {
    // Check if it's an ISO 8601 date string (contains 'T' and 'Z' or timezone)
    if (timestamp.includes('T') && (timestamp.includes('Z') || timestamp.includes('+') || timestamp.includes('-'))) {
      return new Date(timestamp);
    }
    // Otherwise, treat as Unix timestamp string
    const timestampNum = parseInt(timestamp);
    if (isNaN(timestampNum)) return new Date();
    return new Date(timestampNum * 1000);
  }

  // Handle numeric Unix timestamp (seconds)
  if (isNaN(timestamp)) return new Date();
  return new Date(timestamp * 1000);
};

/**
 * Formats time from first data point (0s reference) to human readable format
 * @param {number} timestamp - Unix timestamp
 * @param {number} baseTime - Base timestamp to calculate from (first data point)
 * @returns {string} Formatted time from base
 */
export const formatTimeFromBase = (timestamp, baseTime) => {
  if (!timestamp || !baseTime) return '0s';

  const diff = timestamp - baseTime;

  if (diff <= 0) return '0s';

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

/**
 * Formats time remaining from timestamp to human readable format
 * @param {number|string} expiry - Expiry timestamp (Unix timestamp or ISO 8601 string)
 * @returns {string} Formatted time remaining
 */
export const formatTimeRemaining = (expiry) => {
  if (!expiry) return 'Unknown';

  const now = new Date();
  const expiryTime = parseTimestamp(expiry);
  const diff = expiryTime - now;

  if (diff <= 0) {
    // For recently expired items (within 1 hour), show negative time
    if (diff > -3600000) { // 1 hour in milliseconds
      const absDiff = Math.abs(diff);
      const minutes = Math.floor(absDiff / (1000 * 60));
      const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);
      return `Expired: -${minutes}m ${seconds}s`;
    }
    return 'Expired';
  }

  // Check if the difference is unreasonably large (more than 30 days)
  const maxReasonableDiff = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
  if (diff > maxReasonableDiff) {
    return 'Invalid Time';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

/**
 * Formats time ago from timestamp to human readable format
 * @param {number|string} timestamp - Past timestamp (Unix timestamp)
 * @returns {string} Formatted time ago
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown';

  const now = new Date();
  const pastTime = parseTimestamp(timestamp);
  const diff = now - pastTime;

  if (diff <= 0) return 'Just now';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
};

/**
 * Extracts planet name from node path
 * @param {string} nodePath - Full node path (e.g., "/Lotus/Levels/Earth/Everest.level")
 * @returns {string} Planet name
 */
const extractPlanetFromPath = (nodePath) => {
  if (!nodePath) return 'Unknown';

  const planetMap = {
    'Earth': 'Earth',
    'Venus': 'Venus',
    'Mercury': 'Mercury',
    'Mars': 'Mars',
    'Jupiter': 'Jupiter',
    'Saturn': 'Saturn',
    'Uranus': 'Uranus',
    'Neptune': 'Neptune',
    'Pluto': 'Pluto',
    'Eris': 'Eris',
    'Sedna': 'Sedna',
    'Ceres': 'Ceres',
    'Phobos': 'Phobos',
    'Deimos': 'Deimos',
    'Europa': 'Europa',
    'Lua': 'Lua',
    'Void': 'Void',
    'Derelict': 'Derelict',
    'KuvaLich': 'Kuva Fortress',
    'Tau': 'Duviri'
  };

  // Extract planet from path like "/Lotus/Levels/Earth/Everest.level"
  const pathParts = nodePath.split('/');
  const planetPart = pathParts.find(part => planetMap[part]);

  return planetMap[planetPart] || pathParts[3] || 'Unknown';
};

/**
 * Extracts mission type from level path
 * @param {string} levelPath - Level path
 * @returns {string} Mission type
 */
const extractMissionType = (levelPath) => {
  if (!levelPath) return 'Unknown';

  const missionTypes = {
    'Exterminate': 'Exterminate',
    'Survival': 'Survival',
    'Defense': 'Defense',
    'Interception': 'Interception',
    'Capture': 'Capture',
    'Sabotage': 'Sabotage',
    'Rescue': 'Rescue',
    'Spy': 'Spy',
    'MobileDefense': 'Mobile Defense',
    'Excavation': 'Excavation',
    'Hijack': 'Hijack',
    'Assassination': 'Assassination',
    'Deception': 'Deception',
    'InfestedSalvage': 'Infested Salvage',
    'Disruption': 'Disruption',
    'Alchemy': 'Alchemy',
    'Sanctuary': 'Sanctuary',
    'Arena': 'Conclave'
  };

  for (const [key, value] of Object.entries(missionTypes)) {
    if (levelPath.includes(key)) return value;
  }

  return 'Unknown';
};

/**
 * Processes cycle data from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed cycle data array
 */
export const processCycles = (worldState) => {
  if (!worldState) {
    return [];
  }

  const cycles = [];

  // Process Cetus cycle (Earth)
  if (worldState.cetusCycle) {
    const cetus = worldState.cetusCycle;
    cycles.push({
      location: 'Cetus (Earth)',
      state: cetus.isDay ? 'Day' : 'Night',
      timeLeft: formatTimeRemaining(cetus.expiry)
    });
  }

  // Process Orb Vallis cycle (Venus)
  if (worldState.vallisCycle) {
    const vallis = worldState.vallisCycle;
    cycles.push({
      location: 'Orb Vallis (Venus)',
      state: vallis.isWarm ? 'Warm' : 'Cold',
      timeLeft: formatTimeRemaining(vallis.expiry)
    });
  }

  // Process Cambion Drift cycle (Deimos)
  if (worldState.cambionCycle) {
    const cambion = worldState.cambionCycle;
    cycles.push({
      location: 'Cambion Drift (Deimos)',
      state: cambion.state === 'vome' ? 'Vome' : 'Fass',
      timeLeft: formatTimeRemaining(cambion.expiry)
    });
  }

  // Process Earth cycle (redundant - same as Cetus/Earth)
  // Removed to avoid duplication with Cetus cycle

  return cycles;
};

/**
 * Processes flash sales data from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed flash sales data
 */
export const processFlashSales = (worldState) => {
  if (!worldState || !worldState.flashSales) {
    return [];
  }

  const now = new Date();
  
  return worldState.flashSales
    .filter(sale => {
      const expiry = new Date(sale.expiry);
      return expiry > now; // Only include active sales
    })
    .map(sale => ({
      id: sale.id,
      message: sale.item,
      link: null,
      date: sale.activation,
      expiry: sale.expiry,
      discount: sale.discount,
      isFlashSale: true,
      priority: false
    }))
    .sort((a, b) => new Date(a.expiry) - new Date(b.expiry)); // Sort by earliest expiry first (least time left)
};

/**
 * Processes sortie data from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @returns {Object} Processed sortie data
 */
export const processSortie = (worldState) => {
  if (!worldState || !worldState.sortie) {
    return null;
  }

  const sortie = worldState.sortie;

  const missions = sortie.variants.map((mission, index) => ({
    id: String(index + 1).padStart(2, '0'),
    type: mission.missionType || 'Unknown',
    modifier: mission.modifier || 'No Modifiers',
    location: mission.node || 'Unknown'
  }));

  return {
    boss: sortie.boss || 'Unknown Boss',
    missionType: 'Sortie',
    timeLeft: formatTimeRemaining(sortie.expiry),
    missions
  };
};

/**
 * Gets mission type display name from mission type code
 * @param {string} missionType - Mission type code
 * @returns {string} Display name
 */
const getMissionTypeName = (missionType) => {
  const missionTypes = {
    'MT_ARTIFACT': 'Defection',
    'MT_SURVIVAL': 'Survival',
    'MT_DEFENSE': 'Defense',
    'MT_EXTERMINATE': 'Exterminate',
    'MT_CAPTURE': 'Capture',
    'MT_SABOTAGE': 'Sabotage',
    'MT_RESCUE': 'Rescue',
    'MT_SPY': 'Spy',
    'MT_MOBILE_DEFENSE': 'Mobile Defense',
    'MT_EXCAVATION': 'Excavation',
    'MT_HIJACK': 'Hijack',
    'MT_ASSASSINATION': 'Assassination',
    'MT_INTEL': 'Spy',
    'MT_TERRITORY': 'Conquest',
    'MT_SABOTAGE': 'Sabotage',
    'MT_MOBILE_DEFENSE': 'Mobile Defense',
    'MT_CORRUPTION': 'Defense',
    'MT_RESCUE': 'Rescue'
  };
  return missionTypes[missionType] || missionType || 'Unknown';
};

/**
 * Formats modifier name from modifier code
 * @param {string} modifier - Modifier code
 * @returns {string} Formatted modifier name
 */
const formatModifierName = (modifier) => {
  const modifiers = {
    'SORTIE_MODIFIER_LOW_ENERGY': 'Low Energy',
    'SORTIE_MODIFIER_IMPACT': 'Enhanced Impact',
    'SORTIE_MODIFIER_HAZARD_RADIATION': 'Radiation Hazard',
    'SORTIE_MODIFIER_FIRE': 'Enhanced Fire',
    'SORTIE_MODIFIER_ICE': 'Enhanced Ice',
    'SORTIE_MODIFIER_ELECTRICITY': 'Enhanced Electricity',
    'SORTIE_MODIFIER_TOXIN': 'Enhanced Toxin',
    'SORTIE_MODIFIER_SHOTGUN_ONLY': 'Shotguns Only',
    'SORTIE_MODIFIER_SNIPER_ONLY': 'Snipers Only',
    'SORTIE_MODIFIER_MELEE_ONLY': 'Melee Only',
    'SORTIE_MODIFIER_PRIMARY_ONLY': 'Primary Only',
    'SORTIE_MODIFIER_SECONDARY_ONLY': 'Secondary Only'
  };
  return modifiers[modifier] || modifier || 'No Modifiers';
};

/**
 * Extracts location from node name
 * @param {string} node - Node name
 * @returns {string} Formatted location
 */
const extractLocationFromNode = (node) => {
  if (!node) return 'Unknown';

  // Extract planet and location from node names like "SolNode15" or "SettlementNode11"
  const nodeMap = {
    'SolNode': 'Star Chart',
    'SettlementNode': 'Zariman',
    'CrewBattleNode': 'Railjack'
  };

  for (const [prefix, location] of Object.entries(nodeMap)) {
    if (node.startsWith(prefix)) {
      return location;
    }
  }

  return node;
};

/**
 * Formats boss name from boss code
 * @param {string} bossName - Boss name code
 * @returns {string} Formatted boss name
 */
const formatBossName = (bossName) => {
  if (!bossName) return 'Unknown Boss';

  const bossNames = {
    'SORTIE_BOSS_ALAD': 'Alad V',
    'SORTIE_BOSS_KRIL': 'Captain Vor & Kril',
    'SORTIE_BOSS_LEPHANTIS': 'Lephantis',
    'SORTIE_BOSS_VAY_HEK': 'General Sargas Ruk',
    'SORTIE_BOSS_JACKAL': 'The Jackal',
    'SORTIE_BOSS_RUK': 'General Sargas Ruk',
    'SORTIE_BOSS_INFALAD': 'Alad V',
    'SORTIE_BOSS_BOREAL': 'Boreal'
  };

  return bossNames[bossName] || bossName.replace(/SORTIE_BOSS_/, '').replace(/_/g, ' ') || 'Unknown Boss';
};

/**
 * Gets modifier from conquest variables
 * @param {Array} variables - Variables array
 * @returns {string} Modifier description
 */
const getModifierFromVariables = (variables) => {
  if (!Array.isArray(variables) || variables.length === 0) {
    return 'No Modifiers';
  }

  const variableNames = variables.join(', ');
  return variableNames || 'Special Conditions';
};

/**
 * Gets location from mission data
 * @param {Object} mission - Mission object
 * @returns {string} Location name
 */
const getLocationFromMission = (mission) => {
  const faction = mission.faction;
  const missionType = mission.missionType;

  // Create location based on faction and mission type
  const locations = {
    'FC_MITW': 'Mitwer',
    'FC_GRINEER': 'Grineer Base',
    'FC_CORPUS': 'Corpus Ship',
    'FC_INFESTED': 'Infested Ship'
  };

  return locations[faction] || 'Unknown Location';
};

/**
 * Gets boss name from conquest type
 * @param {string} type - Conquest type
 * @returns {string} Boss name
 */
const getBossFromConquestType = (type) => {
  const bossNames = {
    'CT_SORTIE': 'Sortie Commanders',
    'CT_LAB': 'Laboratory Bosses',
    'CT_HEX': 'Hex Targets'
  };
  return bossNames[type] || 'Unknown Boss';
};

/**
 * Gets conquest type display name
 * @param {string} type - Conquest type
 * @returns {string} Display name
 */
const getConquestTypeName = (type) => {
  const typeNames = {
    'CT_SORTIE': 'Sortie',
    'CT_LAB': 'Laboratory',
    'CT_HEX': 'Hex'
  };
  return typeNames[type] || type || 'Unknown';
};

/**
 * Processes daily deals from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed daily deals
 */
export const processDailyDeals = (worldState) => {
  if (!worldState || !worldState.dailyDeals) {
    return [];
  }

  return worldState.dailyDeals.map(deal => ({
    item: deal.item || 'Unknown Item',
    originalPrice: deal.originalPrice || 0,
    salePrice: deal.salePrice || 0,
    discount: Math.round(((deal.originalPrice - deal.salePrice) / deal.originalPrice) * 100) || 0,
    amountTotal: deal.total || 0,
    amountSold: deal.sold || 0,
    timeLeft: formatTimeRemaining(deal.expiry)
  }));
};

/**
 * Processes invasion data from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed invasions data
 */
export const processInvasions = (worldState) => {
  if (!worldState || !worldState.invasions) {
    return [];
  }

  // Filter out completed invasions
  const activeInvasions = worldState.invasions.filter(invasion => !invasion.completed);

  return activeInvasions.map(invasion => {
    const progressPercent = invasion.completion || 0;
    
    return {
      node: invasion.node || 'Unknown',
      planet: extractPlanetFromNode(invasion.node),
      expiry: invasion.expiry || null,
      progress: progressPercent,
      factionAttacker: invasion.attacker?.faction || 'Unknown',
      factionDefender: invasion.defender?.faction || 'Unknown',
      attackerReward: formatRewards(invasion.attacker?.reward),
      defenderReward: formatRewards(invasion.defender?.reward)
    };
  });
};

/**
 * Formats rewards from reward object
 * @param {Object} rewards - Reward object
 * @returns {string} Formatted reward description
 */
const formatRewards = (rewards) => {
  if (!rewards) return 'No Rewards';

  const items = [];
  if (rewards.credits && rewards.credits > 0) {
    items.push(`${rewards.credits} credits`);
  }
  if (rewards.items && rewards.items.length > 0) {
    items.push(rewards.items.join(', '));
  }
  if (rewards.countedItems && rewards.countedItems.length > 0) {
    const countedItems = rewards.countedItems.map(item => 
      item.count > 1 ? `${item.count}x ${item.type}` : item.type
    );
    items.push(countedItems.join(', '));
  }

  return items.length > 0 ? items.join(' + ') : 'No Rewards';
};

/**
 * Gets reward based on faction and progress
 * @param {string} faction - Faction name
 * @param {number} progress - Progress percentage
 * @returns {string} Reward description
 */
const getRewardForFaction = (faction, progress) => {
  const rewards = {
    'Grineer': ['2x Rifle Ammo Mutation', '3x Hell\'s Decree', '1x Vulkar'],
    'Corpus': ['2x Pistol Ammo Mutation', '3x Cryotic Rounds', '1x Dera']
  };

  const factionRewards = rewards[faction] || rewards['Grineer'];
  return factionRewards[Math.floor(Math.random() * factionRewards.length)];
};

/**
 * Processes season/challenge data (Nightwave) from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @returns {Object} Processed nightwave data
 */
export const processNightwave = (worldState) => {
  if (!worldState || !worldState.nightwave) {
    return {
      progress: 'No Active Season',
      progressPercent: 0,
      challenges: []
    };
  }

  const nightwave = worldState.nightwave;

  // Extract challenges and sort by daily/weekly
  const challenges = (nightwave.activeChallenges || []);
  const dailyChallenges = challenges
    .filter(challenge => challenge.isDaily)
    .map(challenge => ({
      name: challenge.title || 'Unknown Challenge',
      description: challenge.desc || 'Complete this challenge to earn rewards',
      isElite: false,
      type: 'daily',
      reputation: challenge.reputation || 0,
      expiry: formatTimeRemaining(challenge.expiry)
    }));

  const weeklyChallenges = challenges
    .filter(challenge => !challenge.isDaily)
    .map(challenge => ({
      name: challenge.title || 'Unknown Challenge',
      description: challenge.desc || 'Complete this challenge to earn rewards',
      isElite: challenge.isElite || false,
      type: 'weekly',
      reputation: challenge.reputation || 0,
      expiry: formatTimeRemaining(challenge.expiry)
    }));

  // Combine daily and weekly challenges, with daily first
  const sortedChallenges = [...dailyChallenges, ...weeklyChallenges];

  // Calculate progress based on time elapsed in season
  const activation = new Date(nightwave.activation);
  const expiry = new Date(nightwave.expiry);
  const now = new Date();
  const totalTime = expiry - activation;
  const elapsedTime = now - activation;
  const progressPercent = Math.min(100, Math.round((elapsedTime / totalTime) * 100));

  return {
    season: nightwave.season,
    progress: `Season ${nightwave.season}`,
    progressPercent,
    expiry: formatTimeRemaining(nightwave.expiry),
    challenges: sortedChallenges
  };
};

 /**
 * Processes Archon Hunt data from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @returns {Object} Processed archon hunt data
 */
export const processArchonHunt = (worldState) => {
  if (!worldState || !worldState.archonHunt) {
    return null;
  }

  const archonHunt = worldState.archonHunt;

  return {
    boss: archonHunt.boss || 'Unknown Archon',
    faction: archonHunt.faction || 'Unknown Faction',
    timeLeft: formatTimeRemaining(archonHunt.expiry),
    rewardPool: archonHunt.rewardPool || 'Unknown Rewards',
    missions: (archonHunt.missions || []).map((mission, index) => ({
      id: String(index + 1).padStart(2, '0'),
      type: mission.type || 'Unknown Mission',
      node: mission.node || 'Unknown Location',
      modifier: `${archonHunt.faction || 'Unknown'}`,
      location: mission.node || 'Unknown Location'
    }))
  };
};

/**
 * Extracts challenge name from challenge path
 * @param {string} challengePath - Challenge path
 * @returns {string} Challenge name
 */
const extractChallengeName = (challengePath) => {
  if (!challengePath) return 'Unknown Challenge';

  // Extract the last part of the path and convert to readable name
  const pathParts = challengePath.split('/');
  const challengeName = pathParts[pathParts.length - 1];

  // Map known challenge paths to readable names
  const challengeNames = {
    'SeasonDailyDonateLeverian': 'Donate Leverian',
    'SeasonDailyPlaceMarker': 'Place Beacon',
    'SeasonDailyKillEnemiesWithElectricity': 'Kill Enemies with Electricity',
    'SeasonWeeklyPermanentCompleteMissions18': 'Complete 18 Missions',
    'SeasonWeeklySanctuary': 'Sanctuary Target',
    'SeasonWeeklyElite': 'Elite Weekly Challenge'
  };

  return challengeNames[challengeName] || formatChallengeName(challengeName);
};

/**
 * Formats challenge name from path name
 * @param {string} name - Raw challenge name
 * @returns {string} Formatted name
 */
const formatChallengeName = (name) => {
  if (!name) return 'Unknown Challenge';

  // Convert camelCase to readable format
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace('Season Daily', 'Daily')
    .replace('Season Weekly', 'Weekly');
};

/**
 * Gets challenge description
 * @param {string} challengePath - Challenge path
 * @returns {string} Challenge description
 */
const getChallengeDescription = (challengePath) => {
  if (!challengePath) return 'No description available';

  // Provide descriptions for known challenges
  const descriptions = {
    'SeasonDailyDonateLeverian': 'Donate items to the Leverian',
    'SeasonDailyPlaceMarker': 'Place a marker in a mission',
    'SeasonDailyKillEnemiesWithElectricity': 'Kill enemies using electricity damage',
    'SeasonWeeklyPermanentCompleteMissions18': 'Complete 18 missions of any type',
    'SeasonWeeklySanctuary': 'Complete Sanctuary Onslaught missions',
    'SeasonWeeklyElite': 'Complete elite weekly challenges'
  };

  return descriptions[challengePath] || 'Complete this challenge to earn rewards';
};

/**
 * Processes void trader data from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @returns {Object} Processed void trader data
 */
export const processVoidTrader = (worldState) => {
  if (!worldState || !worldState.voidTrader) {
    return null;
  }

  const trader = worldState.voidTrader;
  const now = new Date();
  const activation = parseTimestamp(trader.activation);
  const expiry = parseTimestamp(trader.expiry);
  const isActive = now >= activation && now <= expiry;

  return {
    character: trader.character || 'Baro\'Ki Teel',
    location: trader.location || 'Unknown',
    active: isActive,
    activation,
    expiry,
    timeLeft: formatTimeRemaining(trader.expiry),
    inventory: trader.inventory?.map(item => ({
      name: item.item,
      ducats: item.ducats,
      credits: item.credits
    })) || []
  };
};

/**
 * Processes fissure data from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @param {string} [tierFilter='all'] - Optional filter for specific tier ('all', 'lith', 'meso', 'neo', 'axi', 'requiem', 'omnia')
 * @param {boolean} [steelPath=false] - Whether to filter for Steel Path fissures only
 * @returns {Array} Processed fissures data
 */
export const processFissures = (worldState, tierFilter = 'all', steelPath = false) => {
  if (!worldState || !worldState.fissures) {
    return [];
  }

  const fissures = worldState.fissures
    .filter(fissure => steelPath ? fissure.isHard : !fissure.isHard)
    .map(fissure => ({
      tier: fissure.tier || 'Unknown',
      type: fissure.missionType || 'Unknown',
      node: fissure.node || 'Unknown',
      planet: extractPlanetFromNode(fissure.node),
      faction: fissure.enemy || 'Unknown',
      timeLeft: formatTimeRemaining(fissure.expiry)
    }));

  // Filter by tier if specified
  if (tierFilter !== 'all') {
    return fissures.filter(fissure =>
      fissure.tier.toLowerCase() === tierFilter.toLowerCase()
    );
  }

  return fissures;
};

/**
 * Formats tier name from tier code
 * @param {string} tier - Tier code
 * @returns {string} Formatted tier name
 */
const formatTierName = (tier) => {
  const tierNames = {
    'VoidT1': 'Lith',
    'VoidT2': 'Meso',
    'VoidT3': 'Neo',
    'VoidT4': 'Axi',
    'VoidT5': 'Requiem',
    'VoidT6': 'Omnia'
  };

  return tierNames[tier] || tier || 'Unknown';
};

/**
 * Extracts planet from node name
 * @param {string} node - Node name
 * @returns {string} Planet name
 */
const extractPlanetFromNode = (node) => {
  if (!node) return 'Unknown';

  // Map known SolNodes to planets
  const nodeToPlanet = {
    'SolNode1': 'Mercury',
    'SolNode2': 'Venus',
    'SolNode3': 'Earth',
    'SolNode4': 'Mars',
    'SolNode5': 'Jupiter',
    'SolNode6': 'Saturn',
    'SolNode7': 'Uranus',
    'SolNode8': 'Neptune',
    'SolNode9': 'Pluto',
    'SolNode10': 'Eris',
    'SolNode11': 'Sedna',
    'SolNode12': 'Ceres',
    'SolNode13': 'Phobos',
    'SolNode14': 'Deimos',
    'SolNode15': 'Europa',
    'SolNode16': 'Lua'
  };

  return nodeToPlanet[node] || 'Unknown';
};

/**
 * Processes arbitration data from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @returns {Object} Processed arbitration data
 */
export const processArbitrations = (worldState) => {
  if (!worldState || !worldState.arbitration) {
    return null;
  }

  const arbitration = worldState.arbitration;
  
  // Debug: Log the raw arbitration data
  console.log('Raw arbitration data:', arbitration);

  // Check if arbitration is expired or has placeholder data
  if (arbitration.expired || 
      arbitration.type === 'Unknown' || 
      arbitration.node === 'SolNode000' ||
      !arbitration.activation || 
      arbitration.activation === '1970-01-01T00:00:00.000Z') {
    console.log('Arbitration is not active or has placeholder data');
    return null;
  }

  return {
    type: arbitration.type || 'Unknown',
    location: extractLocationFromNode(arbitration.node) || arbitration.node || 'Unknown',
    faction: arbitration.enemy || 'Unknown',
    timeLeft: formatTimeRemaining(arbitration.expiry)
  };
};

/**
 * Processes void storm data from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @param {string} [filter='all'] - Optional filter for specific tier or faction ('all', 'lith', 'meso', 'neo', 'axi', 'grineer', 'corpus')
 * @returns {Array} Processed void storm data
 */
export const processVoidStorms = (worldState, filter = 'all') => {
  if (!worldState || !worldState.fissures) {
    return [];
  }

  // Filter fissures that are void storms (isStorm: true)
  const voidStormFissures = worldState.fissures.filter(fissure => fissure.isStorm);
  
  const storms = voidStormFissures.map(storm => ({
    location: storm.node || 'Unknown',
    faction: storm.enemy || 'Unknown',
    missionType: storm.missionType || 'Unknown',
    tier: storm.tier || 'Unknown',
    timeLeft: formatTimeRemaining(storm.expiry)
  }));

  // Filter by tier or faction if specified
  if (filter !== 'all') {
    return storms.filter(storm =>
      storm.tier.toLowerCase() === filter.toLowerCase() ||
      storm.faction.toLowerCase() === filter.toLowerCase()
    );
  }

  return storms;
};


/**
 * Processes faction project data from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed faction project data
 */
export const processFactionProjects = (worldState) => {
  if (!worldState) {
    return [];
  }

  // Debug: Log available keys to see what we have
  // console.log('Available worldState keys:', Object.keys(worldState));


  if (!worldState.constructionProgress) {
    // Fallback to events if constructionProgress doesn't exist
    if (!worldState.events) {
      return [];
    }
    
    // Filter events for faction-related ones
    const factionEvents = worldState.events.filter(event => 
      event.description && (
        event.description.toLowerCase().includes('fomorian') ||
        event.description.toLowerCase().includes('razorback')
      )
    );

    return factionEvents.map(project => {
      const progressPercent = Math.round((project.progress || 0) * 100) / 100;
      return {
        type: project.description || 'Unknown',
        faction: project.description?.toLowerCase().includes('fomorian') ? 'Grineer' : 'Corpus',
        progress: progressPercent,
        timeRemaining: formatTimeRemaining(project.expiry),
        location: 'System-wide',
        rewards: []
      };
    });
  }

  const construction = worldState.constructionProgress;
  const projects = [];

  // Process Fomorian progress
  if (construction.fomorianProgress) {
    const fomorianProgress = parseFloat(construction.fomorianProgress) || 0;
    projects.push({
      type: 'Fomorian',
      faction: 'Grineer',
      progress: fomorianProgress,
      timeRemaining: 'Unknown',
      location: 'System-wide',
      rewards: []
    });
  }

  // Process Razorback progress
  if (construction.razorbackProgress) {
    const razorbackProgress = parseFloat(construction.razorbackProgress) || 0;
    projects.push({
      type: 'Razorback',
      faction: 'Corpus',
      progress: razorbackProgress,
      timeRemaining: 'Unknown',
      location: 'System-wide',
      rewards: []
    });
  }

  return projects;
};

/**
 * Processes Kuva siphon data from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed Kuva siphon data
 */
export const processKuvaSiphons = (worldState) => {
  if (!worldState || !worldState.kuva) {
    return [];
  }

  return worldState.kuva.map(siphon => ({
    location: siphon.node || 'Unknown',
    faction: siphon.enemy || 'Unknown',
    missionType: siphon.missionType || 'Unknown',
    tier: siphon.tier || 'Unknown',
    isFlood: siphon.isFlood || false,
    timeLeft: formatTimeRemaining(siphon.expiry),
    rewards: siphon.rewards?.map(reward => ({
      name: reward.item,
      type: reward.type,
      chance: reward.chance
    })) || []
  }));
};

/**
 * Processes bounty data from Warframe Stat API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed bounty data
 */
export const processBounties = (worldState) => {
  if (!worldState || !worldState.syndicateMissions) {
    return [];
  }

  const sortOrder = [
    'Ostrons',
    'Solaris United', 
    'Vox Solaris',
    'Entrati',
    'Cavia',
    'The Holdfasts'
  ];

  // Bounty location mapping
  const bountyLocations = {
    'Ostrons': 'Cetus, Earth',
    'Solaris United': 'Fortuna, Venus',
    'Vox Solaris': 'Orb Vallis, Venus',
    'Entrati': 'Necralisk, Deimos',
    'Cavia': 'Sanctum Anatomica',
    'The Holdfasts': 'Duviri'
  };

  // Filter only syndicates with actual bounty jobs
  const bountiesWithJobs = worldState.syndicateMissions.filter(
    syndicate => syndicate.jobs && syndicate.jobs.length > 0
  );

  const processedBounties = bountiesWithJobs.map(bounty => ({
    syndicate: bounty.syndicate || 'Unknown',
    location: bountyLocations[bounty.syndicate] || 'Unknown',
    expiry: bounty.expiry,
    jobs: bounty.jobs.map((job, index) => ({
      id: index + 1,
      title: job.type || `Job ${index + 1}`,
      type: job.type || '',
      enemyLevels: job.enemyLevels || [0, 0],
      standingStages: job.standingStages || [],
      minMR: job.minMR || 0,
      isVault: job.isVault || false,
      locationTag: job.locationTag || '',
      timeBound: job.timeBound || '',
      expiry: job.expiry,
      // Format rewards from rewardPool
      rewards: (job.rewardPool || []).map((reward, rewardIndex) => ({
        name: reward === "Pattern Mismatch. Results inaccurate." ? "Standard Rewards" : reward,
        type: 'Reward',
        count: 1,
        chance: 0
      }))
    }))
  }));

  // Sort bounties according to the specified order
  return processedBounties.sort((a, b) => {
    const aIndex = sortOrder.indexOf(a.syndicate);
    const bIndex = sortOrder.indexOf(b.syndicate);

    // If both are in the sort order, sort by their positions
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    // If only one is in the sort order, put the one in order first
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    // If neither is in the sort order, sort alphabetically
    return a.syndicate.localeCompare(b.syndicate);
  });
};

/**
 * Gets available relic tiers
 * @returns {Array} Array of available tiers
 */
export const getRelicTiers = () => {
  return ['all', 'Lith', 'Meso', 'Neo', 'Axi', 'Requiem', 'Omnia'];
};
