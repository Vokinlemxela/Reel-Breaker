namespace Fortunalia.Core
{
    public class GridState
    {
        public const int WIDTH = 3;
        public const int HEIGHT = 3;
        
        // 2D Array ячеек
        public readonly SlotCell[,] cells = new SlotCell[WIDTH, HEIGHT];
        
        // Сколько гарантированно мусорных ячеек
        public int entropyFloor;
        
        // Модификатор игрока к весу всех его карт
        public float playerLuck;

        /// <summary>
        /// Очищает состояние сетки
        /// </summary>
        public void Clear()
        {
            for (int x = 0; x < WIDTH; x++)
            {
                for (int y = 0; y < HEIGHT; y++)
                {
                    cells[x, y] = new SlotCell { x = x, y = y };
                }
            }
        }
    }
}
