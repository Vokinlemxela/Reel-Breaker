#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;
using System.Collections.Generic;
using Fortunalia.Core;
using Fortunalia.Data;
using System.Text;
using System.IO;

namespace Fortunalia.Editor
{
    public class MonteCarloSimulator : EditorWindow
    {
        private List<CardData> deck = new List<CardData>();
        private int iterations = 10000;
        private int entropyFloor = 1;
        private float playerLuck = 0f;

        [MenuItem("Fortunalia/Monte Carlo Balance Tester")]
        public static void ShowWindow()
        {
            GetWindow<MonteCarloSimulator>("Balance Tester");
        }

        private void OnGUI()
        {
            GUILayout.Label("Simulation Settings", EditorStyles.boldLabel);

            EditorGUI.BeginChangeCheck();
            iterations = EditorGUILayout.IntField("Spins (Iterations)", iterations);
            entropyFloor = EditorGUILayout.IntSlider("Entropy Floor (0-9)", entropyFloor, 0, 9);
            playerLuck = EditorGUILayout.Slider("Player Luck Modifier", playerLuck, 0f, 5f);
            
            // Allow drag-dropping a folder of cards or selecting them manually
            SerializedObject so = new SerializedObject(this);
            // In a real editor script we would use ReorderableList or similar, but for logic test:
            if (GUILayout.Button("Load Prototype Deck"))
            {
                LoadMockDeck();
            }

            if (GUILayout.Button("Run Simulation & Generate CSV", GUILayout.Height(40)))
            {
                RunSimulation();
            }
        }

        private void LoadMockDeck()
        {
            deck.Clear();
            // В реальном проекте здесь будет AssetDatabase.FindAssets("t:CardData");
            // Для мока создаем 12 виртуальных карт-пустышек 
            for (int i = 0; i < 12; i++)
            {
                var card = ScriptableObject.CreateInstance<CardData>();
                card.id = "MOCK_" + i;
                card.baseDamage = 10f;
                card.baseWeight = 1f;
                card.cardSet = CardSet.RetroJackpot;
                deck.Add(card);
            }
            Debug.Log("Generated 12 Mock Cards for Pool.");
        }

        private void RunSimulation()
        {
            if (deck.Count == 0)
            {
                Debug.LogError("No deck loaded!");
                return;
            }

            GridState state = new GridState();
            state.entropyFloor = entropyFloor;
            state.playerLuck = playerLuck;

            ReelGenerator generator = new ReelGenerator(deck);
            StackResolver resolver = new StackResolver();

            long startMs = System.DateTime.Now.Ticks / System.TimeSpan.TicksPerMillisecond;
            float totalDamageGenerated = 0f;
            int totalZeroSpins = 0;
            int totalJunkSymbols = 0;

            StringBuilder csv = new StringBuilder();
            csv.AppendLine("SpinID;Damage;JunkCount");

            for (int i = 0; i < iterations; i++)
            {
                generator.GenerateGrid(state);
                var resolvedQueue = resolver.ResolveSpin(state);

                float spinDmg = 0f;
                int junkCount = 0;

                for (int x = 0; x < GridState.WIDTH; x++)
                {
                    for (int y = 0; y < GridState.HEIGHT; y++)
                    {
                        if (state.cells[x, y].IsJunk) junkCount++;
                    }
                }

                foreach (var cmd in resolvedQueue)
                {
                    spinDmg += cmd.finalDamage;
                }

                totalDamageGenerated += spinDmg;
                totalJunkSymbols += junkCount;

                if (spinDmg <= 0) totalZeroSpins++;

                csv.AppendLine($"{i};{spinDmg};{junkCount}");
            }

            long endMs = System.DateTime.Now.Ticks / System.TimeSpan.TicksPerMillisecond;
            
            // Stats
            float avgDamage = totalDamageGenerated / iterations;
            float avgJunk = (float)totalJunkSymbols / iterations;

            Debug.Log($"<color=green>Simulation Completed in {endMs - startMs} ms ({iterations} spins)</color>\n" +
                      $"Average Spin Damage: {avgDamage}\n" +
                      $"Average Junk Symbols Output: {avgJunk}\n" +
                      $"Zero Damage Spins (Complete fail): {totalZeroSpins}");

            string path = Path.Combine(Application.dataPath, "SimulationResults.csv");
            File.WriteAllText(path, csv.ToString());
            Debug.Log($"CSV Exported to {path}");
        }
    }
}
#endif
