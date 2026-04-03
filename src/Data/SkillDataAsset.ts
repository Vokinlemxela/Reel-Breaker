export interface SkillDataAsset {
    id: string;
    tier: number;
    col: number;      // Used for grid positioning (1-3)
    name: string;
    icon: string;     // Lucide icon name
    dependsOn: string[];
    baseCost: number;
    maxLevel: number;
    desc: string;
}

export const SKILL_TREE: SkillDataAsset[] = [
  // TIER 1
  { id: 'data_boost', tier: 1, col: 1, name: "Data Miner", icon: "database", dependsOn: [], baseCost: 1, maxLevel: 10, desc: "Увеличивает добычу Данных при выигрыше на +10 за уровень." },
  { id: 'hustle_boost', tier: 1, col: 2, name: "RAM Upgrade", icon: "activity", dependsOn: [], baseCost: 1, maxLevel: 10, desc: "Доход в трущобах увеличен на +10% за каждый уровень." },
  { id: 'alert_resist', tier: 1, col: 3, name: "Stealth Mode", icon: "zap-off", dependsOn: [], baseCost: 2, maxLevel: 5, desc: "Снижает рост тревоги казино на 1 ед. за уровень." },
  
  // TIER 2
  { id: 'discount', tier: 2, col: 1, name: "Backdoor", icon: "lock", dependsOn: ['data_boost'], baseCost: 1, maxLevel: 10, desc: "Скидка 4% за каждый уровень на сессионные хаки в казино." },
  { id: 'vault_dmg', tier: 2, col: 2, name: "Vault Cracker", icon: "server-crash", dependsOn: ['hustle_boost'], baseCost: 1, maxLevel: 10, desc: "Выигрыши наносят на 10% больше урона сейфу казино за уровень." },
  { id: 'hustle_save', tier: 2, col: 3, name: "Кеш-память", icon: "binary", dependsOn: ['hustle_boost', 'alert_resist'], baseCost: 2, maxLevel: 1, desc: "Ошибки в трущобах больше не сбрасывают Уровень порта (теряется только прогресс)." },

  // TIER 3
  { id: 'jackpot', tier: 3, col: 1, name: "Deep Learning", icon: "cpu", dependsOn: ['discount', 'vault_dmg'], baseCost: 2, maxLevel: 10, desc: "Дает +3% шанс за уровень умножить любую выигрышную линию на x3." },
  { id: 'cpu_overclock', tier: 3, col: 3, name: "Quantum Core", icon: "trending-up", dependsOn: ['vault_dmg', 'hustle_save'], baseCost: 2, maxLevel: 5, desc: "При разорении дает +10% шанс за уровень на двойные CPU чипы." },

  // TIER 4
  { id: 'firewall_bypass', tier: 4, col: 1, name: "Ghost Protocol", icon: "eye", dependsOn: ['jackpot'], baseCost: 3, maxLevel: 1, desc: "УЛЬТИМЕЙТ: Полный иммунитет к замедлению и штрафам от Firewall." },
  { id: 'auto_farm', tier: 4, col: 2, name: "Botnet Hive", icon: "play", dependsOn: ['jackpot', 'cpu_overclock'], baseCost: 3, maxLevel: 1, desc: "УЛЬТИМЕЙТ: Ваш ботнет генерирует пассивный доход $25/сек." },
  { id: 'lucky_seven', tier: 4, col: 3, name: "Lucky Hash", icon: "zap", dependsOn: ['cpu_overclock'], baseCost: 2, maxLevel: 10, desc: "Пассивно повышает базовый шанс выпадения редких символов на +2% за уровень." }
];
