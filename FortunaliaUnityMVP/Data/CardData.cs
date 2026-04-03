using UnityEngine;

namespace Fortunalia.Data
{
    [CreateAssetMenu(fileName = "NewCard", menuName = "Fortunalia/Card Data")]
    public class CardData : ScriptableObject
    {
        public string id;
        public CardSet cardSet;
        
        [Tooltip("Базовый вес карты для расчета вероятности выпадения")]
        public float baseWeight = 1.0f;
        
        [Tooltip("Базовый наносимый урон кешу босса")]
        public float baseDamage = 10f;
        
        [Header("Behavior Flags")]
        [Tooltip("Выполняется самым первым (в начале стека)")]
        public bool isInitiator;
        [Tooltip("Выполняется самым последним (в конце стека), бонус от пройденных фаз")]
        public bool isFinisher;
        
        [SerializeReference]
        [Tooltip("Реализация логики карты")]
        public ICardEffect logic;
    }
}
