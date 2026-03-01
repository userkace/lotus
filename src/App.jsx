/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Clock,
  Shield,
  Zap,
  Target,
  Box,
  Sword,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Info,
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import {
  fetchWarframeData,
  processCycles,
  processFissures,
  processSortie,
  processInvasions,
  processNightwave,
  processVoidTrader,
  processDailyDeals,
  processArchonHunt,
  processArbitrations,
  processVoidStorms,
  processAcolytes,
  processBounties,
  processFactionProjects,
  processFlashSales,
  getRelicTiers,
  formatTimeRemaining,
  formatTimeAgo,
  formatTimeFromBase
} from './api/warframeService.js';

// Helper function for extracting location from node
const extractLocationFromNode = (node) => {
  if (!node) return 'Unknown';

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

// --- Types ---

/**
 * @typedef {Object} CycleData
 * @property {string} location
 * @property {string} state
 * @property {string} timeLeft
 */

/**
 * @typedef {Object} Mission
 * @property {string} id
 * @property {string} type
 * @property {string} modifier
 * @property {string} location
 */

/**
 * @typedef {Object} SortieData
 * @property {string} boss
 * @property {string} missionType
 * @property {string} timeLeft
 * @property {Mission[]} missions
 */

/**
 * @typedef {Object} Fissure
 * @property {string} tier
 * @property {string} type
 * @property {string} node
 * @property {string} planet
 * @property {string} timeLeft
 */

/**
 * @typedef {Object} Challenge
 * @property {string} name
 * @property {string} description
 * @property {boolean} [isElite]
 */

/**
 * @typedef {Object} Invasion
 * @property {string} node
 * @property {string} planet
 * @property {number} progress
 * @property {string} attackerReward
 * @property {string} defenderReward
 */

// --- Components ---

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {any} [props.icon]
 * @param {string} [props.className]
 */
const SectionHeader = ({ title, icon: Icon, className = "" }) => (
  <h2 className={`text-sm font-bold text-wf-primary uppercase tracking-widest flex items-center ${className}`}>
    <span className="w-2 h-2 bg-wf-primary mr-2"></span>
    {title}
  </h2>
);

/**
 * @typedef {Object} CardProps
 * @property {React.ReactNode} children
 * @property {string} [className]
 * @property {React.Key} [key]
 */

/**
 * @param {CardProps} props
 */
const Card = ({ children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-wf-surface border border-wf-border p-4 rounded-sm ${className}`}
  >
    {children}
  </motion.div>
);

export default function App() {
  const [time, setTime] = useState(new Date());
  const [warframeData, setWarframeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fissureFilter, setFissureFilter] = useState('all');
  const [steelPathFilter, setSteelPathFilter] = useState('all');
  const [voidStormFilter, setVoidStormFilter] = useState('all');
  const [expandedDaily, setExpandedDaily] = useState(false);
  const [expandedWeekly, setExpandedWeekly] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState(false);
  const [expandedFlashSales, setExpandedFlashSales] = useState(false);
  const [selectedSection, setSelectedSection] = useState('fissures'); // 'all', 'fissures', 'steelPath', 'voidStorms' NOTE: 'all' is no longer mapped to a button but can be used.
  const [sortieMode, setSortieMode] = useState('sortie'); // 'sortie' or 'archonHunt'
  const [platform, setPlatform] = useState('pc');
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);

  const platforms = [
    { value: 'pc', label: 'PC' },
    { value: 'ps4', label: 'PlayStation' },
    { value: 'xb1', label: 'Xbox' },
    { value: 'ns', label: 'Nintendo Switch' }
  ];

  const getPlatformLabel = (value) => {
    return platforms.find(p => p.value === value)?.label || 'PC';
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchWarframeData(platform);
        setWarframeData(data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Failed to fetch Warframe data:', err);
        setError('Failed to fetch Warframe data. Please try again later.');
        setWarframeData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [platform]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWarframeData(platform);
      setWarframeData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to refresh data. Please try again.');
      console.error('Refresh Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process data for display using new API structure
  const cycles = warframeData ? processCycles(warframeData) : [];

  // Update cycle times every second without re-rendering cards
  const [cycleTimes, setCycleTimes] = useState({});
  useEffect(() => {
    const timer = setInterval(() => {
      if (warframeData) {
        // Update cycle times
        const newCycleTimes = {};
        const processedCycles = processCycles(warframeData);
        processedCycles.forEach((cycle, index) => {
          newCycleTimes[index] = cycle.timeLeft;
        });
        setCycleTimes(newCycleTimes);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [warframeData]);

  const sortie = warframeData ? processSortie(warframeData) : null;
  const archonHunt = warframeData ? processArchonHunt(warframeData) : null;
  const fissures = warframeData ? processFissures(warframeData, fissureFilter) : [];
  const steelPathFissures = warframeData ? processFissures(warframeData, steelPathFilter, true) : [];
  const invasions = warframeData ? processInvasions(warframeData) : [];
  const nightwave = warframeData ? processNightwave(warframeData) : null;
  const voidTrader = warframeData ? processVoidTrader(warframeData) : null;
  const dailyDeals = warframeData ? processDailyDeals(warframeData) : [];
  const events = warframeData?.news || [];
  const flashSales = warframeData ? processFlashSales(warframeData) : [];
  const alerts = warframeData?.alerts || [];
  const arbitrations = warframeData ? processArbitrations(warframeData) : null;
  const voidStorms = warframeData ? processVoidStorms(warframeData, voidStormFilter) : [];
  const acolytes = warframeData ? processAcolytes(warframeData) : [];
  const bounties = warframeData ? processBounties(warframeData) : [];
  const factionProjects = warframeData ? processFactionProjects(warframeData) : [];

  if (error && !warframeData) {
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-wf-primary mb-2">Connection Error</h1>
          <p className="text-wf-text-muted mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-wf-primary text-black px-6 py-2 rounded font-semibold hover:bg-opacity-80 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-wf-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-wf-primary">LOTUS_LINK</h1>
          <p className="text-wf-text-muted text-sm mt-1 uppercase tracking-widest">Origin System Real-time Feed</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 cursor-pointer text-wf-primary hover:text-wf-text transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
            {lastUpdated && (
              <div className="text-xs text-wf-text-muted mt-1">
                Last: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="relative">
              <button
                onClick={() => setPlatformDropdownOpen(!platformDropdownOpen)}
                className="bg-wf-surface border border-wf-border text-sm font-semibold px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-wf-primary/50 focus:border-wf-primary cursor-pointer hover:border-wf-primary/50 transition-all duration-200 min-w-[180px] flex items-center justify-between"
              >
                <span>{getPlatformLabel(platform)}</span>
                <ChevronDown className={`w-4 h-4 text-wf-primary transition-transform duration-200 ${platformDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {platformDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-wf-surface border border-wf-border rounded-lg shadow-lg z-50 overflow-hidden">
                  {platforms.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => {
                        setPlatform(p.value);
                        setPlatformDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 cursor-pointer text-sm font-semibold transition-colors duration-150 ${
                        p.value === platform
                          ? 'bg-wf-primary text-black'
                          : 'text-wf-primary hover:bg-wf-border'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Events */}
      <section>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <SectionHeader title="Events" />
          <div className="flex gap-2">
            {events.length > 3 && (
              <button
                onClick={() => setExpandedEvents(!expandedEvents)}
                className={`flex items-center justify-center px-3 py-1 cursor-pointer text-xs font-semibold rounded transition-colors ${
                  expandedEvents
                    ? 'bg-wf-primary/90 text-black'
                    : 'bg-wf-border/70 text-wf-text-muted hover:bg-wf-border hover:text-wf-primary'
                }`}
              >
                {expandedEvents ? 'Show Less' : `View All`}
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-3">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-wf-border rounded w-3/4"></div>
                  <div className="h-3 bg-wf-border rounded w-1/2"></div>
                  <div className="h-3 bg-wf-border rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...events].reverse().slice(0, expandedEvents ? undefined : 3).map((event, i) => (
              <Card key={event.id || i} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {event.message || 'Event'}
                    </p>
                    <p className="text-xs text-wf-text-muted mt-1">
                      {event.date ? (
                        <>
                          Posted: {formatTimeAgo(event.date)}
                        </>
                      ) : (
                        <>
                          Recent News
                        </>
                      )}
                    </p>
                    {event.link && (
                      <a
                        href={event.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-wf-primary hover:underline block mt-1 truncate"
                      >
                        Read More →
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-3">
            <p className="text-wf-text-muted text-center">No active events</p>
          </Card>
        )}
      </section>

      {/* World Cycles */}
      <section>
        <SectionHeader title="World Cycles" className='mb-4' />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <div className="animate-pulse">
                <div className="h-3 bg-wf-border rounded mb-2 w-3/4"></div>
                <div className="flex justify-between">
                  <div className="h-6 bg-wf-border rounded w-1/2"></div>
                  <div className="h-4 bg-wf-border rounded w-1/4"></div>
                </div>
              </div>
            </Card>
          ))
        ) : cycles.length > 0 ? (
          cycles.map((cycle, i) => (
            <Card key={i}>
              <h3 className="text-xs font-semibold text-wf-text-muted uppercase mb-2">{cycle.location}</h3>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{cycle.state}</span>
                <span className="text-wf-primary text-sm font-mono">{cycleTimes[i] || cycle.timeLeft}</span>
              </div>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-3">
            <p className="text-wf-text-muted text-center">No cycle data available</p>
          </Card>
        )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-8">

          {/* Active Invasions */}
          <section>
            <SectionHeader title="Active Invasions" className='mb-4' />
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-wf-border rounded w-2/3"></div>
                      <div className="h-3 bg-wf-border rounded w-1/2"></div>
                      <div className="h-3 bg-wf-border rounded w-1/4"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : invasions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invasions.map((inv, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-bold">{inv.node}</p>
                      </div>
                      <span className="text-wf-primary font-mono text-xs">{inv.progress}%</span>
                    </div>
                    <div className="space-y-2">
                      <div className={`text-xs p-2 rounded ${inv.progress > 0 ? 'bg-wf-primary/20' : 'bg-wf-border/50'}`}>
                        <div className="font-semibold">{inv.factionAttacker}</div>
                        <div className="text-wf-text-muted">{inv.attackerReward}</div>
                      </div>
                      <div className="text-xs text-center text-wf-text-muted">vs</div>
                      <div className={`text-xs p-2 rounded ${inv.progress <= 0 ? 'bg-wf-primary/20' : 'bg-wf-border/50'}`}>
                        <div className="font-semibold">{inv.factionDefender}</div>
                        <div className="text-wf-text-muted">{inv.defenderReward}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6">
                <p className="text-wf-text-muted text-center">No active invasions</p>
              </Card>
            )}
          </section>

          {/* Section Selector */}
          <section className="mt-8">
            <div className="flex justify-center gap-2 mb-4">

              <button
                onClick={() => setSelectedSection('fissures')}
                className={`px-3 py-1 cursor-pointer text-xs font-semibold rounded transition-colors ${
                  selectedSection === 'fissures'
                    ? 'bg-wf-primary text-black'
                    : 'bg-wf-border text-wf-text-muted hover:bg-wf-surface'
                }`}
              >
                Void Fissures
              </button>
              <button
                onClick={() => setSelectedSection('steelPath')}
                className={`px-3 py-1 cursor-pointer text-xs font-semibold rounded transition-colors ${
                  selectedSection === 'steelPath'
                    ? 'bg-wf-primary text-black'
                    : 'bg-wf-border text-wf-text-muted hover:bg-wf-surface'
                }`}
              >
                Steel Path Fissures
              </button>
              <button
                onClick={() => setSelectedSection('voidStorms')}
                className={`px-3 py-1 cursor-pointer text-xs font-semibold rounded transition-colors ${
                  selectedSection === 'voidStorms'
                    ? 'bg-wf-primary text-black'
                    : 'bg-wf-border text-wf-text-muted hover:bg-wf-surface'
                }`}
              >
                Void Storms
              </button>
            </div>
          </section>

          {/* Void Fissures */}
          {(selectedSection === 'all' || selectedSection === 'fissures') && (
          <section>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <SectionHeader title="Void Fissures" />
              <div className="flex gap-2">
                {getRelicTiers().map(tier => (
                  <button
                    key={tier}
                    onClick={() => setFissureFilter(tier)}
                    className={`px-3 py-1 cursor-pointer text-xs font-semibold rounded transition-colors ${fissureFilter === tier
                        ? 'bg-wf-primary text-black'
                        : 'bg-wf-border text-wf-text-muted hover:bg-wf-surface'
                      }`}
                  >
                    {tier === 'all' ? 'All' : tier}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-wf-border rounded w-2/3"></div>
                      <div className="h-3 bg-wf-border rounded w-1/2"></div>
                      <div className="h-3 bg-wf-border rounded w-1/4"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : fissures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fissures.map((f, i) => (
                  <Card key={i} className="flex justify-between items-center p-4">
                    <div>
                      <p className="text-sm font-bold">{f.tier} <span className="text-wf-text-muted text-xs">&nbsp;•&nbsp;</span> {f.type}</p>
                      <p className="text-xs text-wf-text-muted">{f.node} ({f.faction})</p>
                    </div>
                    <span className="text-wf-primary font-mono text-xs">{f.timeLeft}</span>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6">
                <p className="text-wf-text-muted text-center">No fissures available</p>
              </Card>
            )}
          </section>
          )}

          {/* Steel Path Fissures */}
          {(selectedSection === 'all' || selectedSection === 'steelPath') && (
          <section>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <SectionHeader title="Steel Path Fissures" />
              <div className="flex gap-2">
                {getRelicTiers().map(tier => (
                  <button
                    key={tier}
                    onClick={() => setSteelPathFilter(tier)}
                    className={`px-3 py-1 cursor-pointer text-xs font-semibold rounded transition-colors ${steelPathFilter === tier
                        ? 'bg-wf-primary text-black'
                        : 'bg-wf-border text-wf-text-muted hover:bg-wf-surface'
                      }`}
                  >
                    {tier === 'all' ? 'All' : tier}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-wf-border rounded w-2/3"></div>
                      <div className="h-3 bg-wf-border rounded w-1/2"></div>
                      <div className="h-3 bg-wf-border rounded w-1/4"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : steelPathFissures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {steelPathFissures.map((f, i) => (
                  <Card key={i} className="flex justify-between items-center p-4">
                    <div>
                      <p className="text-sm font-bold">{f.tier} <span className="text-wf-text-muted text-xs">&nbsp;•&nbsp;</span> {f.type}</p>
                      <p className="text-xs text-wf-text-muted">{f.node} ({f.faction})</p>
                    </div>
                    <span className="text-wf-primary font-mono text-xs">{f.timeLeft}</span>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6">
                <p className="text-wf-text-muted text-center">No Steel Path fissures available</p>
              </Card>
            )}
          </section>
          )}

          {/* Void Storms */}
          {(selectedSection === 'all' || selectedSection === 'voidStorms') && (
          <section>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <SectionHeader title="Void Storms" />
              <div className="flex gap-2">
                {['all', 'Lith', 'Meso', 'Neo', 'Axi', 'Grineer', 'Corpus'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setVoidStormFilter(filter)}
                    className={`px-3 py-1 cursor-pointer text-xs font-semibold rounded transition-colors ${voidStormFilter === filter
                        ? 'bg-wf-primary text-black'
                        : 'bg-wf-border text-wf-text-muted hover:bg-wf-surface'
                      }`}
                  >
                    {filter === 'all' ? 'All' : filter}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-wf-border rounded w-2/3"></div>
                      <div className="h-3 bg-wf-border rounded w-1/2"></div>
                      <div className="h-3 bg-wf-border rounded w-1/4"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : voidStorms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {voidStorms.map((storm, i) => (
                  <Card key={i} className="flex justify-between items-center p-4">
                    <div>
                      <p className="text-sm font-bold">{storm.tier} <span className="text-wf-text-muted text-xs">&nbsp;•&nbsp;</span> {storm.missionType}</p>
                      <p className="text-xs text-wf-text-muted">{storm.location} ({storm.faction})</p>
                    </div>
                    <span className="text-wf-primary font-mono text-xs">{storm.timeLeft}</span>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-3">
                <p className="text-wf-text-muted text-center">No Void Storms active</p>
              </Card>
            )}
          </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Alerts */}
          <section>
            <SectionHeader title="Alerts" className='mb-4' />
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="p-3">
                    <div className="animate-pulse space-y-2">
                      <div className="h-3 bg-wf-border rounded w-2/3"></div>
                      <div className="h-2 bg-wf-border rounded w-1/2"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <Card key={i} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-wf-text-muted">{alert.mission?.node || 'Unknown'}</span>
                      <span className="text-sm font-mono text-wf-primary">
                        {formatTimeRemaining(alert.expiry)}
                      </span>
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold">{alert.mission?.description || 'Alert Mission'}</p>
                      <p className="text-wf-text-muted">{alert.mission?.type || 'Unknown'} • {alert.mission?.faction || 'Unknown'}</p>
                      {alert.mission?.reward?.credits && (
                        <p className="text-wf-primary">{alert.mission.reward.credits} credits</p>
                      )}
                      {alert.mission?.reward?.items && alert.mission.reward.items.length > 0 && (
                        <p className="text-wf-text-muted">
                          {alert.mission.reward.items.join(', ')}
                        </p>
                      )}
                      {alert.mission?.reward?.countedItems && alert.mission.reward.countedItems.length > 0 && (
                        <p className="text-wf-text-muted">
                          {alert.mission.reward.countedItems.map(item => `${item.count}x ${item.type}`).join(', ')}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-3">
                <p className="text-wf-text-muted text-center">No active alerts</p>
              </Card>
            )}
          </section>

          {/* Sortie / Archon Hunt */}
          <section>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <SectionHeader title={sortieMode === 'sortie' ? 'Sortie' : 'Archon'} />
              <div className="flex gap-2">
                <button
                  onClick={() => setSortieMode('sortie')}
                  className={`px-3 py-1 cursor-pointer text-xs font-semibold rounded transition-colors ${
                    sortieMode === 'sortie'
                      ? 'bg-wf-primary text-black'
                      : 'bg-wf-border text-wf-text-muted hover:bg-wf-surface'
                  }`}
                >
                  Sortie
                </button>
                <button
                  onClick={() => setSortieMode('archonHunt')}
                  className={`px-3 py-1 cursor-pointer text-xs font-semibold rounded transition-colors ${
                    sortieMode === 'archonHunt'
                      ? 'bg-wf-primary text-black'
                      : 'bg-wf-border text-wf-text-muted hover:bg-wf-surface'
                  }`}
                >
                  Archon Hunt
                </button>
              </div>
            </div>
            {loading ? (
              <Card className="p-5">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-wf-border rounded w-1/3"></div>
                  <div className="h-4 bg-wf-border rounded w-1/4"></div>
                  <div className="space-y-2 pt-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-12 bg-wf-border rounded"></div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : (sortieMode === 'sortie' ? sortie : archonHunt) ? (
              <Card className="p-5">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-sm text-white uppercase font-bold">
                    {sortieMode === 'sortie' ? sortie.boss : archonHunt.boss}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-wf-primary font-semibold font-mono">
                      Ends: {sortieMode === 'sortie' ? sortie.timeLeft : archonHunt.timeLeft}
                    </p>
                  </div>
                </div>
                <div className="space-y-6">
                  {(sortieMode === 'sortie' ? sortie.missions : archonHunt.missions).map((m) => (
                    <div key={m.id} className="border-l-2 border-wf-border pl-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{m.type}</p>
                          <p className="text-xs text-wf-text-muted italic">
                            {sortieMode === 'sortie' ? m.modifier : m.modifier}
                          </p>
                          <p className="text-xs text-wf-text-muted">
                            {sortieMode === 'sortie' ? m.location : m.node}
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          <span className="text-xs text-wf-text-muted font-mono">{m.id}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-5">
                <p className="text-wf-text-muted text-center">
                  No {sortieMode === 'sortie' ? 'sortie' : 'archon hunt'} data available
                </p>
              </Card>
            )}
          </section>

          {/* Nightwave */}
          <section>
            <SectionHeader title="Nightwave" className='mb-4' />
            {loading ? (
              <Card className="p-5">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-wf-border rounded w-1/3"></div>
                  <div className="h-2 bg-wf-border rounded w-full"></div>
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-8 bg-wf-border rounded"></div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : nightwave ? (
              <Card className="p-5">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-sm text-white uppercase font-bold">Season {nightwave.season}</span>
                  <div className="text-right">
                    <p className="text-xs text-wf-primary font-semibold font-mono">Ends: {nightwave.expiry}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {/* Daily Challenges */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] text-wf-text-muted uppercase font-bold tracking-widest">Daily Acts</p>
                      <p className="text-xs text-wf-text-muted">{nightwave.challenges.filter(c => c.type === 'daily').length} active</p>
                    </div>
                    {nightwave.challenges.filter(c => c.type === 'daily').length > 0 ? (
                      <div className="space-y-3 mt-3">
                        {nightwave.challenges.filter(c => c.type === 'daily').slice(0, expandedDaily ? undefined : 1).map((c, i) => (
                          <div key={i} className="border-l-2 border-wf-border pl-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-semibold">{c.name}</p>
                                <p className="text-xs text-wf-text-muted">{c.description}</p>
                              </div>
                              <div className="text-right ml-3">
                                <div className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-wf-primary" />
                                  <span className="text-xs font-semibold text-wf-primary">{c.reputation}</span>
                                </div>
                                <p className="text-xs text-wf-text-muted font-mono">{c.expiry}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {nightwave.challenges.filter(c => c.type === 'daily').length > 1 && (
                          <button
                            onClick={() => setExpandedDaily(!expandedDaily)}
                            className={`flex items-center justify-center px-3 py-1 cursor-pointer text-xs font-semibold rounded transition-colors mt-2 ${
                              expandedDaily
                                ? 'bg-wf-primary/90 text-black'
                                : 'bg-wf-border/70 text-wf-text-muted hover:bg-wf-border hover:text-wf-primary'
                            }`}
                          >
                            {expandedDaily ? 'View Less' : `View More • ${nightwave.challenges.filter(c => c.type === 'daily').length - 1}`}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3">
                        <p className="text-xs text-wf-text-muted italic">No daily acts available</p>
                      </div>
                    )}
                  </div>

                  {/* Weekly Challenges */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] text-wf-text-muted uppercase font-bold tracking-widest">Weekly Acts</p>
                      <div className="text-right">
                        <p className="text-xs text-wf-text-muted">{nightwave.challenges.filter(c => c.type === 'weekly').length} active</p>
                        <p className="text-xs text-wf-primary font-semibold font-mono">{nightwave.challenges.filter(c => c.type === 'weekly')[0]?.expiry || 'No timer'}</p>
                      </div>
                    </div>
                    {nightwave.challenges.filter(c => c.type === 'weekly').length > 0 ? (
                      <div className="space-y-3 mt-3">
                        {nightwave.challenges.filter(c => c.type === 'weekly').slice(0, expandedWeekly ? undefined : 1).map((c, i) => (
                          <div key={i} className="border-l-2 border-wf-border pl-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-semibold">{c.name}</p>
                                <p className="text-xs text-wf-text-muted">{c.description}</p>
                              </div>
                              <div className="text-right ml-3">
                                <div className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-wf-primary" />
                                  <span className="text-xs font-semibold text-wf-primary">{c.reputation}</span>
                                </div>
                                {c.isElite && <p className="text-xs text-wf-accent">Elite</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                        {nightwave.challenges.filter(c => c.type === 'weekly').length > 1 && (
                          <button
                            onClick={() => setExpandedWeekly(!expandedWeekly)}
                            className={`flex items-center justify-center px-3 py-1 cursor-pointer text-xs font-semibold rounded transition-colors mt-2 ${
                              expandedWeekly
                                ? 'bg-wf-primary/90 text-black'
                                : 'bg-wf-border/70 text-wf-text-muted hover:bg-wf-border hover:text-wf-primary'
                            }`}
                          >
                            {expandedWeekly ? 'View Less' : `View More • ${nightwave.challenges.filter(c => c.type === 'weekly').length - 1}`}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3">
                        <p className="text-xs text-wf-text-muted italic">No weekly acts available</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-5">
                <p className="text-wf-text-muted text-center">No Nightwave data available</p>
              </Card>
            )}
          </section>

          {/* Faction Projects */}
          <section>
            <SectionHeader title="Faction Construction" className='mb-4' />
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="p-3">
                    <div className="animate-pulse space-y-2">
                      <div className="h-3 bg-wf-border rounded w-2/3"></div>
                      <div className="h-2 bg-wf-border rounded w-1/2"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : factionProjects.length > 0 ? (
              <div className="space-y-3">
                {factionProjects.map((project, i) => (
                  <Card key={i} className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm text-white">
                        {project.type} <span className="text-xs text-wf-text-muted">({project.faction})</span>
                      </div>
                      <div className="text-xs text-wf-text-muted">{project.timeRemaining}</div>
                    </div>
                    {/* Progress Graph */}
                    {project.progressHistory && project.progressHistory.length > 2 && (
                      <div className="mt-3 relative">
                        <div className="absolute top-2 left-2 flex items-center gap-2 text-xs font-bold text-wf-primary z-20">
                          {project.progress}%
                          {project.progress < 100 && (
                            <div className="relative w-2 h-2 flex items-center justify-center">
                              <div className="absolute w-1.5 h-1.5 bg-wf-primary rounded-full"></div>
                              <div className="absolute w-1.5 h-1.5 bg-wf-primary rounded-full animate-ping"></div>
                            </div>
                          )}
                        </div>
                        <div className="h-16 bg-wf-bg rounded p-2 relative overflow-visible">
                          <div className="absolute inset-0 flex items-end justify-between px-2 pb-1">
                            {project.progressHistory.slice(0, -1).map((point, index) => {
                              const height = (point[1] / 100) * 100; // percentage to height
                              const baseTime = project.progressHistory[0][0]; // First data point as base
                              return (
                                <div
                                  key={index}
                                  className="bg-wf-primary w-1 rounded-t hover:bg-wf-primary/80 transition-colors relative group"
                                  style={{ height: `${height}%` }}
                                >
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                                    <div>{point[1].toFixed(2)}%</div>
                                    <div className="text-wf-text-muted text-[10px]">{formatTimeFromBase(point[0], baseTime)}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    {project.rewards.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {project.rewards.slice(0, 2).map((reward, rewardIndex) => (
                          <span key={rewardIndex} className="text-xs bg-wf-border px-2 py-1 rounded">
                            {reward.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-3">
                <p className="text-wf-text-muted text-center">No faction projects active</p>
              </Card>
            )}
          </section>

          
          {/* Daily Deals */}
          <section>
            <SectionHeader title="Darvo's Deal" className='mb-4' />
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="p-3">
                    <div className="animate-pulse space-y-2">
                      <div className="h-3 bg-wf-border rounded w-2/3"></div>
                      <div className="h-2 bg-wf-border rounded w-1/2"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : dailyDeals.length > 0 ? (
              <div className="space-y-3">
                {dailyDeals.map((deal, i) => (
                  <Card key={i} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold">{deal.item}</p>
                        <p className="text-xs text-wf-text-muted">{deal.amountTotal - deal.amountSold}/{deal.amountTotal} remaining</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-wf-primary">
                          {deal.discount}% OFF
                        </p>
                        <p className="text-xs">
                          <span className="line-through text-wf-text-muted">{deal.originalPrice}</span>
                          <span className="text-wf-primary ml-1">{deal.salePrice}</span>
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-wf-bg h-1.5 rounded-full relative group cursor-pointer">
                      <div
                        className="bg-wf-primary h-full transition-all duration-200 rounded-full"
                        style={{ width: `${((deal.amountTotal - deal.amountSold) / deal.amountTotal) * 100}%` }}
                      />
                      <div 
                        className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                        style={{ 
                          left: `${Math.min(((deal.amountTotal - deal.amountSold) / deal.amountTotal) * 100, 85)}%`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <span className="text-xs font-semibold text-wf-primary px-2 py-1 rounded shadow-lg whitespace-nowrap" style={{ backgroundColor: '#262627' }}>
                          {deal.amountSold} sold
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-3">
                <p className="text-wf-text-muted text-center">No daily deals available</p>
              </Card>
            )}
          </section>

          {/* Baro Ki'Teer */}
          <section>
            <SectionHeader title="Void Trader" className='mb-4' />
            {loading ? (
              <Card className="p-5">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-wf-border rounded w-1/3"></div>
                  <div className="h-2 bg-wf-border rounded w-full"></div>
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-8 bg-wf-border rounded"></div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : voidTrader ? (
              <Card className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{voidTrader.character}</h3>
                    <p className="text-wf-text-muted text-xs uppercase">{voidTrader.location}</p>
                  </div>
                  <div className="text-right">
                    {voidTrader.active ? (
                      <p className="text-sm font-mono text-wf-primary">
                        Leaves in: {voidTrader.timeLeft}
                      </p>
                    ) : (
                      <p className="text-sm font-mono text-wf-text-muted">
                        Arrives in: {voidTrader.timeLeft}
                      </p>
                    )}
                  </div>
                </div>
                {voidTrader.active && voidTrader.inventory && voidTrader.inventory.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-wf-text-muted uppercase font-bold tracking-widest">Current Inventory</p>
                    <div className="grid grid-cols-2 gap-2">
                      {voidTrader.inventory.slice(0, 4).map((item, i) => (
                        <div key={i} className="text-xs">
                          <p className="font-semibold truncate">{item.name}</p>
                          <p className="text-wf-primary">{item.ducats} ducats</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-5">
                <p className="text-wf-text-muted text-center">No Void Trader data available</p>
              </Card>
            )}
          </section>

          {/* Arbitrations */}
          <section>
            <SectionHeader title="Arbitrations" className='mb-4' />
            {loading ? (
              <Card className="p-5">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-wf-border rounded w-1/3"></div>
                  <div className="h-2 bg-wf-border rounded w-full"></div>
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-8 bg-wf-border rounded"></div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : arbitrations ? (
              <Card className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{arbitrations.type}</h3>
                    <p className="text-wf-text-muted text-xs uppercase">{arbitrations.faction}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-wf-primary">
                      Ends in: {arbitrations.timeLeft}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-wf-text-muted uppercase font-bold tracking-widest">Location</p>
                  <p className="text-sm">{arbitrations.location}</p>
                  {arbitrations.rewards.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-wf-text-muted uppercase font-bold tracking-widest">Possible Rewards</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {arbitrations.rewards.slice(0, 4).map((reward, i) => (
                          <div key={i} className="text-xs">
                            <p className="font-semibold truncate">{reward.name}</p>
                            <p className="text-wf-primary">{Math.round(reward.chance * 100)}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-5">
                <p className="text-wf-text-muted text-center">No Arbitration available</p>
              </Card>
            )}
          </section>

          {/* Acolytes */}
          <section>
            <SectionHeader title="Acolytes" className='mb-4' />
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="p-3">
                    <div className="animate-pulse space-y-2">
                      <div className="h-3 bg-wf-border rounded w-2/3"></div>
                      <div className="h-2 bg-wf-border rounded w-1/2"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : acolytes.length > 0 ? (
              <div className="space-y-3">
                {acolytes.map((acolyte, i) => (
                  <Card key={i} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-semibold">{acolyte.name}</p>
                        <p className="text-xs text-wf-text-muted">{acolyte.location}</p>
                        <p className="text-xs text-wf-primary">{acolyte.discovered ? 'Discovered' : 'Hidden'}</p>
                      </div>
                      <div className="text-right">
                        <div className="w-16 bg-wf-bg h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-wf-primary h-full"
                            style={{ width: `${acolyte.health}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-wf-primary mt-1">{acolyte.health}%</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-3">
                <p className="text-wf-text-muted text-center">No Acolytes active</p>
              </Card>
            )}
          </section>


        </aside>
      </div>

      {/* Flash Sales - Full Width Section */}
      <section className="mt-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <SectionHeader title="Flash Sales" />
          <div className="flex gap-2">
            {flashSales.length > 12 && (
              <button
                onClick={() => setExpandedFlashSales(!expandedFlashSales)}
                className={`flex items-center justify-center px-3 py-1 cursor-pointer text-xs font-semibold rounded transition-colors ${
                  expandedFlashSales
                    ? 'bg-wf-primary/90 text-black'
                    : 'bg-wf-border/70 text-wf-text-muted hover:bg-wf-border hover:text-wf-primary'
                }`}
              >
                {expandedFlashSales ? 'Show Less' : `View All (${flashSales.length})`}
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-3">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-wf-border rounded w-3/4"></div>
                  <div className="h-3 bg-wf-border rounded w-1/2"></div>
                  <div className="h-3 bg-wf-border rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : flashSales.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashSales.slice(0, expandedFlashSales ? undefined : 12).map((sale, i) => (
              <Card key={sale.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {sale.message || 'Flash Sale'}
                    </p>
                    <p className="text-xs text-wf-text-muted mt-1">
                      {formatTimeRemaining(sale.expiry)}
                      {sale.discount && (
                        <span className="text-wf-primary ml-1">({sale.discount}% off)</span>
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6">
            <p className="text-wf-text-muted text-center">No flash sales available</p>
          </Card>
        )}
      </section>

      {/* Bounties - Full Width Section */}
      <section className="mt-8">
        <SectionHeader title="Bounties" className='mb-4' />
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-wf-border rounded w-1/4 mb-3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Card key={j} className="p-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-3 bg-wf-border rounded w-2/3"></div>
                        <div className="h-2 bg-wf-border rounded w-1/2"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : bounties.length > 0 ? (
          <div className="space-y-6">
            {bounties.map((bounty, i) => (
              <div key={i}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-lg font-bold">{bounty.syndicate}</h3>
                  <span className="text-wf-text-muted text-sm">{bounty.location}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bounty.jobs.map((job, jobIndex) => (
                    <Card key={jobIndex} className="p-3">
                      {job.title !== `Job ${job.id}` && (
                        <div className="mb-2">
                          <h4 className="text-sm font-semibold">{job.title}</h4>
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs bg-wf-border px-2 py-1 rounded">
                          Level {job.minLevel}-{job.maxLevel}
                        </span>
                        {job.rotation && (
                          <span className="text-xs bg-wf-primary/20 px-2 py-1 rounded">
                            Rotation {job.rotation}
                          </span>
                        )}
                      </div>
                      {job.xpAmounts.length > 0 && (
                        <div className="text-xs text-wf-text-muted mb-1">
                          +{job.xpAmounts[0]} XP
                        </div>
                      )}
                      {job.rewards.length > 0 && (
                        <div className="space-y-1">
                          {job.rewards.slice(0, 3).map((reward, rewardIndex) => (
                            <div key={rewardIndex} className="text-xs text-wf-text-muted flex justify-between">
                              <span>{reward.name} {reward.count > 1 && `x${reward.count}`}</span>
                              {reward.chance > 0 && (
                                <span className="text-wf-primary">{Math.round(reward.chance * 100)}%</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-6">
            <p className="text-wf-text-muted text-center">No bounties available</p>
          </Card>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-wf-border text-center">
        <p className="text-xs text-wf-text-muted uppercase tracking-widest">
          Data synchronized with Origin System
        </p>
        <a
          href="https://github.com/userkace"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-xs text-wf-text-muted uppercase tracking-widest transition-colors hover:text-wf-primary"
          style={{ fontFamily: 'orokin' }}
        >
          userkace
        </a>
      </footer>
    </div>
  );
}
