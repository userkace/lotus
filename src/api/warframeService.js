/**
 * Warframe API Service
 * Handles fetching and processing data from official Warframe API
 */

const API_BASE_URL = '/api/warframe';

/**
 * Fetches all Warframe world state data from official API
 * @returns {Promise<Object>} Raw Warframe world state data
 */
export const fetchWarframeData = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    
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
 * Converts Unix timestamp from API to JavaScript Date
 * @param {number|string} timestamp - Unix timestamp (number or string)
 * @returns {Date} JavaScript Date object
 */
const parseTimestamp = (timestamp) => {
  if (!timestamp) return new Date();
  
  // Handle both number and string formats
  const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  
  if (isNaN(timestampNum)) return new Date();
  
  // Unix timestamps are in seconds, JavaScript Date expects milliseconds
  return new Date(timestampNum * 1000);
};

/**
 * Formats time remaining from timestamp to human readable format
 * @param {number|string} expiry - Expiry timestamp (Unix timestamp)
 * @returns {string} Formatted time remaining
 */
export const formatTimeRemaining = (expiry) => {
  if (!expiry) return 'Unknown';
  
  const now = new Date();
  const expiryTime = parseTimestamp(expiry);
  const diff = expiryTime - now;
  
  if (diff <= 0) return 'Expired';
  
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
 * Processes cycle data from Tenno Tools API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed cycle data array
 */
export const processCycles = (worldState) => {
  if (!worldState || !worldState.daynight || !worldState.daynight.data) {
    return [];
  }
  
  const cycles = [];
  const now = new Date();
  
  worldState.daynight.data.forEach(cycle => {
    // Calculate cycle position based on the cycle start time and length
    const cycleStart = parseTimestamp(cycle.start);
    const cycleLengthSeconds = cycle.length;
    const cycleLength = cycleLengthSeconds * 1000; // Convert to milliseconds
    
    // Calculate how much time has passed since cycle started
    const elapsed = now.getTime() - cycleStart.getTime();
    const cycleProgress = (elapsed % cycleLength) / cycleLength;
    
    // Determine if it's day or night (dayStart and dayEnd are in seconds within the cycle)
    const dayStartSeconds = cycle.dayStart;
    const dayEndSeconds = cycle.dayEnd;
    const isDay = cycleProgress >= (dayStartSeconds / cycleLengthSeconds) && cycleProgress <= (dayEndSeconds / cycleLengthSeconds);
    
    // Calculate time until next state change
    let timeUntilChange;
    if (isDay) {
      timeUntilChange = (dayEndSeconds * 1000) - (elapsed % cycleLength);
    } else {
      timeUntilChange = cycleLength - (elapsed % cycleLength);
      if (cycleProgress < (dayStartSeconds / cycleLengthSeconds)) {
        timeUntilChange = (dayStartSeconds * 1000) - (elapsed % cycleLength);
      }
    }
    
    // Format location name
    const locationNames = {
      'cetus': 'Cetus (Earth)',
      'fortuna': 'Orb Vallis (Venus)',
      'earth': 'Earth',
      'vallis': 'Orb Vallis (Venus)',
      'cambion': 'Cambion Drift (Deimos)'
    };
    
    const stateNames = {
      'cetus': isDay ? 'Day' : 'Night',
      'fortuna': isDay ? 'Warm' : 'Cold',
      'earth': isDay ? 'Day' : 'Night',
      'vallis': isDay ? 'Warm' : 'Cold',
      'cambion': isDay ? 'Vome' : 'Wisp'
    };
    
    cycles.push({
      location: locationNames[cycle.id] || `${cycle.id}`,
      state: stateNames[cycle.id] || (isDay ? 'Day' : 'Night'),
      timeLeft: formatTimeRemaining(Math.floor((now.getTime() + timeUntilChange) / 1000))
    });
  });
  
  return cycles;
};

/**
 * Processes sortie data from Tenno Tools API
 * @param {Object} worldState - Full world state data from API
 * @returns {Object} Processed sortie data
 */
export const processSortie = (worldState) => {
  if (!worldState || !worldState.sorties || !worldState.sorties.data || worldState.sorties.data.length === 0) {
    return null;
  }
  
  const sortie = worldState.sorties.data[0];
  
  const missions = sortie.missions.map((mission, index) => ({
    id: String(index + 1).padStart(2, '0'),
    type: getMissionTypeName(mission.missionType),
    modifier: formatModifierName(mission.modifier),
    location: extractLocationFromNode(mission.location)
  }));
  
  return {
    boss: formatBossName(sortie.bossName),
    missionType: 'Sortie',
    timeLeft: formatTimeRemaining(sortie.end),
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
 * Processes daily deals from Tenno Tools API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed daily deals
 */
export const processDailyDeals = (worldState) => {
  if (!worldState || !worldState.dailydeals || !worldState.dailydeals.data) {
    return [];
  }
  
  return worldState.dailydeals.data.map(deal => ({
    item: deal.item?.name || 'Unknown Item',
    originalPrice: deal.originalPrice || 0,
    salePrice: deal.price || 0,
    discount: Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100) || 0,
    amountTotal: deal.stock || 0,
    amountSold: deal.sold || 0,
    timeLeft: formatTimeRemaining(deal.end)
  }));
};

/**
 * Processes invasion data from Tenno Tools API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed invasions data
 */
export const processInvasions = (worldState) => {
  if (!worldState || !worldState.invasions || !worldState.invasions.data) {
    return [];
  }
  
  return worldState.invasions.data.map(invasion => {
    const progressPercent = Math.round((invasion.score / invasion.endScore) * 100);
    
    return {
      node: extractLocationFromNode(invasion.location),
      planet: extractPlanetFromNode(invasion.location),
      progress: progressPercent,
      attackerReward: formatRewards(invasion.rewardsAttacker),
      defenderReward: formatRewards(invasion.rewardsDefender)
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
  if (rewards.credits) {
    items.push(`${rewards.credits} credits`);
  }
  if (rewards.items && rewards.items.length > 0) {
    items.push(rewards.items.map(item => item.name).join(', '));
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
 * Processes season/challenge data (Nightwave equivalent) from Tenno Tools API
 * @param {Object} worldState - Full world state data from API
 * @returns {Object} Processed nightwave data
 */
export const processNightwave = (worldState) => {
  if (!worldState || !worldState.challenges || !worldState.challenges.data || worldState.challenges.data.length === 0) {
    return {
      progress: 'No Active Season',
      progressPercent: 0,
      challenges: []
    };
  }
  
  const season = worldState.challenges.data[0];
  
  // Extract challenges and sort by daily/weekly
  const challenges = (season.challenges || []);
  const dailyChallenges = challenges
    .filter(challenge => challenge.daily)
    .map(challenge => ({
      name: challenge.description || 'Unknown Challenge',
      description: challenge.description || 'Complete this challenge to earn rewards',
      isElite: false,
      type: 'daily'
    }));
    
  const weeklyChallenges = challenges
    .filter(challenge => !challenge.daily)
    .map(challenge => ({
      name: challenge.description || 'Unknown Challenge',
      description: challenge.description || 'Complete this challenge to earn rewards',
      isElite: true,
      type: 'weekly'
    }));
  
  // Combine daily and weekly challenges, with daily first
  const sortedChallenges = [...dailyChallenges, ...weeklyChallenges];
  
  // Calculate progress based on season and phase
  const seasonNumber = season.season || 0;
  const phase = season.phase || 0;
  const progressPercent = Math.min(100, Math.round((phase + 1) * 20)); // Approximate progress
  
  return {
    progress: `Season ${seasonNumber} - Phase ${phase + 1}`,
    progressPercent,
    challenges: sortedChallenges
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
 * Processes void trader data from Tenno Tools API
 * @param {Object} worldState - Full world state data from API
 * @returns {Object} Processed void trader data
 */
export const processVoidTrader = (worldState) => {
  if (!worldState || !worldState.voidtraders || !worldState.voidtraders.data || worldState.voidtraders.data.length === 0) {
    return null;
  }
  
  const trader = worldState.voidtraders.data[0];
  const now = new Date();
  const activation = parseTimestamp(trader.start);
  const expiry = parseTimestamp(trader.end);
  const isActive = now >= activation && now <= expiry;
  
  return {
    character: trader.name || 'Baro\'Ki Teel',
    location: extractLocationFromNode(trader.location),
    active: isActive,
    activation,
    expiry,
    timeLeft: formatTimeRemaining(trader.end),
    inventory: trader.items?.map(item => ({
      name: item.name,
      ducats: item.ducats,
      credits: item.credits
    })) || []
  };
};

/**
 * Processes fissure data from Tenno Tools API
 * @param {Object} worldState - Full world state data from API
 * @param {string} [tierFilter='all'] - Optional filter for specific tier ('all', 'lith', 'meso', 'neo', 'axi', 'requiem', 'omnia', 'steelpath')
 * @returns {Array} Processed fissures data
 */
export const processFissures = (worldState, tierFilter = 'all') => {
  if (!worldState || !worldState.fissures || !worldState.fissures.data) {
    return [];
  }
  
  const fissures = worldState.fissures.data.map(fissure => ({
    tier: formatTierName(fissure.tier),
    type: getMissionTypeName(fissure.missionType),
    node: extractLocationFromNode(fissure.location),
    planet: extractPlanetFromNode(fissure.location),
    timeLeft: formatTimeRemaining(fissure.end)
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
 * Processes arbitration data from Tenno Tools API
 * @param {Object} worldState - Full world state data from API
 * @returns {Object} Processed arbitration data
 */
export const processArbitrations = (worldState) => {
  if (!worldState || !worldState.arbitrations || !worldState.arbitrations.data || worldState.arbitrations.data.length === 0) {
    return null;
  }
  
  const arbitration = worldState.arbitrations.data[0];
  
  return {
    type: getMissionTypeName(arbitration.missionType),
    location: extractLocationFromNode(arbitration.location),
    faction: arbitration.faction,
    timeLeft: formatTimeRemaining(arbitration.end),
    rewards: arbitration.rewards?.map(reward => ({
      name: reward.name,
      type: reward.type,
      chance: reward.chance
    })) || []
  };
};

/**
 * Processes void storm data from Tenno Tools API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed void storm data
 */
export const processVoidStorms = (worldState) => {
  if (!worldState || !worldState.voidstorms || !worldState.voidstorms.data) {
    return [];
  }
  
  return worldState.voidstorms.data.map(storm => ({
    location: extractLocationFromNode(storm.location),
    faction: storm.faction,
    missionType: getMissionTypeName(storm.missionType),
    tier: formatTierName(storm.tier),
    timeLeft: formatTimeRemaining(storm.end)
  }));
};

/**
 * Processes acolyte data from Tenno Tools API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed acolyte data
 */
export const processAcolytes = (worldState) => {
  if (!worldState || !worldState.acolytes || !worldState.acolytes.data) {
    return [];
  }
  
  return worldState.acolytes.data.map(acolyte => ({
    name: acolyte.name,
    health: Math.round(acolyte.health * 100),
    location: extractLocationFromNode(acolyte.location),
    discovered: acolyte.discovered,
    rewards: acolyte.rewards?.map(reward => ({
      name: reward.name,
      type: reward.type,
      chance: reward.chance
    })) || []
  }));
};

/**
 * Processes faction project data from Tenno Tools API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed faction project data
 */
export const processFactionProjects = (worldState) => {
  if (!worldState || !worldState.factionprojects || !worldState.factionprojects.data) {
    return [];
  }
  
  return worldState.factionprojects.data.map(project => ({
    type: project.type,
    progress: Math.round(project.progress * 100),
    location: extractLocationFromNode(project.id),
    rewards: project.rewards?.map(reward => ({
      name: reward.name,
      type: reward.type,
      count: reward.count || 1
    })) || []
  }));
};

/**
 * Processes Kuva siphon data from Tenno Tools API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed Kuva siphon data
 */
export const processKuvaSiphons = (worldState) => {
  if (!worldState || !worldState.kuvasiphons || !worldState.kuvasiphons.data) {
    return [];
  }
  
  return worldState.kuvasiphons.data.map(siphon => ({
    location: extractLocationFromNode(siphon.location),
    faction: siphon.faction,
    missionType: getMissionTypeName(siphon.missionType),
    tier: formatTierName(siphon.tier),
    isFlood: siphon.flood,
    timeLeft: formatTimeRemaining(siphon.end),
    rewards: siphon.rewards?.map(reward => ({
      name: reward.name,
      type: reward.type,
      chance: reward.chance
    })) || []
  }));
};

/**
 * Processes bounty data from Tenno Tools API
 * @param {Object} worldState - Full world state data from API
 * @returns {Array} Processed bounty data
 */
export const processBounties = (worldState) => {
  if (!worldState || !worldState.bounties || !worldState.bounties.data) {
    return [];
  }
  
  return worldState.bounties.data.map(bounty => ({
    syndicate: bounty.syndicate,
    location: extractLocationFromNode(bounty.id),
    jobs: bounty.jobs?.map((job, index) => ({
      id: index + 1,
      rewards: job.rewards?.map(reward => ({
        name: reward.name,
        type: reward.type,
        count: reward.count || 1
      })) || [],
      minLevel: job.minLevel || 0,
      maxLevel: job.maxLevel || 0
    })) || []
  }));
};

/**
 * Gets available relic tiers
 * @returns {Array} Array of available tiers
 */
export const getRelicTiers = () => {
  return ['all', 'Lith', 'Meso', 'Neo', 'Axi', 'Requiem', 'Omnia', 'Steel Path'];
};
