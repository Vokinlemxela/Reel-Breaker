using Fortunalia.Data;
using UnityEngine;
using System.Collections.Generic;

namespace Fortunalia.Core
{
    public class ActionCommand
    {
        public readonly CardData sourceCard;
        public readonly Vector2Int origin;
        public int stackOrder;
        
        /// <summary>
        /// Вычисленный урон (кеш) который карта нанесет Боссу.
        /// Изменяется в ходе выполнения фаз (например, умножается при Line/Resonance).
        /// </summary>
        public float finalDamage;
        
        /// <summary>
        /// Состояние выполнения
        /// </summary>
        public bool IsCancelled { get; private set; }
        
        // Выделение памяти под цели без GC alloc'a
        public List<Vector2Int> affectedTargets = new List<Vector2Int>(9);

        public ActionCommand(CardData card, Vector2Int origin)
        {
            this.sourceCard = card;
            this.origin = origin;
            this.finalDamage = card.baseDamage;
        }

        public void CancelCommand()
        {
            IsCancelled = true;
            finalDamage = 0;
            affectedTargets.Clear();
        }

        public void Execute(GridState state)
        {
            if (IsCancelled || sourceCard.logic == null) return;
            
            sourceCard.logic.Execute(this, state);
        }
    }
}
