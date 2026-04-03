using Fortunalia.Data;
using UnityEngine;
using System.Collections.Generic;

namespace Fortunalia.Core
{
    public class StackResolver
    {
        private List<ActionCommand> stack = new List<ActionCommand>(9);
        private List<ActionCommand> initiators = new List<ActionCommand>(9);
        private List<ActionCommand> normals = new List<ActionCommand>(9);
        private List<ActionCommand> finishers = new List<ActionCommand>(9);

        /// <summary>
        /// Разрешает состояние сетки и возвращает организованный стек команд.
        /// Без GC аллокаций во время цикла (Linq недопустим).
        /// </summary>
        public Queue<ActionCommand> ResolveSpin(GridState state)
        {
            stack.Clear();
            initiators.Clear();
            normals.Clear();
            finishers.Clear();

            // 1. Построение стека (Priority Parse)
            for (int y = 0; y < GridState.HEIGHT; y++) // Сверху вниз (зависит от осей UI слотов, пусть y=0 это верх)
            {
                for (int x = 0; x < GridState.WIDTH; x++) // Слева направо
                {
                    ref SlotCell cell = ref state.cells[x, y];
                    
                    if (cell.currentCard == null) continue; // Шум пропускаем

                    ActionCommand cmd = new ActionCommand(cell.currentCard, new Vector2Int(x, y));

                    if (cell.currentCard.isInitiator)
                    {
                        initiators.Add(cmd);
                    }
                    else if (cell.currentCard.isFinisher)
                    {
                        finishers.Add(cmd);
                    }
                    else
                    {
                        normals.Add(cmd);
                    }
                }
            }

            // Формируем порядок хода
            for (int i = 0; i < initiators.Count; i++) stack.Add(initiators[i]);
            for (int i = 0; i < normals.Count; i++) stack.Add(normals[i]);
            // Финишеры идут в обратном порядке (инвертировано с нижнего правого угла)
            for (int i = finishers.Count - 1; i >= 0; i--) stack.Add(finishers[i]);

            // Проставляем StackOrder
            for (int i = 0; i < stack.Count; i++) stack[i].stackOrder = i + 1;

            // 2. Фазовое выполнение
            // Фаза Auras
            ExecutePhase(state, CommandPhase.Auras);
            // Фаза Consume
            ExecutePhase(state, CommandPhase.Consume);
            // Фаза Lines (Множители x3)
            ResolveLines(state);
            // Фаза Resonance (Сеты)
            ResolveResonance(state);

            // Копируем в очередь для Presenter'а
            return new Queue<ActionCommand>(stack);
        }

        private void ExecutePhase(GridState state, CommandPhase targetPhase)
        {
            for (int i = 0; i < stack.Count; i++)
            {
                ActionCommand cmd = stack[i];
                if (cmd.IsCancelled) continue;
                
                // Проверять жива ли карта после Consume. Если кто-то съел карту, отменяем её дальнейшие фазы.
                if (state.cells[cmd.origin.x, cmd.origin.y].isConsumed)
                {
                    cmd.CancelCommand();
                    continue;
                }

                // Передаем стейт в стратегию. Карты сами решат, делать им что-то в эту фазу или нет.
                // Для MVP вызываем общую логику (нормально паттерн Strategy внутри ICardEffect сам разобьет по фазам)
                cmd.Execute(state); 
            }
        }

        private void ResolveLines(GridState state)
        {
            // Здесь проверка линий 3х3 (MVP). Если 3 одинаковых сета - умножение базы x3.
            // Упрощенная логика: проверяем только горизонтальные линии
            for (int y = 0; y < GridState.HEIGHT; y++)
            {
                CardData c1 = state.cells[0, y].currentCard;
                CardData c2 = state.cells[1, y].currentCard;
                CardData c3 = state.cells[2, y].currentCard;

                bool c1Alive = !state.cells[0, y].IsJunk && !state.cells[0, y].isConsumed;
                bool c2Alive = !state.cells[1, y].IsJunk && !state.cells[1, y].isConsumed;
                bool c3Alive = !state.cells[2, y].IsJunk && !state.cells[2, y].isConsumed;

                if (c1Alive && c2Alive && c3Alive && c1 != null && c2 != null && c3 != null)
                {
                    if (c1.cardSet == c2.cardSet && c2.cardSet == c3.cardSet)
                    {
                        // Умножаем урон всех команд в этой линии на 3
                        MultiplyLineDamage(0, y, 3f);
                        MultiplyLineDamage(1, y, 3f);
                        MultiplyLineDamage(2, y, 3f);
                    }
                }
            }
        }

        private void MultiplyLineDamage(int x, int y, float multiplier)
        {
            for (int i = 0; i < stack.Count; i++)
            {
                if (stack[i].origin.x == x && stack[i].origin.y == y && !stack[i].IsCancelled)
                {
                    stack[i].finalDamage *= multiplier;
                    break;
                }
            }
        }

        private void ResolveResonance(GridState state)
        {
            // Считываем резонанс: 5+ карт одного живого сета
            int[] setCounts = new int[5]; // По кол-ву Enums CardSet

            for (int x = 0; x < GridState.WIDTH; x++)
            {
                for (int y = 0; y < GridState.HEIGHT; y++)
                {
                    ref SlotCell cell = ref state.cells[x, y];
                    if (!cell.IsJunk && !cell.isConsumed)
                    {
                        setCounts[(int)cell.currentCard.cardSet]++;
                    }
                }
            }

            for (int i = 1; i < setCounts.Length; i++)
            {
                if (setCounts[i] >= 5)
                {
                    // Активация Ультимейта сета. Для прототипа применяем глобальное умножение.
                    if (i == (int)CardSet.RetroJackpot)
                    {
                        for (int s = 0; s < stack.Count; s++)
                        {
                            if (!stack[s].IsCancelled) stack[s].finalDamage *= 2f;
                        }
                    }
                    // Другие сеты можно добавить тут.
                }
            }
        }
    }
}
