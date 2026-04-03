export interface Coordinate {
    x: number;
    y: number;
}

export interface Payline {
    id: number;
    name: string;
    path: Coordinate[];
    multiplier: number; // Бонусный множитель за эту линию (базовый = 1)
}

// Классические 8 линий для 3х3: 3 горизонтали, 2 диагонали, 2 V-образные, 1 изломанная (например).
export const Paylines3x3: Payline[] = [
    { id: 1, name: "Middle Row",        path: [{x:0, y:1}, {x:1, y:1}, {x:2, y:1}], multiplier: 1.0 },
    { id: 2, name: "Top Row",           path: [{x:0, y:0}, {x:1, y:0}, {x:2, y:0}], multiplier: 1.2 },
    { id: 3, name: "Bottom Row",        path: [{x:0, y:2}, {x:1, y:2}, {x:2, y:2}], multiplier: 1.2 },
    { id: 4, name: "Diagonal Down",     path: [{x:0, y:0}, {x:1, y:1}, {x:2, y:2}], multiplier: 2.0 },
    { id: 5, name: "Diagonal Up",       path: [{x:0, y:2}, {x:1, y:1}, {x:2, y:0}], multiplier: 2.0 },
    { id: 6, name: "V-Shape Down",      path: [{x:0, y:0}, {x:1, y:1}, {x:2, y:0}], multiplier: 1.5 },
    { id: 7, name: "V-Shape Up",        path: [{x:0, y:2}, {x:1, y:1}, {x:2, y:2}], multiplier: 1.5 },
    { id: 8, name: "Wave",              path: [{x:0, y:1}, {x:1, y:0}, {x:2, y:1}], multiplier: 1.5 }
];

// Заготовка на будущее для казино 5х3 (по образу референса 25 линий).
export const Paylines5x3: Payline[] = [
    { id: 1, name: "Line 1", path: [{x:0,y:1}, {x:1,y:1}, {x:2,y:1}, {x:3,y:1}, {x:4,y:1}], multiplier: 1.0 },
    { id: 2, name: "Line 2", path: [{x:0,y:0}, {x:1,y:0}, {x:2,y:0}, {x:3,y:0}, {x:4,y:0}], multiplier: 1.0 },
    { id: 3, name: "Line 3", path: [{x:0,y:2}, {x:1,y:2}, {x:2,y:2}, {x:3,y:2}, {x:4,y:2}], multiplier: 1.0 },
    { id: 4, name: "Line 4", path: [{x:0,y:0}, {x:1,y:1}, {x:2,y:2}, {x:3,y:1}, {x:4,y:0}], multiplier: 1.5 },
    { id: 5, name: "Line 5", path: [{x:0,y:2}, {x:1,y:1}, {x:2,y:0}, {x:3,y:1}, {x:4,y:2}], multiplier: 1.5 },
    // Здесь позже добавим еще 20 линий по запросу...
];
