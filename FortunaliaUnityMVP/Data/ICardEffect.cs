using Fortunalia.Core;
using UnityEngine;

namespace Fortunalia.Data
{
    public interface ICardEffect
    {
        /// <summary>
        /// Выполняет специфичную логику карты
        /// </summary>
        /// <param name="command">Сам контекст выполнения с позицией и источником</param>
        /// <param name="gridState">Позволяет изменять стейт (например Consume)</param>
        void Execute(ActionCommand command, GridState gridState);
    }
}
