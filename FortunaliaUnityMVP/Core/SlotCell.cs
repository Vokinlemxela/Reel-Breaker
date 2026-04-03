using Fortunalia.Data;

namespace Fortunalia.Core
{
    /// <summary>
    /// Представляет состояние конкретной ячейки спина в сетке 3x3
    /// </summary>
    public struct SlotCell
    {
        public int x;
        public int y;
        
        /// <summary>
        /// Если null - это Шум (Junk Symbol)
        /// </summary>
        public CardData currentCard;
        
        /// <summary>
        /// true если карта была уничтожена в фазу Consume
        /// </summary>
        public bool isConsumed;
        
        public bool IsJunk => currentCard == null;
    }
}
