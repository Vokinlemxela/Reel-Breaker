function sim() {
    let hands: any = {
        FIVE_OF_A_KIND: 0,
        FOUR_OF_A_KIND: 0,
        FULL_HOUSE: 0,
        THREE_OF_A_KIND: 0,
        TWO_PAIR: 0,
        PAIR: 0,
        HIGH_CARD: 0
    };

    for(let i=0; i<10000; i++) {
        // Draw 7 cards from 12 unique items with replacement
        let counts: number[] = new Array(12).fill(0);
        for(let j=0; j<7; j++) {
            let roll = Math.floor(Math.random() * 12);
            counts[roll]++;
        }
        
        counts.sort((a,b) => b-a);
        
        if (counts[0] >= 5) hands.FIVE_OF_A_KIND++;
        else if (counts[0] >= 4) hands.FOUR_OF_A_KIND++;
        else if (counts[0] >= 3 && counts[1] >= 2) hands.FULL_HOUSE++;
        else if (counts[0] >= 3) hands.THREE_OF_A_KIND++;
        else if (counts[0] >= 2 && counts[1] >= 2) hands.TWO_PAIR++;
        else if (counts[0] >= 2) hands.PAIR++;
        else hands.HIGH_CARD++;
    }
    
    for(const k in hands) {
        console.log(k, (hands[k]/100).toFixed(2) + '%');
    }
}
sim();
