using Fortunalia.Data;
using UnityEngine;
using System.Collections.Generic;

namespace Fortunalia.Core
{
    public class ReelGenerator
    {
        private List<CardData> playerDeck;

        public ReelGenerator(List<CardData> deck)
        {
            this.playerDeck = deck;
        }

        /// <summary>
        /// Генерирует 3х3 сетку на основе пула игрока и Entropy Floor Босса
        /// </summary>
        public void GenerateGrid(GridState state)
        {
            state.Clear();
            
            int totalCells = GridState.WIDTH * GridState.HEIGHT;
            int entropyCount = Mathf.Clamp(state.entropyFloor, 0, totalCells);

            // 1. Сначала расставляем гарантированный мусор (Entropy Floor)
            // Чтобы не было аллокаций массива, используем простой Fisher-Yates инпейлс или просто резервуарную выборку индексов.
            // Для упрощения аллоцируем один массив индексов 0..8 на спин
            int[] availableIndices = new int[totalCells];
            for (int i = 0; i < totalCells; i++) availableIndices[i] = i;

            // Перемешиваем индексы для выбора позиций мусора
            ShuffleIndices(availableIndices);

            // Устанавливаем мусор
            for (int i = 0; i < entropyCount; i++)
            {
                int index = availableIndices[i];
                int x = index % GridState.WIDTH;
                int y = index / GridState.WIDTH;
                state.cells[x, y].currentCard = null; 
            }

            // 2. Расставляем карты игрока в оставшиеся слоты по весу
            if (playerDeck.Count == 0) return;

            // Подсчет общего веса колоды
            float totalWeight = 0f;
            for (int i = 0; i < playerDeck.Count; i++)
            {
                // FinalWeight = BaseWeight * (1 + PlayerLuck)
                totalWeight += playerDeck[i].baseWeight * (1f + state.playerLuck);
            }

            for (int i = entropyCount; i < totalCells; i++)
            {
                int index = availableIndices[i];
                int x = index % GridState.WIDTH;
                int y = index / GridState.WIDTH;

                // Взвешенный рандом
                float rand = Random.Range(0f, totalWeight);
                float accumulated = 0f;
                CardData selectedCard = playerDeck[0];

                for (int j = 0; j < playerDeck.Count; j++)
                {
                    accumulated += playerDeck[j].baseWeight * (1f + state.playerLuck);
                    if (rand <= accumulated)
                    {
                        selectedCard = playerDeck[j];
                        break;
                    }
                }

                state.cells[x, y].currentCard = selectedCard;
                state.cells[x, y].isConsumed = false;
            }
        }

        private void ShuffleIndices(int[] array)
        {
            for (int i = 0; i < array.Length; i++)
            {
                int temp = array[i];
                int randomIndex = Random.Range(i, array.Length);
                array[i] = array[randomIndex];
                array[randomIndex] = temp;
            }
        }
    }
}
