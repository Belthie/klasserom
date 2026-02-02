
window.Utils = {
    generateId: () => Math.random().toString(36).substr(2, 9),

    // Constraint Types
    CONSTRAINTS: {
        SEPARATION: 'separation', // "Enemy"
        PAIRING: 'pairing',       // "Buddy"
        ISOLATION: 'isolation',   // "Alone"
        LOCK_FRONT: 'lock_front',
        LOCK_BACK: 'lock_back',
    },

    // Mock Name List for easy testing
    MOCK_NAMES: `Liam
Olivia
Noah
Emma
Oliver
Charlotte
Elijah
Amelia
James
Ava
William
Sophia
Benjamin
Isabella
Lucas
Mia
Henry
Evelyn
Theodore
Harper`.split('\n'),

    // Helper to shuffle array
    shuffle: (array) => {
        let currentIndex = array.length, randomIndex;
        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }
};
