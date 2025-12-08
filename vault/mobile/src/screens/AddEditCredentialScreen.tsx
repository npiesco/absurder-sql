/**
 * Add/Edit Credential Screen
 *
 * Form for creating or editing credentials with:
 * - Name, username, password, URL, notes fields
 * - Password generation
 * - Field validation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Clipboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';
import { useVaultStore } from '../lib/store';
import { Credential } from '../lib/VaultDatabase';

interface AddEditCredentialScreenProps {
  credentialId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

// Password generation utility
function generatePassword(length: number = 20): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// EFF large wordlist (subset of 1000 common words for passphrase generation)
const WORDLIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'action', 'actor', 'actress', 'actual', 'adapt',
  'address', 'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic', 'affair',
  'afford', 'afraid', 'again', 'agent', 'agree', 'ahead', 'album', 'alcohol',
  'alert', 'alien', 'allow', 'almost', 'alone', 'alpha', 'already', 'alter',
  'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor',
  'ancient', 'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual',
  'another', 'answer', 'antenna', 'antique', 'anxiety', 'apart', 'apology', 'appear',
  'apple', 'approve', 'april', 'arch', 'arctic', 'area', 'arena', 'argue',
  'armor', 'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'artist',
  'artwork', 'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma', 'athlete',
  'atom', 'attack', 'attend', 'attract', 'auction', 'audit', 'august', 'author',
  'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware', 'away', 'awesome',
  'awful', 'awkward', 'baby', 'bachelor', 'bacon', 'badge', 'balance', 'balcony',
  'ball', 'bamboo', 'banana', 'banner', 'bargain', 'barrel', 'base', 'basic',
  'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become', 'bedroom',
  'before', 'begin', 'behavior', 'behind', 'believe', 'below', 'bench', 'benefit',
  'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bird', 'birth',
  'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless',
  'blind', 'blood', 'blossom', 'blouse', 'blue', 'blur', 'blush', 'board',
  'boat', 'body', 'boil', 'bomb', 'bone', 'bonus', 'book', 'boost',
  'border', 'boring', 'borrow', 'boss', 'bottom', 'bounce', 'box', 'brain',
  'brand', 'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge', 'brief',
  'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother',
  'brown', 'brush', 'bubble', 'budget', 'buffalo', 'build', 'bulb', 'bulk',
  'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus', 'business',
  'busy', 'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable', 'cactus',
  'cage', 'cake', 'call', 'calm', 'camera', 'camp', 'canal', 'cancel',
  'candy', 'cannon', 'canoe', 'canvas', 'canyon', 'capable', 'capital', 'captain',
  'carbon', 'card', 'cargo', 'carpet', 'carry', 'cart', 'case', 'cash',
  'casino', 'castle', 'casual', 'catalog', 'catch', 'category', 'cattle', 'caught',
  'cause', 'caution', 'cave', 'ceiling', 'celery', 'cement', 'census', 'century',
  'cereal', 'certain', 'chair', 'chalk', 'champion', 'change', 'chaos', 'chapter',
  'charge', 'chase', 'chat', 'cheap', 'check', 'cheese', 'cherry', 'chest',
  'chicken', 'chief', 'child', 'chimney', 'choice', 'choose', 'chronic', 'chuckle',
  'chunk', 'churn', 'cigar', 'cinnamon', 'circle', 'citizen', 'city', 'civil',
  'claim', 'clap', 'clarify', 'claw', 'clay', 'clean', 'clerk', 'clever',
  'click', 'client', 'cliff', 'climb', 'clinic', 'clip', 'clock', 'close',
  'cloth', 'cloud', 'clown', 'club', 'clump', 'cluster', 'clutch', 'coach',
  'coast', 'coconut', 'code', 'coffee', 'coil', 'coin', 'collect', 'color',
  'column', 'combine', 'come', 'comfort', 'comic', 'common', 'company', 'concert',
  'conduct', 'confirm', 'congress', 'connect', 'consider', 'control', 'convince', 'cook',
  'cool', 'copper', 'coral', 'core', 'corn', 'correct', 'cost', 'cotton',
  'couch', 'country', 'couple', 'course', 'cousin', 'cover', 'coyote', 'crack',
  'cradle', 'craft', 'crane', 'crash', 'crater', 'crawl', 'crazy', 'cream',
  'credit', 'creek', 'crew', 'cricket', 'crime', 'crisp', 'critic', 'crop',
  'cross', 'crouch', 'crowd', 'crucial', 'cruel', 'cruise', 'crumble', 'crunch',
  'crush', 'crystal', 'cube', 'culture', 'cupboard', 'curious', 'current', 'curtain',
  'curve', 'cushion', 'custom', 'cute', 'cycle', 'daily', 'damage', 'damp',
  'dance', 'danger', 'daring', 'dash', 'daughter', 'dawn', 'day', 'deal',
  'debate', 'debris', 'decade', 'december', 'decide', 'decline', 'decorate', 'decrease',
  'deer', 'defense', 'define', 'degree', 'delay', 'deliver', 'demand', 'denial',
  'dentist', 'deny', 'depart', 'depend', 'deposit', 'depth', 'deputy', 'derive',
  'describe', 'desert', 'design', 'desk', 'despair', 'destroy', 'detail', 'detect',
  'develop', 'device', 'devote', 'diagram', 'dial', 'diamond', 'diary', 'dice',
  'diesel', 'diet', 'differ', 'digital', 'dignity', 'dilemma', 'dinner', 'dinosaur',
  'direct', 'dirt', 'disagree', 'discover', 'disease', 'dish', 'dismiss', 'disorder',
  'display', 'distance', 'divert', 'divide', 'divorce', 'dizzy', 'doctor', 'document',
  'dolphin', 'domain', 'donate', 'donkey', 'donor', 'door', 'dose', 'double',
  'dove', 'draft', 'dragon', 'drama', 'drastic', 'draw', 'dream', 'dress',
  'drift', 'drill', 'drink', 'drip', 'drive', 'drop', 'drum', 'dry',
  'duck', 'dumb', 'dune', 'during', 'dust', 'dutch', 'duty', 'dwarf',
  'dynamic', 'eager', 'eagle', 'early', 'earn', 'earth', 'easily', 'east',
  'easy', 'echo', 'ecology', 'economy', 'edge', 'edit', 'educate', 'effort',
  'eight', 'either', 'elbow', 'elder', 'electric', 'elegant', 'element', 'elephant',
  'elevator', 'elite', 'else', 'embark', 'embody', 'embrace', 'emerge', 'emotion',
  'employ', 'empower', 'empty', 'enable', 'enact', 'end', 'endless', 'endorse',
  'enemy', 'energy', 'enforce', 'engage', 'engine', 'enhance', 'enjoy', 'enlist',
  'enough', 'enrich', 'enroll', 'ensure', 'enter', 'entire', 'entry', 'envelope',
  'episode', 'equal', 'equip', 'erase', 'erode', 'erosion', 'error', 'erupt',
  'escape', 'essay', 'essence', 'estate', 'eternal', 'ethics', 'evidence', 'evil',
  'evoke', 'evolve', 'exact', 'example', 'excess', 'exchange', 'excite', 'exclude',
  'excuse', 'execute', 'exercise', 'exhaust', 'exhibit', 'exile', 'exist', 'exit',
  'exotic', 'expand', 'expect', 'expire', 'explain', 'expose', 'express', 'extend',
  'extra', 'fabric', 'face', 'faculty', 'fade', 'faint', 'faith', 'fall',
  'false', 'fame', 'family', 'famous', 'fancy', 'fantasy', 'farm', 'fashion',
  'fatal', 'father', 'fatigue', 'fault', 'favorite', 'feature', 'february', 'federal',
  'fee', 'feed', 'feel', 'female', 'fence', 'festival', 'fetch', 'fever',
  'fiber', 'fiction', 'field', 'figure', 'file', 'film', 'filter', 'final',
  'find', 'finger', 'finish', 'fire', 'firm', 'first', 'fiscal', 'fish',
  'fitness', 'flag', 'flame', 'flash', 'flat', 'flavor', 'flee', 'flight',
  'flip', 'float', 'flock', 'floor', 'flower', 'fluid', 'flush', 'fly',
  'foam', 'focus', 'fog', 'foil', 'fold', 'follow', 'food', 'foot',
  'force', 'forest', 'forget', 'fork', 'fortune', 'forum', 'forward', 'fossil',
  'foster', 'found', 'fox', 'fragile', 'frame', 'frequent', 'fresh', 'friend',
  'fringe', 'frog', 'front', 'frost', 'frown', 'frozen', 'fruit', 'fuel',
  'fun', 'funny', 'furnace', 'fury', 'future', 'gadget', 'gain', 'galaxy',
  'gallery', 'game', 'gap', 'garage', 'garbage', 'garden', 'garlic', 'garment',
  'gas', 'gasp', 'gate', 'gather', 'gauge', 'gaze', 'general', 'genius',
  'genre', 'gentle', 'genuine', 'gesture', 'ghost', 'giant', 'gift', 'giggle',
  'ginger', 'giraffe', 'girl', 'give', 'glad', 'glance', 'glare', 'glass',
  'glide', 'glimpse', 'globe', 'gloom', 'glory', 'glove', 'glow', 'glue',
  'goat', 'goddess', 'gold', 'good', 'goose', 'gorilla', 'gospel', 'gossip',
  'govern', 'gown', 'grab', 'grace', 'grain', 'grant', 'grape', 'grass',
  'gravity', 'great', 'green', 'grid', 'grief', 'grit', 'grocery', 'group',
  'grow', 'grunt', 'guard', 'guess', 'guide', 'guilt', 'guitar', 'gun',
  'gym', 'habit', 'hair', 'half', 'hammer', 'hamster', 'hand', 'happy',
  'harbor', 'hard', 'harsh', 'harvest', 'hat', 'have', 'hawk', 'hazard',
  'head', 'health', 'heart', 'heavy', 'hedgehog', 'height', 'hello', 'helmet',
  'help', 'hen', 'hero', 'hidden', 'high', 'hill', 'hint', 'hip',
  'hire', 'history', 'hobby', 'hockey', 'hold', 'hole', 'holiday', 'hollow',
  'home', 'honey', 'hood', 'hope', 'horn', 'horror', 'horse', 'hospital',
  'host', 'hotel', 'hour', 'hover', 'hub', 'huge', 'human', 'humble',
  'humor', 'hundred', 'hungry', 'hunt', 'hurdle', 'hurry', 'hurt', 'husband',
  'hybrid', 'ice', 'icon', 'idea', 'identify', 'idle', 'ignore', 'illegal',
  'illness', 'image', 'imitate', 'immense', 'immune', 'impact', 'impose', 'improve',
  'impulse', 'inch', 'include', 'income', 'increase', 'index', 'indicate', 'indoor',
  'industry', 'infant', 'inflict', 'inform', 'inhale', 'inherit', 'initial', 'inject',
  'injury', 'inmate', 'inner', 'innocent', 'input', 'inquiry', 'insane', 'insect',
  'inside', 'inspire', 'install', 'intact', 'interest', 'into', 'invest', 'invite',
  'involve', 'iron', 'island', 'isolate', 'issue', 'item', 'ivory', 'jacket',
  'jaguar', 'jar', 'jazz', 'jealous', 'jeans', 'jelly', 'jewel', 'job',
  'join', 'joke', 'journey', 'joy', 'judge', 'juice', 'jump', 'jungle',
  'junior', 'junk', 'just', 'kangaroo', 'keen', 'keep', 'ketchup', 'key',
  'kick', 'kidney', 'kind', 'kingdom', 'kiss', 'kitchen', 'kite', 'kitten',
  'kiwi', 'knee', 'knife', 'knock', 'know', 'labor', 'ladder', 'lady',
  'lake', 'lamp', 'language', 'laptop', 'large', 'later', 'latin', 'laugh',
  'laundry', 'lava', 'lawn', 'lawsuit', 'layer', 'lazy', 'leader', 'leaf',
  'learn', 'leave', 'lecture', 'left', 'legal', 'legend', 'leisure', 'lemon',
  'lend', 'length', 'lens', 'leopard', 'lesson', 'letter', 'level', 'liberty',
  'library', 'license', 'life', 'lift', 'light', 'limb', 'limit', 'link',
  'lion', 'liquid', 'list', 'little', 'live', 'lizard', 'load', 'loan',
  'lobster', 'local', 'lock', 'logic', 'lonely', 'long', 'loop', 'lottery',
  'loud', 'lounge', 'love', 'loyal', 'lucky', 'luggage', 'lumber', 'lunar',
  'lunch', 'luxury', 'lyrics', 'machine', 'mad', 'magic', 'magnet', 'maid',
  'mail', 'main', 'major', 'make', 'mammal', 'manage', 'mandate', 'mango',
  'mansion', 'manual', 'maple', 'marble', 'march', 'margin', 'marine', 'market',
  'marriage', 'mask', 'mass', 'master', 'match', 'material', 'math', 'matrix',
  'matter', 'maximum', 'maze', 'meadow', 'mean', 'measure', 'meat', 'mechanic',
  'medal', 'media', 'melody', 'melt', 'member', 'memory', 'mention', 'menu',
  'mercy', 'merge', 'merit', 'merry', 'mesh', 'message', 'metal', 'method',
  'middle', 'midnight', 'milk', 'million', 'mimic', 'mind', 'minimum', 'minor',
  'minute', 'miracle', 'mirror', 'misery', 'miss', 'mistake', 'mix', 'mixed',
  'mixture', 'mobile', 'model', 'modify', 'moment', 'monitor', 'monkey', 'monster',
  'month', 'moon', 'moral', 'more', 'morning', 'mosquito', 'mother', 'motion',
  'motor', 'mountain', 'mouse', 'move', 'movie', 'much', 'muffin', 'multiply',
  'muscle', 'museum', 'mushroom', 'music', 'must', 'mutual', 'myself', 'mystery',
  'myth', 'naive', 'name', 'napkin', 'narrow', 'nasty', 'nation', 'nature',
  'near', 'neck', 'need', 'negative', 'neglect', 'neither', 'nephew', 'nerve',
  'nest', 'network', 'neutral', 'never', 'news', 'next', 'nice', 'night',
  'noble', 'noise', 'nominee', 'noodle', 'normal', 'north', 'nose', 'notable',
  'note', 'nothing', 'notice', 'novel', 'now', 'nuclear', 'number', 'nurse',
  'nut', 'oak', 'obey', 'object', 'oblige', 'obscure', 'observe', 'obtain',
  'obvious', 'occur', 'ocean', 'october', 'odor', 'off', 'offer', 'office',
  'often', 'oil', 'okay', 'old', 'olive', 'olympic', 'omit', 'once',
  'one', 'onion', 'online', 'only', 'open', 'opera', 'opinion', 'oppose',
  'option', 'orange', 'orbit', 'orchard', 'order', 'ordinary', 'organ', 'orient',
  'original', 'orphan', 'ostrich', 'other', 'outdoor', 'outer', 'output', 'outside',
  'oval', 'oven', 'over', 'owner', 'oxygen', 'oyster', 'ozone', 'pact',
  'paddle', 'page', 'pair', 'palace', 'palm', 'panda', 'panel', 'panic',
  'panther', 'paper', 'parade', 'parent', 'park', 'parrot', 'party', 'pass',
  'patch', 'path', 'patient', 'patrol', 'pattern', 'pause', 'pave', 'payment',
  'peace', 'peanut', 'pear', 'peasant', 'pelican', 'penalty', 'pencil', 'people',
  'pepper', 'perfect', 'permit', 'person', 'pet', 'phone', 'photo', 'phrase',
  'physical', 'piano', 'picnic', 'picture', 'piece', 'pig', 'pigeon', 'pill',
  'pilot', 'pink', 'pioneer', 'pipe', 'pistol', 'pitch', 'pizza', 'place',
  'planet', 'plastic', 'plate', 'play', 'please', 'pledge', 'pluck', 'plug',
  'plunge', 'poem', 'poet', 'point', 'polar', 'pole', 'police', 'pond',
  'pony', 'pool', 'popular', 'portion', 'position', 'possible', 'post', 'potato',
  'pottery', 'poverty', 'powder', 'power', 'practice', 'praise', 'predict', 'prefer',
  'prepare', 'present', 'pretty', 'prevent', 'price', 'pride', 'primary', 'print',
  'priority', 'prison', 'private', 'prize', 'problem', 'process', 'produce', 'profit',
  'program', 'project', 'promote', 'proof', 'property', 'prosper', 'protect', 'proud',
  'provide', 'public', 'pudding', 'pull', 'pulp', 'pulse', 'pumpkin', 'punch',
  'pupil', 'puppy', 'purchase', 'purity', 'purpose', 'purse', 'push', 'puzzle',
  'pyramid', 'quality', 'quantum', 'quarter', 'question', 'quick', 'quit', 'quiz',
  'quote', 'rabbit', 'raccoon', 'race', 'rack', 'radar', 'radio', 'rail',
  'rain', 'raise', 'rally', 'ramp', 'ranch', 'random', 'range', 'rapid',
  'rare', 'rate', 'rather', 'raven', 'raw', 'razor', 'ready', 'real',
  'reason', 'rebel', 'rebuild', 'recall', 'receive', 'recipe', 'record', 'recycle',
  'reduce', 'reflect', 'reform', 'refuse', 'region', 'regret', 'regular', 'reject',
  'relax', 'release', 'relief', 'rely', 'remain', 'remember', 'remind', 'remove',
  'render', 'renew', 'rent', 'reopen', 'repair', 'repeat', 'replace', 'report',
  'require', 'rescue', 'resemble', 'resist', 'resource', 'response', 'result', 'retire',
  'retreat', 'return', 'reunion', 'reveal', 'review', 'reward', 'rhythm', 'ribbon',
  'rice', 'rich', 'ride', 'ridge', 'rifle', 'right', 'rigid', 'ring',
  'riot', 'ripple', 'risk', 'ritual', 'rival', 'river', 'road', 'roast',
  'robot', 'robust', 'rocket', 'romance', 'roof', 'rookie', 'room', 'rose',
  'rotate', 'rough', 'round', 'route', 'royal', 'rubber', 'rude', 'rug',
  'rule', 'run', 'runway', 'rural', 'sad', 'saddle', 'sadness', 'safe',
  'sail', 'salad', 'salmon', 'salon', 'salt', 'salute', 'same', 'sample',
  'sand', 'satisfy', 'satoshi', 'sauce', 'sausage', 'save', 'scale', 'scan',
  'scatter', 'scene', 'scheme', 'school', 'science', 'scissors', 'scorpion', 'scout',
  'scrap', 'screen', 'script', 'scrub', 'search', 'season', 'seat', 'second',
  'secret', 'section', 'security', 'seek', 'segment', 'select', 'sell', 'seminar',
  'senior', 'sense', 'sentence', 'series', 'service', 'session', 'settle', 'setup',
  'seven', 'shadow', 'shaft', 'shallow', 'share', 'shed', 'shell', 'sheriff',
  'shield', 'shift', 'shine', 'ship', 'shiver', 'shock', 'shoe', 'shoot',
  'shop', 'short', 'shoulder', 'shove', 'shrimp', 'shrug', 'shuffle', 'shy',
  'sibling', 'sick', 'side', 'siege', 'sight', 'sign', 'silent', 'silk',
  'silly', 'silver', 'similar', 'simple', 'since', 'sing', 'siren', 'sister',
  'situate', 'size', 'skate', 'sketch', 'skill', 'skin', 'skirt', 'skull',
  'slab', 'slam', 'sleep', 'slender', 'slice', 'slide', 'slight', 'slim',
  'slogan', 'slot', 'slow', 'slush', 'small', 'smart', 'smile', 'smoke',
  'smooth', 'snack', 'snake', 'snap', 'sniff', 'snow', 'soap', 'soccer',
  'social', 'sock', 'soda', 'soft', 'solar', 'soldier', 'solid', 'solution',
  'solve', 'someone', 'song', 'soon', 'sorry', 'sort', 'soul', 'sound',
  'soup', 'source', 'south', 'space', 'spare', 'spatial', 'spawn', 'speak',
  'special', 'speed', 'spell', 'spend', 'sphere', 'spice', 'spider', 'spike',
  'spin', 'spirit', 'split', 'spoil', 'sponsor', 'spoon', 'sport', 'spot',
  'spray', 'spread', 'spring', 'spy', 'square', 'squeeze', 'squirrel', 'stable',
  'stadium', 'staff', 'stage', 'stairs', 'stamp', 'stand', 'start', 'state',
  'stay', 'steak', 'steel', 'stem', 'step', 'stereo', 'stick', 'still',
  'sting', 'stock', 'stomach', 'stone', 'stool', 'story', 'stove', 'strategy',
  'street', 'strike', 'strong', 'struggle', 'student', 'stuff', 'stumble', 'style',
  'subject', 'submit', 'subway', 'success', 'such', 'sudden', 'suffer', 'sugar',
  'suggest', 'suit', 'summer', 'sun', 'sunny', 'sunset', 'super', 'supply',
  'supreme', 'sure', 'surface', 'surge', 'surprise', 'surround', 'survey', 'suspect',
  'sustain', 'swallow', 'swamp', 'swap', 'swarm', 'swear', 'sweet', 'swift',
  'swim', 'swing', 'switch', 'sword', 'symbol', 'symptom', 'syrup', 'system',
  'table', 'tackle', 'tag', 'tail', 'talent', 'talk', 'tank', 'tape',
  'target', 'task', 'taste', 'tattoo', 'taxi', 'teach', 'team', 'tell',
  'ten', 'tenant', 'tennis', 'tent', 'term', 'test', 'text', 'thank',
  'that', 'theme', 'then', 'theory', 'there', 'they', 'thing', 'this',
  'thought', 'three', 'thrive', 'throw', 'thumb', 'thunder', 'ticket', 'tide',
  'tiger', 'tilt', 'timber', 'time', 'tiny', 'tip', 'tired', 'tissue',
  'title', 'toast', 'tobacco', 'today', 'toddler', 'toe', 'together', 'toilet',
  'token', 'tomato', 'tomorrow', 'tone', 'tongue', 'tonight', 'tool', 'tooth',
  'top', 'topic', 'topple', 'torch', 'tornado', 'tortoise', 'toss', 'total',
  'tourist', 'toward', 'tower', 'town', 'toy', 'track', 'trade', 'traffic',
  'tragic', 'train', 'transfer', 'trap', 'trash', 'travel', 'tray', 'treat',
  'tree', 'trend', 'trial', 'tribe', 'trick', 'trigger', 'trim', 'trip',
  'trophy', 'trouble', 'truck', 'true', 'truly', 'trumpet', 'trust', 'truth',
  'try', 'tube', 'tuition', 'tumble', 'tuna', 'tunnel', 'turkey', 'turn',
  'turtle', 'twelve', 'twenty', 'twice', 'twin', 'twist', 'type', 'typical',
  'ugly', 'umbrella', 'unable', 'unaware', 'uncle', 'uncover', 'under', 'undo',
  'unfair', 'unfold', 'unhappy', 'uniform', 'unique', 'unit', 'universe', 'unknown',
  'unlock', 'until', 'unusual', 'unveil', 'update', 'upgrade', 'uphold', 'upon',
  'upper', 'upset', 'urban', 'urge', 'usage', 'use', 'used', 'useful',
  'useless', 'usual', 'utility', 'vacant', 'vacuum', 'vague', 'valid', 'valley',
  'valve', 'van', 'vanish', 'vapor', 'various', 'vast', 'vault', 'vehicle',
  'velvet', 'vendor', 'venture', 'venue', 'verb', 'verify', 'version', 'very',
  'vessel', 'veteran', 'viable', 'vibrant', 'vicious', 'victory', 'video', 'view',
  'village', 'vintage', 'violin', 'virtual', 'virus', 'visa', 'visit', 'visual',
  'vital', 'vivid', 'vocal', 'voice', 'void', 'volcano', 'volume', 'vote',
  'voyage', 'wage', 'wagon', 'wait', 'walk', 'wall', 'walnut', 'want',
  'warfare', 'warm', 'warrior', 'wash', 'wasp', 'waste', 'water', 'wave',
  'way', 'wealth', 'weapon', 'wear', 'weasel', 'weather', 'web', 'wedding',
  'weekend', 'weird', 'welcome', 'west', 'wet', 'whale', 'what', 'wheat',
  'wheel', 'when', 'where', 'whip', 'whisper', 'wide', 'width', 'wife',
  'wild', 'will', 'win', 'window', 'wine', 'wing', 'wink', 'winner',
  'winter', 'wire', 'wisdom', 'wise', 'wish', 'witness', 'wolf', 'woman',
  'wonder', 'wood', 'wool', 'word', 'work', 'world', 'worry', 'worth',
  'wrap', 'wreck', 'wrestle', 'wrist', 'write', 'wrong', 'yard', 'year',
  'yellow', 'young', 'youth', 'zebra', 'zero', 'zone', 'zoo',
];

// Passphrase generation utility
function generatePassphrase(wordCount: number = 4, separator: string = '-'): string {
  const words: string[] = [];
  const usedIndices = new Set<number>();

  while (words.length < wordCount) {
    const index = Math.floor(Math.random() * WORDLIST.length);
    if (!usedIndices.has(index)) {
      usedIndices.add(index);
      words.push(WORDLIST[index]);
    }
  }

  return words.join(separator);
}

type PasswordMode = 'random' | 'passphrase';

// Helper to get full folder path for nested folders
function getFolderPath(folderId: string | null, folders: { id: string; name: string; parentId: string | null }[]): string {
  if (!folderId) return 'No folder';
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return 'No folder';
  
  const path: string[] = [folder.name];
  let currentParentId = folder.parentId;
  
  while (currentParentId) {
    const parent = folders.find(f => f.id === currentParentId);
    if (parent) {
      path.unshift(parent.name);
      currentParentId = parent.parentId;
    } else {
      break;
    }
  }
  
  return path.join(' / ');
}

// Sort folders for display with nested structure
function getSortedFoldersForPicker(folders: { id: string; name: string; parentId: string | null }[]): { id: string; name: string; parentId: string | null; depth: number; path: string }[] {
  const result: { id: string; name: string; parentId: string | null; depth: number; path: string }[] = [];
  
  const addFolderAndChildren = (parentId: string | null, depth: number) => {
    const children = folders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    for (const folder of children) {
      const path = getFolderPath(folder.id, folders);
      result.push({ ...folder, depth, path });
      addFolderAndChildren(folder.id, depth + 1);
    }
  };
  
  addFolderAndChildren(null, 0);
  return result;
}

export default function AddEditCredentialScreen({
  credentialId,
  onSave,
  onCancel,
}: AddEditCredentialScreenProps) {
  const { credentials, folders, addCredential, updateCredential, getCustomFields, syncCustomFields, getCredentialTags, syncCredentialTags } = useVaultStore();

  const isEditing = !!credentialId;
  const existingCredential = credentialId
    ? credentials.find(c => c.id === credentialId)
    : null;

  const [name, setName] = useState(existingCredential?.name || '');
  const [username, setUsername] = useState(existingCredential?.username || '');
  const [password, setPassword] = useState(existingCredential?.password || '');
  const [url, setUrl] = useState(existingCredential?.url || '');
  const [notes, setNotes] = useState(existingCredential?.notes || '');
  const [totpSecret, setTotpSecret] = useState(existingCredential?.totpSecret || '');
  const [folderId, setFolderId] = useState<string | null>(existingCredential?.folderId || null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [customFields, setCustomFields] = useState<Array<{ name: string; value: string }>>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passwordLength, setPasswordLength] = useState(20);
  const [generatedPasswordLength, setGeneratedPasswordLength] = useState<number | null>(null);
  const [passwordMode, setPasswordMode] = useState<PasswordMode>('random');
  const [wordCount, setWordCount] = useState(4);
  const [generatedWordCount, setGeneratedWordCount] = useState<number | null>(null);

  useEffect(() => {
    if (existingCredential) {
      setName(existingCredential.name);
      setUsername(existingCredential.username || '');
      setPassword(existingCredential.password);
      setUrl(existingCredential.url || '');
      setNotes(existingCredential.notes || '');
      setTotpSecret(existingCredential.totpSecret || '');
      // Load custom fields
      getCustomFields(existingCredential.id).then((fields) => {
        setCustomFields(fields.map(f => ({ name: f.name, value: f.value })));
      });
      // Load tags
      getCredentialTags(existingCredential.id).then((credentialTags) => {
        setTags(credentialTags.map(t => t.name));
      });
    }
  }, [existingCredential, getCustomFields, getCredentialTags]);

  const handleAddCustomField = () => {
    setCustomFields([...customFields, { name: '', value: '' }]);
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleCustomFieldChange = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const handleAddTag = () => {
    setShowTagInput(true);
    setNewTagInput('');
  };

  const handleSaveTag = () => {
    const tagName = newTagInput.trim();
    if (tagName && !tags.includes(tagName)) {
      setTags([...tags, tagName]);
    }
    setShowTagInput(false);
    setNewTagInput('');
  };

  const handleRemoveTag = (tagName: string) => {
    setTags(tags.filter(t => t !== tagName));
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGeneratePassword = () => {
    if (passwordMode === 'random') {
      const newPassword = generatePassword(passwordLength);
      setPassword(newPassword);
      setGeneratedPasswordLength(newPassword.length);
      setGeneratedWordCount(null);
    } else {
      const newPassphrase = generatePassphrase(wordCount);
      setPassword(newPassphrase);
      setGeneratedWordCount(wordCount);
      setGeneratedPasswordLength(null);
    }
    setShowPassword(true);
  };

  const handleCopyGeneratedPassword = async () => {
    if (!password) {
      return;
    }
    try {
      await Clipboard.setString(password);
      Alert.alert('Copied', 'Password copied to clipboard');
    } catch {
      Alert.alert('Error', 'Failed to copy password');
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      // Show first error
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Alert.alert('Validation Error', firstError);
      }
      return;
    }

    setIsLoading(true);

    try {
      let credId: string;
      if (isEditing && credentialId) {
        await updateCredential(credentialId, {
          name: name.trim(),
          username: username.trim() || null,
          password: password,
          url: url.trim() || null,
          notes: notes.trim() || null,
          totpSecret: totpSecret.trim() || null,
        });
        credId = credentialId;
      } else {
        credId = await addCredential({
          name: name.trim(),
          username: username.trim() || null,
          password: password,
          url: url.trim() || null,
          totpSecret: totpSecret.trim() || null,
          notes: notes.trim() || null,
          folderId: folderId,
          favorite: false,
          passwordUpdatedAt: null,
        });
      }
      // Sync custom fields (filter out empty ones)
      const validCustomFields = customFields.filter(f => f.name.trim() && f.value.trim());
      await syncCustomFields(credId, validCustomFields);
      // Sync tags
      await syncCredentialTags(credId, tags);
      onSave();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save credential'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity testID="cancel-button" style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Credential' : 'Add Credential'}
        </Text>
        <TouchableOpacity
          testID="save-credential-button"
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView testID="credential-form-scroll" style={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            testID="credential-name-input"
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="e.g., GitHub, Gmail, Bank"
            placeholderTextColor="#8a8a9a"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors({ ...errors, name: '' });
              }
            }}
            autoCapitalize="words"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username / Email</Text>
          <TextInput
            testID="credential-username-input"
            style={styles.input}
            placeholder="username@example.com"
            placeholderTextColor="#8a8a9a"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              testID="credential-password-input"
              style={[styles.passwordInput, errors.password && styles.inputError]}
              placeholder="Enter password"
              placeholderTextColor="#8a8a9a"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({ ...errors, password: '' });
                }
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon name={showPassword ? 'eye' : 'eye-off'} size={20} color="#e94560" />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TouchableOpacity
            testID="generate-password-button"
            style={styles.generateButton}
            onPress={handleGeneratePassword}
          >
            <Icon name="dice-multiple" size={20} color="#ffffff" />
            <Text style={styles.generateText}>Generate Strong Password</Text>
          </TouchableOpacity>

          {/* Password Mode Toggle */}
          <View testID="password-mode-toggle" style={styles.modeToggleContainer}>
            <TouchableOpacity
              testID={passwordMode === 'random' ? 'mode-random-selected' : 'mode-random'}
              style={[
                styles.modeButton,
                passwordMode === 'random' && styles.modeButtonSelected,
              ]}
              onPress={() => setPasswordMode('random')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  passwordMode === 'random' && styles.modeButtonTextSelected,
                ]}
              >
                Random
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={passwordMode === 'passphrase' ? 'mode-passphrase-selected' : 'mode-passphrase'}
              style={[
                styles.modeButton,
                passwordMode === 'passphrase' && styles.modeButtonSelected,
              ]}
              onPress={() => setPasswordMode('passphrase')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  passwordMode === 'passphrase' && styles.modeButtonTextSelected,
                ]}
              >
                Passphrase
              </Text>
            </TouchableOpacity>
          </View>

          {/* Password Length Slider (Random mode) */}
          {passwordMode === 'random' && (
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Password Length</Text>
                <Text testID="password-length-display" style={styles.lengthDisplay}>
                  {passwordLength}
                </Text>
              </View>
              <Slider
                testID="password-length-slider"
                style={styles.slider}
                minimumValue={8}
                maximumValue={128}
                step={1}
                value={passwordLength}
                onValueChange={(value) => setPasswordLength(Math.round(value))}
                minimumTrackTintColor="#e94560"
                maximumTrackTintColor="#16213e"
                thumbTintColor="#e94560"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderMinMax}>8</Text>
                <Text style={styles.sliderMinMax}>128</Text>
              </View>
            </View>
          )}

          {/* Word Count Slider (Passphrase mode) */}
          {passwordMode === 'passphrase' && (
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Word Count</Text>
                <Text testID="word-count-display" style={styles.lengthDisplay}>
                  {wordCount}
                </Text>
              </View>
              <Slider
                testID="word-count-slider"
                style={styles.slider}
                minimumValue={3}
                maximumValue={8}
                step={1}
                value={wordCount}
                onValueChange={(value) => setWordCount(Math.round(value))}
                minimumTrackTintColor="#e94560"
                maximumTrackTintColor="#16213e"
                thumbTintColor="#e94560"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderMinMax}>3</Text>
                <Text style={styles.sliderMinMax}>8</Text>
              </View>
            </View>
          )}

          {/* Generated password length indicator */}
          {generatedPasswordLength !== null && (
            <View style={styles.generatedLengthContainer}>
              <Text style={styles.generatedLengthLabel}>Generated: </Text>
              <Text testID="generated-password-length" style={styles.generatedLengthValue}>
                {generatedPasswordLength}
              </Text>
              <Text style={styles.generatedLengthLabel}> characters</Text>
              <TouchableOpacity
                testID="copy-generated-password-button"
                style={styles.copyGeneratedButton}
                onPress={handleCopyGeneratedPassword}
              >
                <Icon name="content-copy" size={18} color="#e94560" />
              </TouchableOpacity>
            </View>
          )}

          {/* Generated word count indicator */}
          {generatedWordCount !== null && (
            <View style={styles.generatedLengthContainer}>
              <Text style={styles.generatedLengthLabel}>Generated: </Text>
              <Text testID="generated-word-count" style={styles.generatedLengthValue}>
                {generatedWordCount}
              </Text>
              <Text style={styles.generatedLengthLabel}> words</Text>
              <TouchableOpacity
                testID="copy-generated-password-button"
                style={styles.copyGeneratedButton}
                onPress={handleCopyGeneratedPassword}
              >
                <Icon name="content-copy" size={18} color="#e94560" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Website URL</Text>
          <TextInput
            testID="credential-url-input"
            style={styles.input}
            placeholder="https://example.com"
            placeholderTextColor="#8a8a9a"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            testID="credential-notes-input"
            style={[styles.input, styles.notesInput]}
            placeholder="Additional notes..."
            placeholderTextColor="#8a8a9a"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>TOTP Secret (2FA)</Text>
          <TextInput
            testID="credential-totp-input"
            style={styles.input}
            placeholder="Base32 encoded secret (e.g., JBSWY3DPEHPK3PXP)"
            placeholderTextColor="#8a8a9a"
            value={totpSecret}
            onChangeText={setTotpSecret}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Text style={styles.totpHint}>
            Enter the secret key from your authenticator app setup
          </Text>
        </View>

        {/* Folder Picker */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Folder</Text>
          <TouchableOpacity
            testID="folder-picker"
            style={styles.folderPicker}
            onPress={() => setShowFolderPicker(!showFolderPicker)}
          >
            <Icon name="folder" size={20} color="#e94560" />
            <Text style={styles.folderPickerText}>
              {getFolderPath(folderId, folders)}
            </Text>
            <Icon name="chevron-down" size={20} color="#a0a0a0" />
          </TouchableOpacity>
          {showFolderPicker && (
            <View style={styles.folderPickerMenu}>
              <TouchableOpacity
                style={[styles.folderPickerItem, !folderId && styles.folderPickerItemActive]}
                onPress={() => { setFolderId(null); setShowFolderPicker(false); }}
              >
                <Text style={styles.folderPickerItemText}>No folder</Text>
                {!folderId && <Icon name="check" size={18} color="#e94560" />}
              </TouchableOpacity>
              {getSortedFoldersForPicker(folders).map(folder => (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderPickerItem, 
                    folderId === folder.id && styles.folderPickerItemActive,
                    { paddingLeft: 16 + folder.depth * 16 }
                  ]}
                  onPress={() => { setFolderId(folder.id); setShowFolderPicker(false); }}
                >
                  <Text style={styles.folderPickerItemText}>{folder.path}</Text>
                  {folderId === folder.id && <Icon name="check" size={18} color="#e94560" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Tags Section */}
        <View style={styles.tagsSection}>
          <Text style={styles.tagsHeader}>Tags</Text>

          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <View key={tag} testID={`tag-chip-${tag}`} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
                <TouchableOpacity
                  testID={`remove-tag-${tag}`}
                  style={styles.removeTagButton}
                  onPress={() => handleRemoveTag(tag)}
                >
                  <Icon name="close" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {showTagInput ? (
            <View style={styles.tagInputRow}>
              <TextInput
                testID="tag-input"
                style={styles.tagInput}
                placeholder="Enter tag name"
                placeholderTextColor="#8a8a9a"
                value={newTagInput}
                onChangeText={setNewTagInput}
                autoFocus
              />
              <TouchableOpacity
                testID="save-tag-button"
                style={styles.saveTagButton}
                onPress={handleSaveTag}
              >
                <Text style={styles.saveTagText}>Add</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              testID="add-tag-button"
              style={styles.addTagButton}
              onPress={handleAddTag}
            >
              <Icon name="plus" size={18} color="#e94560" />
              <Text style={styles.addTagText}>Add Tag</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Custom Fields Section */}
        <View style={styles.customFieldsSection}>
          <Text style={styles.customFieldsHeader}>Custom Fields</Text>

          {customFields.map((field, index) => (
            <View key={index} style={styles.customFieldRow}>
              <View style={styles.customFieldInputs}>
                <TextInput
                  testID={`custom-field-name-${index}`}
                  style={styles.customFieldNameInput}
                  placeholder="Field name"
                  placeholderTextColor="#8a8a9a"
                  value={field.name}
                  onChangeText={(value) => handleCustomFieldChange(index, 'name', value)}
                />
                <TextInput
                  testID={`custom-field-value-${index}`}
                  style={styles.customFieldValueInput}
                  placeholder="Value"
                  placeholderTextColor="#8a8a9a"
                  value={field.value}
                  onChangeText={(value) => handleCustomFieldChange(index, 'value', value)}
                />
              </View>
              <TouchableOpacity
                testID={`delete-custom-field-${index}`}
                style={styles.deleteFieldButton}
                onPress={() => handleRemoveCustomField(index)}
              >
                <Icon name="close" size={18} color="#e94560" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            testID="add-custom-field-button"
            style={styles.addFieldButton}
            onPress={handleAddCustomField}
          >
            <Icon name="plus" size={20} color="#e94560" />
            <Text style={styles.addFieldText}>Add Custom Field</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#16213e',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: '#8a8a9a',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#e94560',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#8a8a9a',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff4757',
  },
  errorText: {
    color: '#ff4757',
    fontSize: 12,
    marginTop: 4,
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  eyeButton: {
    padding: 16,
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  generateIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  generateText: {
    color: '#fff',
    fontSize: 14,
  },
  notesInput: {
    height: 100,
    paddingTop: 12,
  },
  spacer: {
    height: 100,
  },
  sliderContainer: {
    marginTop: 16,
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    color: '#8a8a9a',
    fontSize: 14,
  },
  lengthDisplay: {
    color: '#e94560',
    fontSize: 18,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderMinMax: {
    color: '#8a8a9a',
    fontSize: 12,
  },
  generatedLengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  generatedLengthLabel: {
    color: '#8a8a9a',
    fontSize: 12,
  },
  generatedLengthValue: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 8,
    marginTop: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonSelected: {
    backgroundColor: '#e94560',
  },
  modeButtonText: {
    color: '#8a8a9a',
    fontSize: 14,
    fontWeight: '500',
  },
  modeButtonTextSelected: {
    color: '#fff',
  },
  copyGeneratedButton: {
    marginLeft: 12,
    padding: 4,
  },
  copyIcon: {
    fontSize: 16,
  },
  totpHint: {
    color: '#8a8a9a',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  tagsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
  },
  tagsHeader: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagChipText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 6,
  },
  removeTagButton: {
    padding: 2,
  },
  removeTagIcon: {
    color: '#8a8a9a',
    fontSize: 12,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  saveTagButton: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  saveTagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  addTagIcon: {
    color: '#0f3460',
    fontSize: 16,
    marginRight: 8,
  },
  addTagText: {
    color: '#0f3460',
    fontSize: 14,
  },
  customFieldsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
  },
  customFieldsHeader: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  customFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customFieldInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  customFieldNameInput: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  customFieldValueInput: {
    flex: 2,
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  deleteFieldButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: '#3a1a2e',
    borderRadius: 6,
  },
  deleteFieldIcon: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 4,
  },
  addFieldIcon: {
    color: '#e94560',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  addFieldText: {
    color: '#8a8a9a',
    fontSize: 14,
  },
  folderPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 12,
  },
  folderPickerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  folderPickerText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  folderPickerArrow: {
    color: '#8a8a9a',
    fontSize: 10,
  },
  folderPickerMenu: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  folderPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  folderPickerItemActive: {
    backgroundColor: '#0f3460',
  },
  folderPickerItemText: {
    color: '#fff',
    fontSize: 14,
  },
  folderPickerCheck: {
    color: '#e94560',
    fontSize: 14,
  },
});
