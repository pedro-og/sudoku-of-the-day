/**
 * Generates a unique two-word username from 5-letter words.
 * Example: "Storm Blade", "Frost Ember", "Swift Raven"
 */

const WORDS: string[] = [
  'Alpha', 'Arrow', 'Atlas', 'Blaze', 'Blade',
  'Brave', 'Cedar', 'Chase', 'Cloud', 'Coral',
  'Crash', 'Crown', 'Cyber', 'Delta', 'Dream',
  'Drift', 'Eagle', 'Ember', 'Fable', 'Flame',
  'Flash', 'Frost', 'Ghost', 'Grace', 'Grand',
  'Haven', 'Ivory', 'Jewel', 'Karma', 'Keyan',
  'Light', 'Lotus', 'Lucky', 'Maple', 'Mirth',
  'Mocha', 'Noble', 'North', 'Ocean', 'Onion',
  'Orbit', 'Panda', 'Pearl', 'Phase', 'Pixel',
  'Prism', 'Pulse', 'Queen', 'Quest', 'Quick',
  'Raven', 'Rider', 'River', 'Robin', 'Rocky',
  'Rouge', 'Roxan', 'Royal', 'Sable', 'Scout',
  'Shade', 'Sharp', 'Shore', 'Solar', 'Sonic',
  'Spark', 'Spice', 'Staff', 'Stark', 'Steam',
  'Steel', 'Stone', 'Storm', 'Sugar', 'Swift',
  'Terra', 'Thorn', 'Tidal', 'Tiger', 'Titan',
  'Topaz', 'Torch', 'Trace', 'Trail', 'Ultra',
  'Unity', 'Venom', 'Vigor', 'Vinyl', 'Viper',
  'Vista', 'Vivid', 'Volta', 'Whale', 'Whirl',
  'Wired', 'Xenon', 'Yield', 'Zebra',
];

export function generateUsername(): string {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  let a = pick();
  let b = pick();
  while (b === a) b = pick();
  return `${a} ${b}`;
}
